# Application Design

## Executive Summary

테이블오더 서비스는 **Layered Architecture (3-tier)**를 기반으로 설계되었습니다:
- **Presentation Layer**: React 기반 고객용 앱 및 관리자용 앱
- **Service Layer**: Express 기반 백엔드 (REST API + SSE)
- **Data Access Layer**: PostgreSQL + Knex.js Query Builder

**주요 설계 결정**:
- **Backend**: EC2/ECS에 Express 서버 배포 (SSE 지원을 위해 Lambda 대신 선택)
- **Real-time Communication**: Server-Sent Events (SSE) for 관리자 실시간 모니터링
- **State Management**: React Context + useReducer (고객용, 관리자용 모두)
- **Database Access**: Knex.js Query Builder로 SQL 쿼리 추상화
- **Business Logic**: Domain Models에 비즈니스 로직 포함
- **Authentication**: Service Layer에서 JWT 토큰 생성/검증

---

## 1. Architecture Overview

### 1.1 Three-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│         Presentation Layer (Frontend)            │
│                                                  │
│  ┌─────────────────┐   ┌────────────────────┐  │
│  │  Customer App   │   │    Admin App       │  │
│  │  (React)        │   │    (React)         │  │
│  │  - Menu         │   │ - Auth             │  │
│  │  - Cart         │   │ - Dashboard (SSE)  │  │
│  │  - Order        │   │ - Table Mgmt       │  │
│  │  - Auto-Login   │   │ - Menu Mgmt        │  │
│  └─────────────────┘   └────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP REST API + SSE
                 ▼
┌─────────────────────────────────────────────────┐
│          Service Layer (Backend)                 │
│                Express on EC2/ECS                │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │          Controllers                      │  │
│  │  Menu | Order | Table | Auth | SSE       │  │
│  └─────────────────┬────────────────────────┘  │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐  │
│  │           Services                        │  │
│  │  Menu | Order | Table | Auth | Notify    │  │
│  └─────────────────┬────────────────────────┘  │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐  │
│  │         Repositories                      │  │
│  │  Menu | Order | Table | User             │  │
│  └─────────────────┬────────────────────────┘  │
│                    ▼                             │
│  ┌──────────────────────────────────────────┐  │
│  │         Domain Models                     │  │
│  │  Menu | Order | Table | User | Session   │  │
│  └──────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │
                 │ SQL Queries (Knex.js)
                 ▼
┌─────────────────────────────────────────────────┐
│        Data Access Layer (Database)              │
│                                                  │
│              PostgreSQL Database                 │
│  stores | tables | menus | categories           │
│  orders | order_items | users | sessions        │
└──────────────────────────────────────────────────┘
```

---

## 2. Component Summary

### 2.1 Frontend Components (~40+ components)

#### Customer App
- **Menu Feature**: MenuPage, CategoryTabs, MenuGrid, MenuCard, MenuDetail
- **Cart Feature**: CartButton, CartPage, CartItemList, CartItem, CartSummary
- **Order Feature**: OrderConfirmModal, OrderSuccessModal, OrderHistoryPage, OrderList, OrderCard
- **Auto-Login**: AutoLoginProvider, TableSessionManager

#### Admin App
- **Auth Feature**: LoginPage, LoginForm, AuthProvider, PrivateRoute
- **Dashboard Feature**: DashboardPage, TableGrid, TableCard, OrderPreview, OrderDetailModal, SSEConnection
- **Table Management**: TableManagementPage, TableSetupModal, OrderDeleteButton, CompleteSessionButton, HistoryModal
- **Menu Management**: MenuManagementPage, MenuForm, MenuList, MenuItemCard, DeleteConfirmModal

#### Shared Components
- Layout: Header, Footer, Sidebar, NavBar
- UI: Button, Modal, Input, Select, Card, Badge, Spinner

---

### 2.2 Backend Components

#### Controllers (5)
- **MenuController**: GET/POST/PUT/DELETE /api/menus
- **OrderController**: POST/GET/PATCH/DELETE /api/orders
- **TableController**: POST/GET /api/tables (login, setup, complete session)
- **AuthController**: POST /api/auth/login, /api/auth/logout
- **SSEController**: GET /api/sse/orders

#### Services (5)
- **MenuService**: Menu CRUD business logic
- **OrderService**: Order creation, status management, notifications
- **TableService**: Table login, session management
- **AuthService**: Login validation, JWT generation/verification
- **NotificationService**: SSE client management, real-time notifications

#### Repositories (4)
- **MenuRepository**: Menu data access
- **OrderRepository**: Order and order_items data access
- **TableRepository**: Table and session data access
- **UserRepository**: User data access

#### Domain Models (5)
- **Menu**: Menu entity and validation logic
- **Order**: Order entity, total calculation, status transitions
- **Table**: Table entity and session logic
- **User**: User entity and password validation
- **Session**: Session entity and expiration logic

---

### 2.3 Database Entities (8 tables)

- **stores**: 매장 정보
- **tables**: 테이블 정보
- **menus**: 메뉴 정보
- **categories**: 메뉴 카테고리
- **orders**: 주문 정보
- **order_items**: 주문 항목
- **users**: 관리자 사용자
- **sessions**: 테이블 세션

---

## 3. Key Design Patterns

### 3.1 Layered Architecture Pattern

**Principle**: Separation of concerns into layers with unidirectional dependencies.

**Implementation**:
- **Presentation Layer**: UI components (React)
- **Service Layer**: Business logic (Express Services)
- **Data Access Layer**: Data persistence (Repositories + Database)

**Benefit**: Clear separation, easier testing, maintainability

---

### 3.2 Service Layer Pattern

**Principle**: Encapsulate business logic in services, isolate from controllers and repositories.

**Implementation**:
- Controllers handle HTTP concerns
- Services handle business logic
- Repositories handle data access

**Example**:
```
OrderController.createOrder()
  → OrderService.createOrder(orderData)
    → OrderRepository.create(order)
    → NotificationService.notifyNewOrder(order)
  ← return order
```

---

### 3.3 Repository Pattern

**Principle**: Abstract data access behind repository interfaces.

**Implementation**:
- Each repository encapsulates database queries for one entity
- Services call repositories, not directly Knex
- Repositories return domain models or plain data

**Example**:
```javascript
// OrderRepository
async create(orderData) {
  return await knex('orders').insert(orderData).returning('*');
}
```

---

### 3.4 Domain Model Pattern

**Principle**: Business logic resides in domain models, not in services or controllers.

**Implementation**:
- Order Model: `calculateTotal()`, `canChangeStatus(newStatus)`
- User Model: `validatePassword(password)`, `hashPassword(password)`
- Session Model: `isExpired()`, `isActive()`

**Example**:
```javascript
// Order Model
class Order {
  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  }
  
  canChangeStatus(newStatus) {
    // Business rule: only allow certain status transitions
    const validTransitions = {
      'pending': ['preparing', 'cancelled'],
      'preparing': ['completed', 'cancelled'],
      'completed': []
    };
    return validTransitions[this.status].includes(newStatus);
  }
}
```

---

### 3.5 Real-time Communication Pattern (SSE)

**Principle**: Server pushes events to clients via long-lived HTTP connections.

**Implementation**:
1. Admin client establishes SSE connection: `GET /api/sse/orders`
2. SSEController adds client to NotificationService's client pool
3. When new order created, OrderService calls NotificationService
4. NotificationService sends SSE event to all connected clients
5. Admin dashboard receives event and updates UI

**Benefit**: Real-time updates without polling, lower server load than WebSocket for one-way communication

---

## 4. Data Flow Examples

### 4.1 Customer Order Creation Flow

```
1. [Customer] selects menu items → adds to cart (local storage)
2. [Customer] clicks "주문 확정"
3. [CartPage] → POST /api/orders with order data
4. [OrderController] validates request → calls OrderService.createOrder()
5. [OrderService] validates business rules → calculates total
6. [OrderService] → OrderRepository.create() → INSERT into orders table
7. [OrderService] → OrderRepository.createOrderItems() → INSERT into order_items table
8. [OrderService] → NotificationService.notifyNewOrder() → SSE event to admins
9. [OrderController] returns HTTP 201 with order details
10. [CartPage] shows success modal → clears cart → redirects to menu
```

**Duration**: < 1 second (NFR requirement)

---

### 4.2 Admin Real-time Monitoring Flow

```
1. [Admin] logs in → receives JWT token
2. [Admin] navigates to Dashboard
3. [Dashboard] establishes SSE connection: GET /api/sse/orders (with JWT)
4. [SSEController] validates JWT → adds client to NotificationService
5. Connection stays open, server sends heartbeat every 30s
6. When new order arrives:
   - [OrderService] creates order
   - [OrderService] → NotificationService.notifyNewOrder()
   - [NotificationService] → SSE event to all admin clients
   - [Dashboard] receives event → updates table card in real-time
7. Admin sees new order appear within 2 seconds (NFR requirement)
```

---

### 4.3 Table Session Lifecycle

```
1. [Manager] sets up table: POST /api/tables/setup
   - TableService creates table record with password
   - TableService creates new session with session_token
2. [Customer Tablet] auto-login: POST /api/tables/login
   - TableService validates table number + password
   - Returns session_token, stored in local storage
3. [Customer] places orders (session_id in each order)
4. [Manager] completes session: POST /api/tables/:id/complete
   - TableService marks session as completed
   - Orders moved to history (completed_at timestamp)
5. [New Customer] can start fresh (new session created on next login)
```

---

## 5. API Endpoint Summary

### 5.1 Customer APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/tables/login | 테이블 로그인 | None |
| GET | /api/menus | 메뉴 목록 조회 | None |
| POST | /api/orders | 주문 생성 | Session Token |
| GET | /api/orders | 주문 내역 조회 | Session Token |

### 5.2 Admin APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | 관리자 로그인 | None |
| GET | /api/sse/orders | 실시간 주문 스트림 (SSE) | JWT |
| GET | /api/orders | 모든 주문 조회 | JWT |
| PATCH | /api/orders/:id/status | 주문 상태 변경 | JWT |
| DELETE | /api/orders/:id | 주문 삭제 | JWT |
| POST | /api/tables/setup | 테이블 초기 설정 | JWT |
| POST | /api/tables/:id/complete | 테이블 세션 종료 | JWT |
| GET | /api/tables/:id/history | 과거 주문 조회 | JWT |
| POST | /api/menus | 메뉴 생성 | JWT |
| PUT | /api/menus/:id | 메뉴 수정 | JWT |
| DELETE | /api/menus/:id | 메뉴 삭제 | JWT |

**Total Endpoints**: ~15

---

## 6. Technology Stack Summary

### Frontend
- **Framework**: React 18+
- **State Management**: React Context API + useReducer
- **Routing**: React Router v6
- **HTTP Client**: Axios or Fetch API
- **SSE Client**: EventSource API (native)
- **Build Tool**: Vite or Create React App

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Query Builder**: Knex.js
- **Database Driver**: pg (node-postgres)
- **Authentication**: jsonwebtoken (JWT)
- **Password Hashing**: bcrypt
- **Environment**: EC2 or ECS/Fargate (AWS)

### Database
- **DBMS**: PostgreSQL 14+
- **Migration Tool**: Knex Migrations
- **Seeding**: Knex Seeds

### DevOps
- **Deployment**: AWS EC2 or ECS
- **Logging**: AWS CloudWatch
- **Environment Config**: dotenv

---

## 7. Non-Functional Requirements Mapping

### NFR-1: Performance (1초 이내 응답)
- **Architecture Impact**: 
  - Optimized queries via Knex.js
  - Database indexing on frequently queried columns
  - Connection pooling for PostgreSQL

### NFR-2: Scalability (10-50명 동시 사용자)
- **Architecture Impact**:
  - Stateless backend (horizontal scaling possible)
  - SSE connection management (limit concurrent SSE connections)
  - AWS Auto Scaling Group for EC2/ECS

### NFR-3: Security (bcrypt + JWT + HTTPS)
- **Architecture Impact**:
  - AuthService handles JWT generation/verification
  - Passwords hashed with bcrypt before storage
  - HTTPS enforced at load balancer level

### NFR-4: Real-time Updates (2초 이내)
- **Architecture Impact**:
  - SSE for server-to-client push (no polling)
  - NotificationService manages SSE clients in-memory
  - Event-driven architecture (OrderService → NotificationService)

### NFR-5: Availability (CloudWatch 로깅)
- **Architecture Impact**:
  - Centralized logging via CloudWatch
  - Error handling at all layers
  - Health check endpoints for monitoring

---

## 8. Design Validation

### 8.1 Requirements Coverage

✅ **All functional requirements covered**:
- FR-1.1 to FR-1.5 (Customer features): Mapped to Customer App components
- FR-2.1 to FR-2.4 (Admin features): Mapped to Admin App components

✅ **All user stories covered**:
- Story 1-5 (Customer): Menu, Cart, Order features
- Story 6-11 (Admin): Auth, Dashboard, Table/Menu management

### 8.2 Component Completeness

✅ **Frontend**: All feature modules identified
✅ **Backend**: All controllers, services, repositories defined
✅ **Database**: All tables and relationships defined

### 8.3 Dependency Validation

✅ **No circular dependencies**: Unidirectional layer dependencies
✅ **Clear boundaries**: Presentation ↔ Service ↔ Data Access
✅ **Service isolation**: Services don't depend on controllers

---

## 9. Traceability Matrix

### User Stories → Components Mapping

| Story | Frontend Components | Backend Components |
|-------|---------------------|-------------------|
| Story 1: 자동 로그인 | AutoLoginProvider | TableController, TableService |
| Story 2: 메뉴 탐색 | Menu Feature | MenuController, MenuService |
| Story 3: 장바구니 | Cart Feature | (Local storage only) |
| Story 4: 주문 생성 | Order Feature | OrderController, OrderService, NotificationService |
| Story 5: 주문 조회 | OrderHistory Feature | OrderController, OrderService |
| Story 6: 관리자 로그인 | Auth Feature | AuthController, AuthService |
| Story 7: 실시간 모니터링 | Dashboard Feature | SSEController, NotificationService |
| Story 8: 주문 상태 관리 | Dashboard Feature | OrderController, OrderService |
| Story 9: 테이블 세션 관리 | Table Management Feature | TableController, TableService |
| Story 10: 메뉴 관리 | Menu Management Feature | MenuController, MenuService |
| Story 11: 테이블 초기 설정 | Table Management Feature | TableController, TableService |

**Coverage**: 100% - All stories mapped to components

---

## 10. Next Steps

With Application Design complete, the next phase is **Units Generation**:

1. **Break down system into units of work** for parallel development
2. **Define unit boundaries** (e.g., Customer Frontend unit, Admin Frontend unit, Backend API unit, Database unit)
3. **Identify unit dependencies** and development sequence
4. **Map user stories to units**

After Units Generation, proceed to **CONSTRUCTION PHASE**:
- Functional Design (per-unit)
- NFR Requirements (per-unit)
- NFR Design (per-unit)
- Infrastructure Design (per-unit)
- Code Generation (per-unit)
- Build and Test

---

## Document References

- **[components.md](./components.md)**: Detailed component catalog
- **[services.md](./services.md)**: Service layer specifications
- **[component-dependency.md](./component-dependency.md)**: Dependency relationships and data flows
- **[../requirements/requirements.md](../requirements/requirements.md)**: Functional and non-functional requirements
- **[../user-stories/stories.md](../user-stories/stories.md)**: User stories and acceptance criteria
- **[../plans/execution-plan.md](../plans/execution-plan.md)**: Workflow execution plan

---

**Application Design Version**: 1.0  
**Date**: 2026-04-06  
**Status**: Complete - Ready for Units Generation
