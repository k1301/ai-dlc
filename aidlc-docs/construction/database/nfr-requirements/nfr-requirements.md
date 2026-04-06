# Database NFR Requirements

## Overview

이 문서는 Database unit의 비기능 요구사항(Non-Functional Requirements)을 정의합니다.

**Database**: PostgreSQL 14 on AWS RDS  
**Target Environment**: AWS (Single-AZ, MVP configuration)  
**Expected Load**: 10-50 concurrent users

---

## 1. Performance Requirements

### 1.1 Query Performance

**Requirement**: 데이터베이스 쿼리는 100ms 이내에 응답해야 합니다.

**Details**:
- **Simple Queries** (SELECT by PK, FK): < 50ms
- **Indexed Queries** (WHERE with indexed columns): < 100ms
- **Complex Queries** (JOIN, aggregation): < 100ms (최대 허용)
- **Write Operations** (INSERT, UPDATE, DELETE): < 100ms

**Rationale**:
- 전체 API 응답 시간 목표가 1초이므로 DB 쿼리는 그 일부여야 함
- 대부분의 쿼리는 단순하므로 100ms는 충분히 달성 가능
- 인덱스를 적절히 활용하면 100ms 이내 응답 가능

**Measurement**:
- CloudWatch RDS Performance Insights 사용
- Slow query logging은 현재 비활성화 (추후 활성화 예정)
- 애플리케이션 레벨에서 쿼리 시간 로깅

**Acceptance Criteria**:
- P95 쿼리 응답 시간 < 100ms
- P99 쿼리 응답 시간 < 200ms

---

### 1.2 Throughput

**Requirement**: 데이터베이스는 최소 50 TPS (Transactions Per Second)를 처리해야 합니다.

**Details**:
- **Expected Load**: 10-50 concurrent users
- **Average Transactions per User**: ~1 TPS
- **Peak Load**: 50 TPS
- **Sustainable Load**: 30 TPS (average)

**Rationale**:
- 중규모 트래픽 (10-50명)
- 주문 생성, 메뉴 조회 등 기본 트랜잭션
- t3.medium 인스턴스로 충분히 처리 가능

**Measurement**:
- CloudWatch Metrics: DatabaseConnections, ReadThroughput, WriteThroughput
- Application metrics: Transactions per second

**Acceptance Criteria**:
- Sustained 30 TPS without performance degradation
- Peak 50 TPS handling capability

---

### 1.3 Connection Management

**Requirement**: 10-20개의 동시 데이터베이스 연결을 유지합니다.

**Details**:
- **Connection Pool Size**: 10-20 connections (Knex.js pool configuration)
- **Max Connections**: PostgreSQL default (100)
- **Connection Timeout**: 30 seconds
- **Idle Timeout**: 10 minutes

**Configuration** (Knex.js):
```javascript
{
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000
  }
}
```

**Rationale**:
- 10-50 concurrent users → 10-20 connections 충분
- Connection pooling으로 연결 재사용
- 불필요한 연결 낭비 방지

---

## 2. Scalability Requirements

### 2.1 Data Growth

**Requirement**: 최소 1년간 데이터 증가를 수용해야 합니다.

**Expected Growth**:
- **Orders**: ~100 orders/day → 36,500 orders/year
- **Order Items**: ~300 items/day (avg 3 items per order) → 109,500/year
- **Menus**: 50-100 menus (stable)
- **Categories**: 5-10 categories (stable)
- **Users**: 5-10 admin users (stable)
- **Tables**: 10-20 tables (stable)
- **Sessions**: ~100 sessions/day → 36,500/year

**Storage Estimate** (1 year):
- Orders: ~3.5 MB (100 bytes × 36,500)
- Order Items: ~11 MB (100 bytes × 109,500)
- Other tables: < 1 MB
- **Total**: ~20 MB/year (데이터만)
- **With indexes, overhead**: ~50 MB/year

**Initial Storage**: 20GB (충분한 여유)

**Auto-scaling**:
- RDS Storage Auto-scaling 활성화
- Threshold: 80% usage
- Maximum storage: 100GB (자동 확장 상한)

---

### 2.2 User Growth

**Requirement**: 50명까지 동시 사용자 증가 대응

**Current**: 10-50 concurrent users  
**Future (1 year)**: 50-100 concurrent users (예상)

**Scaling Strategy**:
- **Phase 1** (MVP): t3.medium, Single-AZ (현재)
- **Phase 2** (성장기): t3.medium → t3.large, Multi-AZ 전환
- **Phase 3** (확장기): Read Replica 추가, connection pool 증가

**Triggers**:
- CPU > 70% sustained
- Connection count > 80% of max
- Query latency > 200ms (P95)

---

## 3. Availability Requirements

### 3.1 Uptime

**Requirement**: 99% uptime (허용 다운타임: ~7.3 hours/month)

**Current Configuration**: Single-AZ
- **Expected Availability**: 99.0-99.5%
- **Planned Downtime**: Maintenance window (새벽 2-4시, 월 1-2회)

**Future Configuration** (프로덕션): Multi-AZ
- **Target Availability**: 99.9% (허용 다운타임: ~43 minutes/month)

**Rationale**:
- MVP 단계에서는 Single-AZ로 비용 절감
- 테이블오더 서비스 특성상 24/7 고가용성 필수는 아님 (영업시간 내 가용성 중요)
- 프로덕션 전환 시 Multi-AZ로 업그레이드 계획

---

### 3.2 Backup and Recovery

**Requirement**: 7일 이내 데이터 복구 가능

**Backup Strategy**:
- **Automated Backups**: Enabled
- **Retention Period**: 7 days
- **Backup Window**: 새벽 3-4시 (유지보수 시간과 겹침)
- **Point-in-Time Recovery**: Enabled (5분 단위)

**Recovery Objectives**:
- **RPO (Recovery Point Objective)**: 5 minutes (point-in-time recovery)
- **RTO (Recovery Time Objective)**: 30 minutes (automated restore)

**Backup Validation**:
- 월 1회 백업 복구 테스트 수행
- 복구 프로세스 문서화

**Disaster Recovery**:
- Manual snapshot 생성 (주요 마일스톤)
- Cross-region snapshot copy (선택, 향후 고려)

---

### 3.3 Maintenance Window

**Requirement**: 서비스 영향 최소화

**Maintenance Window**: 매주 화요일 새벽 2-4시 (KST)
- **Duration**: 최대 2시간
- **Frequency**: 주 1회 (필요시)
- **Activities**: 
  - OS/DB 패치
  - Minor version upgrades
  - Parameter changes

**Rationale**:
- 영업시간 외 (매장 마감 후)
- 트래픽이 가장 적은 시간대
- 화요일 선택 (주말 직후 아님, 주말 전 아님)

**Notification**:
- 유지보수 24시간 전 알림 (이메일, Slack)
- 영향 범위 및 예상 시간 공유

---

## 4. Security Requirements

### 4.1 Data Encryption

**Requirement**: 저장 및 전송 데이터 암호화

**Encryption at Rest**:
- **Enabled**: Yes
- **Algorithm**: AES-256
- **Key Management**: AWS KMS (Customer Master Key)
- **Scope**: 모든 데이터, 백업, 스냅샷

**Encryption in Transit**:
- **Protocol**: SSL/TLS 1.2+
- **Certificate**: AWS RDS managed certificate
- **Enforcement**: 모든 클라이언트 연결은 SSL 필수

**Configuration**:
```javascript
// Knex.js SSL configuration
{
  connection: {
    ssl: {
      rejectUnauthorized: false, // RDS certificate trust
      ca: fs.readFileSync('./rds-ca-cert.pem') // Optional: explicit CA cert
    }
  }
}
```

**Rationale**:
- 데이터 유출 시 암호화로 보호
- 규정 준수 (GDPR, 개인정보보호법)
- 네트워크 스니핑 방지

---

### 4.2 Access Control

**Requirement**: VPC 내부에서만 데이터베이스 접근 가능

**Network Security**:
- **Subnet**: Private subnet (no internet gateway)
- **Security Group**: 
  - Inbound: Port 5432, source = Backend security group only
  - Outbound: All traffic (for updates)
- **Public Accessibility**: Disabled

**VPC Configuration**:
```
VPC: 10.0.0.0/16
  Private Subnet 1: 10.0.1.0/24 (AZ-a) → RDS Database
  Private Subnet 2: 10.0.2.0/24 (AZ-b) → Backend EC2/ECS
```

**Rationale**:
- Database는 인터넷에 노출되지 않음
- Backend만 DB 접근 가능
- 공격 표면 최소화

---

### 4.3 Database User Permissions

**Requirement**: 단일 사용자, 전체 권한 (MVP 단순화)

**Users**:
- **Application User**: `table_order_app`
  - Permissions: ALL (CRUD on all tables, schema changes)
  - Used by: Backend application

**Future** (프로덕션):
- **Application User** (read-write): CRUD only
- **Admin User** (read-only): SELECT only (for reports)
- **Migration User**: Schema changes only

**Password Policy**:
- Minimum 16 characters
- Alphanumeric + special characters
- Stored in AWS Secrets Manager (not in code)
- Rotated every 90 days

**Rationale**:
- MVP 단계에서는 단순화 (single user)
- 프로덕션에서는 least privilege 원칙 적용
- Secrets Manager로 안전한 자격 증명 관리

---

### 4.4 Audit Logging

**Requirement**: 주요 데이터베이스 이벤트 감사

**Logging Configuration**:
- **Connection Logging**: Disabled (MVP에서는 overhead 고려)
- **Slow Query Logging**: Disabled (추후 활성화 예정)
- **Error Logging**: Enabled (CloudWatch Logs)
- **DDL Logging**: Enabled (schema changes)

**Future Activation** (프로덕션):
- Slow Query Logging: Enable (> 500ms)
- Connection Logging: Enable (보안 감사용)

**Log Retention**:
- CloudWatch Logs: 30 days
- Archive to S3: 1 year (cold storage)

**Rationale**:
- MVP에서는 최소 로깅 (비용 및 overhead 최소화)
- 에러 및 DDL은 중요하므로 항상 로깅
- 프로덕션 전환 시 상세 로깅 활성화

---

## 5. Reliability Requirements

### 5.1 Error Handling

**Requirement**: 데이터베이스 오류 시 적절한 처리 및 복구

**Error Scenarios**:
- **Connection Failure**: Retry 3 times with exponential backoff
- **Timeout**: Query timeout 30 seconds, retry or abort
- **Deadlock**: Automatic retry (PostgreSQL handles)
- **Transaction Failure**: Rollback, log error, return error to client

**Application-Level Handling** (Backend):
```javascript
// Example: Connection retry
const retryConnection = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.raw('SELECT 1');
      return true;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
};
```

---

### 5.2 Monitoring and Alerting

**Requirement**: 주요 메트릭 모니터링 및 임계값 알림

**Monitored Metrics** (CloudWatch):
- **CPU Utilization**: Alert if > 80% for 5 minutes
- **Database Connections**: Alert if > 80 (of 100 max)
- **Freeable Memory**: Alert if < 500 MB
- **Free Storage Space**: Alert if < 20%
- **Read/Write Latency**: Alert if > 100ms (P95)
- **Read/Write IOPS**: Monitor for anomalies

**Alerting**:
- **Notification Channels**: Email, Slack
- **Severity Levels**:
  - **Critical**: Immediate action (CPU > 90%, connections > 95, storage < 10%)
  - **Warning**: Investigation needed (CPU > 80%, connections > 80%, storage < 20%)
  - **Info**: Monitoring (normal fluctuations)

**CloudWatch Alarms**:
```yaml
Alarms:
  - Name: RDS-CPU-High
    Metric: CPUUtilization
    Threshold: 80
    Period: 300 (5 minutes)
    EvaluationPeriods: 2
    Action: SNS notification

  - Name: RDS-Storage-Low
    Metric: FreeStorageSpace
    Threshold: 4GB (20% of 20GB)
    Period: 300
    EvaluationPeriods: 1
    Action: SNS notification + auto-scaling trigger
```

**Dashboard**:
- CloudWatch Dashboard with key metrics
- Updated every 1 minute (standard resolution)

---

### 5.3 Health Checks

**Requirement**: 데이터베이스 헬스 체크

**Application Health Check** (Backend):
```javascript
// Health check endpoint: GET /health
app.get('/health', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
  }
});
```

**Monitoring Frequency**: Every 60 seconds

---

## 6. Maintainability Requirements

### 6.1 Schema Versioning

**Requirement**: 데이터베이스 스키마 변경 이력 관리

**Tool**: Knex.js migrations

**Migration Strategy**:
- All schema changes via migration files
- Sequential numbering (001, 002, ...)
- Rollback support (down() function)
- Version tracking in `knex_migrations` table

**Example**:
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

---

### 6.2 Documentation

**Requirement**: 스키마 및 변경 사항 문서화

**Documentation**:
- **ERD**: Entity Relationship Diagram (in domain-entities.md)
- **Schema Reference**: Table, column, constraint details
- **Migration Log**: Each migration file with description
- **Business Rules**: Data integrity rules (in business-rules.md)

**Updates**: 스키마 변경 시 문서 동시 업데이트

---

## 7. Compliance Requirements

### 7.1 Data Retention

**Requirement**: 주문 데이터는 최소 1년 보관

**Retention Policy**:
- **Orders, Order Items**: Permanent (no deletion)
- **Sessions**: Permanent (soft close, no deletion)
- **Menus, Categories**: Soft delete, 1 year retention
- **Users**: Soft delete, 1 year retention
- **Tables**: Soft delete, 1 year retention

**Archival** (향후):
- 1년 이상 된 주문 데이터 → S3 cold storage
- Database에는 최근 1년 데이터만 유지 (성능 최적화)

---

### 7.2 Data Privacy

**Requirement**: 개인정보보호법 준수 (한국)

**Personal Data**:
- **Users**: username, password_hash (관리자 정보)
- **Orders**: 주문 내역 (개인식별 정보 없음, 테이블 번호만)

**Privacy Measures**:
- Password hashing (bcrypt)
- Encryption at-rest
- Access control (VPC, security group)
- No PII (Personally Identifiable Information) in orders

**GDPR Consideration** (향후 확장 시):
- Right to erasure (삭제 요청 처리)
- Data portability (데이터 내보내기)
- Consent management

---

## 8. Performance Optimization Strategy

### 8.1 Indexing

**Requirement**: 적절한 인덱스로 쿼리 성능 최적화

**Index Strategy**: Query-optimized
- Primary Key indexes (automatic)
- Foreign Key indexes (all FKs)
- Frequently queried columns (status, is_active, deleted_at, display_order)
- Composite index: (table_id, is_active) for sessions

**Monitoring**: EXPLAIN ANALYZE for slow queries (when logging enabled)

---

### 8.2 Query Optimization

**Requirement**: 효율적인 쿼리 작성

**Best Practices**:
- Use indexed columns in WHERE clauses
- Avoid SELECT * (select only needed columns)
- Use JOINs instead of multiple queries
- Limit result sets (LIMIT, pagination)
- Use connection pooling

**Review Process**: Code review includes query performance check

---

### 8.3 Caching Strategy

**Requirement**: 자주 조회되는 데이터 캐싱 (Optional, 향후)

**Future Caching** (프로덕션):
- **Redis** for menu data (read-heavy)
- **Application-level caching** for categories
- **TTL**: 5-10 minutes

**MVP**: No caching (database-only)

---

## Summary

**Performance**:
- Query response time < 100ms
- Throughput: 50 TPS
- Connection pool: 10-20 connections

**Scalability**:
- Storage: 20GB initial, auto-scale to 100GB
- Users: 10-50 concurrent, scalable to 100+

**Availability**:
- Uptime: 99% (Single-AZ MVP)
- Backup: 7 days retention, point-in-time recovery
- Maintenance: 새벽 2-4시, 주 1회

**Security**:
- Encryption: at-rest (AES-256) + in-transit (SSL/TLS)
- Access: Private subnet, VPC security group
- User: Single application user (MVP)
- Logging: Error logs only (MVP), detailed logs later

**Reliability**:
- Error handling: Retry with exponential backoff
- Monitoring: CloudWatch + Alarms
- Alerting: Critical (CPU > 90%, storage < 10%), Warning (CPU > 80%, storage < 20%)

**Maintainability**:
- Schema versioning: Knex.js migrations
- Documentation: ERD, schema reference, migration log
