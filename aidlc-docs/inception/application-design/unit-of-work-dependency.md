# Unit of Work Dependencies

## Overview

이 문서는 5개 units 간의 의존성 관계, API 계약, 데이터 흐름, 그리고 개발 순서를 정의합니다.

---

## Dependency Matrix

| Unit | Depends On | Depended By | Dependency Type |
|------|-----------|-------------|-----------------|
| **Customer Frontend** | Backend (REST API), Shared (Components) | None | Runtime (API calls), Compile-time (imports) |
| **Admin Frontend** | Backend (REST API + SSE), Shared (Components) | None | Runtime (API calls + SSE), Compile-time (imports) |
| **Backend** | Database (Data Access), Shared (Types) | Customer Frontend, Admin Frontend | Runtime (DB queries), Compile-time (imports) |
| **Database** | None | Backend | Runtime (SQL queries) |
| **Shared** | None | Customer Frontend, Admin Frontend, Backend | Compile-time (imports) |

### Dependency Visualization

```
┌──────────────────────────────────────────────────────┐
│                   Frontend Layer                      │
│                                                       │
│  ┌─────────────────┐         ┌──────────────────┐   │
│  │  Customer       │         │  Admin           │   │
│  │  Frontend       │         │  Frontend        │   │
│  │  (Unit 1)       │         │  (Unit 2)        │   │
│  └────────┬────────┘         └────────┬─────────┘   │
│           │                           │              │
│           │   ┌───────────────┐       │              │
│           └───┤  Shared (U5)  ├───────┘              │
│               └───────────────┘                      │
└──────────────────┬──────────────┬────────────────────┘
                   │              │
                   │   REST API   │   REST API + SSE
                   │              │
           ┌───────▼──────────────▼────────┐
           │       Backend (Unit 3)        │
           │   Controllers → Services      │
           │   → Repositories              │
           └───────────────┬───────────────┘
                           │
                           │ Knex.js Queries
                           │
                   ┌───────▼────────┐
                   │  Database      │
                   │  (Unit 4)      │
                   │  PostgreSQL    │
                   └────────────────┘
```

**Dependency Rules**:
- ✅ **No circular dependencies**: 모든 의존성이 단방향
- ✅ **Layered architecture**: Frontend → Backend → Database
- ✅ **Shared library pattern**: Shared unit은 다른 units에 의존하지 않음

---

## API Contracts

### 1. Backend → Database Contract

**Protocol**: SQL via Knex.js Query Builder

**Key Operations**:
- **Menus**: SELECT, INSERT, UPDATE, DELETE (menus table)
- **Orders**: SELECT, INSERT, UPDATE, DELETE (orders, order_items tables)
- **Tables**: SELECT, INSERT, UPDATE (tables, sessions tables)
- **Auth**: SELECT (users table)

**Example Query**:
```javascript
// Backend → Database (via Knex.js)
const menus = await knex('menus')
  .where({ store_id: storeId, is_available: true })
  .orderBy('display_order', 'asc');
```

**Contract Characteristics**:
- **Type**: Synchronous
- **Error Handling**: Database errors → Backend service errors
- **Transaction Support**: Yes (Knex.js transactions)

---

### 2. Customer Frontend → Backend Contract

**Protocol**: REST API over HTTPS

**Base URL**: `https://api.table-order.example.com/api`

**Authentication**:
- **Table Login**: POST /api/tables/login → returns session token
- **Subsequent Requests**: Include session token in headers

**Key Endpoints**:

#### 2.1 Table Login
```http
POST /api/tables/login
Content-Type: application/json

{
  "storeId": "store-001",
  "tableNumber": 5,
  "password": "table123"
}

Response 200:
{
  "sessionToken": "sess_abc123...",
  "tableId": 42,
  "tableName": "Table 5"
}
```

#### 2.2 Get Menus
```http
GET /api/menus?storeId=store-001
Authorization: Bearer {sessionToken}

Response 200:
{
  "menus": [
    {
      "id": 1,
      "name": "Margherita Pizza",
      "description": "Classic tomato and mozzarella",
      "price": 15000,
      "categoryId": 1,
      "imageUrl": "https://...",
      "isAvailable": true
    },
    ...
  ]
}
```

#### 2.3 Create Order
```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer {sessionToken}

{
  "storeId": "store-001",
  "tableId": 42,
  "sessionId": 101,
  "items": [
    {
      "menuId": 1,
      "quantity": 2
    },
    {
      "menuId": 5,
      "quantity": 1
    }
  ]
}

Response 201:
{
  "orderId": 201,
  "orderNumber": "ORD-20260406-001",
  "totalAmount": 45000,
  "status": "pending",
  "createdAt": "2026-04-06T10:30:00Z"
}
```

#### 2.4 Get Orders (Current Session)
```http
GET /api/orders?sessionId=101
Authorization: Bearer {sessionToken}

Response 200:
{
  "orders": [
    {
      "id": 201,
      "orderNumber": "ORD-20260406-001",
      "totalAmount": 45000,
      "status": "preparing",
      "items": [
        {
          "menuName": "Margherita Pizza",
          "quantity": 2,
          "unitPrice": 15000,
          "subtotal": 30000
        },
        ...
      ],
      "createdAt": "2026-04-06T10:30:00Z"
    },
    ...
  ]
}
```

**Contract Characteristics**:
- **Type**: Synchronous (request-response)
- **Format**: JSON
- **Status Codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 500 (Server Error)
- **Error Format**: `{ "error": "Error message" }`

---

### 3. Admin Frontend → Backend Contract

**Protocol**: REST API + Server-Sent Events (SSE)

**Base URL**: `https://api.table-order.example.com/api`

**Authentication**:
- **Admin Login**: POST /api/auth/login → returns JWT token (16-hour session)
- **Subsequent Requests**: Include JWT in `Authorization: Bearer {token}` header

**Key Endpoints**:

#### 3.1 Admin Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "storeId": "store-001",
  "username": "admin1",
  "password": "securepass"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin1",
    "role": "admin",
    "storeId": "store-001"
  },
  "expiresIn": 57600
}
```

#### 3.2 Real-time Order Stream (SSE)
```http
GET /api/sse/orders?storeId=store-001
Authorization: Bearer {token}
Accept: text/event-stream

Response (Server-Sent Events):
event: order-created
data: {"orderId": 201, "tableId": 42, "orderNumber": "ORD-20260406-001", "totalAmount": 45000, "status": "pending", "createdAt": "2026-04-06T10:30:00Z"}

event: order-updated
data: {"orderId": 201, "status": "preparing", "updatedAt": "2026-04-06T10:32:00Z"}

event: heartbeat
data: {"timestamp": "2026-04-06T10:33:00Z"}
```

#### 3.3 Update Order Status
```http
PATCH /api/orders/201/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "completed"
}

Response 200:
{
  "orderId": 201,
  "status": "completed",
  "updatedAt": "2026-04-06T10:35:00Z"
}
```

#### 3.4 Delete Order
```http
DELETE /api/orders/201
Authorization: Bearer {token}

Response 204: (No Content)
```

#### 3.5 Create Menu
```http
POST /api/menus
Content-Type: application/json
Authorization: Bearer {token}

{
  "storeId": "store-001",
  "categoryId": 1,
  "name": "Pepperoni Pizza",
  "description": "Spicy pepperoni with mozzarella",
  "price": 17000,
  "imageUrl": "https://...",
  "displayOrder": 2
}

Response 201:
{
  "id": 10,
  "name": "Pepperoni Pizza",
  "price": 17000,
  "createdAt": "2026-04-06T11:00:00Z"
}
```

#### 3.6 Complete Table Session
```http
POST /api/tables/42/complete
Authorization: Bearer {token}

Response 200:
{
  "tableId": 42,
  "sessionId": 101,
  "completedAt": "2026-04-06T11:30:00Z",
  "totalRevenue": 120000
}
```

#### 3.7 Table Setup (Initial Configuration)
```http
POST /api/tables/setup
Content-Type: application/json
Authorization: Bearer {token}

{
  "storeId": "store-001",
  "tableNumber": 8,
  "password": "table456"
}

Response 201:
{
  "tableId": 50,
  "sessionToken": "sess_xyz789...",
  "message": "Table setup complete. Auto-login enabled."
}
```

**Contract Characteristics**:
- **REST Type**: Synchronous (request-response)
- **SSE Type**: Asynchronous (server-push, long-lived connection)
- **Format**: JSON (REST), text/event-stream (SSE)
- **Status Codes**: 200, 201, 204, 400, 401, 403, 500
- **SSE Reconnection**: Client auto-reconnects on connection loss

---

### 4. Frontend Units → Shared Contract

**Protocol**: ES Module imports (compile-time)

**Example Imports**:
```javascript
// Customer Frontend or Admin Frontend
import { Button, Modal, Card } from '@shared/components/ui';
import { Header, Footer } from '@shared/components/layout';
import { formatCurrency, formatDate } from '@shared/utils';
import { API_BASE_URL, ORDER_STATUS } from '@shared/constants';
import type { Menu, Order } from '@shared/types';
```

**Shared Exports**:
- **Components**: React components (Button, Modal, Input, Select, Card, Badge, Spinner, Header, Footer, Sidebar, NavBar)
- **Types**: TypeScript interfaces (Menu, Order, Table, User, Session, etc.)
- **Utils**: Utility functions (formatCurrency, formatDate, validateEmail, etc.)
- **Constants**: API URLs, status codes, configuration

**Contract Characteristics**:
- **Type**: Compile-time dependency
- **Package**: npm package (private registry or monorepo)
- **Versioning**: Semantic versioning (e.g., 1.0.0)

---

## Data Flow Diagrams

### Flow 1: Customer Order Creation

```
┌─────────────────┐
│  Customer       │
│  Frontend (U1)  │
└────────┬────────┘
         │
         │ 1. User adds menu to cart (client-side)
         │ 2. User clicks "주문 확정"
         │ 3. POST /api/orders with cart items
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  OrderController   │
└────────┬───────────┘
         │
         │ 4. Validate request
         │ 5. Call OrderService.createOrder()
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  OrderService      │
└────────┬───────────┘
         │
         │ 6. Calculate total amount
         │ 7. Call OrderRepository.create()
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  OrderRepository   │
└────────┬───────────┘
         │
         │ 8. INSERT into orders table
         │ 9. INSERT into order_items table
         │
         ▼
┌────────────────────┐
│  Database (U4)     │
│  PostgreSQL        │
└────────┬───────────┘
         │
         │ 10. Return order ID
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  OrderService      │
└────────┬───────────┘
         │
         │ 11. Notify via NotificationService
         │ 12. Send SSE event to all admin connections
         │
         ▼
┌────────────────────┐
│  Admin Frontend    │
│  (U2) - Dashboard  │
└────────────────────┘
         │
         │ 13. Update UI with new order
         │
         ▼
┌────────────────────┐
│  Customer Frontend │
│  (U1)              │
└────────────────────┘
         │
         │ 14. Show order success
         │ 15. Clear cart, redirect to menu
```

**Data Flow Summary**:
1. Customer Frontend → Backend: Order creation request (HTTP POST)
2. Backend → Database: Insert order and order items (SQL INSERT)
3. Backend → Admin Frontend: Real-time order notification (SSE event)
4. Backend → Customer Frontend: Order confirmation response (HTTP 201)

**Latency Target**: < 1 second (FR → Backend → DB → FR)

---

### Flow 2: Admin Real-time Monitoring

```
┌────────────────────┐
│  Admin Frontend    │
│  (U2) - Dashboard  │
└────────┬───────────┘
         │
         │ 1. Establish SSE connection on dashboard load
         │ GET /api/sse/orders
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  SSEController     │
└────────┬───────────┘
         │
         │ 2. Add client to connection pool
         │ 3. Send initial state (current orders)
         │ 4. Keep connection alive (heartbeat every 30s)
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  NotificationSvc   │
└────────────────────┘
         │
         │ 5. Listen for order events:
         │    - order-created
         │    - order-updated
         │    - order-deleted
         │
         ▼
┌────────────────────┐
│  Admin Frontend    │
│  (U2) - Dashboard  │
└────────┬───────────┘
         │
         │ 6. Update UI in real-time
         │    - Highlight new orders
         │    - Update order status
         │    - Update table total amounts
         │
         ▼
    [User sees real-time updates]
```

**Data Flow Summary**:
1. Admin Frontend → Backend: SSE connection establishment (HTTP GET with Accept: text/event-stream)
2. Backend → Admin Frontend: Continuous SSE events (order-created, order-updated, order-deleted, heartbeat)
3. Admin Frontend: UI updates based on SSE events

**Latency Target**: < 2 seconds (Order creation → SSE event received)

---

### Flow 3: Table Session Management

```
┌────────────────────┐
│  Admin Frontend    │
│  (U2) - Table Mgmt │
└────────┬───────────┘
         │
         │ 1. Admin clicks "테이블 이용 완료" for Table 5
         │ POST /api/tables/42/complete
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  TableController   │
└────────┬───────────┘
         │
         │ 2. Validate admin token (JWT)
         │ 3. Call TableService.completeSession()
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  TableService      │
└────────┬───────────┘
         │
         │ 4. Calculate total revenue for session
         │ 5. Call TableRepository.completeSession()
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  TableRepository   │
└────────┬───────────┘
         │
         │ 6. UPDATE sessions SET is_active = false, completed_at = NOW()
         │ 7. SELECT SUM(total_amount) FROM orders WHERE session_id = 101
         │
         ▼
┌────────────────────┐
│  Database (U4)     │
│  PostgreSQL        │
└────────┬───────────┘
         │
         │ 8. Return session data + revenue
         │
         ▼
┌────────────────────┐
│  Backend (U3)      │
│  TableService      │
└────────┬───────────┘
         │
         │ 9. Return success response
         │
         ▼
┌────────────────────┐
│  Admin Frontend    │
│  (U2) - Dashboard  │
└────────┬───────────┘
         │
         │ 10. Reset table display (orders = 0, amount = 0)
         │ 11. Show success message
         │
         ▼
┌────────────────────┐
│  Customer Frontend │
│  (U1) - Table 5    │
└────────────────────┘
         │
         │ 12. Next customer's orders will create new session
```

**Data Flow Summary**:
1. Admin Frontend → Backend: Complete session request (HTTP POST)
2. Backend → Database: Update session, calculate revenue (SQL UPDATE + SELECT)
3. Backend → Admin Frontend: Session completion confirmation (HTTP 200)
4. Admin Frontend: Reset table display

---

## Development Sequence

### Strategy: All Parallel (User Choice - Q4)

모든 units을 동시에 시작하여 최대 병렬성을 확보합니다. 이를 가능하게 하는 전략:

### Phase 1: Foundation (Week 1)

**Goal**: 의존성이 없는 units 먼저 완료 + API 계약 정의

| Unit | Tasks | Deliverables |
|------|-------|--------------|
| **Shared (U5)** | 기본 컴포넌트 개발 | Button, Modal, Card, Input, Header, Footer, Utils |
| **Database (U4)** | 스키마 설계 및 migrations | 8 tables, migrations, seed data |
| **Backend (U3)** | API 스펙 정의 (OpenAPI) | API contract document, mock endpoints |
| **Customer Frontend (U1)** | 프로젝트 셋업, mock API 사용 | Project scaffolding, routing, basic pages |
| **Admin Frontend (U2)** | 프로젝트 셋업, mock API 사용 | Project scaffolding, routing, basic pages |

**Integration Points**:
- Shared components를 Frontend units에 통합
- API 계약 문서를 Frontend units에 공유
- Database 스키마를 Backend unit에 반영

---

### Phase 2: Core Implementation (Week 2)

**Goal**: 각 unit의 핵심 기능 구현

| Unit | Tasks | Deliverables |
|------|-------|--------------|
| **Backend (U3)** | 실제 API 구현 | 15 endpoints, services, repositories, JWT auth |
| **Database (U4)** | 데이터베이스 배포 | AWS RDS 인스턴스, migrations 실행 |
| **Customer Frontend (U1)** | 고객 기능 구현 | Menu, Cart, Order features |
| **Admin Frontend (U2)** | 관리자 기능 구현 | Auth, Dashboard, Table Management |
| **Shared (U5)** | 추가 컴포넌트 개발 | Badge, Spinner, additional utilities |

**Integration Points**:
- Frontend units를 실제 Backend API에 연결
- Backend unit을 실제 Database에 연결
- SSE 연결 구현 (Admin Frontend ↔ Backend)

---

### Phase 3: Integration & Testing (Week 3)

**Goal**: 통합 테스트 및 배포 준비

| Unit | Tasks | Deliverables |
|------|-------|--------------|
| **All Units** | 통합 테스트 | End-to-end test scenarios |
| **Backend (U3)** | 성능 최적화 | Response time < 1s |
| **Admin Frontend (U2)** | SSE 안정성 테스트 | Real-time latency < 2s |
| **All Units** | 배포 준비 | CI/CD pipelines, deployment scripts |

**Integration Milestones**:
- ✅ Customer can browse menus and create orders
- ✅ Admin can see real-time orders on dashboard
- ✅ Admin can manage menus and table sessions
- ✅ All NFR targets met (1s response, 2s real-time)

---

### Parallel Development Enablers

**How to enable parallel development**:

1. **API Contract First**:
   - Backend unit defines OpenAPI spec in Week 1
   - Frontend units use mock servers (e.g., Prism, json-server) until Backend is ready

2. **Shared Components Early**:
   - Shared unit delivers basic components in Week 1
   - Frontend units can build UI immediately

3. **Database Schema First**:
   - Database unit defines schema in Week 1
   - Backend unit can design Repositories based on schema

4. **Independent Testing**:
   - Each unit has its own test suite
   - Integration tests run only after all units are ready

5. **Mock Data**:
   - Database unit provides seed data early
   - Backend unit can test with local PostgreSQL
   - Frontend units can test with mock API responses

---

## Critical Path Analysis

**Critical Path** (longest dependency chain):
```
Database (U4) → Backend (U3) → Frontend (U1/U2)
```

**Critical Path Duration**: ~2.5 weeks (with parallel work)

**Bottleneck Prevention**:
- Start Database unit immediately (Week 1 Day 1)
- Define Backend API contract early (Week 1 Day 2)
- Frontend units use mock APIs to avoid blocking

---

## Integration Points

### Integration Checkpoint 1: API Contract Review (End of Week 1)
- **Participants**: Backend unit, Customer Frontend unit, Admin Frontend unit
- **Deliverable**: Approved API contract (OpenAPI spec)
- **Success Criteria**: All Frontend units agree on API structure

### Integration Checkpoint 2: Shared Components Review (End of Week 1)
- **Participants**: Shared unit, Customer Frontend unit, Admin Frontend unit
- **Deliverable**: Shared component library v1.0.0
- **Success Criteria**: All required components available

### Integration Checkpoint 3: Backend Integration (Mid Week 2)
- **Participants**: Backend unit, Database unit
- **Deliverable**: Backend connected to Database, all endpoints working
- **Success Criteria**: All API endpoints return 200/201 with real data

### Integration Checkpoint 4: Frontend Integration (End of Week 2)
- **Participants**: Customer Frontend, Admin Frontend, Backend
- **Deliverable**: Frontend units connected to real Backend API
- **Success Criteria**: All user stories functional end-to-end

### Integration Checkpoint 5: SSE Integration (End of Week 2)
- **Participants**: Admin Frontend, Backend
- **Deliverable**: Real-time order notifications working
- **Success Criteria**: Latency < 2 seconds, reconnection working

### Integration Checkpoint 6: Full System Test (Week 3)
- **Participants**: All units
- **Deliverable**: All 11 user stories tested end-to-end
- **Success Criteria**: 100% story acceptance, all NFRs met

---

## Dependency Risk Mitigation

### Risk 1: Backend delays block Frontend units
**Mitigation**:
- Frontend units use mock API servers (Prism, json-server)
- API contract defined in Week 1
- Frontend development proceeds independently

### Risk 2: Shared components incomplete
**Mitigation**:
- Prioritize basic components (Button, Modal, Card) in Week 1
- Frontend units can use temporary components if needed
- Swap to Shared components later (low risk)

### Risk 3: Database schema changes break Backend
**Mitigation**:
- Schema review with Backend unit before migrations
- Use Knex.js migrations for version control
- Database unit provides rollback scripts

### Risk 4: SSE connection unstable
**Mitigation**:
- Implement reconnection logic in Admin Frontend
- Backend sends heartbeat every 30 seconds
- Fallback to polling if SSE fails

---

## Deployment Dependencies

### Deployment Order
1. **Database (U4)** - Deploy first (AWS RDS)
2. **Backend (U3)** - Deploy after Database (AWS EC2/ECS)
3. **Shared (U5)** - Publish to npm registry
4. **Customer Frontend (U1)** - Deploy after Backend + Shared (AWS S3 + CloudFront)
5. **Admin Frontend (U2)** - Deploy after Backend + Shared (AWS S3 + CloudFront)

**Note**: Frontend units can deploy simultaneously after Backend is ready.

---

## Summary

### Dependency Characteristics
- **Total Units**: 5
- **Dependency Edges**: 7 (Customer→Backend, Customer→Shared, Admin→Backend, Admin→Shared, Backend→Database, Backend→Shared, Backend→Database)
- **Cyclic Dependencies**: 0 (all dependencies are acyclic)
- **Critical Path Length**: 2.5 weeks
- **Parallelization Factor**: High (3-4 units can work simultaneously)

### Development Strategy
- **Approach**: All parallel with API contract first
- **Duration**: ~3 weeks (Foundation → Implementation → Integration)
- **Risk Level**: Medium (mitigated by mock APIs and early contract definition)

### Integration Complexity
- **REST API Integration**: Medium (15 endpoints, standard patterns)
- **SSE Integration**: Medium (real-time connection management)
- **Shared Library Integration**: Low (standard npm package)
- **Database Integration**: Low (Knex.js ORM)

**Overall Complexity**: Medium
