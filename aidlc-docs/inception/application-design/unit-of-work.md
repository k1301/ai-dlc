# Unit of Work

## Overview

테이블오더 서비스는 **5개의 독립적인 units**으로 분해되어 병렬 개발이 가능하도록 설계되었습니다.

**Unit Decomposition Strategy**:
- **Development Model**: All parallel (모든 units 동시 개발)
- **Deployment Model**: Separate Deployments (각 unit 독립 배포)
- **Directory Structure**: Simple structure with subdirectories (frontend/customer/, frontend/admin/, backend/, database/, shared/)
- **Shared Code**: Dedicated Shared Unit

---

## Unit 1: Customer Frontend

### Basic Information
- **Name**: Customer Frontend
- **Type**: Frontend Application
- **Purpose**: 고객용 테이블 태블릿 인터페이스

### Responsibilities
- 테이블 자동 로그인 및 세션 관리
- 메뉴 조회 및 카테고리 탐색
- 장바구니 관리 (추가, 수정, 삭제)
- 주문 생성 및 확정
- 주문 내역 조회

### Components Included
**From Frontend Components (Section 1.1 in components.md)**:
- Menu Feature Module (5 components)
  - MenuPage
  - CategoryTabs
  - MenuGrid
  - MenuCard
  - MenuDetail
- Cart Feature Module (5 components)
  - CartButton
  - CartPage
  - CartItemList
  - CartItem
  - CartSummary
- Order Feature Module (5 components)
  - OrderConfirmModal
  - OrderSuccessModal
  - OrderHistoryPage
  - OrderList
  - OrderCard
- Auto-Login Module (2 components)
  - AutoLoginProvider
  - TableSessionManager

**Shared Components** (from Shared unit):
- Layout Components (Header, Footer, NavBar)
- UI Components (Button, Modal, Input, Select, Card, Badge, Spinner)

**Total Components**: ~17 unique + shared components

### Technology Stack
- **Framework**: React 18+
- **State Management**: React Context + useReducer
- **Routing**: React Router
- **HTTP Client**: Fetch API or Axios
- **Storage**: localStorage (장바구니, 테이블 인증 정보)
- **Styling**: CSS Modules or Styled Components
- **Build Tool**: Vite or Create React App

### Input/Output
**Inputs**:
- API responses from Backend unit
- User interactions (클릭, 터치, 입력)
- localStorage 데이터 (테이블 인증, 장바구니)

**Outputs**:
- API requests to Backend unit
  - POST /api/tables/login
  - GET /api/menus
  - POST /api/orders
  - GET /api/orders
- localStorage 데이터 저장
- UI 렌더링

### Directory Structure
```
frontend/customer/
├── src/
│   ├── features/
│   │   ├── menu/
│   │   ├── cart/
│   │   ├── order/
│   │   └── auth/
│   ├── hooks/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
└── vite.config.js
```

### Dependencies
**Depends On**:
- Backend unit (REST API)
- Shared unit (공통 컴포넌트, 타입 정의, 유틸리티)

**Depended By**:
- None (최종 사용자 인터페이스)

---

## Unit 2: Admin Frontend

### Basic Information
- **Name**: Admin Frontend
- **Type**: Frontend Application
- **Purpose**: 관리자용 웹 인터페이스

### Responsibilities
- 관리자 인증 및 세션 관리 (16시간)
- 실시간 주문 모니터링 (SSE 연결)
- 주문 상태 관리 및 삭제
- 테이블 세션 관리 (이용 완료 처리, 과거 내역 조회)
- 메뉴 CRUD 관리
- 테이블 태블릿 초기 설정

### Components Included
**From Frontend Components (Section 1.2 in components.md)**:
- Auth Feature Module (4 components)
  - LoginPage
  - LoginForm
  - AuthProvider
  - PrivateRoute
- Dashboard Feature Module (7 components)
  - DashboardPage
  - TableGrid
  - TableCard
  - OrderPreview
  - OrderDetailModal
  - OrderStatusButton
  - SSEConnection
- Table Management Feature Module (6 components)
  - TableManagementPage
  - TableSetupModal
  - OrderDeleteButton
  - CompleteSessionButton
  - HistoryModal
  - HistoryFilter
- Menu Management Feature Module (5 components)
  - MenuManagementPage
  - MenuForm
  - MenuList
  - MenuItemCard
  - DeleteConfirmModal

**Shared Components** (from Shared unit):
- Layout Components (Header, Footer, Sidebar, NavBar)
- UI Components (Button, Modal, Input, Select, Card, Badge, Spinner)

**Total Components**: ~22 unique + shared components

### Technology Stack
- **Framework**: React 18+
- **State Management**: React Context + useReducer
- **Routing**: React Router
- **HTTP Client**: Fetch API or Axios
- **Real-time**: EventSource API (SSE)
- **Storage**: localStorage (JWT 토큰)
- **Styling**: CSS Modules or Styled Components
- **Build Tool**: Vite or Create React App

### Input/Output
**Inputs**:
- API responses from Backend unit
- SSE events from Backend unit (실시간 주문 알림)
- User interactions (로그인, 주문 관리, 메뉴 관리)
- localStorage 데이터 (JWT 토큰)

**Outputs**:
- API requests to Backend unit
  - POST /api/auth/login
  - GET /api/auth/me
  - GET /api/menus
  - POST /api/menus
  - PUT /api/menus/:id
  - DELETE /api/menus/:id
  - PATCH /api/orders/:id/status
  - DELETE /api/orders/:id
  - POST /api/tables/setup
  - POST /api/tables/:id/complete
  - GET /api/tables/:id/history
- SSE connection to /api/sse/orders
- localStorage 데이터 저장 (JWT)
- UI 렌더링

### Directory Structure
```
frontend/admin/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── table-management/
│   │   └── menu-management/
│   ├── hooks/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
└── vite.config.js
```

### Dependencies
**Depends On**:
- Backend unit (REST API + SSE)
- Shared unit (공통 컴포넌트, 타입 정의, 유틸리티)

**Depended By**:
- None (최종 사용자 인터페이스)

---

## Unit 3: Backend

### Basic Information
- **Name**: Backend
- **Type**: Backend Application
- **Purpose**: 비즈니스 로직 및 API 제공

### Responsibilities
- REST API 엔드포인트 제공 (~15 endpoints)
- Server-Sent Events (SSE) 실시간 통신
- 비즈니스 로직 실행 (주문, 메뉴, 테이블, 인증)
- 데이터 검증 및 에러 처리
- JWT 인증 및 세션 관리
- Database unit과 통신

### Components Included
**From Backend Components (Section 2 in components.md)**:
- Controllers (5)
  - MenuController
  - OrderController
  - TableController
  - AuthController
  - SSEController
- Services (5)
  - MenuService
  - OrderService
  - TableService
  - AuthService
  - NotificationService
- Repositories (4)
  - MenuRepository
  - OrderRepository
  - TableRepository
  - UserRepository
- Domain Models (5)
  - Menu Model
  - Order Model
  - Table Model
  - User Model
  - Session Model

**Total Components**: 19 backend components

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Architecture**: Layered (Controllers → Services → Repositories)
- **Query Builder**: Knex.js
- **Database Driver**: pg (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Real-time**: Server-Sent Events (SSE)
- **Deployment**: AWS EC2 or ECS

### Input/Output
**Inputs**:
- HTTP requests from Customer Frontend unit
- HTTP requests from Admin Frontend unit
- SSE connections from Admin Frontend unit
- Database query results from Database unit

**Outputs**:
- HTTP responses (JSON)
- SSE events (실시간 주문 알림)
- Database queries to Database unit (via Knex.js)

### API Endpoints
**Menu Endpoints**:
- GET /api/menus
- GET /api/menus/:id
- POST /api/menus (관리자 전용)
- PUT /api/menus/:id (관리자 전용)
- DELETE /api/menus/:id (관리자 전용)

**Order Endpoints**:
- POST /api/orders
- GET /api/orders
- GET /api/orders/:id
- PATCH /api/orders/:id/status (관리자 전용)
- DELETE /api/orders/:id (관리자 전용)

**Table Endpoints**:
- POST /api/tables/login
- GET /api/tables (관리자 전용)
- POST /api/tables/setup (관리자 전용)
- POST /api/tables/:id/complete (관리자 전용)
- GET /api/tables/:id/history (관리자 전용)

**Auth Endpoints**:
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

**SSE Endpoints**:
- GET /api/sse/orders (관리자 전용)

### Directory Structure
```
backend/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── middleware/
│   │   └── auth.js
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   └── index.js
│   ├── app.js
│   └── server.js
├── tests/
├── package.json
└── knexfile.js
```

### Dependencies
**Depends On**:
- Database unit (데이터 접근)
- Shared unit (타입 정의, 유틸리티)

**Depended By**:
- Customer Frontend unit
- Admin Frontend unit

---

## Unit 4: Database

### Basic Information
- **Name**: Database
- **Type**: Database Schema
- **Purpose**: 데이터 저장 및 스키마 관리

### Responsibilities
- 데이터베이스 스키마 정의
- 마이그레이션 관리
- 시드 데이터 제공 (초기 데이터)
- 인덱스 및 제약조건 관리

### Components Included
**From Database Components (Section 3 in components.md)**:
- Database Tables (8)
  - stores
  - tables
  - menus
  - categories
  - orders
  - order_items
  - users
  - sessions

**Total Components**: 8 tables

### Technology Stack
- **Database**: PostgreSQL 14+
- **Migration Tool**: Knex.js migrations
- **Hosting**: AWS RDS (PostgreSQL)

### Schema Summary
**stores**:
- id (PK), name, store_id, created_at, updated_at

**tables**:
- id (PK), store_id (FK), table_number, password (hashed), created_at, updated_at

**categories**:
- id (PK), store_id (FK), name, display_order, created_at, updated_at

**menus**:
- id (PK), store_id (FK), category_id (FK), name, description, price, image_url, display_order, is_available, created_at, updated_at

**orders**:
- id (PK), store_id (FK), table_id (FK), session_id (FK), order_number, total_amount, status, created_at, updated_at

**order_items**:
- id (PK), order_id (FK), menu_id (FK), menu_name, quantity, unit_price, subtotal, created_at

**users**:
- id (PK), store_id (FK), username, password_hash, role, created_at, updated_at

**sessions**:
- id (PK), table_id (FK), session_token, started_at, completed_at, is_active, created_at, updated_at

### Input/Output
**Inputs**:
- SQL queries from Backend unit (via Knex.js)
- Migration scripts
- Seed data scripts

**Outputs**:
- Query results (SELECT)
- Affected rows (INSERT, UPDATE, DELETE)

### Directory Structure
```
database/
├── migrations/
│   ├── 001_create_stores.js
│   ├── 002_create_tables.js
│   ├── 003_create_categories.js
│   ├── 004_create_menus.js
│   ├── 005_create_orders.js
│   ├── 006_create_order_items.js
│   ├── 007_create_users.js
│   └── 008_create_sessions.js
├── seeds/
│   ├── 001_stores.js
│   ├── 002_categories.js
│   └── 003_users.js
└── README.md
```

### Dependencies
**Depends On**:
- None (최하위 레이어)

**Depended By**:
- Backend unit

---

## Unit 5: Shared

### Basic Information
- **Name**: Shared
- **Type**: Shared Library
- **Purpose**: Frontend units 간 공유 코드 제공

### Responsibilities
- 공통 UI 컴포넌트 제공
- 공통 타입 정의 (TypeScript interfaces)
- 공통 유틸리티 함수
- 공통 상수 정의
- API 클라이언트 유틸리티

### Components Included
**From Shared Components (Section 1.3 in components.md)**:
- Layout Components (4)
  - Header
  - Footer
  - Sidebar
  - NavBar
- UI Components (7)
  - Button
  - Modal
  - Input
  - Select
  - Card
  - Badge
  - Spinner

**Additional Shared Assets**:
- TypeScript types/interfaces
- API client utilities
- Constants (API_BASE_URL, STATUS_CODES, etc.)
- Utility functions (formatCurrency, formatDate, etc.)

**Total Components**: ~11 components + utilities

### Technology Stack
- **Language**: JavaScript/TypeScript
- **Build Tool**: Vite (library mode) or Rollup
- **Package Manager**: npm or yarn

### Input/Output
**Inputs**:
- Props from Customer Frontend and Admin Frontend components

**Outputs**:
- Rendered UI components
- Exported types, utilities, constants

### Directory Structure
```
shared/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── NavBar.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Modal.jsx
│   │       ├── Input.jsx
│   │       ├── Select.jsx
│   │       ├── Card.jsx
│   │       ├── Badge.jsx
│   │       └── Spinner.jsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── index.js
│   ├── constants/
│   │   └── index.js
│   └── index.js
├── package.json
└── vite.config.js
```

### Dependencies
**Depends On**:
- None (독립적인 라이브러리)

**Depended By**:
- Customer Frontend unit
- Admin Frontend unit
- Backend unit (타입 정의만)

---

## Unit Summary

| Unit | Type | Components | Tech Stack | Dependencies |
|------|------|-----------|-----------|--------------|
| Customer Frontend | Frontend | ~17 unique + shared | React, Context API, Vite | Backend, Shared |
| Admin Frontend | Frontend | ~22 unique + shared | React, Context API, SSE, Vite | Backend, Shared |
| Backend | Backend | 19 (5+5+4+5) | Express, Knex.js, JWT, bcrypt | Database, Shared |
| Database | Database | 8 tables | PostgreSQL, Knex migrations | None |
| Shared | Shared Library | ~11 + utilities | React, TypeScript | None |

**Total Units**: 5
**Total Components**: ~67+ (across all units)

---

## Development Strategy

### Development Order
**All parallel** (Q4 답변) - 모든 units을 동시에 시작하여 최대 병렬성 확보

**Recommended Sequence** (병렬 개발 가능):
1. **Week 1**: 
   - Shared unit 기본 컴포넌트 개발
   - Database unit 스키마 및 migrations 생성
   - Backend unit API 계약(스펙) 정의
2. **Week 2**: 
   - Backend unit 구현 (API endpoints, services)
   - Customer Frontend unit 구현 (메뉴, 장바구니, 주문)
   - Admin Frontend unit 구현 (로그인, 대시보드)
3. **Week 3**: 
   - 통합 테스트 및 버그 수정
   - SSE 실시간 기능 통합
   - 배포 준비

### Deployment Model
**Separate Deployments** (Q6 답변) - 각 unit을 독립적으로 배포

**Deployment Targets**:
- **Customer Frontend**: AWS S3 + CloudFront (정적 호스팅)
- **Admin Frontend**: AWS S3 + CloudFront (정적 호스팅)
- **Backend**: AWS EC2 or ECS (Express 서버)
- **Database**: AWS RDS (PostgreSQL)
- **Shared**: npm package (private registry or monorepo)

### Integration Strategy
- **API Contract First**: Backend unit이 API 스펙을 먼저 정의하여 Frontend units가 mock 데이터로 개발 가능
- **Shared Components Early**: Shared unit의 기본 컴포넌트를 먼저 개발하여 Frontend units가 즉시 사용 가능
- **Database First**: Database unit의 스키마를 먼저 정의하여 Backend unit이 Repository 레이어 개발 가능

---

## Code Organization

### Directory Structure (Workspace Root)
```
/home/ec2-user/environment/aidlc-table-order/
├── frontend/
│   ├── customer/        # Unit 1: Customer Frontend
│   └── admin/           # Unit 2: Admin Frontend
├── backend/             # Unit 3: Backend
├── database/            # Unit 4: Database
├── shared/              # Unit 5: Shared
└── aidlc-docs/          # Documentation only
```

**Note**: 이 구조는 Q7 답변 (Simple structure with subdirectories)과 CQ3 답변 (Subdirectories under frontend/)을 반영합니다.

---

## Validation Checklist

### Completeness
- [x] 모든 컴포넌트가 unit에 할당됨 (~67+ components)
- [x] 모든 user stories가 unit에 매핑 가능 (11 stories)
- [x] 모든 기능 요구사항이 unit에 커버됨 (FR-1.1 ~ FR-2.4)

### Consistency
- [x] Unit boundaries가 명확함
- [x] 순환 의존성 없음 (Shared → None, Database → None, Backend → Database+Shared, Frontends → Backend+Shared)
- [x] 병렬 개발 가능 (All parallel)
- [x] 독립 배포 가능 (Separate deployments)

### Traceability
- [x] Requirements → Stories → Components → Units 연결 완료
- [x] 각 unit의 책임이 명확히 정의됨
- [x] 각 unit의 입출력이 명확히 정의됨
