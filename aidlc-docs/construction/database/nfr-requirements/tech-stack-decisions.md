# Database Tech Stack Decisions

## Overview

이 문서는 Database unit의 기술 스택 선택 사항과 그 근거를 설명합니다.

---

## 1. Database Engine

### Decision: PostgreSQL 14

**선택한 옵션**: PostgreSQL 14

**대안**:
- PostgreSQL 15 (최신 기능)
- PostgreSQL 16 (최신 버전)
- MySQL 8.0
- Amazon Aurora PostgreSQL

**선택 이유**:
1. **안정성**: PostgreSQL 14는 충분히 검증된 안정적인 버전
2. **널리 사용됨**: 커뮤니티 지원 풍부, 문제 해결 자료 많음
3. **기능 충분**: 프로젝트 요구사항을 모두 충족
4. **장기 지원**: Extended support 기간 확보
5. **호환성**: Knex.js, Node.js 생태계와 완벽 호환

**PostgreSQL 14 주요 기능**:
- JSON/JSONB 지원
- CTE (Common Table Expressions)
- Window functions
- Full-text search
- Advanced indexing (B-tree, GiST, GIN)

**PostgreSQL vs MySQL**:
- PostgreSQL 선택 이유: ACID compliance 더 엄격, 복잡한 쿼리 성능 우수, JSON 지원 우수
- MySQL 대비 단점: 초기 설정 복잡도 약간 높음 (허용 가능)

---

## 2. Hosting Platform

### Decision: AWS RDS for PostgreSQL

**선택한 옵션**: AWS RDS for PostgreSQL

**대안**:
- Self-managed PostgreSQL on EC2
- Amazon Aurora PostgreSQL
- Google Cloud SQL
- Heroku Postgres

**선택 이유**:
1. **관리 편의성**: 자동 백업, 패치, 모니터링
2. **AWS 통합**: Backend (EC2/ECS), CloudWatch와 원활한 통합
3. **비용 효율성**: Aurora 대비 저렴, MVP에 적합
4. **확장성**: 수직 확장 (인스턴스 크기) 및 수평 확장 (Read Replica) 가능
5. **안정성**: AWS SLA 보장

**AWS RDS vs Aurora**:
- RDS 선택 이유: 비용 절감 (중규모 트래픽에 충분), 단순한 설정
- Aurora 대비 단점: 성능 약간 낮음 (허용 가능), 고가용성 기능 적음

**AWS RDS vs Self-managed**:
- RDS 선택 이유: 운영 부담 감소, 자동화된 백업/복구, 모니터링 내장
- Self-managed 대비 단점: 비용 약간 높음 (시간 절약으로 상쇄)

---

## 3. Instance Configuration

### 3.1 Instance Type

**Decision**: db.t3.medium

**Specifications**:
- **vCPUs**: 2
- **RAM**: 4 GB
- **Network**: Up to 5 Gbps
- **EBS Bandwidth**: Up to 2,780 Mbps

**대안**:
- db.t3.micro (2 vCPU, 1GB RAM) - 너무 작음
- db.t3.small (2 vCPU, 2GB RAM) - MVP 가능하나 여유 없음
- db.t3.large (2 vCPU, 8GB RAM) - 과도한 스펙

**선택 이유**:
1. **적절한 크기**: 10-50 concurrent users 처리 가능
2. **여유 공간**: 트래픽 증가 대응, 피크 타임 처리
3. **비용 효율성**: t3.small 대비 약간 비싸지만 충분한 여유
4. **Burstable**: T3 시리즈 CPU 크레딧으로 버스트 성능 제공

**Cost Estimate** (us-east-1, On-Demand):
- db.t3.medium: ~$0.068/hour (~$50/month)

**Scaling Path**:
- Phase 1 (MVP): t3.medium
- Phase 2 (성장): t3.large or m5.large
- Phase 3 (확장): m5.xlarge + Read Replicas

---

### 3.2 Storage Configuration

**Decision**: General Purpose SSD (gp3), 20GB

**Specifications**:
- **Type**: gp3 (General Purpose SSD)
- **Size**: 20 GB (initial)
- **IOPS**: 3,000 (baseline)
- **Throughput**: 125 MB/s (baseline)
- **Auto-scaling**: Enabled (up to 100GB)

**대안**:
- gp3, 50GB - 과도한 초기 용량
- gp3, 100GB - 불필요
- io1 (Provisioned IOPS SSD) - 고비용, 불필요

**선택 이유**:
1. **충분한 용량**: 1년 데이터 (~50MB) + 인덱스/오버헤드 고려
2. **자동 확장**: 용량 부족 시 자동 증가 (20GB → 100GB)
3. **비용 효율성**: gp3은 io1 대비 저렴, 성능 충분
4. **Baseline IOPS**: 3,000 IOPS는 중규모 트래픽에 충분

**Cost Estimate**:
- gp3, 20GB: ~$2.30/month (storage only)
- Auto-scaling 시: Pay-as-you-grow

**IOPS Calculation**:
- Expected load: 50 TPS × 2 queries/transaction = 100 IOPS (average)
- Baseline: 3,000 IOPS (충분한 여유)

---

## 4. Availability and Backup

### 4.1 Multi-AZ Deployment

**Decision**: Single-AZ (MVP)

**대안**:
- Multi-AZ (고가용성)
- Multi-AZ + Read Replica (최대 가용성)

**선택 이유**:
1. **비용 절감**: Multi-AZ는 비용 약 2배
2. **MVP 단계**: 99% uptime으로 충분
3. **영업시간 중심**: 24/7 고가용성 필수 아님
4. **향후 전환 가능**: 프로덕션 시 Multi-AZ 전환 용이

**Trade-offs**:
- **단점**: Failover 시간 증가, 단일 AZ 장애 시 서비스 중단
- **허용 이유**: MVP 단계, 비용 우선, 계획된 유지보수 시간대 활용

**Future Migration**:
- 프로덕션 전환 시 Multi-AZ 활성화 (몇 분 내 전환 가능)
- 예상 타이밍: 사용자 100+ 명 또는 매출 안정 후

---

### 4.2 Backup Strategy

**Decision**: Automated Backups (7 days retention)

**Configuration**:
- **Automated Backups**: Enabled
- **Retention Period**: 7 days
- **Backup Window**: 03:00-04:00 KST (새벽 3-4시)
- **Point-in-Time Recovery**: Enabled

**대안**:
- 30 days retention - 과도한 비용, MVP 불필요
- Manual snapshots only - 자동화 부족, 휴먼 에러 가능성
- No backups - 위험 과다

**선택 이유**:
1. **적절한 보관 기간**: 7일이면 대부분의 복구 시나리오 커버
2. **자동화**: 수동 개입 불필요, 안정적
3. **Point-in-Time**: 5분 단위 복구 가능, 정밀한 복구
4. **비용 효율성**: 7일 retention은 무료 범위 (RDS 스토리지 크기까지)

**Recovery Objectives**:
- **RPO**: 5 minutes (point-in-time recovery)
- **RTO**: 30 minutes (automated restore)

**Manual Snapshots**:
- 주요 마일스톤 (major release) 전 수동 스냅샷 생성
- 장기 보관 필요 시 (예: compliance)

---

## 5. Security Configuration

### 5.1 Encryption

**Decision**: Encryption at-rest (AES-256) + SSL/TLS in-transit

**Configuration**:
- **Encryption at Rest**: 
  - Enabled
  - Algorithm: AES-256
  - Key: AWS KMS (Customer Master Key)
- **Encryption in Transit**: 
  - Protocol: SSL/TLS 1.2+
  - Certificate: AWS RDS managed

**대안**:
- SSL/TLS only (전송 암호화만) - 저장 데이터 취약
- No encryption - 보안 위험 과다

**선택 이유**:
1. **규정 준수**: 개인정보보호법, GDPR (향후)
2. **데이터 보호**: 디스크 유출, 백업 유출 시에도 안전
3. **비용 무료**: RDS encryption은 추가 비용 없음 (KMS 키 비용만)
4. **성능 영향 미미**: 암호화/복호화 오버헤드 < 1%

**Note**: RDS encryption은 생성 시 설정 필수, 나중에 활성화 불가

---

### 5.2 Network Security

**Decision**: Private subnet, VPC security group

**Configuration**:
- **Subnet**: Private subnet (no internet gateway)
- **Security Group**: 
  - Inbound: Port 5432, Source = Backend security group only
  - Outbound: All traffic
- **Public Accessibility**: Disabled

**VPC Design**:
```
VPC: 10.0.0.0/16
  Public Subnet (10.0.0.0/24): 
    - NAT Gateway
    - Application Load Balancer (optional)
  Private Subnet 1 (10.0.1.0/24, AZ-a):
    - RDS Database (Primary)
  Private Subnet 2 (10.0.2.0/24, AZ-b):
    - Backend EC2/ECS
    - (RDS Multi-AZ standby, 향후)
```

**대안**:
- Public subnet with IP whitelist - 보안 위험 증가
- Public access - 매우 위험, 비권장

**선택 이유**:
1. **보안 강화**: 인터넷에서 직접 접근 불가
2. **공격 표면 최소화**: Backend만 접근 가능
3. **AWS Best Practice**: RDS는 항상 private subnet 권장

**Bastion Host** (optional):
- 개발/디버깅 시 Bastion host 통해 접근
- 또는 Systems Manager Session Manager 사용

---

### 5.3 Access Control

**Decision**: Single application user, full permissions

**Configuration**:
- **User**: `table_order_app`
- **Password**: 16+ characters, stored in AWS Secrets Manager
- **Permissions**: ALL (CRUD + schema changes)

**대안**:
- Least privilege (read/write 분리) - 복잡도 증가, MVP 불필요
- Multiple users (app, admin, readonly) - 관리 오버헤드

**선택 이유**:
1. **단순성**: MVP 단계, 복잡도 최소화
2. **운영 효율성**: 권한 관리 부담 감소
3. **향후 전환 가능**: 프로덕션 시 권한 분리 추가

**Secrets Manager**:
- Password rotation: 90 days
- Automatic rotation 가능 (Lambda function)
- Application은 Secrets Manager에서 credential 조회

---

## 6. Monitoring and Logging

### 6.1 Monitoring

**Decision**: CloudWatch + Alarms

**Configuration**:
- **Metrics**: CPU, Memory, Storage, Connections, Latency (standard resolution, 1 minute)
- **Alarms**: 
  - CPU > 80% for 5 minutes → SNS notification
  - Storage < 20% → SNS + auto-scaling trigger
  - Connections > 80 → SNS notification
- **Dashboard**: CloudWatch Dashboard with key metrics

**대안**:
- CloudWatch Enhanced Monitoring - 유료, MVP 불필요
- Third-party (Datadog, New Relic) - 고비용, MVP 과도

**선택 이유**:
1. **AWS 통합**: RDS와 원활한 통합
2. **비용 효율성**: Basic monitoring 무료
3. **충분한 기능**: 1분 단위 메트릭으로 충분
4. **알림 지원**: SNS 통합으로 이메일/Slack 알림

**Cost**: CloudWatch alarms ~$0.10/alarm/month (매우 저렴)

---

### 6.2 Logging

**Decision**: Error logs only (MVP), Slow query logging disabled (추후 활성화)

**Configuration**:
- **Error Logging**: Enabled → CloudWatch Logs
- **Slow Query Logging**: Disabled (향후 활성화 예정)
- **Connection Logging**: Disabled
- **DDL Logging**: Enabled (schema changes)

**대안**:
- Enable all logging - 비용 증가, overhead 증가
- No logging - 문제 진단 불가

**선택 이유**:
1. **비용 절감**: Slow query logging은 로그 volume 증가
2. **Overhead 최소화**: MVP 단계, 성능 우선
3. **에러 추적**: 에러 및 DDL은 중요하므로 항상 로깅
4. **점진적 활성화**: 프로덕션 전환 시 slow query logging 활성화

**Future Activation**:
- Slow query logging: Enable (> 500ms) 프로덕션 전환 시
- Connection logging: Enable (보안 감사 필요 시)

**Log Retention**:
- CloudWatch Logs: 30 days
- Cost: ~$0.50/GB/month (logs usually < 1GB/month for MVP)

---

## 7. Performance Tuning

### 7.1 Parameter Group

**Decision**: Default parameters (RDS default)

**Configuration**:
- **Parameter Group**: default.postgres14
- **Customization**: None (MVP)

**대안**:
- Custom parameter group (performance tuning) - 복잡도 증가, MVP 불필요

**선택 이유**:
1. **검증된 설정**: AWS RDS 기본값은 충분히 최적화됨
2. **복잡도 최소화**: Parameter tuning은 전문 지식 필요
3. **성능 충분**: 기본 설정으로 100ms 쿼리 목표 달성 가능
4. **점진적 최적화**: 성능 모니터링 후 필요시 조정

**Future Tuning** (필요 시):
- `shared_buffers`: 메모리의 25% (1GB for t3.medium)
- `work_mem`: 4MB → 16MB (복잡한 쿼리 성능)
- `max_connections`: 100 (default) → 50 (connection pool 사용 시)

---

### 7.2 Connection Pooling

**Decision**: Knex.js connection pool, 10-20 connections

**Configuration**:
```javascript
{
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000
  }
}
```

**대안**:
- No pooling - 성능 저하, 연결 오버헤드
- PgBouncer (external pooler) - 복잡도 증가, MVP 불필요

**선택 이유**:
1. **내장 지원**: Knex.js 내장 pooling 사용
2. **적절한 크기**: 10-50 users → 10-20 connections 충분
3. **성능 향상**: 연결 재사용으로 overhead 감소
4. **단순성**: 외부 pooler 불필요

---

### 7.3 Read Replica

**Decision**: No Read Replica (MVP)

**대안**:
- 1 Read Replica - 비용 증가, MVP 불필요
- Multiple Read Replicas - 과도한 설정

**선택 이유**:
1. **트래픽 충분**: 10-50 concurrent users, single instance 충분
2. **비용 절감**: Read Replica는 인스턴스 비용 추가
3. **복잡도 최소화**: Application logic 단순 (read/write 분리 불필요)
4. **향후 전환 가능**: 트래픽 증가 시 Read Replica 추가 용이

**Trigger for Read Replica**:
- Read workload > 70% CPU
- Write/Read ratio < 20/80
- User count > 100

---

## 8. Operations

### 8.1 Maintenance

**Decision**: Off-peak hours (새벽 2-4시)

**Configuration**:
- **Maintenance Window**: 매주 화요일 02:00-04:00 KST
- **Auto Minor Version Upgrade**: Enabled (within maintenance window)
- **Major Version Upgrade**: Manual (planned)

**선택 이유**:
1. **서비스 영향 최소화**: 영업 외 시간, 트래픽 최저
2. **자동화**: Auto minor version upgrade로 보안 패치 자동 적용
3. **계획적 업그레이드**: Major version은 테스트 후 수동 진행

---

### 8.2 Monitoring Dashboard

**Decision**: CloudWatch Dashboard

**Metrics**:
- CPU Utilization
- Database Connections
- Freeable Memory
- Free Storage Space
- Read/Write Latency
- Read/Write IOPS

**Refresh**: Every 1 minute

---

## 9. Cost Estimation

### Monthly Cost Breakdown (us-east-1)

| Component | Specification | Cost/Month |
|-----------|---------------|------------|
| **RDS Instance** | db.t3.medium, Single-AZ | ~$50 |
| **Storage** | gp3, 20GB | ~$2.30 |
| **Backup** | 7 days, ~20GB | Free (within storage size) |
| **Data Transfer** | Minimal (VPC internal) | < $1 |
| **CloudWatch** | Standard metrics + 3 alarms | ~$0.30 |
| **KMS** | 1 CMK for encryption | $1 |
| **Secrets Manager** | 1 secret (password) | $0.40 |
| **Total** | | **~$55/month** |

**Cost Optimization**:
- Reserved Instances: ~30-40% savings (1-year commit)
- Savings Plans: Flexible, ~20-30% savings

**Scaling Costs** (future):
- t3.large: ~$100/month (+$50)
- Multi-AZ: ~$110/month (+$60)
- Read Replica: +$50/month per replica

---

## 10. Decision Summary

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Database Engine** | PostgreSQL 14 | Stable, well-supported, feature-rich |
| **Hosting** | AWS RDS | Managed, integrated, cost-effective |
| **Instance Type** | db.t3.medium (2 vCPU, 4GB RAM) | Right-sized for 10-50 users, room to grow |
| **Storage** | gp3, 20GB, auto-scale to 100GB | Cost-efficient, sufficient IOPS (3,000) |
| **Availability** | Single-AZ | Cost savings, 99% uptime sufficient for MVP |
| **Backup** | Automated, 7 days retention | Balance of cost and recovery capability |
| **Encryption** | At-rest (AES-256) + In-transit (SSL/TLS) | Security best practice, compliance |
| **Network** | Private subnet, VPC security group | Security isolation, minimize attack surface |
| **Access** | Single user, full permissions | Simplicity for MVP, scalable later |
| **Monitoring** | CloudWatch + Alarms | AWS-integrated, cost-effective |
| **Logging** | Error only (MVP) | Minimal overhead, expand later |
| **Parameters** | Default (RDS) | Proven configuration, adjust as needed |
| **Connection Pool** | 10-20 connections (Knex.js) | Right-sized, application-level pooling |
| **Read Replica** | None (MVP) | Cost savings, single instance sufficient |
| **Maintenance** | 새벽 2-4시, 화요일 | Off-peak, minimal service impact |

---

## 11. Migration Path (Future)

**Phase 1** (MVP - Current):
- db.t3.medium, Single-AZ, 20GB, no Read Replica

**Phase 2** (Growth - 50-100 users):
- db.t3.large or db.m5.large
- Multi-AZ enabled
- 50GB storage

**Phase 3** (Scale - 100+ users):
- db.m5.xlarge
- Multi-AZ + 1-2 Read Replicas
- 100GB+ storage
- Custom parameter tuning

**Phase 4** (Enterprise - 500+ users):
- Amazon Aurora PostgreSQL (better scalability)
- Multi-region replication (disaster recovery)
- Connection pooling with PgBouncer

---

## 12. Risks and Mitigation

**Risk 1**: Single-AZ 장애 시 서비스 중단
- **Mitigation**: Automated backups (point-in-time recovery), 프로덕션 시 Multi-AZ 전환

**Risk 2**: Storage 용량 부족
- **Mitigation**: Auto-scaling enabled (20GB → 100GB), CloudWatch 알림

**Risk 3**: 성능 저하 (CPU, memory)
- **Mitigation**: CloudWatch 모니터링 및 알림, vertical scaling 용이

**Risk 4**: Connection pool 부족
- **Mitigation**: Knex.js pool size 조정 (max: 20 → 50), monitoring

**Risk 5**: Slow query 미발견
- **Mitigation**: 추후 slow query logging 활성화 (> 500ms), application-level logging

---

## Conclusion

선택한 기술 스택은 **MVP에 최적화**되어 있으며, **비용 효율성**과 **확장성**을 균형있게 고려했습니다. AWS RDS PostgreSQL 14 on db.t3.medium은 10-50명의 동시 사용자를 안정적으로 처리할 수 있으며, 향후 트래픽 증가 시 간단한 vertical/horizontal scaling으로 대응 가능합니다.

**Total Estimated Cost**: ~$55/month (매우 합리적)

**Key Strengths**:
- Managed service (운영 부담 감소)
- Right-sized (비용 최적화)
- Secure (encryption, VPC isolation)
- Scalable (clear migration path)
- Observable (CloudWatch monitoring)

**Next Steps**:
1. Infrastructure as Code (Terraform or CloudFormation) 작성
2. Knex.js migrations 준비
3. AWS 리소스 프로비저닝
4. Connection string 및 Secrets Manager 설정
5. Monitoring 및 Alerting 구성
