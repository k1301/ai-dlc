# Database Unit - NFR Design Plan

## Unit Context

**Unit Name**: Database  
**Unit Type**: Database Schema  
**Purpose**: 데이터 저장 및 스키마 관리

**NFR Requirements Summary**:
- Performance: Query <100ms, 50 TPS, 10-20 connections
- Scalability: Storage auto-scaling (20GB → 100GB), User scalability (10-50 → 100+)
- Availability: 99% uptime (Single-AZ), 7 days backup, point-in-time recovery
- Security: Encryption at-rest/in-transit, private subnet, VPC security group
- Reliability: Error handling, CloudWatch monitoring, alarms
- Maintainability: Knex.js migrations, documentation

---

## NFR Design Objectives

Database unit의 NFR Design은 다음을 정의합니다:
1. **Design Patterns** - Connection pooling, error handling, monitoring patterns
2. **Logical Components** - RDS instance, CloudWatch alarms, backup jobs, health checks
3. **Implementation Strategy** - How to implement NFR requirements in the database layer

---

## NFR Design Questions

다음 질문들에 답변하여 Database NFR Design을 결정해주세요.

---

### Question 1: Connection Pool Error Handling
Connection pool에서 발생하는 오류를 어떻게 처리할지 선택해주세요.

**Context**:
- NFR Requirements에서 "Retry 3 times with exponential backoff" 정의됨
- Connection acquisition timeout: 30 seconds
- Knex.js pool configuration 사용

A) **Automatic Retry (Knex.js built-in)** - Knex.js의 기본 retry 메커니즘 사용 (간단)
B) **Custom Retry Logic** - Application-level에서 명시적 retry 로직 구현 (세밀한 제어)
C) **Circuit Breaker Pattern** - 일정 실패 후 circuit open, 일시적으로 요청 차단 (과부하 방지)
D) **Fail Fast** - Retry 없이 즉시 실패 반환 (단순, 빠른 실패 감지)
E) Other (please describe after [Answer]: tag below)

**추천**: A (Automatic Retry) - MVP에서는 Knex.js 기본 retry 충분

[Answer]: A

---

### Question 2: Database Health Check Implementation
Database health check를 어떤 수준으로 구현할지 선택해주세요.

**Context**:
- Backend에서 `/health` endpoint 제공
- NFR Requirements에서 기본 health check 정의됨

A) **Simple Query Only** - `SELECT 1` 쿼리만 실행 (기본, 빠름)
B) **Table Existence Check** - 주요 테이블 존재 여부 확인 (스키마 검증)
C) **Connectivity + Latency** - 연결 + 응답 시간 측정 (성능 모니터링)
D) **Comprehensive** - 연결 + 테이블 존재 + 쿼리 성능 (완전한 검사)
E) Other (please describe after [Answer]: tag below)

**추천**: A (Simple Query Only) - MVP에서는 기본 연결 확인 충분

[Answer]: A

---

### Question 3: CloudWatch Alarm Response Strategy
CloudWatch alarm 발생 시 대응 전략을 선택해주세요.

**Context**:
- CPU > 80%, Connections > 80, Storage < 20% 시 alarm
- SNS notification 설정

A) **Manual Response Only** - Alarm 발생 시 수동 확인 및 대응 (MVP 적합)
B) **Automated Scaling** - Auto-scaling trigger 연결 (스토리지만 자동 확장)
C) **Automated Scaling + Notification** - 자동 확장 + 알림 (권장)
D) **Runbook Automation** - Lambda를 통한 자동 대응 (고급)
E) Other (please describe after [Answer]: tag below)

**추천**: C (Automated Scaling + Notification) - Storage auto-scaling은 활성화, 나머지는 알림만

[Answer]: C

---

### Question 4: Backup Validation Strategy
백업이 제대로 동작하는지 검증하는 전략을 선택해주세요.

**Context**:
- 7일 자동 백업 활성화
- NFR Requirements에서 "월 1회 백업 복구 테스트" 권장

A) **No Validation** - 백업만 활성화, 검증 없음 (MVP 단순화)
B) **Monthly Manual Test** - 월 1회 수동으로 복구 테스트 (권장)
C) **Automated Test** - 자동화된 백업 복구 테스트 (시간 소요)
D) **Restore to Staging** - 주기적으로 staging 환경에 복구 (완전한 검증)
E) Other (please describe after [Answer]: tag below)

**추천**: A (No Validation) - MVP에서는 활성화만, 프로덕션에서 B 적용

[Answer]: A

---

### Question 5: Query Performance Monitoring
쿼리 성능을 어떻게 모니터링할지 선택해주세요.

**Context**:
- Slow query logging은 MVP에서 비활성화 (추후 활성화)
- 쿼리 응답 시간 목표: < 100ms

A) **Application-Level Logging** - Backend에서 쿼리 실행 시간 로깅 (간단)
B) **CloudWatch Performance Insights** - RDS Performance Insights 사용 (유료, 상세)
C) **Both** - Application logging + Performance Insights (완전한 가시성)
D) **No Monitoring** - MVP에서는 모니터링 안 함 (비권장)
E) Other (please describe after [Answer]: tag below)

**추천**: A (Application-Level Logging) - MVP에서는 backend logging 충분

[Answer]: A

---

### Question 6: Database Migration Rollback Strategy
Migration 실패 시 rollback 전략을 선택해주세요.

**Context**:
- Knex.js migrations 사용
- down() function으로 rollback 지원

A) **Automatic Rollback** - Migration 실패 시 자동 rollback (안전)
B) **Manual Rollback** - 실패 시 수동으로 rollback 명령 실행 (제어 가능)
C) **No Rollback** - Rollback 없이 forward-only migration (단순)
D) **Backup + Restore** - Migration 전 snapshot, 실패 시 복구 (완전한 복구)
E) Other (please describe after [Answer]: tag below)

**추천**: A (Automatic Rollback) - Knex.js 기본 rollback 기능 활용

[Answer]: A

---

### Question 7: Connection Pool Exhaustion Handling
Connection pool이 고갈될 때 처리 방법을 선택해주세요.

**Context**:
- Pool size: max 20 connections
- Acquisition timeout: 30 seconds

A) **Queue and Wait** - 연결이 사용 가능할 때까지 대기 (기본, Knex.js 동작)
B) **Fail Fast** - Timeout 전에 즉시 실패 반환 (빠른 응답)
C) **Dynamic Pool Expansion** - 임시로 pool size 증가 (위험)
D) **Circuit Breaker** - 일정 실패 후 요청 차단 (과부하 방지)
E) Other (please describe after [Answer]: tag below)

**추천**: A (Queue and Wait) - Knex.js 기본 동작 사용

[Answer]: A

---

### Question 8: Database Password Rotation
Database password rotation 전략을 선택해주세요.

**Context**:
- NFR Requirements에서 "90일마다 rotation" 권장
- AWS Secrets Manager 사용

A) **No Rotation** - MVP에서는 password 고정 (단순)
B) **Manual Rotation (90 days)** - 90일마다 수동으로 password 변경 (권장)
C) **Automated Rotation (Secrets Manager)** - Secrets Manager 자동 rotation (완전 자동화)
D) **Later Decision** - MVP는 no rotation, 프로덕션에서 결정
E) Other (please describe after [Answer]: tag below)

**추천**: D (Later Decision) - MVP는 고정, 프로덕션에서 B 또는 C 적용

[Answer]: D

---

### Question 9: Transaction Timeout Handling
Long-running transaction timeout 처리 방법을 선택해주세요.

**Context**:
- Query timeout: 30 seconds
- PostgreSQL statement_timeout 설정 가능

A) **Application Timeout Only** - Knex.js timeout만 사용 (30초)
B) **Database Timeout (statement_timeout)** - PostgreSQL level에서 timeout 설정 (서버 보호)
C) **Both** - Application + Database timeout (이중 보호)
D) **No Timeout** - Timeout 없음 (비권장)
E) Other (please describe after [Answer]: tag below)

**추천**: A (Application Timeout Only) - MVP에서는 Knex.js timeout 충분

[Answer]: A

---

### Question 10: Database Connection Leak Detection
Connection leak을 감지하는 방법을 선택해주세요.

**Context**:
- Connection pool이 제대로 반환되지 않으면 leak 발생 가능
- Idle timeout: 10 minutes

A) **No Detection** - MVP에서는 감지 안 함 (단순)
B) **Idle Connection Monitoring** - CloudWatch로 idle connection 수 모니터링 (기본)
C) **Application-Level Tracking** - Backend에서 connection 사용 추적 (상세)
D) **Knex.js Debug Mode** - 개발 환경에서 debug logging 활성화 (개발용)
E) Other (please describe after [Answer]: tag below)

**추천**: B (Idle Connection Monitoring) - CloudWatch 기본 메트릭 활용

[Answer]: B

---

## Execution Checklist

아래는 답변을 바탕으로 실행할 NFR Design 체크리스트입니다.

### Phase 1: Design Patterns Definition
- [x] **Step 1.1**: Connection Pooling Pattern 정의
  - [x] Pool configuration
  - [x] Error handling strategy
  - [x] Timeout configuration
  - [x] Connection leak prevention

- [x] **Step 1.2**: Error Handling Pattern 정의
  - [x] Retry strategy
  - [x] Circuit breaker (if applicable)
  - [x] Timeout handling
  - [x] Transaction rollback

- [x] **Step 1.3**: Monitoring Pattern 정의
  - [x] Query performance monitoring
  - [x] Connection pool monitoring
  - [x] Health check implementation
  - [x] Alert response strategy

- [x] **Step 1.4**: Data Management Pattern 정의
  - [x] Migration strategy
  - [x] Backup validation
  - [x] Password rotation
  - [x] Schema versioning

### Phase 2: Logical Components Definition
- [x] **Step 2.1**: AWS RDS Instance
  - [x] Instance configuration
  - [x] Parameter group settings
  - [x] Security group rules
  - [x] Subnet configuration

- [x] **Step 2.2**: CloudWatch Monitoring
  - [x] Alarms configuration
  - [x] Dashboard layout
  - [x] Log groups
  - [x] SNS topics for notifications

- [x] **Step 2.3**: Backup and Recovery
  - [x] Automated backup schedule
  - [x] Backup validation process
  - [x] Point-in-time recovery setup
  - [x] Disaster recovery plan

- [x] **Step 2.4**: Security Components
  - [x] Encryption keys (KMS)
  - [x] Secrets Manager setup
  - [x] VPC security groups
  - [x] SSL/TLS certificates

- [x] **Step 2.5**: Application Integration
  - [x] Knex.js configuration
  - [x] Health check endpoint
  - [x] Error handling middleware
  - [x] Connection pool management

### Phase 3: Implementation Strategy
- [x] **Step 3.1**: Setup sequence 정의
  - [x] Infrastructure provisioning order
  - [x] Configuration steps
  - [x] Validation checkpoints

- [x] **Step 3.2**: Testing strategy 정의
  - [x] Connection testing
  - [x] Performance testing
  - [x] Failover testing (if Multi-AZ)
  - [x] Backup/restore testing

- [x] **Step 3.3**: Monitoring setup 정의
  - [x] CloudWatch alarms creation
  - [x] Dashboard configuration
  - [x] Alert notification setup

### Phase 4: Documentation
- [x] **Step 4.1**: Generate `nfr-design-patterns.md`
  - [x] Connection Pooling Pattern
  - [x] Error Handling Pattern
  - [x] Monitoring Pattern
  - [x] Data Management Pattern

- [x] **Step 4.2**: Generate `logical-components.md`
  - [x] RDS Instance component
  - [x] CloudWatch Monitoring component
  - [x] Backup and Recovery component
  - [x] Security Components
  - [x] Application Integration component

---

## Next Steps After Approval

1. ⛔ **WAIT**: 위 모든 질문 (Q1~Q10)에 답변해주세요
2. 답변을 분석하여 ambiguity 확인
3. 필요시 clarification 질문 생성
4. NFR Design 아티팩트 생성 (nfr-design-patterns.md, logical-components.md)
5. Present completion message
6. 사용자 승인 대기
