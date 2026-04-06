# Unit of Work - Story Mapping

## Overview

이 문서는 11개의 user stories를 5개의 units에 매핑하여 각 unit의 MVP 범위를 정의합니다.

---

## Story-to-Unit Mapping

### Mapping Summary Table

| Story ID | Story Name | Priority | Units Involved | Primary Unit |
|----------|-----------|----------|----------------|--------------|
| Story 1 | 테이블 태블릿 자동 로그인 및 세션 시작 | Critical | Customer Frontend, Backend, Database | Customer Frontend |
| Story 2 | 메뉴 탐색 및 선택 | Critical | Customer Frontend, Backend, Database | Customer Frontend |
| Story 3 | 장바구니 관리 | Critical | Customer Frontend | Customer Frontend |
| Story 4 | 주문 생성 및 확정 | Critical | Customer Frontend, Backend, Database | Customer Frontend |
| Story 5 | 주문 내역 조회 | High | Customer Frontend, Backend, Database | Customer Frontend |
| Story 6 | 관리자 로그인 및 인증 | Critical | Admin Frontend, Backend, Database | Admin Frontend |
| Story 7 | 실시간 주문 모니터링 | Critical | Admin Frontend, Backend | Admin Frontend |
| Story 8 | 주문 상태 관리 및 삭제 | Critical | Admin Frontend, Backend, Database | Admin Frontend |
| Story 9 | 테이블 세션 관리 | Critical | Admin Frontend, Backend, Database | Admin Frontend |
| Story 10 | 메뉴 관리 | High | Admin Frontend, Backend, Database | Admin Frontend |
| Story 11 | 테이블 태블릿 초기 설정 | High | Admin Frontend, Backend, Database | Admin Frontend |

**Note**: 
- **Primary Unit**: 스토리가 주로 구현되는 unit (사용자 인터페이스 관점)
- **Units Involved**: 스토리 완성을 위해 필요한 모든 units
- **Shared Unit**: 모든 Frontend stories에 간접적으로 사용됨 (공통 컴포넌트)

---

## Unit 1: Customer Frontend - Story Mapping

### Assigned Stories (5 stories)

#### Story 1: 테이블 태블릿 자동 로그인 및 세션 시작 (Critical)

**User Story**:
매장 고객으로서, 테이블에 앉자마자 별도의 로그인 절차 없이 자동으로 메뉴 화면을 볼 수 있어야 한다.

**Unit Responsibilities**:
- **Customer Frontend** (Primary):
  - localStorage에서 테이블 인증 정보 로드
  - 자동 로그인 실행
  - 세션 만료 처리
  - 메뉴 화면 자동 리다이렉트
- **Backend**:
  - POST /api/tables/login 엔드포인트 제공
  - 세션 토큰 발급 및 검증
- **Database**:
  - tables, sessions 테이블 조회

**Components**:
- AutoLoginProvider (Customer Frontend)
- TableSessionManager (Customer Frontend)
- TableController (Backend)
- TableService (Backend)
- TableRepository (Backend)

**Acceptance Criteria Owner**: Customer Frontend

---

#### Story 2: 메뉴 탐색 및 선택 (Critical)

**User Story**:
매장 고객으로서, 카테고리별로 정리된 메뉴를 쉽게 탐색하고 각 메뉴의 이미지와 설명을 확인할 수 있어야 한다.

**Unit Responsibilities**:
- **Customer Frontend** (Primary):
  - 카테고리 탭 렌더링
  - 메뉴 그리드 표시
  - 메뉴 상세 모달
  - 터치 친화적 UI
- **Backend**:
  - GET /api/menus 엔드포인트 제공
  - 카테고리별 필터링
- **Database**:
  - menus, categories 테이블 조회

**Components**:
- MenuPage (Customer Frontend)
- CategoryTabs (Customer Frontend)
- MenuGrid (Customer Frontend)
- MenuCard (Customer Frontend)
- MenuDetail (Customer Frontend)
- MenuController (Backend)
- MenuService (Backend)
- MenuRepository (Backend)

**Acceptance Criteria Owner**: Customer Frontend

---

#### Story 3: 장바구니 관리 (Critical)

**User Story**:
매장 고객으로서, 선택한 메뉴를 장바구니에 추가하고 수량을 조절하며 총 금액을 실시간으로 확인할 수 있어야 한다.

**Unit Responsibilities**:
- **Customer Frontend** (Primary):
  - 장바구니 상태 관리 (Context API + useReducer)
  - 메뉴 추가/삭제
  - 수량 증가/감소
  - 총 금액 계산
  - localStorage 저장 (새로고침 대응)

**Components**:
- CartButton (Customer Frontend)
- CartPage (Customer Frontend)
- CartItemList (Customer Frontend)
- CartItem (Customer Frontend)
- CartSummary (Customer Frontend)

**Acceptance Criteria Owner**: Customer Frontend

**Note**: 이 스토리는 100% 클라이언트 측에서 처리되며 Backend/Database 의존성 없음.

---

#### Story 4: 주문 생성 및 확정 (Critical)

**User Story**:
매장 고객으로서, 장바구니의 메뉴를 최종 확인하고 주문을 확정할 수 있어야 한다.

**Unit Responsibilities**:
- **Customer Frontend** (Primary):
  - 주문 확인 모달
  - POST /api/orders API 호출
  - 주문 성공/실패 처리
  - 장바구니 초기화
  - 메뉴 화면 리다이렉트
- **Backend**:
  - POST /api/orders 엔드포인트
  - 주문 생성 비즈니스 로직
  - 가격 계산 및 검증
  - SSE 알림 발송 (Admin Frontend에게)
- **Database**:
  - orders, order_items 테이블 삽입

**Components**:
- OrderConfirmModal (Customer Frontend)
- OrderSuccessModal (Customer Frontend)
- OrderController (Backend)
- OrderService (Backend)
- OrderRepository (Backend)
- NotificationService (Backend)

**Acceptance Criteria Owner**: Customer Frontend

---

#### Story 5: 주문 내역 조회 (High)

**User Story**:
매장 고객으로서, 내가 주문한 메뉴의 내역을 확인하고 주문 상태를 볼 수 있어야 한다.

**Unit Responsibilities**:
- **Customer Frontend** (Primary):
  - GET /api/orders API 호출 (세션 ID 기준)
  - 주문 목록 렌더링
  - 주문 상태 표시
- **Backend**:
  - GET /api/orders 엔드포인트
  - 세션별 주문 필터링
- **Database**:
  - orders, order_items 테이블 조회

**Components**:
- OrderHistoryPage (Customer Frontend)
- OrderList (Customer Frontend)
- OrderCard (Customer Frontend)
- OrderController (Backend)
- OrderService (Backend)
- OrderRepository (Backend)

**Acceptance Criteria Owner**: Customer Frontend

---

### Customer Frontend MVP Scope

**Critical Stories**: 4 (Story 1, 2, 3, 4)
**High Stories**: 1 (Story 5)

**MVP Definition**:
- ✅ 자동 로그인 (Story 1)
- ✅ 메뉴 조회 (Story 2)
- ✅ 장바구니 관리 (Story 3)
- ✅ 주문 생성 (Story 4)
- ⚠️ 주문 내역 조회 (Story 5) - MVP에 포함하되 우선순위 낮음

**Estimated Effort**: ~1.5-2 weeks (병렬 개발 시)

---

## Unit 2: Admin Frontend - Story Mapping

### Assigned Stories (6 stories)

#### Story 6: 관리자 로그인 및 인증 (Critical)

**User Story**:
매장 관리자로서, 매장 식별자와 사용자명/비밀번호를 사용하여 로그인하고 16시간 세션을 유지할 수 있어야 한다.

**Unit Responsibilities**:
- **Admin Frontend** (Primary):
  - 로그인 폼 렌더링
  - POST /api/auth/login API 호출
  - JWT 토큰 localStorage 저장
  - 인증 상태 관리 (Context API)
  - PrivateRoute 보호
- **Backend**:
  - POST /api/auth/login 엔드포인트
  - 비밀번호 bcrypt 검증
  - JWT 토큰 생성 (16시간 만료)
- **Database**:
  - users 테이블 조회

**Components**:
- LoginPage (Admin Frontend)
- LoginForm (Admin Frontend)
- AuthProvider (Admin Frontend)
- PrivateRoute (Admin Frontend)
- AuthController (Backend)
- AuthService (Backend)
- UserRepository (Backend)

**Acceptance Criteria Owner**: Admin Frontend

---

#### Story 7: 실시간 주문 모니터링 (Critical)

**User Story**:
매장 관리자로서, 모든 테이블의 주문을 실시간으로 모니터링하고 신규 주문을 2초 이내에 확인할 수 있어야 한다.

**Unit Responsibilities**:
- **Admin Frontend** (Primary):
  - SSE 연결 수립 (EventSource)
  - 테이블 그리드 렌더링
  - 실시간 주문 업데이트
  - 신규 주문 시각적 강조
  - 주문 상세 모달
- **Backend**:
  - GET /api/sse/orders 엔드포인트 (SSE)
  - SSE 클라이언트 연결 관리
  - 주문 생성 시 SSE 이벤트 발송
  - Heartbeat (30초마다)

**Components**:
- DashboardPage (Admin Frontend)
- TableGrid (Admin Frontend)
- TableCard (Admin Frontend)
- OrderPreview (Admin Frontend)
- OrderDetailModal (Admin Frontend)
- SSEConnection (Admin Frontend)
- SSEController (Backend)
- NotificationService (Backend)

**Acceptance Criteria Owner**: Admin Frontend

**NFR Target**: 실시간 업데이트 < 2초

---

#### Story 8: 주문 상태 관리 및 삭제 (Critical)

**User Story**:
매장 관리자로서, 주문 상태를 변경하고 필요시 잘못된 주문을 삭제할 수 있어야 한다.

**Unit Responsibilities**:
- **Admin Frontend** (Primary):
  - 주문 상태 변경 버튼
  - PATCH /api/orders/:id/status API 호출
  - 주문 삭제 확인 팝업
  - DELETE /api/orders/:id API 호출
- **Backend**:
  - PATCH /api/orders/:id/status 엔드포인트
  - DELETE /api/orders/:id 엔드포인트
  - 상태 변경 비즈니스 로직
  - 삭제 시 테이블 총액 재계산
- **Database**:
  - orders 테이블 UPDATE 및 DELETE

**Components**:
- OrderStatusButton (Admin Frontend)
- OrderDeleteButton (Admin Frontend)
- OrderController (Backend)
- OrderService (Backend)
- OrderRepository (Backend)

**Acceptance Criteria Owner**: Admin Frontend

---

#### Story 9: 테이블 세션 관리 (Critical)

**User Story**:
매장 관리자로서, 테이블 세션을 종료하고 과거 주문 내역을 조회할 수 있어야 한다.

**Unit Responsibilities**:
- **Admin Frontend** (Primary):
  - "테이블 이용 완료" 버튼
  - POST /api/tables/:id/complete API 호출
  - 과거 내역 조회 모달
  - GET /api/tables/:id/history API 호출
  - 날짜 필터
- **Backend**:
  - POST /api/tables/:id/complete 엔드포인트
  - GET /api/tables/:id/history 엔드포인트
  - 세션 종료 비즈니스 로직
  - 과거 주문 조회 로직
- **Database**:
  - sessions 테이블 UPDATE (is_active = false)
  - orders 테이블 조회 (과거 내역)

**Components**:
- TableManagementPage (Admin Frontend)
- CompleteSessionButton (Admin Frontend)
- HistoryModal (Admin Frontend)
- HistoryFilter (Admin Frontend)
- TableController (Backend)
- TableService (Backend)
- TableRepository (Backend)

**Acceptance Criteria Owner**: Admin Frontend

---

#### Story 10: 메뉴 관리 (High)

**User Story**:
매장 관리자로서, 메뉴를 추가, 수정, 삭제하고 카테고리별로 조회할 수 있어야 한다.

**Unit Responsibilities**:
- **Admin Frontend** (Primary):
  - 메뉴 목록 렌더링
  - 메뉴 등록/수정 폼
  - POST /api/menus, PUT /api/menus/:id API 호출
  - DELETE /api/menus/:id API 호출
  - 필드 검증
- **Backend**:
  - POST /api/menus 엔드포인트
  - PUT /api/menus/:id 엔드포인트
  - DELETE /api/menus/:id 엔드포인트
  - 메뉴 CRUD 비즈니스 로직
- **Database**:
  - menus 테이블 INSERT, UPDATE, DELETE

**Components**:
- MenuManagementPage (Admin Frontend)
- MenuForm (Admin Frontend)
- MenuList (Admin Frontend)
- MenuItemCard (Admin Frontend)
- DeleteConfirmModal (Admin Frontend)
- MenuController (Backend)
- MenuService (Backend)
- MenuRepository (Backend)

**Acceptance Criteria Owner**: Admin Frontend

---

#### Story 11: 테이블 태블릿 초기 설정 (High)

**User Story**:
매장 관리자로서, 새 테이블 태블릿을 초기 설정하여 자동 로그인을 활성화할 수 있어야 한다.

**Unit Responsibilities**:
- **Admin Frontend** (Primary):
  - 초기 설정 모달
  - POST /api/tables/setup API 호출
  - 설정 완료 후 리다이렉트
- **Backend**:
  - POST /api/tables/setup 엔드포인트
  - 테이블 생성 및 세션 생성
  - 세션 토큰 발급
- **Database**:
  - tables 테이블 INSERT
  - sessions 테이블 INSERT

**Components**:
- TableSetupModal (Admin Frontend)
- TableController (Backend)
- TableService (Backend)
- TableRepository (Backend)

**Acceptance Criteria Owner**: Admin Frontend

---

### Admin Frontend MVP Scope

**Critical Stories**: 4 (Story 6, 7, 8, 9)
**High Stories**: 2 (Story 10, 11)

**MVP Definition**:
- ✅ 관리자 로그인 (Story 6)
- ✅ 실시간 주문 모니터링 (Story 7)
- ✅ 주문 상태 관리 (Story 8)
- ✅ 테이블 세션 관리 (Story 9)
- ⚠️ 메뉴 관리 (Story 10) - MVP에 포함하되 우선순위 낮음
- ⚠️ 테이블 초기 설정 (Story 11) - MVP에 포함하되 우선순위 낮음

**Estimated Effort**: ~2-2.5 weeks (병렬 개발 시, SSE 구현 포함)

---

## Unit 3: Backend - Story Mapping

### Assigned Stories (All 11 stories)

Backend unit은 모든 11개 스토리에 관여하지만, **Primary Owner는 아님** (Frontend units가 Primary).

**Backend의 역할**: API 제공, 비즈니스 로직 실행, 데이터 접근

### Story-to-Backend Mapping

| Story | Backend Components | API Endpoints | Services |
|-------|-------------------|---------------|----------|
| Story 1 | TableController, TableService, TableRepository | POST /api/tables/login | TableService.login() |
| Story 2 | MenuController, MenuService, MenuRepository | GET /api/menus | MenuService.getMenus() |
| Story 3 | None | None | None (Client-side only) |
| Story 4 | OrderController, OrderService, OrderRepository, NotificationService | POST /api/orders | OrderService.createOrder() |
| Story 5 | OrderController, OrderService, OrderRepository | GET /api/orders | OrderService.getOrdersBySession() |
| Story 6 | AuthController, AuthService, UserRepository | POST /api/auth/login | AuthService.login() |
| Story 7 | SSEController, NotificationService | GET /api/sse/orders | NotificationService.subscribe() |
| Story 8 | OrderController, OrderService, OrderRepository | PATCH /api/orders/:id/status, DELETE /api/orders/:id | OrderService.updateStatus(), OrderService.deleteOrder() |
| Story 9 | TableController, TableService, TableRepository | POST /api/tables/:id/complete, GET /api/tables/:id/history | TableService.completeSession(), TableService.getHistory() |
| Story 10 | MenuController, MenuService, MenuRepository | POST /api/menus, PUT /api/menus/:id, DELETE /api/menus/:id | MenuService.createMenu(), MenuService.updateMenu(), MenuService.deleteMenu() |
| Story 11 | TableController, TableService, TableRepository | POST /api/tables/setup | TableService.setupTable() |

**Total API Endpoints**: ~15
**Total Services**: 5 (MenuService, OrderService, TableService, AuthService, NotificationService)
**Total Repositories**: 4 (MenuRepository, OrderRepository, TableRepository, UserRepository)

### Backend MVP Scope

**All 11 stories require Backend support**

**MVP Definition**:
- ✅ 모든 API endpoints 구현
- ✅ 모든 비즈니스 로직 구현
- ✅ JWT 인증 구현
- ✅ SSE 실시간 통신 구현
- ✅ 에러 처리 및 검증

**Estimated Effort**: ~2 weeks (병렬 개발 시)

---

## Unit 4: Database - Story Mapping

### Assigned Stories (10 stories, excluding Story 3)

Database unit은 10개 스토리에 관여 (Story 3 제외 - 장바구니는 클라이언트 측만).

**Database의 역할**: 데이터 저장 및 조회

### Story-to-Database Mapping

| Story | Tables Involved | Operations |
|-------|----------------|------------|
| Story 1 | tables, sessions | SELECT, INSERT (session) |
| Story 2 | menus, categories | SELECT |
| Story 3 | None | None (Client-side only) |
| Story 4 | orders, order_items | INSERT |
| Story 5 | orders, order_items | SELECT |
| Story 6 | users | SELECT |
| Story 7 | orders, order_items, tables | SELECT (real-time queries) |
| Story 8 | orders | UPDATE, DELETE |
| Story 9 | sessions, orders | UPDATE (sessions), SELECT (orders) |
| Story 10 | menus | INSERT, UPDATE, DELETE |
| Story 11 | tables, sessions | INSERT |

**Total Tables**: 8 (stores, tables, categories, menus, orders, order_items, users, sessions)

### Database MVP Scope

**All 10 stories require Database support** (except Story 3)

**MVP Definition**:
- ✅ 모든 8개 테이블 스키마 정의
- ✅ Migrations 생성 및 실행
- ✅ Seed data (초기 데이터) 제공
- ✅ 인덱스 및 제약조건 설정

**Estimated Effort**: ~3-5 days (Week 1)

---

## Unit 5: Shared - Story Mapping

### Assigned Stories (Indirect - All Frontend stories)

Shared unit은 모든 Frontend stories에 간접적으로 사용됩니다.

**Shared의 역할**: 공통 UI 컴포넌트 및 유틸리티 제공

### Story-to-Shared Mapping

| Story | Shared Components Used | Shared Utilities Used |
|-------|----------------------|---------------------|
| Story 1 | Input, Button | None |
| Story 2 | Card, Badge, Header, Footer | formatCurrency |
| Story 3 | Button, Card, Badge | formatCurrency |
| Story 4 | Modal, Button | formatCurrency |
| Story 5 | Card, Badge | formatDate, formatCurrency |
| Story 6 | Input, Button, Modal | None |
| Story 7 | Card, Badge, Spinner | formatDate, formatCurrency |
| Story 8 | Button, Modal | None |
| Story 9 | Button, Modal, Input | formatDate |
| Story 10 | Input, Select, Button, Modal, Card | None |
| Story 11 | Input, Button, Modal | None |

**Total Shared Components**: ~11 (Button, Modal, Input, Select, Card, Badge, Spinner, Header, Footer, Sidebar, NavBar)
**Total Shared Utilities**: ~5 (formatCurrency, formatDate, validateEmail, API client, constants)

### Shared MVP Scope

**All Frontend stories depend on Shared components**

**MVP Definition**:
- ✅ 기본 UI 컴포넌트 (Button, Modal, Input, Select, Card, Badge, Spinner)
- ✅ 레이아웃 컴포넌트 (Header, Footer, Sidebar, NavBar)
- ✅ 유틸리티 함수 (formatCurrency, formatDate)
- ✅ 공통 상수 (API_BASE_URL, ORDER_STATUS)
- ✅ TypeScript 타입 정의

**Estimated Effort**: ~1 week (병렬 개발 시)

---

## Unit MVP Summary

### Unit 1: Customer Frontend
- **Stories**: 5 (1, 2, 3, 4, 5)
- **Critical**: 4
- **High**: 1
- **Effort**: 1.5-2 weeks

### Unit 2: Admin Frontend
- **Stories**: 6 (6, 7, 8, 9, 10, 11)
- **Critical**: 4
- **High**: 2
- **Effort**: 2-2.5 weeks

### Unit 3: Backend
- **Stories**: 11 (all, except Story 3 has no Backend involvement)
- **Effective Stories**: 10
- **Effort**: 2 weeks

### Unit 4: Database
- **Stories**: 10 (all except Story 3)
- **Effort**: 3-5 days

### Unit 5: Shared
- **Stories**: 11 (all, indirectly)
- **Effort**: 1 week

---

## Story Coverage Validation

### All Stories Covered
- ✅ Story 1: Customer Frontend (Primary), Backend, Database
- ✅ Story 2: Customer Frontend (Primary), Backend, Database
- ✅ Story 3: Customer Frontend (Primary only)
- ✅ Story 4: Customer Frontend (Primary), Backend, Database
- ✅ Story 5: Customer Frontend (Primary), Backend, Database
- ✅ Story 6: Admin Frontend (Primary), Backend, Database
- ✅ Story 7: Admin Frontend (Primary), Backend
- ✅ Story 8: Admin Frontend (Primary), Backend, Database
- ✅ Story 9: Admin Frontend (Primary), Backend, Database
- ✅ Story 10: Admin Frontend (Primary), Backend, Database
- ✅ Story 11: Admin Frontend (Primary), Backend, Database

**Coverage**: 100% - 모든 스토리가 최소 1개 unit에 명확히 할당됨

---

## Development Priority by Story

### Phase 1: Critical Stories (9 stories)
**Target**: MVP 핵심 기능 구현

| Story | Priority | Units | Target Week |
|-------|----------|-------|-------------|
| Story 1 | Critical | Customer Frontend, Backend, Database | Week 1-2 |
| Story 2 | Critical | Customer Frontend, Backend, Database | Week 1-2 |
| Story 3 | Critical | Customer Frontend | Week 1-2 |
| Story 4 | Critical | Customer Frontend, Backend, Database | Week 2 |
| Story 6 | Critical | Admin Frontend, Backend, Database | Week 1-2 |
| Story 7 | Critical | Admin Frontend, Backend | Week 2 |
| Story 8 | Critical | Admin Frontend, Backend, Database | Week 2 |
| Story 9 | Critical | Admin Frontend, Backend, Database | Week 2 |

### Phase 2: High Stories (2 stories)
**Target**: MVP 보조 기능 구현

| Story | Priority | Units | Target Week |
|-------|----------|-------|-------------|
| Story 5 | High | Customer Frontend, Backend, Database | Week 2-3 |
| Story 10 | High | Admin Frontend, Backend, Database | Week 2-3 |
| Story 11 | High | Admin Frontend, Backend, Database | Week 2-3 |

---

## Integration Testing by Story

### Story-Level Test Plan

| Story | Test Type | Test Owner | Integration Points |
|-------|-----------|-----------|-------------------|
| Story 1 | E2E | Customer Frontend | Customer Frontend ↔ Backend ↔ Database |
| Story 2 | E2E | Customer Frontend | Customer Frontend ↔ Backend ↔ Database |
| Story 3 | Unit | Customer Frontend | None (client-side only) |
| Story 4 | E2E | Customer Frontend | Customer Frontend ↔ Backend ↔ Database ↔ Admin Frontend (SSE) |
| Story 5 | E2E | Customer Frontend | Customer Frontend ↔ Backend ↔ Database |
| Story 6 | E2E | Admin Frontend | Admin Frontend ↔ Backend ↔ Database |
| Story 7 | E2E | Admin Frontend | Admin Frontend (SSE) ↔ Backend |
| Story 8 | E2E | Admin Frontend | Admin Frontend ↔ Backend ↔ Database |
| Story 9 | E2E | Admin Frontend | Admin Frontend ↔ Backend ↔ Database |
| Story 10 | E2E | Admin Frontend | Admin Frontend ↔ Backend ↔ Database |
| Story 11 | E2E | Admin Frontend | Admin Frontend ↔ Backend ↔ Database |

**Total E2E Tests**: 10
**Total Unit Tests**: 1 (Story 3)

---

## Story Dependency Graph

```
┌────────────────────────────────────────────────────┐
│                  Database (U4)                      │
│  (Foundation - Must be deployed first)              │
└────────────────┬───────────────────────────────────┘
                 │
                 │ Depends On
                 │
         ┌───────▼──────────────────────┐
         │      Backend (U3)             │
         │  (API + Business Logic)       │
         └───────┬──────────────────┬────┘
                 │                  │
                 │ Depends On       │ Depends On
                 │                  │
      ┌──────────▼────────┐  ┌──────▼───────────┐
      │  Customer Frontend │  │  Admin Frontend  │
      │      (U1)          │  │      (U2)        │
      └────────────────────┘  └──────────────────┘
               │                       │
               │ Depends On            │ Depends On
               │                       │
               └──────────┬────────────┘
                          │
                  ┌───────▼────────┐
                  │  Shared (U5)   │
                  │  (Components)  │
                  └────────────────┘
```

**Critical Path**:
1. Database (U4) - Week 1
2. Backend (U3) - Week 1-2
3. Customer Frontend (U1) + Admin Frontend (U2) - Week 2-3

**Shared Unit**: 병렬 개발 가능 (Week 1)

---

## Summary

### Story Distribution
- **Customer Frontend**: 5 stories (45%)
- **Admin Frontend**: 6 stories (55%)
- **Backend**: 10 stories (91% - supports almost all)
- **Database**: 10 stories (91% - supports almost all)
- **Shared**: 11 stories (100% - indirectly)

### MVP Completion Criteria
- ✅ All 11 stories implemented and tested
- ✅ All acceptance criteria met
- ✅ All NFRs met (1s response, 2s real-time)
- ✅ All units integrated and deployed

### Estimated Timeline
- **Week 1**: Foundation (Database, Shared, Backend API contracts)
- **Week 2**: Core Implementation (Backend, Frontends)
- **Week 3**: Integration & Testing

**Total Duration**: ~3 weeks (with parallel development)
