# Component Dependencies

## Dependency Overview

이 문서는 테이블오더 서비스의 컴포넌트 간 의존성 관계와 통신 패턴을 정의합니다.

---

## 1. High-Level Architecture Layers

```
┌─────────────────────────────────────────────────┐
│         Presentation Layer (Frontend)            │
│     Customer App        |      Admin App         │
│  (React + Feature Modules) | (React + Features) │
└────────────────┬────────────────────────────────┘
                 │ HTTP REST / SSE
┌────────────────▼────────────────────────────────┐
│          Service Layer (Backend)                 │
│     Controllers → Services → Repositories        │
│   (Express + Business Logic + Data Access)      │
└────────────────┬────────────────────────────────┘
                 │ SQL Queries
┌────────────────▼────────────────────────────────┐
│        Data Access Layer (Database)              │
│       PostgreSQL + Knex.js Query Builder         │
└──────────────────────────────────────────────────┘
```

---

## 2. Frontend Dependencies

### 2.1 Customer App Dependencies

```
Customer App Root
├── Menu Feature
│   ├── API Client (→ Backend /api/menus)
│   └── Shared UI Components
├── Cart Feature
│   ├── Local Storage
│   └── Shared UI Components
├── Order Feature
│   ├── API Client (→ Backend /api/orders)
│   ├── Cart Feature (cart data)
│   └── Shared UI Components
└── Auto-Login Module
    ├── Local Storage (session token)
    └── API Client (→ Backend /api/tables/login)
```

**External Dependencies**:
- **Backend REST API**: All feature modules communicate with backend
- **Local Storage**: Cart and session data persistence
- **React Context**: State sharing between components

---

### 2.2 Admin App Dependencies

```
Admin App Root
├── Auth Feature
│   ├── API Client (→ Backend /api/auth/login)
│   ├── Local Storage (JWT token)
│   └── Shared UI Components
├── Dashboard Feature
│   ├── SSE Client (→ Backend /api/sse/orders)
│   ├── API Client (→ Backend /api/orders)
│   ├── Auth Feature (token)
│   └── Shared UI Components
├── Table Management Feature
│   ├── API Client (→ Backend /api/tables)
│   ├── Auth Feature (token)
│   └── Shared UI Components
└── Menu Management Feature
    ├── API Client (→ Backend /api/menus)
    ├── Auth Feature (token)
    └── Shared UI Components
```

**External Dependencies**:
- **Backend REST API**: Admin features communicate with backend
- **SSE**: Real-time order updates from backend
- **Local Storage**: JWT token persistence
- **React Context**: Authentication state sharing

---

## 3. Backend Dependencies

### 3.1 Controller Dependencies

```
MenuController
├── MenuService
├── AuthMiddleware (관리자 전용 엔드포인트)
└── ValidationMiddleware

OrderController
├── OrderService
├── AuthMiddleware (관리자 전용 엔드포인트)
└── ValidationMiddleware

TableController
├── TableService
├── AuthMiddleware (관리자 전용 엔드포인트)
└── ValidationMiddleware

AuthController
├── AuthService
└── ValidationMiddleware

SSEController
├── NotificationService
└── AuthMiddleware
```

**Pattern**: Controllers depend on Services and Middleware only. They do NOT directly access Repositories.

---

### 3.2 Service Dependencies

```
MenuService
├── MenuRepository
├── Menu Model
└── CategoryRepository

OrderService
├── OrderRepository
├── Order Model
├── MenuRepository (for validation)
└── NotificationService (for real-time alerts)

TableService
├── TableRepository
├── SessionRepository
├── Table Model
├── Session Model
└── OrderRepository (for history queries)

AuthService
├── UserRepository
├── User Model
└── JWT Library (jsonwebtoken)

NotificationService
├── SSEController (for client connections)
└── (No repository - in-memory client management)
```

**Pattern**: Services depend on Repositories, Domain Models, and (occasionally) other Services.

---

### 3.3 Repository Dependencies

```
MenuRepository
└── Knex.js (Database connection)

OrderRepository
└── Knex.js (Database connection)

TableRepository
└── Knex.js (Database connection)

SessionRepository
└── Knex.js (Database connection)

UserRepository
└── Knex.js (Database connection)
```

**Pattern**: Repositories depend ONLY on Knex.js. They do NOT depend on Services or Models.

---

### 3.4 Model Dependencies

```
Menu Model
└── (No external dependencies - pure domain logic)

Order Model
└── (No external dependencies - pure domain logic)

Table Model
└── (No external dependencies - pure domain logic)

Session Model
└── (No external dependencies - pure domain logic)

User Model
├── bcrypt (for password hashing)
└── (Domain logic for user validation)
```

**Pattern**: Models contain domain logic and minimal dependencies (e.g., bcrypt for password hashing).

---

## 4. Communication Patterns

### 4.1 Frontend ↔ Backend Communication

#### REST API Pattern (Synchronous)

**Customer App → Backend**:
```
[MenuPage] → HTTP GET /api/menus → [MenuController] → [MenuService] → [MenuRepository] → [Database]
                                  ← JSON Response ←
```

**Admin App → Backend**:
```
[Dashboard] → HTTP POST /api/orders/:id/status → [OrderController] → [OrderService] → [OrderRepository] → [Database]
                                               ← JSON Response ←
```

#### SSE Pattern (Asynchronous - Server to Client)

**Backend → Admin App (Real-time)**:
```
[OrderService] → (Order Created Event) → [NotificationService] → SSE /api/sse/orders → [Dashboard SSE Client]
```

**Flow**:
1. Admin client establishes SSE connection: `GET /api/sse/orders`
2. Server keeps connection open
3. When new order is created, `OrderService` calls `NotificationService.notifyNewOrder(order)`
4. `NotificationService` sends SSE event to all connected admin clients
5. Admin dashboard receives event and updates UI in real-time

---

### 4.2 Backend Internal Communication

#### Controller → Service → Repository Pattern

```
Controller Layer:
  - Receives HTTP request
  - Validates request data
  - Calls Service method
  - Returns HTTP response

Service Layer:
  - Executes business logic
  - Calls Repository methods for data access
  - Coordinates multiple repositories if needed
  - Calls other services if needed
  - Returns result to Controller

Repository Layer:
  - Executes database queries via Knex.js
  - Returns raw data or domain models
  - No business logic
```

#### Service-to-Service Communication

**OrderService → NotificationService**:
```javascript
// In OrderService.createOrder()
const order = await OrderRepository.create(orderData);
await NotificationService.notifyNewOrder(order); // Async notification
return order;
```

**OrderService → MenuService**:
```javascript
// In OrderService.createOrder() - validate menu availability
for (const item of orderData.items) {
  const menu = await MenuService.getMenuById(item.menuId);
  if (!menu.is_available) {
    throw new ValidationError('Menu not available');
  }
}
```

---

## 5. Dependency Matrix

### Frontend Dependencies Matrix

| Component | Depends On |
|-----------|------------|
| Customer App | Backend API, Local Storage, React Context |
| Admin App | Backend API, SSE, Local Storage, React Context |
| Menu Feature | MenuController API |
| Cart Feature | Local Storage |
| Order Feature | OrderController API, Cart Feature |
| Dashboard Feature | SSEController, OrderController API, Auth Context |
| Table Management | TableController API, Auth Context |
| Menu Management | MenuController API, Auth Context |

### Backend Dependencies Matrix

| Component | Depends On |
|-----------|------------|
| MenuController | MenuService, AuthMiddleware |
| OrderController | OrderService, AuthMiddleware |
| TableController | TableService, AuthMiddleware |
| AuthController | AuthService |
| SSEController | NotificationService, AuthMiddleware |
| MenuService | MenuRepository, Menu Model |
| OrderService | OrderRepository, Order Model, NotificationService |
| TableService | TableRepository, SessionRepository, Models |
| AuthService | UserRepository, User Model, JWT |
| NotificationService | SSEController |
| All Repositories | Knex.js |
| Models | Minimal (bcrypt for User Model) |

---

## 6. Data Flow Diagrams

### 6.1 Customer Order Creation Flow

```
[Customer] → [MenuPage] → Select Menu Items → [CartPage] → Add to Cart (Local Storage)
                                                               ↓
                                                          [OrderPage]
                                                               ↓
                                                    POST /api/orders
                                                               ↓
                                                      [OrderController]
                                                               ↓
                                                        [OrderService]
                                                               ↓
                                            [OrderRepository] → [Database: INSERT order]
                                                               ↓
                                                   [NotificationService]
                                                               ↓
                                            SSE Event → [Admin Dashboard] (Real-time)
                                                               ↓
                                                  HTTP 201 Response ← [Customer]
                                                               ↓
                                          [OrderSuccessModal] → Auto-redirect to [MenuPage]
```

### 6.2 Admin Real-time Monitoring Flow

```
[Admin Login] → POST /api/auth/login → [AuthController] → [AuthService]
                                                              ↓
                                                      JWT Token Generated
                                                              ↓
                                              Stored in Local Storage
                                                              ↓
                                                      [Dashboard Page]
                                                              ↓
                                          GET /api/sse/orders (with JWT)
                                                              ↓
                                                        [SSEController]
                                                              ↓
                                                  [NotificationService]
                                                              ↓
                                              Add Client to SSE pool
                                                              ↓
                                        Keep connection open, send heartbeat
                                                              ↓
                            When new order: [OrderService] → [NotificationService]
                                                              ↓
                                           SSE Event → [Dashboard] (Real-time Update)
```

### 6.3 Table Session Management Flow

```
[Manager] → [TableSetupModal] → POST /api/tables/setup
                                        ↓
                              [TableController] → [TableService]
                                        ↓
              [TableRepository] → [Database: INSERT/UPDATE table]
                                        ↓
                  [SessionRepository] → [Database: INSERT session]
                                        ↓
                                HTTP 201 Response
                                        ↓
                        [Customer Tablet] → Auto-login with session token
                                        ↓
                              Customer can order immediately
```

---

## 7. Circular Dependency Prevention

### Avoided Patterns

❌ **BAD**: Service A → Service B → Service A (Circular)
❌ **BAD**: Repository → Service (Repositories should not call Services)
❌ **BAD**: Model → Repository (Models should not access data)

### Good Patterns

✅ **GOOD**: Controller → Service → Repository → Database (Unidirectional)
✅ **GOOD**: Service A → Service B (One direction only)
✅ **GOOD**: Service → Model (Service uses Model for domain logic)

### Handling Complex Dependencies

If Service A and Service B need each other:
- **Option 1**: Create Service C that coordinates A and B
- **Option 2**: Use Event-driven pattern (Pub/Sub)
- **Option 3**: Refactor to remove circular dependency

---

## 8. External Dependencies

### Frontend External Libraries

- **React**: UI framework
- **React Router**: Client-side routing
- **Axios** or **Fetch API**: HTTP client
- **EventSource API**: SSE client (native browser API)

### Backend External Libraries

- **Express**: Web framework
- **Knex.js**: Query builder
- **pg** (node-postgres): PostgreSQL driver
- **jsonwebtoken**: JWT token generation/verification
- **bcrypt**: Password hashing
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment configuration

### Database

- **PostgreSQL 14+**: Relational database

---

## Summary

**Key Dependency Principles**:
1. **Layered Architecture**: Presentation → Service → Data Access
2. **Unidirectional Dependencies**: Higher layers depend on lower layers, not vice versa
3. **Service Isolation**: Services don't depend on Controllers
4. **Repository Isolation**: Repositories only depend on Knex.js
5. **Model Purity**: Models contain domain logic, minimal external dependencies
6. **No Circular Dependencies**: Avoided through careful design

**Total Component Count**: ~67+ components across 3 layers with clear dependency boundaries.
