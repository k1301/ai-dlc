# Database NFR Design Patterns

## Overview

이 문서는 Database unit의 NFR requirements를 구현하기 위한 design patterns를 정의합니다.

**Database**: PostgreSQL 14 on AWS RDS  
**Target Environment**: AWS (Single-AZ, MVP configuration)  
**Expected Load**: 10-50 concurrent users

---

## 1. Connection Pooling Pattern

### Pattern Name
**Connection Pool with Queue and Wait Strategy**

### Context
- Knex.js를 사용하여 PostgreSQL에 연결
- 10-20개의 connection pool 유지
- 동시 사용자 10-50명 지원

### Design Decision
**Q1 Answer: A (Automatic Retry - Knex.js built-in)**  
**Q7 Answer: A (Queue and Wait)**

### Pattern Description

**Connection Pool Configuration**:
```javascript
// knexfile.js
module.exports = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false,
      ca: fs.readFileSync('./rds-ca-cert.pem') // Optional
    }
  },
  pool: {
    min: 2,                      // Minimum connections
    max: 20,                     // Maximum connections
    acquireTimeoutMillis: 30000, // 30 seconds timeout
    idleTimeoutMillis: 600000,   // 10 minutes idle timeout
    createTimeoutMillis: 3000,   // 3 seconds create timeout
    reapIntervalMillis: 1000,    // Check for idle connections every 1 second
    createRetryIntervalMillis: 200 // Retry interval on create failure
  },
  acquireConnectionTimeout: 30000
};
```

**Pool Behavior**:
1. **Initial State**: 2 connections created (min pool size)
2. **On Demand**: New connections created up to 20 (max pool size)
3. **Pool Exhaustion**: Requests queue and wait for available connection (up to 30 seconds)
4. **Idle Cleanup**: Connections idle for 10 minutes are closed (down to min pool size)
5. **Automatic Retry**: Knex.js automatically retries failed connection attempts

### Error Handling

**Connection Acquisition Failure**:
```javascript
// Knex.js handles retry automatically
// Application receives error if all retries fail
try {
  const result = await knex('stores').select('*');
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    // Connection acquisition timeout
    logger.error('Database connection timeout', { error });
    throw new DatabaseError('Database unavailable', 503);
  } else if (error.code === 'ECONNREFUSED') {
    // Connection refused
    logger.error('Database connection refused', { error });
    throw new DatabaseError('Database unavailable', 503);
  } else {
    // Other errors
    logger.error('Database error', { error });
    throw error;
  }
}
```

**Connection Pool Exhaustion**:
- **Strategy**: Queue and Wait (Knex.js default)
- **Timeout**: 30 seconds (acquireTimeoutMillis)
- **Response**: HTTP 503 Service Unavailable if timeout

### Monitoring

**Q10 Answer: B (Idle Connection Monitoring)**

**CloudWatch Metrics**:
- `DatabaseConnections`: Current active connections
- Alert if > 80% of max (> 16 connections)
- Monitor idle connections via RDS metrics

**Application Metrics** (Optional):
```javascript
// Log pool stats periodically
setInterval(() => {
  const poolStats = knex.client.pool;
  logger.info('Connection pool stats', {
    numUsed: poolStats.numUsed(),
    numFree: poolStats.numFree(),
    numPendingAcquires: poolStats.numPendingAcquires(),
    numPendingCreates: poolStats.numPendingCreates()
  });
}, 60000); // Every 1 minute
```

### Benefits
- **Efficiency**: Connection reuse reduces overhead
- **Scalability**: Supports up to 50 concurrent users
- **Resilience**: Automatic retry on transient failures
- **Simplicity**: Leverages Knex.js built-in capabilities

---

## 2. Error Handling Pattern

### Pattern Name
**Automatic Retry with Transaction Rollback**

### Context
- Database operations may fail due to transient issues
- Transactions must maintain ACID properties
- Query timeout: 30 seconds

### Design Decisions
**Q1 Answer: A (Automatic Retry)**  
**Q6 Answer: A (Automatic Rollback)**  
**Q9 Answer: A (Application Timeout Only)**

### Pattern Description

**Retry Strategy**:
- **Automatic**: Knex.js handles connection-level retries
- **Transient Errors**: Retried automatically (ECONNREFUSED, ETIMEDOUT)
- **Non-Transient Errors**: Fail immediately (syntax error, constraint violation)

**Transaction Rollback**:
```javascript
// Automatic rollback on error
const createOrder = async (orderData) => {
  const trx = await knex.transaction();
  
  try {
    // Insert order
    const [order] = await trx('orders').insert({
      order_number: orderData.order_number,
      table_id: orderData.table_id,
      session_id: orderData.session_id,
      status: 'pending',
      total_amount: orderData.total_amount
    }).returning('*');
    
    // Insert order items
    await trx('order_items').insert(
      orderData.items.map(item => ({
        order_id: order.id,
        menu_id: item.menu_id,
        menu_name: item.menu_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }))
    );
    
    // Commit transaction
    await trx.commit();
    return order;
    
  } catch (error) {
    // Automatic rollback on any error
    await trx.rollback();
    logger.error('Order creation failed', { error, orderData });
    throw error;
  }
};
```

**Timeout Handling**:
- **Application Level**: Knex.js timeout (30 seconds)
- **Configuration**:
```javascript
// Per-query timeout
await knex('orders')
  .select('*')
  .timeout(30000); // 30 seconds

// Global timeout (in pool config)
acquireConnectionTimeout: 30000
```

**Database Level Timeout** (Not used in MVP):
```sql
-- Optional: Set statement_timeout at database level
ALTER DATABASE table_order_db SET statement_timeout = '30s';
```

### Error Response Strategy

**Application Error Handling**:
```javascript
// Error handler middleware
app.use((error, req, res, next) => {
  if (error.code === 'ETIMEDOUT') {
    return res.status(503).json({
      error: 'Database timeout',
      message: 'Request took too long to process'
    });
  } else if (error.code === '23505') { // Unique violation
    return res.status(409).json({
      error: 'Duplicate entry',
      message: error.detail
    });
  } else if (error.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Invalid reference',
      message: error.detail
    });
  } else {
    logger.error('Unhandled database error', { error });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});
```

### Migration Rollback

**Q6 Answer: A (Automatic Rollback)**

**Migration Strategy**:
```javascript
// migrations/001_create_stores.js
exports.up = function(knex) {
  return knex.schema.createTable('stores', table => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('store_id', 50).notNullable().unique();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('stores');
};
```

**Rollback Execution**:
```bash
# Automatic rollback on migration failure
npx knex migrate:latest
# If fails, automatically rolls back the failed migration

# Manual rollback (if needed)
npx knex migrate:rollback
```

### Benefits
- **Reliability**: Automatic retry handles transient failures
- **Data Integrity**: Transaction rollback maintains consistency
- **Simplicity**: Leverages Knex.js built-in error handling
- **Debuggability**: Clear error messages and logging

---

## 3. Monitoring Pattern

### Pattern Name
**Application-Level Logging with CloudWatch Alarms**

### Context
- Query performance target: < 100ms
- CloudWatch monitors RDS metrics
- Automated scaling for storage
- Manual response for CPU/connection alarms

### Design Decisions
**Q5 Answer: A (Application-Level Logging)**  
**Q3 Answer: C (Automated Scaling + Notification)**

### Pattern Description

**Query Performance Monitoring**:

**Application-Level Logging**:
```javascript
// Query logging middleware
const queryLogger = (knex) => {
  knex.on('query', (query) => {
    query.startTime = Date.now();
  });
  
  knex.on('query-response', (response, query) => {
    const duration = Date.now() - query.startTime;
    
    if (duration > 100) {
      // Log slow queries (> 100ms)
      logger.warn('Slow query detected', {
        sql: query.sql,
        bindings: query.bindings,
        duration,
        threshold: 100
      });
    }
    
    // Log all queries in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Query executed', {
        sql: query.sql,
        duration
      });
    }
  });
  
  knex.on('query-error', (error, query) => {
    logger.error('Query error', {
      sql: query.sql,
      bindings: query.bindings,
      error: error.message
    });
  });
};

// Initialize
queryLogger(knex);
```

**CloudWatch Alarms**:

**Alarm Configuration**:
```yaml
# CloudWatch Alarms for RDS
Alarms:
  # CPU Utilization
  - AlarmName: RDS-Database-CPU-High
    MetricName: CPUUtilization
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300 # 5 minutes
    EvaluationPeriods: 2
    Threshold: 80 # 80%
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref SNSTopicDatabase
    TreatMissingData: notBreaching
  
  # Database Connections
  - AlarmName: RDS-Database-Connections-High
    MetricName: DatabaseConnections
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 16 # 80% of 20 max connections
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref SNSTopicDatabase
  
  # Free Storage Space
  - AlarmName: RDS-Database-Storage-Low
    MetricName: FreeStorageSpace
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 1
    Threshold: 4294967296 # 4GB (20% of 20GB)
    ComparisonOperator: LessThanThreshold
    AlarmActions:
      - !Ref SNSTopicDatabase
      - !Ref AutoScalingPolicy # Trigger auto-scaling
  
  # Freeable Memory
  - AlarmName: RDS-Database-Memory-Low
    MetricName: FreeableMemory
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 524288000 # 500MB
    ComparisonOperator: LessThanThreshold
    AlarmActions:
      - !Ref SNSTopicDatabase
  
  # Read Latency
  - AlarmName: RDS-Database-ReadLatency-High
    MetricName: ReadLatency
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 0.1 # 100ms
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref SNSTopicDatabase

# SNS Topic for Notifications
SNSTopic:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: database-alarms
    Subscriptions:
      - Protocol: email
        Endpoint: admin@example.com
      - Protocol: https
        Endpoint: https://hooks.slack.com/services/XXX # Slack webhook
```

**Automated Scaling**:
```yaml
# Storage Auto-Scaling
StorageAutoScaling:
  MaxAllocatedStorage: 100 # GB
  Enabled: true
  # RDS automatically scales storage when:
  # - Free storage < 10% of allocated storage
  # - Low storage lasts at least 5 minutes
  # - At least 6 hours since last modification
```

**Response Strategy**:
- **Storage Low Alarm**: Automatic scaling + notification
- **CPU High Alarm**: Notification only (manual investigation)
- **Connections High Alarm**: Notification only (manual investigation)
- **Memory Low Alarm**: Notification only (manual investigation)
- **Read Latency High Alarm**: Notification only (investigate queries)

### Health Check Implementation

**Q2 Answer: A (Simple Query Only)**

**Health Check Endpoint**:
```javascript
// GET /health
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Simple query to check connectivity
    await knex.raw('SELECT 1');
    
    const duration = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      latency: duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Health check failed', { error, duration });
    
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      latency: duration,
      timestamp: new Date().toISOString()
    });
  }
});
```

**Health Check Monitoring**:
- **Frequency**: Every 60 seconds
- **Timeout**: 5 seconds
- **Failure Threshold**: 3 consecutive failures

### Benefits
- **Visibility**: Application-level logging provides query-level insights
- **Automation**: Storage auto-scaling prevents outages
- **Proactive**: Alarms notify before critical thresholds
- **Cost-Effective**: No additional RDS Performance Insights cost

---

## 4. Data Management Pattern

### Pattern Name
**Migration-First with Deferred Validation**

### Context
- Schema changes via Knex.js migrations
- Automated backups enabled (7 days retention)
- Password rotation deferred to production

### Design Decisions
**Q4 Answer: A (No Validation)**  
**Q8 Answer: D (Later Decision)**

### Pattern Description

**Schema Migration Strategy**:

**Migration Workflow**:
```bash
# Development
1. Create migration: npx knex migrate:make migration_name
2. Implement up() and down() functions
3. Test locally: npx knex migrate:latest
4. Test rollback: npx knex migrate:rollback
5. Commit to git

# Staging
1. Deploy code
2. Run migrations: npx knex migrate:latest
3. Verify schema changes
4. Test application

# Production
1. Create manual snapshot (pre-migration backup)
2. Deploy code
3. Run migrations: npx knex migrate:latest
4. Verify schema changes
5. Monitor for errors
6. Rollback if needed: npx knex migrate:rollback
```

**Migration Best Practices**:
```javascript
// Good migration - Reversible
exports.up = function(knex) {
  return knex.schema.table('menus', table => {
    table.integer('display_order').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.table('menus', table => {
    table.dropColumn('display_order');
  });
};

// Migration with data transformation
exports.up = async function(knex) {
  // Add column
  await knex.schema.table('orders', table => {
    table.string('payment_method', 50);
  });
  
  // Set default values
  await knex('orders').update({ payment_method: 'cash' });
  
  // Make non-nullable
  await knex.schema.alterTable('orders', table => {
    table.string('payment_method', 50).notNullable().alter();
  });
};

exports.down = async function(knex) {
  return knex.schema.table('orders', table => {
    table.dropColumn('payment_method');
  });
};
```

**Backup Strategy**:

**Q4 Answer: A (No Validation)**

**Automated Backups**:
- **Enabled**: Yes
- **Retention**: 7 days
- **Backup Window**: 03:00-04:00 KST (during maintenance window)
- **Point-in-Time Recovery**: Enabled (5-minute granularity)

**Manual Snapshots** (Pre-Migration):
```bash
# Create snapshot before major migrations
aws rds create-db-snapshot \
  --db-instance-identifier table-order-db \
  --db-snapshot-identifier table-order-db-pre-migration-$(date +%Y%m%d)
```

**Backup Validation**:
- **MVP**: No validation (trust AWS RDS automated backups)
- **Production**: Monthly manual restore test to verify backups

**Recovery Procedures**:
```bash
# Point-in-Time Recovery (within 7 days)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier table-order-db \
  --target-db-instance-identifier table-order-db-recovered \
  --restore-time 2026-04-05T10:30:00Z

# Snapshot Restore
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier table-order-db-recovered \
  --db-snapshot-identifier table-order-db-pre-migration-20260405
```

**Password Rotation Strategy**:

**Q8 Answer: D (Later Decision)**

**MVP (No Rotation)**:
- Password stored in AWS Secrets Manager
- Fixed password for MVP phase
- Manually rotated if compromised

**Production (Future)**:
- **Option B**: Manual rotation every 90 days
- **Option C**: Automated rotation via Secrets Manager

**Password Management**:
```javascript
// Load password from Secrets Manager
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

const getDbPassword = async () => {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'table-order-db-password'
  }).promise();
  
  return JSON.parse(secret.SecretString).password;
};

// Use in Knex configuration
const initDatabase = async () => {
  const password = await getDbPassword();
  
  return require('knex')({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: password,
      database: process.env.DB_NAME
    },
    pool: { /* pool config */ }
  });
};
```

### Benefits
- **Safety**: Migration rollback prevents data loss
- **Versioning**: Git tracks all schema changes
- **Simplicity**: No backup validation overhead in MVP
- **Security**: Secrets Manager for password management

---

## Summary

| Pattern | Key Decision | Implementation |
|---------|-------------|----------------|
| **Connection Pooling** | Queue and Wait | Knex.js pool (2-20 connections, 30s timeout) |
| **Error Handling** | Automatic Retry + Rollback | Knex.js built-in retry, transaction rollback |
| **Monitoring** | Application Logging + CloudWatch | Query logging + RDS alarms + auto-scaling |
| **Data Management** | Migration-First, No Validation | Knex.js migrations, automated backups, deferred password rotation |

**MVP Approach**: Leverage Knex.js and AWS RDS built-in capabilities, minimize custom implementation, defer production-grade features (backup validation, password rotation) to later phases.
