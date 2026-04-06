# Database Unit - Infrastructure Design Plan

## Unit Context

**Unit Name**: Database  
**Unit Type**: Database Schema  
**Purpose**: 데이터 저장 및 스키마 관리

**Logical Components** (from NFR Design):
1. RDS Instance (PostgreSQL 14, db.t3.medium, 20GB gp3)
2. CloudWatch Monitoring (Alarms, Dashboard, Logs)
3. Backup and Recovery (Automated backups, PITR)
4. Security Components (KMS, Secrets Manager, VPC Security Group, SSL/TLS)
5. Application Integration (Knex.js, Health Check)

---

## Infrastructure Design Objectives

Database unit의 Infrastructure Design은 다음을 정의합니다:
1. **AWS Service Mapping** - 논리 컴포넌트를 실제 AWS 서비스로 매핑
2. **Deployment Architecture** - VPC, 서브넷, 보안 그룹 구성
3. **Infrastructure as Code** - 배포 자동화 방법 (CloudFormation, Terraform 등)
4. **Environment Strategy** - Dev/Staging/Production 환경 전략
5. **Cost Optimization** - 비용 최적화 전략

---

## Infrastructure Design Questions

다음 질문들에 답변하여 Database Infrastructure Design을 결정해주세요.

---

### Question 1: AWS Region
Database를 배포할 AWS Region을 선택해주세요.

**Context**:
- 한국 기반 서비스
- 레이턴시 최소화
- 데이터 레지던시 고려

A) **ap-northeast-2 (Seoul)** - 한국 리전, 레이턴시 최소 (권장)
B) **ap-northeast-1 (Tokyo)** - 일본 리전, 백업 용도
C) **us-east-1 (Virginia)** - 미국 리전, 글로벌 서비스
D) **Multi-region** - 여러 리전에 배포 (고가용성)
E) Other (please describe after [Answer]: tag below)

**추천**: A (Seoul) - 한국 사용자 대상 서비스

[Answer]: A

---

### Question 2: VPC Configuration
Database가 배포될 VPC 구성을 선택해주세요.

**Context**:
- Database는 private subnet에 배포
- Backend와 동일 VPC 또는 VPC peering

A) **New VPC (10.0.0.0/16)** - 새로운 VPC 생성, 전체 제어 (권장)
B) **Existing VPC** - 기존 VPC 사용 (VPC ID 제공 필요)
C) **Shared VPC** - Backend와 VPC 공유 (같은 VPC)
D) **VPC Peering** - 별도 VPC, peering으로 연결
E) Other (please describe after [Answer]: tag below)

**추천**: C (Shared VPC) - Backend와 같은 VPC 사용으로 간단화

[Answer]: A

---

### Question 3: Subnet Configuration
Database subnet 구성을 선택해주세요.

**Context**:
- RDS는 최소 2개 AZ의 subnet 필요 (DB subnet group)
- Private subnet만 사용 (인터넷 접근 불가)

A) **2 Private Subnets (10.0.1.0/24, 10.0.2.0/24)** - 2개 AZ, 각 256 IP (권장)
B) **3 Private Subnets** - 3개 AZ, 고가용성
C) **Custom CIDR** - 사용자 정의 CIDR (명시 필요)
D) **Existing Subnets** - 기존 subnet 사용 (Subnet ID 제공 필요)
E) Other (please describe after [Answer]: tag below)

**추천**: A (2 Private Subnets) - MVP에 충분, Single-AZ지만 subnet group 필요

[Answer]: A

---

### Question 4: Infrastructure as Code (IaC)
인프라 배포 자동화 방법을 선택해주세요.

**Context**:
- IaC로 인프라 재현 가능
- 버전 관리, 롤백 가능

A) **AWS CloudFormation** - AWS 네이티브, YAML/JSON (권장)
B) **Terraform** - 멀티 클라우드, HCL
C) **AWS CDK** - 프로그래밍 언어로 인프라 정의
D) **Manual (AWS Console)** - 수동 설정 (MVP 빠른 시작)
E) Other (please describe after [Answer]: tag below)

**추천**: D (Manual) - MVP 빠른 시작, 프로덕션에서 A 또는 B로 전환

[Answer]: A

---

### Question 5: Environment Strategy
개발/스테이징/프로덕션 환경 전략을 선택해주세요.

**Context**:
- MVP는 단일 환경으로 시작 가능
- 프로덕션 전환 시 환경 분리 필요

A) **Single Environment (Production only)** - MVP 단일 환경 (권장)
B) **Two Environments (Dev + Production)** - 개발 + 프로덕션 분리
C) **Three Environments (Dev + Staging + Production)** - 완전 분리
D) **Shared RDS with Separate Databases** - 하나의 RDS 인스턴스에 여러 DB
E) Other (please describe after [Answer]: tag below)

**추천**: A (Single Environment) - MVP는 프로덕션만, 개발은 로컬 DB 사용

[Answer]: A

---

### Question 6: IAM Roles and Policies
Database 접근을 위한 IAM 역할 전략을 선택해주세요.

**Context**:
- Backend가 RDS에 접근 필요
- Secrets Manager, KMS 접근 권한 필요

A) **EC2 Instance Profile** - EC2에서 Backend 실행 시 (권장)
B) **ECS Task Role** - ECS/Fargate에서 Backend 실행 시
C) **IAM User with Access Keys** - Access Key/Secret Key 사용 (비권장)
D) **IAM Roles for Service Accounts (IRSA)** - EKS에서 Backend 실행 시
E) Other (please describe after [Answer]: tag below)

**추천**: A (EC2 Instance Profile) - EC2 기반 Backend 배포 가정

[Answer]: A

---

### Question 7: Database Endpoint Access
Backend가 Database endpoint에 접근하는 방법을 선택해주세요.

**Context**:
- RDS endpoint는 DNS 이름 제공
- Environment variable 또는 Secrets Manager 사용

A) **Environment Variables** - .env 파일 또는 시스템 환경 변수 (간단)
B) **AWS Secrets Manager** - Endpoint + credentials 모두 Secrets Manager (권장)
C) **AWS Systems Manager Parameter Store** - SSM Parameter Store 사용
D) **Hardcoded** - 코드에 직접 작성 (비권장)
E) Other (please describe after [Answer]: tag below)

**추천**: B (Secrets Manager) - Endpoint와 credentials를 함께 관리

[Answer]: B

---

### Question 8: CloudWatch Log Exports
CloudWatch로 export할 로그를 선택해주세요.

**Context**:
- PostgreSQL은 여러 로그 타입 지원
- 로그 export는 추가 비용 발생 가능

A) **postgresql only** - 일반 PostgreSQL 로그만 (에러 포함, 권장)
B) **postgresql + upgrade** - PostgreSQL + 업그레이드 로그
C) **All logs** - 모든 로그 (postgresql, upgrade)
D) **No logs** - CloudWatch export 안 함 (비용 절감)
E) Other (please describe after [Answer]: tag below)

**추천**: A (postgresql only) - MVP에서는 기본 로그만 충분

[Answer]: a

---

### Question 9: RDS Enhanced Monitoring
RDS Enhanced Monitoring 활성화 여부를 선택해주세요.

**Context**:
- 기본 CloudWatch는 60초 간격 (무료)
- Enhanced Monitoring은 1초 간격, OS 메트릭 제공 (유료)

A) **Disabled** - 기본 CloudWatch만 사용 (무료, 권장)
B) **Enabled (60 seconds)** - 60초 간격, 비용 최소
C) **Enabled (30 seconds)** - 30초 간격
D) **Enabled (1 second)** - 1초 간격, 상세 모니터링
E) Other (please describe after [Answer]: tag below)

**추천**: A (Disabled) - MVP에서는 기본 모니터링 충분

[Answer]: a

---

### Question 10: Disaster Recovery Region
재해 복구를 위한 다른 리전 백업 전략을 선택해주세요.

**Context**:
- Cross-region snapshot copy로 다른 리전에 백업 가능
- 추가 비용 발생

A) **No DR Region** - 단일 리전만 사용 (MVP 권장)
B) **Manual Snapshot to Tokyo (ap-northeast-1)** - 주요 마일스톤마다 수동 복사
C) **Automated Snapshot to Tokyo** - 자동 복사 (비용 증가)
D) **Multi-Region Active-Active** - 여러 리전에서 동시 운영 (고가용성)
E) Other (please describe after [Answer]: tag below)

**추천**: A (No DR Region) - MVP는 단일 리전, 프로덕션에서 B 고려

[Answer]: a

---

### Question 11: Database Identifier Naming
RDS 인스턴스 identifier 이름 규칙을 선택해주세요.

**Context**:
- RDS identifier는 고유해야 함
- 이름에 환경, 용도 포함 권장

A) **table-order-db** - 단순 이름 (MVP 단일 환경)
B) **table-order-db-prod** - 환경 포함 (권장)
C) **table-order-db-{env}-{region}** - 환경 + 리전 (예: table-order-db-prod-ap-northeast-2)
D) **Custom naming** - 사용자 정의 (명시 필요)
E) Other (please describe after [Answer]: tag below)

**추천**: A (table-order-db) - MVP 단일 환경, 간단한 이름

[Answer]: a

---

### Question 12: Database Name
PostgreSQL 내부 database 이름을 선택해주세요.

**Context**:
- RDS 인스턴스 내부의 database 이름
- Application connection string에 사용

A) **table_order_db** - Snake case (PostgreSQL 관례)
B) **tableorder** - 단순 이름
C) **table_order** - 간결한 이름
D) **Same as RDS identifier** - RDS identifier와 동일
E) Other (please describe after [Answer]: tag below)

**추천**: A (table_order_db) - 명확하고 PostgreSQL 관례 준수

[Answer]: a

---

### Question 13: Tagging Strategy
AWS 리소스 태깅 전략을 선택해주세요.

**Context**:
- 태그로 리소스 관리, 비용 추적, 접근 제어
- 일관된 태깅 전략 권장

A) **Basic Tags** - Name, Environment만 (MVP 간단)
B) **Standard Tags** - Name, Environment, Application, ManagedBy (권장)
C) **Comprehensive Tags** - Owner, CostCenter, Project 등 추가
D) **No Tags** - 태그 사용 안 함
E) Other (please describe after [Answer]: tag below)

**추천**: B (Standard Tags) - 기본적인 관리와 추적 가능

[Answer]: b

---

### Question 14: RDS Deletion Protection
RDS 인스턴스 삭제 방지 설정을 선택해주세요.

**Context**:
- Deletion protection 활성화 시 실수로 삭제 방지
- 프로덕션 환경에서 권장

A) **Enabled** - 삭제 방지 활성화 (권장)
B) **Disabled** - 삭제 가능 (개발/테스트 환경)
C) **Later Decision** - MVP는 비활성화, 프로덕션 전환 시 활성화
D) Other (please describe after [Answer]: tag below)

**추천**: A (Enabled) - MVP부터 활성화하여 실수 방지

[Answer]: a

---

### Question 15: Backup Snapshot Retention After Deletion
RDS 인스턴스 삭제 시 final snapshot 생성 여부를 선택해주세요.

**Context**:
- 인스턴스 삭제 전 final snapshot 생성 가능
- 데이터 복구 가능

A) **Create Final Snapshot** - 삭제 전 snapshot 생성 (권장)
B) **No Final Snapshot** - Snapshot 생성 안 함 (개발 환경)
C) **Automated via IaC** - IaC에서 제어
D) Other (please describe after [Answer]: tag below)

**추천**: A (Create Final Snapshot) - 데이터 손실 방지

[Answer]: a

---

## Execution Checklist

아래는 답변을 바탕으로 실행할 Infrastructure Design 체크리스트입니다.

### Phase 1: AWS Service Mapping
- [x] **Step 1.1**: RDS 서비스 매핑
  - [x] RDS PostgreSQL 인스턴스 사양
  - [x] Database parameter group
  - [x] DB subnet group
  - [x] Option group (if needed)

- [x] **Step 1.2**: Monitoring 서비스 매핑
  - [x] CloudWatch Alarms
  - [x] CloudWatch Dashboard
  - [x] CloudWatch Logs
  - [x] SNS Topics

- [x] **Step 1.3**: Security 서비스 매핑
  - [x] AWS KMS (암호화 키)
  - [x] AWS Secrets Manager (자격 증명)
  - [x] VPC Security Groups
  - [x] IAM Roles and Policies

- [x] **Step 1.4**: Networking 서비스 매핑
  - [x] VPC
  - [x] Subnets (Private)
  - [x] Route Tables
  - [x] Network ACLs (if needed)

### Phase 2: Deployment Architecture
- [x] **Step 2.1**: Network Architecture 정의
  - [x] VPC CIDR blocks
  - [x] Subnet CIDR blocks
  - [x] Availability Zones
  - [x] Routing configuration

- [x] **Step 2.2**: Compute Architecture 정의
  - [x] RDS instance placement
  - [x] Subnet group configuration
  - [x] Multi-AZ configuration (Single-AZ for MVP)

- [x] **Step 2.3**: Security Architecture 정의
  - [x] Security group rules (inbound/outbound)
  - [x] IAM roles and policies
  - [x] Encryption configuration (KMS)
  - [x] Secrets management

- [x] **Step 2.4**: Monitoring Architecture 정의
  - [x] Alarm definitions
  - [x] Dashboard layout
  - [x] Log aggregation
  - [x] Notification channels

### Phase 3: Infrastructure as Code
- [x] **Step 3.1**: IaC 템플릿 구조 정의
  - [x] Template format (CloudFormation, Terraform, etc.)
  - [x] Resource organization
  - [x] Parameter definitions
  - [x] Output definitions

- [x] **Step 3.2**: Deployment Process 정의
  - [x] Deployment order
  - [x] Validation steps
  - [x] Rollback procedures

### Phase 4: Environment Strategy
- [x] **Step 4.1**: Environment 구성 정의
  - [x] Environment naming (dev, staging, prod)
  - [x] Resource naming conventions
  - [x] Environment-specific configurations

- [x] **Step 4.2**: Configuration Management 정의
  - [x] Environment variables
  - [x] Secrets management
  - [x] Parameter store usage

### Phase 5: Cost Optimization
- [x] **Step 5.1**: Cost Optimization 전략
  - [x] Instance sizing recommendations
  - [x] Reserved Instance opportunities
  - [x] Storage optimization
  - [x] Monitoring cost controls

- [x] **Step 5.2**: Cost Tracking 설정
  - [x] Tagging strategy for cost allocation
  - [x] Budget alerts
  - [x] Cost monitoring dashboard

### Phase 6: Documentation
- [x] **Step 6.1**: Generate `infrastructure-design.md`
  - [x] AWS service mappings
  - [x] Resource specifications
  - [x] IAM roles and policies
  - [x] Network configuration
  - [x] Security configuration
  - [x] Cost estimates

- [x] **Step 6.2**: Generate `deployment-architecture.md`
  - [x] Architecture diagrams
  - [x] Network topology
  - [x] Security architecture
  - [x] Deployment process
  - [x] Operational procedures

---

## Next Steps After Approval

1. ⛔ **WAIT**: 위 모든 질문 (Q1~Q15)에 답변해주세요
2. 답변을 분석하여 ambiguity 확인
3. 필요시 clarification 질문 생성
4. Infrastructure Design 아티팩트 생성 (infrastructure-design.md, deployment-architecture.md)
5. Present completion message
6. 사용자 승인 대기
