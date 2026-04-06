# Application Design Plan

## Purpose
이 계획은 테이블오더 서비스의 high-level 컴포넌트와 서비스 레이어를 설계하는 방법론을 정의합니다.

## Context Summary
- **Project**: 테이블오더 서비스 (Table Order Service)
- **Architecture**: Client-Server Architecture
- **Frontend**: React (고객용 UI + 관리자용 UI)
- **Backend**: Node.js (REST API + SSE)
- **Database**: PostgreSQL
- **Key Features**: 
  - 고객: 자동 로그인, 메뉴 조회, 장바구니, 주문 생성, 주문 조회
  - 관리자: 인증, 실시간 모니터링, 테이블 관리, 메뉴 관리

---

## Design Questions

다음 질문들에 답변하여 설계 방향을 결정해주세요.

### Question 1: 컴포넌트 구조
애플리케이션 컴포넌트를 어떻게 조직할까요?

A) **Layered Architecture** - Presentation Layer, Service Layer, Data Access Layer로 3계층 분리
B) **Feature-based** - 기능별로 컴포넌트 조직 (Order 모듈, Menu 모듈, Table 모듈 등)
C) **Clean Architecture** - Domain 중심으로 Entities, Use Cases, Interface Adapters, Frameworks 계층 분리
D) **Simple MVC** - Model, View, Controller 패턴
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2: Backend API 구조
Backend API를 어떻게 구조화할까요?

A) **RESTful API with Controllers** - Express Router + Controller 패턴
B) **NestJS Modules** - NestJS 프레임워크의 모듈 기반 구조
C) **Serverless Functions** - AWS Lambda 개별 함수
D) **GraphQL API** - GraphQL schema 및 resolvers
E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 3: Frontend 컴포넌트 구조
React 프론트엔드를 어떻게 조직할까요?

A) **Feature-based folders** - 기능별로 폴더 구성 (features/order, features/menu 등)
B) **Atomic Design** - Atoms, Molecules, Organisms, Templates, Pages
C) **Smart/Dumb Components** - Container 컴포넌트와 Presentational 컴포넌트 분리
D) **Simple pages structure** - Pages, Components, Hooks, Services로 평면 구조
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4: 실시간 통신 구현
Server-Sent Events (SSE) 실시간 통신을 어디에 구현할까요?

A) **Dedicated SSE Service** - SSE 전용 백엔드 서비스 분리
B) **Main API Server** - 메인 REST API 서버에 SSE 엔드포인트 추가
C) **Separate Real-time Module** - 별도 모듈로 구현하되 같은 서버 프로세스
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 5: 데이터베이스 접근 계층
데이터베이스 접근을 어떻게 추상화할까요?

A) **ORM (Sequelize or TypeORM)** - Object-Relational Mapping 라이브러리 사용
B) **Query Builder (Knex.js)** - SQL 쿼리 빌더 사용
C) **Raw SQL with pg** - PostgreSQL 드라이버로 직접 SQL 작성
D) **Repository Pattern** - Repository 인터페이스로 데이터 접근 추상화
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 6: 상태 관리 (Frontend)
React 프론트엔드의 상태 관리를 어떻게 할까요?

A) **React Context + useReducer** - React 내장 상태 관리
B) **Redux or Redux Toolkit** - Redux 상태 관리 라이브러리
C) **Zustand** - 경량 상태 관리 라이브러리
D) **React Query** - 서버 상태 관리 전용 (+ local state는 useState)
E) **Simple useState/useEffect** - 컴포넌트 로컬 상태만 사용
F) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 7: 인증 및 세션 관리
인증 및 세션을 어디서 관리할까요?

A) **Backend Service Layer** - 백엔드 서비스에서 JWT 생성/검증 처리
B) **Middleware Layer** - Express 미들웨어로 인증 처리
C) **Dedicated Auth Module** - 인증 전용 모듈/서비스 분리
D) **Combination** - 미들웨어 + 서비스 레이어 조합
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 8: 비즈니스 로직 위치
비즈니스 로직을 어디에 배치할까요?

A) **Service Layer** - 독립적인 서비스 클래스/함수에 배치
B) **Domain Models** - 도메인 객체에 비즈니스 로직 포함
C) **Controllers** - 컨트롤러에 직접 비즈니스 로직 작성
D) **Use Cases / Interactors** - Clean Architecture 스타일의 Use Case 객체
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Execution Checklist

아래는 사용자 답변을 바탕으로 실행할 설계 체크리스트입니다.

### Phase 1: Component Identification
- [x] **Step 1.1**: 주요 기능 영역 식별
  - [x] 고객용 기능 (메뉴 조회, 장바구니, 주문)
  - [x] 관리자용 기능 (인증, 모니터링, 테이블 관리, 메뉴 관리)
  - [x] 공통 기능 (데이터 접근, 인증/세션)

- [x] **Step 1.2**: Frontend 컴포넌트 식별
  - [x] 고객용 UI 컴포넌트 (메뉴 화면, 장바구니, 주문 내역)
  - [x] 관리자용 UI 컴포넌트 (대시보드, 테이블 관리, 메뉴 관리)
  - [x] 공통 UI 컴포넌트 (레이아웃, 버튼, 모달 등)

- [x] **Step 1.3**: Backend 컴포넌트 식별
  - [x] API Controllers/Routes
  - [x] Service Layer
  - [x] Data Access Layer
  - [x] 인증/세션 관리
  - [x] SSE 실시간 통신

- [x] **Step 1.4**: Database 스키마 컴포넌트 식별
  - [x] 주요 엔티티 (Store, Table, Menu, Order, User, Session)
  - [x] 관계 정의

### Phase 2: Component Responsibilities
- [ ] **Step 2.1**: 각 컴포넌트의 책임 정의
  - [ ] Frontend 컴포넌트 책임
  - [ ] Backend 컴포넌트 책임
  - [ ] 데이터베이스 컴포넌트 책임

- [ ] **Step 2.2**: 컴포넌트 경계 명확화
  - [ ] 어떤 컴포넌트가 어떤 기능을 담당하는가
  - [ ] 컴포넌트 간 중복 책임 제거

### Phase 3: Component Methods Definition
- [ ] **Step 3.1**: Frontend 컴포넌트 메서드
  - [ ] 주요 React 컴포넌트의 props 및 state
  - [ ] 이벤트 핸들러 및 lifecycle 메서드
  - [ ] Custom hooks

- [ ] **Step 3.2**: Backend API 메서드
  - [ ] REST API 엔드포인트 (HTTP method + path)
  - [ ] SSE 엔드포인트
  - [ ] 각 엔드포인트의 입력/출력 타입

- [ ] **Step 3.3**: Service Layer 메서드
  - [ ] 비즈니스 로직 메서드 시그니처
  - [ ] 입력 파라미터 및 반환 타입
  - [ ] Note: 상세 비즈니스 규칙은 Functional Design (CONSTRUCTION)에서 정의

- [ ] **Step 3.4**: Data Access 메서드
  - [ ] CRUD 메서드 시그니처
  - [ ] 쿼리 메서드 (복잡한 조회)
  - [ ] 트랜잭션 메서드

### Phase 4: Service Layer Design
- [ ] **Step 4.1**: 서비스 식별
  - [ ] OrderService (주문 관리)
  - [ ] MenuService (메뉴 관리)
  - [ ] TableService (테이블 및 세션 관리)
  - [ ] AuthService (인증 및 세션 관리)
  - [ ] NotificationService (실시간 알림 - SSE)

- [ ] **Step 4.2**: 서비스 책임 정의
  - [ ] 각 서비스의 비즈니스 로직 범위
  - [ ] 서비스 간 협업 패턴

- [ ] **Step 4.3**: 서비스 오케스트레이션
  - [ ] Controller가 여러 서비스를 어떻게 조율하는가
  - [ ] 트랜잭션 경계 정의

### Phase 5: Component Dependencies
- [ ] **Step 5.1**: 의존성 관계 매핑
  - [ ] Frontend → Backend API 의존성
  - [ ] Backend API → Service Layer 의존성
  - [ ] Service Layer → Data Access 의존성
  - [ ] 컴포넌트 간 순환 의존성 체크

- [ ] **Step 5.2**: 통신 패턴 정의
  - [ ] REST API 호출 패턴
  - [ ] SSE 구독 패턴
  - [ ] 에러 처리 패턴

- [ ] **Step 5.3**: 데이터 흐름 다이어그램
  - [ ] 고객 주문 생성 플로우
  - [ ] 관리자 실시간 모니터링 플로우
  - [ ] 인증 및 세션 플로우

### Phase 6: Design Documentation
- [x] **Step 6.1**: Generate `components.md`
  - [x] 모든 컴포넌트 목록 및 설명
  - [x] 컴포넌트 책임 정의
  - [x] 컴포넌트 인터페이스

- [x] **Step 6.2**: Generate `component-methods.md`
  - [x] 각 컴포넌트의 메서드 시그니처 (application-design.md에 통합)
  - [x] 입력/출력 타입
  - [x] 메서드 목적 (상세 비즈니스 규칙은 나중에)

- [x] **Step 6.3**: Generate `services.md`
  - [x] 서비스 정의
  - [x] 서비스 책임
  - [x] 서비스 간 상호작용

- [x] **Step 6.4**: Generate `component-dependency.md`
  - [x] 의존성 매트릭스
  - [x] 통신 패턴
  - [x] 데이터 흐름 다이어그램

- [x] **Step 6.5**: Generate `application-design.md`
  - [x] 위 모든 문서를 통합한 단일 문서

### Phase 7: Validation
- [x] **Step 7.1**: 설계 완전성 검증
  - [x] 모든 user stories가 컴포넌트에 매핑되는가
  - [x] 모든 요구사항이 설계에 반영되는가

- [x] **Step 7.2**: 설계 일관성 검증
  - [x] 컴포넌트 간 인터페이스가 일치하는가
  - [x] 순환 의존성이 없는가
  - [x] 책임이 명확히 분리되는가

---

## Recommended Approach

이 프로젝트의 특성을 고려한 권장 접근법:

### Frontend (React)
- **권장**: Feature-based folders (Q3-A) + React Query for server state (Q6-D)
- **이유**: 
  - 기능별 폴더는 고객용/관리자용 기능을 명확히 분리
  - React Query는 서버 상태(메뉴, 주문)를 효율적으로 관리
  - 장바구니 같은 로컬 상태는 useState로 충분

### Backend (Node.js)
- **권장**: RESTful API with Controllers (Q2-A) + Service Layer (Q8-A)
- **이유**:
  - Express Router + Controller는 간단하고 명확
  - Service Layer는 비즈니스 로직을 분리하여 테스트 용이
  - MVP에 적합한 복잡도

### Database Access
- **권장**: Repository Pattern with ORM (Q5-D + Q5-A)
- **이유**:
  - Repository 패턴은 데이터 접근을 추상화
  - ORM (Sequelize/TypeORM)은 타입 안전성과 생산성 제공

### Real-time (SSE)
- **권장**: Separate Real-time Module (Q4-C)
- **이유**:
  - SSE 로직을 모듈로 분리하여 관심사 분리
  - 같은 서버 프로세스에서 동작하여 배포 단순화

### Architecture
- **권장**: Layered Architecture (Q1-A)
- **이유**:
  - Presentation (React), Service (Business Logic), Data Access (Repository/ORM) 3계층
  - 명확한 책임 분리와 테스트 용이성
  - MVP에 적합한 단순성

하지만 최종 결정은 사용자의 선택에 따릅니다.

---

## Next Steps After Approval

1. ⛔ **WAIT**: 위 모든 질문 (Q1~Q8)에 답변해주세요
2. 답변을 분석하여 ambiguity 확인
3. 필요시 clarification 질문 생성
4. Plan 승인 대기
5. 설계 아티팩트 생성 (components.md, component-methods.md, services.md, component-dependency.md, application-design.md)
