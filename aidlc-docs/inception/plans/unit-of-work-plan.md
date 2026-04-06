# Unit of Work Plan

## Purpose
이 계획은 테이블오더 서비스를 독립적인 작업 단위(Units of Work)로 분해하여 병렬 개발을 가능하게 합니다.

## Context Summary
- **Project**: 테이블오더 서비스 (Greenfield)
- **Architecture**: Layered Architecture (3-tier)
  - Presentation Layer: React (Customer App + Admin App)
  - Service Layer: Express Backend (REST API + SSE)
  - Data Access Layer: PostgreSQL Database
- **Components**: ~67+ components across 3 layers
- **User Stories**: 11 stories (5 customer, 6 admin)

---

## Decomposition Questions

다음 질문들에 답변하여 unit 분해 방향을 결정해주세요.

### Question 1: Unit 분해 수준
시스템을 몇 개의 units으로 분해할까요?

A) **4 Units** - Customer Frontend, Admin Frontend, Backend API, Database Schema (최대 분리, 최대 병렬성)
B) **3 Units** - Frontend (Customer + Admin), Backend API, Database Schema (중간 분리)
C) **2 Units** - Frontend (Customer + Admin), Backend (API + Database) (최소 분리, 단순성)
D) **1 Unit** - Monolithic (Frontend + Backend + Database 하나로) (최소 복잡도, 순차 개발)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2: Frontend 분리 여부
고객용 앱과 관리자용 앱을 별도 units으로 분리할까요?

A) **Separate Units** - Customer App과 Admin App을 독립적인 units으로 개발 (별도 배포 가능, 팀 분리 가능)
B) **Single Unit** - 하나의 Frontend unit에서 두 앱 모두 개발 (코드 공유 용이, 단순한 배포)
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 3: Backend과 Database 분리 여부
Backend API와 Database Schema를 별도 units으로 분리할까요?

A) **Separate Units** - Backend API unit과 Database unit 분리 (Database 먼저 설계, API는 나중에)
B) **Combined Unit** - Backend unit에 API + Database 함께 포함 (통합 개발, 트랜잭션 관리 용이)
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4: Unit 개발 순서
Units을 어떤 순서로 개발할까요?

A) **Database → Backend → Frontend** (전통적 bottom-up)
B) **Frontend → Backend → Database** (top-down, UI 먼저)
C) **Backend → Frontend & Database parallel** (API 계약 먼저, 그 다음 병렬)
D) **All parallel** (모든 units 동시 시작, 최대 속도)
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

### Question 5: 공유 코드 처리
Units 간 공유 코드(예: 도메인 모델, 유틸리티)를 어떻게 처리할까요?

A) **Shared Unit** - 공유 코드를 별도 unit으로 분리 (재사용성 최대화)
B) **Duplicate** - 각 unit에서 필요한 코드 복제 (독립성 최대화)
C) **Main Unit** - 주요 unit(보통 Backend)에 두고 다른 units이 참조
D) **No shared code** - 각 unit이 완전히 독립적
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 6: Deployment Model (Greenfield)
각 unit을 어떻게 배포할 계획인가요?

A) **Separate Deployments** - 각 unit을 독립적으로 배포 (Customer App, Admin App, Backend API 각각)
B) **Grouped Deployments** - 관련 units을 그룹으로 배포 (예: Frontend 2개 함께, Backend 별도)
C) **Monolithic Deployment** - 모든 units을 하나로 빌드/배포
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 7: Directory Structure (Greenfield)
프로젝트 디렉토리 구조를 어떻게 조직할까요?

A) **Monorepo** - 하나의 리포지토리에 모든 units (packages/ 또는 apps/ 하위)
B) **Multi-repo** - 각 unit을 별도 리포지토리로 관리
C) **Simple structure** - 평면 구조 (frontend/, backend/, database/)
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Recommended Approach

테이블오더 서비스의 특성을 고려한 권장사항:

### Option 1: 4 Units (최대 분리, 최대 병렬성)
- **Unit 1: Customer Frontend** - 고객용 React 앱
- **Unit 2: Admin Frontend** - 관리자용 React 앱
- **Unit 3: Backend API** - Express REST API + SSE
- **Unit 4: Database Schema** - PostgreSQL 스키마 및 migrations

**장점**: 
- 최대 병렬 개발 가능 (4개 팀 동시 작업 가능)
- 명확한 책임 분리
- 독립적 배포 가능

**단점**: 
- Unit 간 조율 필요
- 통합 복잡도 증가

---

### Option 2: 3 Units (중간 분리) - **권장**
- **Unit 1: Frontend** - Customer + Admin React 앱 (공유 컴포넌트 활용)
- **Unit 2: Backend** - Express API + Business Logic
- **Unit 3: Database** - PostgreSQL 스키마

**장점**:
- 적절한 병렬성 (3개 팀 또는 1개 팀이 순차적으로)
- Frontend 코드 공유 용이 (UI 컴포넌트, Context API)
- 배포 단순함 (Frontend 1개, Backend 1개, Database 1개)

**단점**:
- Customer와 Admin 앱이 같은 빌드/배포 사이클

---

### Option 3: 2 Units (최소 분리)
- **Unit 1: Frontend** - Customer + Admin
- **Unit 2: Backend** - API + Database

**장점**:
- 단순함
- Backend의 API와 Database 통합 개발 용이

**단점**:
- 병렬성 제한 (Frontend와 Backend만 병렬)

---

**개인적 권장**: **Option 2 (3 Units)**
- MVP 개발에 적합한 균형
- Frontend 공유 코드 활용 (Shared UI Components, Context API)
- Backend와 Database 분리로 스키마 우선 설계 가능
- 적절한 병렬성과 단순성의 균형

하지만 최종 결정은 사용자의 선택에 따릅니다.

---

## Execution Checklist

아래는 사용자 답변을 바탕으로 실행할 unit 생성 체크리스트입니다.

### Phase 1: Unit Identification
- [x] **Step 1.1**: Unit 경계 정의
  - [x] 선택된 decomposition 수준에 따라 units 정의
  - [x] 각 unit의 이름 및 범위 설정

- [x] **Step 1.2**: Unit 책임 정의
  - [x] 각 unit이 담당하는 컴포넌트/기능 나열
  - [x] 각 unit의 입력/출력 정의
  - [x] 각 unit의 기술 스택 명시

### Phase 2: Unit Dependencies
- [x] **Step 2.1**: 의존성 관계 매핑
  - [x] Unit 간 의존성 관계 식별
  - [x] 데이터 흐름 정의
  - [x] API 계약 정의 (Frontend ↔ Backend)

- [x] **Step 2.2**: 개발 순서 결정
  - [x] Critical path 식별
  - [x] 병렬 개발 가능한 units 식별
  - [x] 통합 지점 정의

### Phase 3: Story Mapping
- [x] **Step 3.1**: User Stories를 Units에 매핑
  - [x] Customer stories → 해당 unit(s)
  - [x] Admin stories → 해당 unit(s)
  - [x] 모든 stories가 최소 1개 unit에 할당되었는지 확인

- [x] **Step 3.2**: Unit별 story 우선순위
  - [x] 각 unit의 Critical stories 식별
  - [x] 각 unit의 MVP 범위 정의

### Phase 4: Code Organization (Greenfield)
- [x] **Step 4.1**: Directory structure 정의
  - [x] Monorepo, Multi-repo, 또는 Simple structure 선택
  - [x] 각 unit의 디렉토리 경로 정의
  - [x] 공유 코드 위치 결정

- [x] **Step 4.2**: Deployment model 정의
  - [x] 각 unit의 배포 전략
  - [x] Build 및 CI/CD 파이프라인 고려

### Phase 5: Documentation
- [x] **Step 5.1**: Generate `unit-of-work.md`
  - [x] 모든 units 정의 및 책임
  - [x] 각 unit의 컴포넌트 목록
  - [x] 각 unit의 기술 스택
  - [x] Code organization strategy (디렉토리 구조)

- [x] **Step 5.2**: Generate `unit-of-work-dependency.md`
  - [x] Dependency matrix
  - [x] API 계약
  - [x] 데이터 흐름 다이어그램
  - [x] 개발 순서 및 통합 전략

- [x] **Step 5.3**: Generate `unit-of-work-story-map.md`
  - [x] Story-to-unit mapping
  - [x] 각 unit의 story 목록
  - [x] Unit별 MVP 범위

### Phase 6: Validation
- [x] **Step 6.1**: 완전성 검증
  - [x] 모든 컴포넌트가 unit에 할당되었는가
  - [x] 모든 stories가 unit에 매핑되었는가

- [x] **Step 6.2**: 일관성 검증
  - [x] Unit boundaries가 명확한가
  - [x] 순환 의존성이 없는가
  - [x] 병렬 개발이 가능한가

---

## Next Steps After Approval

1. ⛔ **WAIT**: 위 모든 질문 (Q1~Q7)에 답변해주세요
2. 답변을 분석하여 ambiguity 확인
3. 필요시 clarification 질문 생성
4. Plan 승인 대기
5. Unit 아티팩트 생성 (unit-of-work.md, unit-of-work-dependency.md, unit-of-work-story-map.md)
