# Database Unit - NFR Requirements Plan

## Unit Context

**Unit Name**: Database  
**Unit Type**: Database Schema  
**Purpose**: 데이터 저장 및 스키마 관리

**Functional Design Summary**:
- 8 tables: stores, tables, categories, menus, sessions, orders, order_items, users
- PostgreSQL 14+
- DECIMAL(10,2) for prices
- TIMESTAMPTZ for timestamps
- Soft delete support (4 tables)
- Query-optimized indexes

**Target Environment**: AWS RDS PostgreSQL

---

## NFR Requirements Objectives

Database unit의 NFR requirements는 다음을 정의합니다:
1. **Performance Requirements** - 쿼리 응답 시간, 처리량
2. **Scalability Requirements** - 데이터 증가, 동시 연결 수
3. **Availability Requirements** - Uptime, 백업, 복구
4. **Security Requirements** - 접근 제어, 암호화, 감사
5. **Tech Stack Decisions** - PostgreSQL 버전, RDS 인스턴스 타입, 백업 전략

---

## NFR Questions

다음 질문들에 답변하여 Database NFR requirements를 결정해주세요.

---

### Question 1: Database Instance Size
예상되는 데이터 규모와 성능 요구사항을 고려한 RDS 인스턴스 크기는?

**Context**:
- 중규모 사용자 (10-50명 동시 접속)
- 1초 이내 응답 시간 목표
- MVP 단계

A) **t3.micro** - 2 vCPU, 1GB RAM (최소 비용, 개발/테스트용)
B) **t3.small** - 2 vCPU, 2GB RAM (소규모 프로덕션)
C) **t3.medium** - 2 vCPU, 4GB RAM (중규모 프로덕션, 권장)
D) **t3.large** - 2 vCPU, 8GB RAM (여유있는 중규모)
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 2: Database Storage Type and Size
스토리지 타입과 초기 용량은?

**Context**:
- RDS는 gp3 (General Purpose SSD) 또는 io1 (Provisioned IOPS SSD) 지원
- 예상 데이터: 주문 데이터 누적, 이미지는 외부 저장

A) **gp3, 20GB** - 최소 용량, 자동 확장 가능 (권장)
B) **gp3, 50GB** - 여유있는 시작 용량
C) **gp3, 100GB** - 충분한 여유 공간
D) **io1 (Provisioned IOPS)** - 고성능 필요 시
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3: Database Backup Strategy
백업 전략은?

**Context**:
- RDS 자동 백업 지원
- Point-in-time recovery 가능

A) **Automated Backups (7 days retention)** - RDS 기본 자동 백업, 7일 보관
B) **Automated Backups (30 days retention)** - 장기 보관
C) **Automated + Manual Snapshots** - 자동 + 주요 마일스톤 수동 스냅샷
D) **No backups** - 개발 환경만
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4: Multi-AZ Deployment
고가용성을 위한 Multi-AZ 배포?

**Context**:
- Multi-AZ는 자동 failover 제공 (가용성 향상)
- 비용 약 2배

A) **Single-AZ** - 단일 AZ, 비용 최소화 (개발/MVP)
B) **Multi-AZ** - 고가용성, 자동 failover (프로덕션 권장)
C) **Later decision** - MVP는 Single-AZ, 프로덕션 전환 시 Multi-AZ
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 5: Database Connection Pooling
Connection pool 설정은?

**Context**:
- Backend에서 connection pool 관리 (Knex.js)
- PostgreSQL max_connections 기본값: 100

A) **Pool: 10-20 connections** - 중소규모 적합 (권장)
B) **Pool: 20-50 connections** - 여유있는 설정
C) **Pool: 50-100 connections** - 대규모
D) **No pooling** - 매 요청마다 새 연결 (비권장)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 6: Query Performance Target
쿼리 성능 목표는?

**Context**:
- 전체 API 응답 시간 목표: 1초
- Database 쿼리는 API 응답 시간의 일부

A) **< 100ms** - 매우 빠른 쿼리 (권장, 대부분의 simple queries)
B) **< 200ms** - 빠른 쿼리
C) **< 500ms** - 복잡한 쿼리 허용
D) **< 1000ms** - API 전체 시간과 동일
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 7: Database Monitoring and Alerting
모니터링 및 알림 전략은?

**Context**:
- RDS는 CloudWatch 메트릭 제공
- 주요 메트릭: CPU, memory, connections, slow queries

A) **CloudWatch Basic** - 기본 메트릭만 (무료)
B) **CloudWatch Enhanced** - 상세 메트릭, 1초 단위 (유료)
C) **CloudWatch + Alarms** - 메트릭 + 임계값 알림 (권장)
D) **Third-party monitoring** - Datadog, New Relic 등
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 8: Slow Query Logging
느린 쿼리 로깅 설정은?

**Context**:
- PostgreSQL slow query log 지원
- 성능 문제 진단에 유용

A) **Enable (> 1000ms)** - 1초 이상 쿼리 로깅
B) **Enable (> 500ms)** - 500ms 이상 쿼리 로깅 (권장)
C) **Enable (> 100ms)** - 100ms 이상 쿼리 로깅 (상세)
D) **Disable** - 로깅 안 함
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

### Question 9: Database Encryption
데이터 암호화 설정은?

**Context**:
- RDS는 at-rest 암호화 지원 (AWS KMS)
- In-transit 암호화는 SSL/TLS

A) **Encryption at-rest + SSL/TLS** - 저장 및 전송 암호화 (권장)
B) **SSL/TLS only** - 전송 암호화만
C) **No encryption** - 개발 환경만
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 10: Database Access Control
데이터베이스 접근 제어는?

**Context**:
- Backend만 DB에 직접 접근
- VPC 내부 접근만 허용

A) **Private subnet, VPC security group** - VPC 내부만 접근 (권장)
B) **Public subnet with IP whitelist** - 특정 IP만 허용
C) **Public access** - 개발 편의성 (비권장)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 11: Database User Permissions
Database 사용자 권한 전략은?

**Context**:
- Backend application용 DB 사용자 필요
- Admin용 DB 사용자 필요 (선택)

A) **Single user (full permissions)** - 하나의 사용자, 모든 권한 (간단, MVP 적합)
B) **Two users (app + admin)** - Application 사용자 + Admin 사용자 (권한 분리)
C) **Least privilege per table** - 테이블별 세밀한 권한 설정
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 12: Read Replica
읽기 전용 복제본(Read Replica) 필요 여부는?

**Context**:
- Read Replica는 읽기 부하 분산
- 중규모 트래픽(10-50명)에서는 불필요할 수 있음

A) **No Read Replica** - 단일 인스턴스 (MVP 적합, 권장)
B) **1 Read Replica** - 읽기 부하 분산
C) **Later decision** - 성능 모니터링 후 결정
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 13: Database Maintenance Window
유지보수 시간대는?

**Context**:
- RDS 자동 패치 및 유지보수
- 서비스 중단 최소화

A) **Off-peak hours (새벽 2-4시)** - 트래픽 적은 시간 (권장)
B) **Weekends** - 주말
C) **Flexible** - RDS 자동 선택
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 14: PostgreSQL Version
PostgreSQL 버전은?

**Context**:
- RDS는 여러 PostgreSQL 버전 지원
- 최신 버전일수록 성능 및 기능 향상

A) **PostgreSQL 14** - 안정적, 널리 사용 (권장)
B) **PostgreSQL 15** - 최신 기능
C) **PostgreSQL 16** - 최신 버전
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 15: Database Parameter Group Customization
Parameter Group 커스터마이징 필요 여부는?

**Context**:
- RDS Parameter Group으로 PostgreSQL 설정 변경 가능
- 예: max_connections, shared_buffers, work_mem 등

A) **Default parameters** - RDS 기본 설정 사용 (권장, MVP)
B) **Custom parameters (performance tuning)** - 성능 최적화 설정
C) **Later decision** - 성능 모니터링 후 조정
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Execution Checklist

아래는 답변을 바탕으로 실행할 NFR requirements 체크리스트입니다.

### Phase 1: Performance Requirements
- [x] **Step 1.1**: 쿼리 성능 목표 정의
  - [x] Simple queries 응답 시간
  - [x] Complex queries 응답 시간
  - [x] Concurrent connections 목표

- [x] **Step 1.2**: 처리량 목표 정의
  - [x] Transactions per second (TPS)
  - [x] Queries per second (QPS)

### Phase 2: Scalability Requirements
- [x] **Step 2.1**: 데이터 증가 패턴
  - [x] 예상 데이터 증가율
  - [x] Storage 확장 전략

- [x] **Step 2.2**: 동시 사용자 증가
  - [x] Connection pool 확장 전략
  - [x] Read Replica 필요성 평가

### Phase 3: Availability Requirements
- [x] **Step 3.1**: Uptime 목표
  - [x] SLA 목표 (예: 99.9%)
  - [x] Multi-AZ 배포 결정

- [x] **Step 3.2**: 백업 및 복구
  - [x] 백업 주기 및 보관 기간
  - [x] Point-in-time recovery 설정
  - [x] 재해 복구 계획

### Phase 4: Security Requirements
- [x] **Step 4.1**: 데이터 암호화
  - [x] At-rest 암호화 (KMS)
  - [x] In-transit 암호화 (SSL/TLS)

- [x] **Step 4.2**: 접근 제어
  - [x] VPC 설정
  - [x] Security group 규칙
  - [x] Database 사용자 권한

- [x] **Step 4.3**: 감사 및 로깅
  - [x] Slow query logging
  - [x] Connection logging
  - [x] 보안 이벤트 로깅

### Phase 5: Monitoring Requirements
- [x] **Step 5.1**: 메트릭 정의
  - [x] CPU, Memory, Storage 사용률
  - [x] Connection count
  - [x] Query latency

- [x] **Step 5.2**: 알림 설정
  - [x] 임계값 정의
  - [x] 알림 채널 (email, SMS, Slack)

### Phase 6: Tech Stack Decisions
- [x] **Step 6.1**: PostgreSQL 버전 선택
  - [x] 버전 및 이유

- [x] **Step 6.2**: RDS 인스턴스 타입
  - [x] Instance class (t3.medium 등)
  - [x] Storage type (gp3 등)
  - [x] Storage size

- [x] **Step 6.3**: 배포 전략
  - [x] Single-AZ vs Multi-AZ
  - [x] Read Replica 여부

### Phase 7: Documentation
- [x] **Step 7.1**: Generate `nfr-requirements.md`
  - [x] Performance requirements
  - [x] Scalability requirements
  - [x] Availability requirements
  - [x] Security requirements
  - [x] Monitoring requirements

- [x] **Step 7.2**: Generate `tech-stack-decisions.md`
  - [x] PostgreSQL version
  - [x] RDS instance type
  - [x] Storage configuration
  - [x] Backup strategy
  - [x] Security configuration
  - [x] Monitoring setup

---

## Next Steps After Approval

1. ⛔ **WAIT**: 위 모든 질문 (Q1~Q15)에 답변해주세요
2. 답변을 분석하여 ambiguity 확인
3. 필요시 clarification 질문 생성
4. NFR requirements 아티팩트 생성 (nfr-requirements.md, tech-stack-decisions.md)
5. Present completion message
6. 사용자 승인 대기
