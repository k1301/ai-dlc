# Database Logical Components

## Overview

이 문서는 Database unit의 NFR requirements를 구현하기 위한 logical components를 정의합니다.

**Database**: PostgreSQL 14 on AWS RDS  
**Target Environment**: AWS (Single-AZ, MVP configuration)  
**Expected Load**: 10-50 concurrent users

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Backend    │  │ Health Check │  │  Migration   │         │
│  │   (Knex.js)  │  │   Endpoint   │  │    Runner    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
│         └─────────────────┴─────────────────┘                   │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ SSL/TLS
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                   AWS Cloud (VPC)                               │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────┐         │
│  │         Security Group (DB-SG)                    │         │
│  │  Inbound: Port 5432 from Backend-SG               │         │
│  └────────────────────────┬──────────────────────────┘         │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────┐         │
│  │           RDS PostgreSQL 14 Instance              │         │
│  │  Instance: db.t3.medium (2 vCPU, 4GB RAM)        │         │
│  │  Storage: gp3, 20GB, auto-scale to 100GB         │         │
│  │  Subnet: Private Subnet (10.0.1.0/24)            │         │
│  │  Multi-AZ: No (Single-AZ)                        │         │
│  │  Encryption: AES-256 (KMS)                       │         │
│  └────────────────────────┬──────────────────────────┘         │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────┐         │
│  │         CloudWatch Monitoring                     │         │
│  │  - Alarms (CPU, Connections, Storage, Latency)   │         │
│  │  - Dashboard                                      │         │
│  │  - Log Groups (Error logs)                       │         │
│  └────────────────────────┬──────────────────────────┘         │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────┐         │
│  │         SNS Topic (Notifications)                 │         │
│  │  - Email: admin@example.com                       │         │
│  │  - Slack: Webhook                                 │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │    Backup and Recovery                          │           │
│  │  - Automated Backups (7 days)                   │           │
│  │  - Point-in-Time Recovery (5 min granularity)   │           │
│  │  - Manual Snapshots (pre-migration)             │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │    Security Components                          │           │
│  │  - KMS Key (Encryption at-rest)                 │           │
│  │  - Secrets Manager (DB password)                │           │
│  │  - VPC Security Groups (Network isolation)      │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. RDS Instance Component

### Component Description
AWS RDS PostgreSQL 14 인스턴스, Database unit의 핵심 컴포넌트

### Configuration

**Instance Specifications**:
```yaml
DBInstance:
  Engine: postgres
  EngineVersion: "14.10"
  DBInstanceClass: db.t3.medium
  AllocatedStorage: 20 # GB
  MaxAllocatedStorage: 100 # GB (auto-scaling limit)
  StorageType: gp3
  StorageEncrypted: true
  KmsKeyId: !Ref DatabaseKMSKey
  
  # Network
  DBSubnetGroupName: !Ref DatabaseSubnetGroup
  VPCSecurityGroups:
    - !Ref DatabaseSecurityGroup
  PubliclyAccessible: false
  
  # Availability
  MultiAZ: false # Single-AZ for MVP
  AvailabilityZone: ap-northeast-2a # Seoul
  
  # Backup
  BackupRetentionPeriod: 7 # days
  PreferredBackupWindow: "03:00-04:00" # KST
  CopyTagsToSnapshot: true
  
  # Maintenance
  PreferredMaintenanceWindow: "tue:02:00-tue:04:00" # KST
  AutoMinorVersionUpgrade: true
  
  # Monitoring
  EnableCloudwatchLogsExports:
    - postgresql
  MonitoringInterval: 60 # seconds (basic monitoring)
  EnablePerformanceInsights: false # Cost optimization for MVP
  
  # Database
  DBName: table_order_db
  MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
  MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
  
  # Parameter Group
  DBParameterGroupName: !Ref DatabaseParameterGroup
  
  # Tags
  Tags:
    - Key: Environment
      Value: MVP
    - Key: Application
      Value: TableOrder
    - Key: ManagedBy
      Value: CloudFormation
```

**Parameter Group**:
```yaml
DatabaseParameterGroup:
  Type: AWS::RDS::DBParameterGroup
  Properties:
    Description: Parameter group for table-order PostgreSQL 14
    Family: postgres14
    Parameters:
      # Connection
      max_connections: "100" # Default
      
      # Memory
      shared_buffers: "{DBInstanceClassMemory/4096}" # 25% of RAM (default)
      work_mem: "4096" # 4MB per sort/hash operation
      maintenance_work_mem: "65536" # 64MB for maintenance
      
      # Query Performance
      effective_cache_size: "{DBInstanceClassMemory*3/4096}" # 75% of RAM
      random_page_cost: "1.1" # SSD optimization
      
      # Logging (MVP - minimal)
      log_statement: "none" # Don't log statements (MVP)
      log_min_duration_statement: "-1" # Disabled (slow query logging off)
      log_connections: "0" # Disabled
      log_disconnections: "0" # Disabled
      
      # Error Logging
      log_min_error_statement: "error" # Log errors
      log_error_verbosity: "default"
      
      # Timeout (handled by application)
      statement_timeout: "0" # No database-level timeout
      
      # Auto Vacuum
      autovacuum: "1" # Enabled
      
      # Timezone
      timezone: "Asia/Seoul"
```

**Subnet Group**:
```yaml
DatabaseSubnetGroup:
  Type: AWS::RDS::DBSubnetGroup
  Properties:
    DBSubnetGroupName: table-order-db-subnet-group
    DBSubnetGroupDescription: Subnet group for table-order database
    SubnetIds:
      - !Ref PrivateSubnet1 # 10.0.1.0/24 (AZ-a)
      - !Ref PrivateSubnet2 # 10.0.2.0/24 (AZ-b)
    Tags:
      - Key: Environment
        Value: MVP
```

### Connections

**Inputs**:
- Database credentials from AWS Secrets Manager
- KMS key for encryption
- VPC security group
- Private subnets

**Outputs**:
- Endpoint: `table-order-db.xxxxxx.ap-northeast-2.rds.amazonaws.com:5432`
- Database name: `table_order_db`

### Monitoring

- CloudWatch Metrics: CPU, Memory, Connections, Storage, IOPS
- CloudWatch Logs: PostgreSQL error logs
- Alarms: See CloudWatch Monitoring Component

---

## 2. CloudWatch Monitoring Component

### Component Description
RDS 메트릭 모니터링, 알림, 로깅을 위한 CloudWatch 컴포넌트

### Configuration

**CloudWatch Alarms**:

```yaml
# CPU Utilization Alarm
DatabaseCPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RDS-TableOrder-CPU-High
    AlarmDescription: Alert when RDS CPU utilization exceeds 80%
    MetricName: CPUUtilization
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300 # 5 minutes
    EvaluationPeriods: 2 # 10 minutes total
    Threshold: 80.0
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic
    TreatMissingData: notBreaching

# Database Connections Alarm
DatabaseConnectionsAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RDS-TableOrder-Connections-High
    AlarmDescription: Alert when database connections exceed 80% (16 of 20)
    MetricName: DatabaseConnections
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 16.0
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic

# Free Storage Space Alarm
DatabaseStorageAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RDS-TableOrder-Storage-Low
    AlarmDescription: Alert when free storage drops below 20% (4GB of 20GB)
    MetricName: FreeStorageSpace
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 1
    Threshold: 4294967296 # 4GB in bytes
    ComparisonOperator: LessThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic
    TreatMissingData: notBreaching

# Freeable Memory Alarm
DatabaseMemoryAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RDS-TableOrder-Memory-Low
    AlarmDescription: Alert when freeable memory drops below 500MB
    MetricName: FreeableMemory
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 524288000 # 500MB in bytes
    ComparisonOperator: LessThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic

# Read Latency Alarm
DatabaseReadLatencyAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RDS-TableOrder-ReadLatency-High
    AlarmDescription: Alert when read latency exceeds 100ms
    MetricName: ReadLatency
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 0.1 # 100ms in seconds
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic

# Write Latency Alarm
DatabaseWriteLatencyAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: RDS-TableOrder-WriteLatency-High
    AlarmDescription: Alert when write latency exceeds 100ms
    MetricName: WriteLatency
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 0.1 # 100ms in seconds
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic
```

**SNS Topic for Notifications**:

```yaml
DatabaseAlarmTopic:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: table-order-database-alarms
    DisplayName: Table Order Database Alarms
    Subscriptions:
      - Protocol: email
        Endpoint: admin@example.com
      # Future: Add Slack webhook
      # - Protocol: https
      #   Endpoint: https://hooks.slack.com/services/XXX

DatabaseAlarmTopicPolicy:
  Type: AWS::SNS::TopicPolicy
  Properties:
    Topics:
      - !Ref DatabaseAlarmTopic
    PolicyDocument:
      Statement:
        - Effect: Allow
          Principal:
            Service: cloudwatch.amazonaws.com
          Action: SNS:Publish
          Resource: !Ref DatabaseAlarmTopic
```

**CloudWatch Dashboard**:

```yaml
DatabaseDashboard:
  Type: AWS::CloudWatch::Dashboard
  Properties:
    DashboardName: TableOrder-Database-MVP
    DashboardBody: !Sub |
      {
        "widgets": [
          {
            "type": "metric",
            "properties": {
              "title": "CPU Utilization",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "CPUUtilization", {"stat": "Average", "period": 300}]
              ],
              "view": "timeSeries",
              "stacked": false,
              "yAxis": {"left": {"min": 0, "max": 100}}
            }
          },
          {
            "type": "metric",
            "properties": {
              "title": "Database Connections",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "DatabaseConnections", {"stat": "Average", "period": 300}]
              ],
              "view": "timeSeries",
              "yAxis": {"left": {"min": 0, "max": 20}}
            }
          },
          {
            "type": "metric",
            "properties": {
              "title": "Free Storage Space (GB)",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "FreeStorageSpace", {"stat": "Average", "period": 300}]
              ],
              "view": "timeSeries"
            }
          },
          {
            "type": "metric",
            "properties": {
              "title": "Read/Write Latency (ms)",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "ReadLatency", {"stat": "Average", "period": 300, "label": "Read"}],
                [".", "WriteLatency", {"stat": "Average", "period": 300, "label": "Write"}]
              ],
              "view": "timeSeries"
            }
          },
          {
            "type": "metric",
            "properties": {
              "title": "IOPS",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "ReadIOPS", {"stat": "Average", "period": 300, "label": "Read"}],
                [".", "WriteIOPS", {"stat": "Average", "period": 300, "label": "Write"}]
              ],
              "view": "timeSeries"
            }
          }
        ]
      }
```

**Log Groups**:

```yaml
DatabaseLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: /aws/rds/instance/table-order-db/postgresql
    RetentionInDays: 30 # 30 days retention
```

### Alarm Response Actions

| Alarm | Threshold | Response | Action |
|-------|-----------|----------|--------|
| CPU High | > 80% for 10 min | Manual | Investigate queries, consider instance upgrade |
| Connections High | > 16 connections | Manual | Review connection usage, check for leaks |
| Storage Low | < 4GB free | Automated | Auto-scaling triggers, notification sent |
| Memory Low | < 500MB | Manual | Investigate memory usage, consider instance upgrade |
| Read Latency High | > 100ms | Manual | Check slow queries, review indexes |
| Write Latency High | > 100ms | Manual | Check write operations, review disk performance |

---

## 3. Backup and Recovery Component

### Component Description
자동 백업, Point-in-Time Recovery, 재해 복구를 위한 컴포넌트

### Configuration

**Automated Backups**:
- **Retention Period**: 7 days
- **Backup Window**: 03:00-04:00 KST (during maintenance window)
- **Backup Method**: Automated snapshots
- **Storage**: AWS RDS managed (replicated across AZs)
- **Cost**: Included in RDS instance cost (up to 100% of database size)

**Point-in-Time Recovery (PITR)**:
- **Enabled**: Yes
- **Granularity**: 5 minutes
- **Retention**: Same as automated backups (7 days)
- **Method**: Transaction log replay

**Manual Snapshots**:
```bash
# Create manual snapshot (before major changes)
aws rds create-db-snapshot \
  --db-instance-identifier table-order-db \
  --db-snapshot-identifier table-order-db-$(date +%Y%m%d-%H%M%S) \
  --tags Key=Type,Value=Manual Key=Reason,Value=Pre-Migration
```

### Backup Validation Strategy

**Q4 Answer: A (No Validation in MVP)**

**MVP**:
- No automated validation
- Trust AWS RDS automated backup mechanism
- Manual validation only if needed (e.g., before major migration)

**Production (Future)**:
- Monthly restore test to staging environment
- Validate data integrity after restore
- Document restore procedures

### Recovery Procedures

**Point-in-Time Recovery**:
```bash
# Restore to specific time (within 7 days)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier table-order-db \
  --target-db-instance-identifier table-order-db-recovered \
  --restore-time 2026-04-05T10:30:00Z \
  --db-instance-class db.t3.medium \
  --db-subnet-group-name table-order-db-subnet-group \
  --vpc-security-group-ids sg-xxxxxx

# Wait for restore to complete
aws rds wait db-instance-available \
  --db-instance-identifier table-order-db-recovered

# Update application to use recovered database
# (Update DNS or connection string)
```

**Snapshot Restore**:
```bash
# Restore from manual snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier table-order-db-recovered \
  --db-snapshot-identifier table-order-db-20260405-120000 \
  --db-instance-class db.t3.medium \
  --db-subnet-group-name table-order-db-subnet-group \
  --vpc-security-group-ids sg-xxxxxx
```

### Recovery Objectives

- **RPO (Recovery Point Objective)**: 5 minutes (PITR granularity)
- **RTO (Recovery Time Objective)**: 30 minutes (automated restore + application update)

### Disaster Recovery Plan

**Scenarios**:

1. **Database Corruption**:
   - Use PITR to restore to point before corruption
   - Validate data integrity
   - Update application connection

2. **Accidental Data Deletion**:
   - Use PITR to restore to point before deletion
   - OR restore specific data from snapshot to staging, then copy to production

3. **Region Failure** (Future):
   - Copy snapshot to another region (cross-region backup)
   - Restore in new region
   - Update application to new endpoint

---

## 4. Security Components

### Component Description
데이터 보호, 접근 제어, 암호화를 위한 보안 컴포넌트

### 4.1 KMS Key (Encryption at Rest)

**Configuration**:
```yaml
DatabaseKMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS key for table-order database encryption
    KeyPolicy:
      Version: "2012-10-17"
      Statement:
        - Sid: Enable IAM User Permissions
          Effect: Allow
          Principal:
            AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
          Action: "kms:*"
          Resource: "*"
        
        - Sid: Allow RDS to use the key
          Effect: Allow
          Principal:
            Service: rds.amazonaws.com
          Action:
            - "kms:Decrypt"
            - "kms:GenerateDataKey"
            - "kms:CreateGrant"
          Resource: "*"
          Condition:
            StringEquals:
              "kms:ViaService": !Sub "rds.${AWS::Region}.amazonaws.com"

DatabaseKMSKeyAlias:
  Type: AWS::KMS::Alias
  Properties:
    AliasName: alias/table-order-database
    TargetKeyId: !Ref DatabaseKMSKey
```

**Encryption**:
- **Algorithm**: AES-256
- **Scope**: Database storage, automated backups, snapshots, logs
- **Key Rotation**: Automatic (annual)

### 4.2 Secrets Manager (Credentials)

**Configuration**:
```yaml
DatabaseSecret:
  Type: AWS::SecretsManager::Secret
  Properties:
    Name: table-order-database-credentials
    Description: Database credentials for table-order application
    GenerateSecretString:
      SecretStringTemplate: '{"username": "table_order_app"}'
      GenerateStringKey: password
      PasswordLength: 32
      ExcludeCharacters: '"@/\\'
      RequireEachIncludedType: true
    Tags:
      - Key: Environment
        Value: MVP
      - Key: Application
        Value: TableOrder

# Attach secret to RDS instance
SecretRDSAttachment:
  Type: AWS::SecretsManager::SecretTargetAttachment
  Properties:
    SecretId: !Ref DatabaseSecret
    TargetId: !Ref DBInstance
    TargetType: AWS::RDS::DBInstance
```

**Password Rotation**:
- **MVP**: No rotation (Q8 Answer: D - Later Decision)
- **Production**: Manual rotation every 90 days OR automated via Secrets Manager

**Application Access**:
```javascript
// Load credentials from Secrets Manager
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'ap-northeast-2' });

const getDatabaseCredentials = async () => {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'table-order-database-credentials'
  }).promise();
  
  const credentials = JSON.parse(secret.SecretString);
  return {
    username: credentials.username,
    password: credentials.password
  };
};
```

### 4.3 VPC Security Group

**Configuration**:
```yaml
DatabaseSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupName: table-order-database-sg
    GroupDescription: Security group for table-order PostgreSQL database
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        SourceSecurityGroupId: !Ref BackendSecurityGroup
        Description: Allow PostgreSQL access from backend only
    SecurityGroupEgress:
      - IpProtocol: -1
        CidrIp: 0.0.0.0/0
        Description: Allow all outbound traffic
    Tags:
      - Key: Name
        Value: table-order-database-sg
      - Key: Environment
        Value: MVP
```

**Network Isolation**:
- **Subnet**: Private subnet (no internet gateway)
- **Inbound**: Port 5432 from Backend security group only
- **Outbound**: All traffic (for updates, not used in practice)
- **Public Access**: Disabled

### 4.4 SSL/TLS (Encryption in Transit)

**Configuration**:
- **Protocol**: TLS 1.2+
- **Certificate**: AWS RDS managed certificate
- **Enforcement**: Require SSL for all connections

**Application Configuration**:
```javascript
// Knex.js SSL configuration
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false, // Accept AWS RDS certificate
      // Optional: Use explicit CA certificate
      // ca: fs.readFileSync('./rds-ca-2019-root.pem').toString()
    }
  }
});
```

**Certificate Download**:
```bash
# Download RDS CA certificate (optional)
wget https://truststore.pki.rds.amazonaws.com/ap-northeast-2/ap-northeast-2-bundle.pem -O rds-ca-cert.pem
```

---

## 5. Application Integration Component

### Component Description
Backend application과 Database의 통합을 위한 컴포넌트

### 5.1 Knex.js Configuration

**Connection Configuration**:
```javascript
// knexfile.js
const path = require('path');

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'table_order_dev'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'database/migrations'),
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.join(__dirname, 'database/seeds')
    }
  },

  production: {
    client: 'pg',
    connection: async () => {
      // Load credentials from Secrets Manager
      const credentials = await getDatabaseCredentials();
      
      return {
        host: process.env.DB_HOST,
        port: 5432,
        user: credentials.username,
        password: credentials.password,
        database: process.env.DB_NAME,
        ssl: {
          rejectUnauthorized: false
        }
      };
    },
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 600000,
      createTimeoutMillis: 3000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    migrations: {
      directory: path.join(__dirname, 'database/migrations'),
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.join(__dirname, 'database/seeds')
    }
  }
};
```

### 5.2 Health Check Endpoint

**Implementation**:
```javascript
// routes/health.js
const express = require('express');
const router = express.Router();
const knex = require('../database/knex');

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Simple connectivity check
    await knex.raw('SELECT 1');
    
    const latency = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      latency: latency,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const latency = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      latency: latency,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
```

**Health Check Monitoring**:
- **Endpoint**: `GET /health`
- **Frequency**: Every 60 seconds (from load balancer or monitoring service)
- **Timeout**: 5 seconds
- **Failure Threshold**: 3 consecutive failures

### 5.3 Connection Management

**Initialization**:
```javascript
// database/knex.js
const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Initialize Knex instance
const db = knex(config);

// Query logging (development only)
if (environment === 'development') {
  db.on('query', (query) => {
    console.log('[Query]', query.sql, query.bindings);
  });
}

// Query response logging (performance monitoring)
db.on('query', (query) => {
  query.__startTime = Date.now();
});

db.on('query-response', (response, query) => {
  const duration = Date.now() - query.__startTime;
  
  if (duration > 100) {
    console.warn('[Slow Query]', {
      sql: query.sql,
      duration: duration,
      threshold: 100
    });
  }
});

db.on('query-error', (error, query) => {
  console.error('[Query Error]', {
    sql: query.sql,
    error: error.message
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await db.destroy();
  process.exit(0);
});

module.exports = db;
```

### 5.4 Migration Runner

**Migration Execution**:
```javascript
// scripts/migrate.js
const knex = require('../database/knex');

const runMigrations = async () => {
  try {
    console.log('Running migrations...');
    
    const [batchNo, log] = await knex.migrate.latest();
    
    if (log.length === 0) {
      console.log('Database is already up to date');
    } else {
      console.log(`Batch ${batchNo} run: ${log.length} migrations`);
      log.forEach(migration => {
        console.log(`- ${migration}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
```

**Rollback Execution**:
```javascript
// scripts/rollback.js
const knex = require('../database/knex');

const rollbackMigrations = async () => {
  try {
    console.log('Rolling back migrations...');
    
    const [batchNo, log] = await knex.migrate.rollback();
    
    if (log.length === 0) {
      console.log('Already at the base migration');
    } else {
      console.log(`Batch ${batchNo} rolled back: ${log.length} migrations`);
      log.forEach(migration => {
        console.log(`- ${migration}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  }
};

rollbackMigrations();
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Request Flow                               │
└─────────────────────────────────────────────────────────────────┘

1. Application Startup:
   Backend → Secrets Manager → Get DB credentials
   Backend → Knex.js → Initialize connection pool (min 2 connections)
   Backend → RDS Instance → Establish SSL/TLS connections

2. API Request (Normal):
   Client → Backend → Knex.js Pool → Acquire connection (wait if exhausted)
   Knex.js → RDS Instance → Execute query (< 100ms target)
   RDS Instance → Knex.js → Return result
   Knex.js → Backend → Release connection to pool
   Backend → Client → Send response

3. Health Check:
   Load Balancer → Backend /health → Knex.js → SELECT 1
   RDS Instance → Backend → Return status
   Backend → Load Balancer → 200 OK or 503 Unavailable

4. CloudWatch Monitoring (Continuous):
   RDS Instance → CloudWatch Metrics → Update every 60 seconds
   CloudWatch Alarms → Evaluate metrics every 5 minutes
   If threshold exceeded → SNS Topic → Notify admin

5. Backup (Daily):
   03:00-04:00 KST → RDS Automated Backup → Create snapshot
   Snapshot → Encrypted with KMS → Store in S3
   Retention → 7 days → Auto-delete old backups

6. Migration:
   Developer → Run npx knex migrate:latest
   Knex.js → Connect to RDS
   Knex.js → Execute migration SQL
   If success → Update knex_migrations table
   If failure → Automatic rollback → Restore previous state
```

---

## Summary

| Component | Technology | Purpose | Key Configuration |
|-----------|-----------|---------|-------------------|
| **RDS Instance** | PostgreSQL 14, db.t3.medium | Data storage | 20GB gp3, Single-AZ, encryption at-rest |
| **CloudWatch Monitoring** | CloudWatch Alarms, Dashboard, Logs | Monitoring & alerting | 6 alarms (CPU, connections, storage, memory, latency) |
| **Backup & Recovery** | RDS Automated Backups, PITR | Data protection | 7 days retention, 5-min granularity |
| **Security** | KMS, Secrets Manager, VPC SG, SSL/TLS | Data security | AES-256 encryption, private subnet, credential management |
| **Application Integration** | Knex.js, Health Check, Migrations | Application connectivity | Connection pool (2-20), automatic retry, SSL |

**Total Components**: 5 major components, 15+ sub-components

**Estimated Monthly Cost**: ~$55 (RDS instance + storage + backups)
