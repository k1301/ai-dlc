# Components

## Architecture Overview

테이블오더 서비스는 **Layered Architecture** (3-tier)를 따릅니다:
- **Presentation Layer**: React Frontend (고객용 + 관리자용)
- **Service Layer**: Express Backend (Business Logic)
- **Data Access Layer**: PostgreSQL Database (Knex.js Query Builder)

---

## 1. Frontend Components (Presentation Layer)

### 1.1 Customer App (고객용 애플리케이션)

#### 1.1.1 Menu Feature Module
**Purpose**: 메뉴 조회 및 탐색 기능

**Responsibilities**:
- 카테고리별 메뉴 목록 표시
- 메뉴 상세 정보 표시 (이미지, 가격, 설명)
- 카테고리 간 네비게이션
- 터치 친화적 UI 제공

**Components**:
- `MenuPage`: 메뉴 페이지 컨테이너
- `CategoryTabs`: 카테고리 탭 네비게이션
- `MenuGrid`: 메뉴 카드 그리드
- `MenuCard`: 개별 메뉴 카드
- `MenuDetail`: 메뉴 상세 모달

#### 1.1.2 Cart Feature Module
**Purpose**: 장바구니 관리 기능

**Responsibilities**:
- 장바구니에 메뉴 추가/삭제
- 수량 조절 (증가/감소)
- 총 금액 실시간 계산
- 로컬 스토리지에 장바구니 저장 (새로고침 대응)

**Components**:
- `CartButton`: 장바구니 바로가기 버튼 (배지 표시)
- `CartPage`: 장바구니 페이지
- `CartItemList`: 장바구니 항목 목록
- `CartItem`: 개별 장바구니 항목
- `CartSummary`: 총 금액 요약

#### 1.1.3 Order Feature Module
**Purpose**: 주문 생성 및 조회 기능

**Responsibilities**:
- 주문 확정 및 서버 전송
- 주문 성공/실패 피드백
- 주문 내역 조회 (현재 세션)
- 주문 상태 표시

**Components**:
- `OrderConfirmModal`: 주문 확인 모달
- `OrderSuccessModal`: 주문 성공 모달 (주문 번호 표시)
- `OrderHistoryPage`: 주문 내역 페이지
- `OrderList`: 주문 목록
- `OrderCard`: 개별 주문 카드

#### 1.1.4 Auto-Login Module
**Purpose**: 테이블 자동 로그인 및 세션 관리

**Responsibilities**:
- 로컬 스토리지에서 테이블 인증 정보 로드
- 자동 로그인 및 세션 유지
- 세션 만료 처리

**Components**:
- `AutoLoginProvider`: 자동 로그인 컨텍스트 제공자
- `TableSessionManager`: 세션 관리 유틸리티

---

### 1.2 Admin App (관리자용 애플리케이션)

#### 1.2.1 Auth Feature Module
**Purpose**: 관리자 인증

**Responsibilities**:
- 로그인 폼 제공
- JWT 토큰 저장 및 관리
- 인증 상태 관리 (16시간 세션)
- 로그아웃 처리

**Components**:
- `LoginPage`: 로그인 페이지
- `LoginForm`: 로그인 폼
- `AuthProvider`: 인증 컨텍스트 제공자
- `PrivateRoute`: 인증 필요 라우트 보호

#### 1.2.2 Dashboard Feature Module
**Purpose**: 실시간 주문 모니터링

**Responsibilities**:
- SSE로 실시간 주문 수신
- 테이블별 주문 그리드 표시
- 테이블별 총 주문액 표시
- 신규 주문 시각적 강조
- 주문 상세 보기
- 주문 상태 변경

**Components**:
- `DashboardPage`: 대시보드 페이지
- `TableGrid`: 테이블 그리드 레이아웃
- `TableCard`: 개별 테이블 카드
- `OrderPreview`: 주문 미리보기 (최신 n개)
- `OrderDetailModal`: 주문 상세 모달
- `OrderStatusButton`: 주문 상태 변경 버튼
- `SSEConnection`: SSE 연결 관리 훅

#### 1.2.3 Table Management Feature Module
**Purpose**: 테이블 및 세션 관리

**Responsibilities**:
- 테이블 태블릿 초기 설정
- 주문 삭제
- 테이블 이용 완료 처리
- 과거 주문 내역 조회

**Components**:
- `TableManagementPage`: 테이블 관리 페이지
- `TableSetupModal`: 초기 설정 모달
- `OrderDeleteButton`: 주문 삭제 버튼 (확인 팝업)
- `CompleteSessionButton`: 세션 종료 버튼
- `HistoryModal`: 과거 주문 내역 모달
- `HistoryFilter`: 날짜 필터

#### 1.2.4 Menu Management Feature Module
**Purpose**: 메뉴 관리

**Responsibilities**:
- 메뉴 CRUD (생성, 조회, 수정, 삭제)
- 카테고리별 메뉴 조회
- 메뉴 노출 순서 조정
- 필드 검증

**Components**:
- `MenuManagementPage`: 메뉴 관리 페이지
- `MenuForm`: 메뉴 등록/수정 폼
- `MenuList`: 메뉴 목록
- `MenuItemCard`: 메뉴 항목 카드
- `DeleteConfirmModal`: 삭제 확인 모달

---

### 1.3 Shared Components (공통 컴포넌트)

#### 1.3.1 Layout Components
- `Header`: 헤더 (타이틀, 네비게이션)
- `Footer`: 푸터
- `Sidebar`: 사이드바 (관리자용)
- `NavBar`: 네비게이션 바

#### 1.3.2 UI Components
- `Button`: 공통 버튼
- `Modal`: 공통 모달
- `Input`: 공통 입력 필드
- `Select`: 공통 셀렉트
- `Card`: 공통 카드
- `Badge`: 배지 (알림 수)
- `Spinner`: 로딩 스피너

---

## 2. Backend Components (Service Layer)

### 2.1 Controllers (API Endpoints)

#### 2.1.1 MenuController
**Purpose**: 메뉴 관련 API 엔드포인트

**Responsibilities**:
- HTTP 요청 수신 및 응답 반환
- 요청 검증 (validation)
- MenuService 호출
- 에러 핸들링

**Endpoints**:
- `GET /api/menus` - 메뉴 목록 조회
- `GET /api/menus/:id` - 메뉴 상세 조회
- `POST /api/menus` - 메뉴 생성 (관리자 전용)
- `PUT /api/menus/:id` - 메뉴 수정 (관리자 전용)
- `DELETE /api/menus/:id` - 메뉴 삭제 (관리자 전용)

#### 2.1.2 OrderController
**Purpose**: 주문 관련 API 엔드포인트

**Responsibilities**:
- HTTP 요청 수신 및 응답 반환
- 요청 검증
- OrderService 호출
- 에러 핸들링

**Endpoints**:
- `POST /api/orders` - 주문 생성
- `GET /api/orders` - 주문 목록 조회 (세션 ID 기준)
- `GET /api/orders/:id` - 주문 상세 조회
- `PATCH /api/orders/:id/status` - 주문 상태 변경 (관리자 전용)
- `DELETE /api/orders/:id` - 주문 삭제 (관리자 전용)

#### 2.1.3 TableController
**Purpose**: 테이블 관련 API 엔드포인트

**Responsibilities**:
- HTTP 요청 수신 및 응답 반환
- 요청 검증
- TableService 호출
- 에러 핸들링

**Endpoints**:
- `POST /api/tables/login` - 테이블 로그인
- `GET /api/tables` - 테이블 목록 조회 (관리자 전용)
- `POST /api/tables/setup` - 테이블 초기 설정 (관리자 전용)
- `POST /api/tables/:id/complete` - 테이블 세션 종료 (관리자 전용)
- `GET /api/tables/:id/history` - 과거 주문 내역 조회 (관리자 전용)

#### 2.1.4 AuthController
**Purpose**: 인증 관련 API 엔드포인트

**Responsibilities**:
- HTTP 요청 수신 및 응답 반환
- 요청 검증
- AuthService 호출
- JWT 토큰 발급
- 에러 핸들링

**Endpoints**:
- `POST /api/auth/login` - 관리자 로그인
- `POST /api/auth/logout` - 관리자 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보 조회

#### 2.1.5 SSEController
**Purpose**: Server-Sent Events 엔드포인트

**Responsibilities**:
- SSE 연결 수립 및 유지
- 클라이언트에 실시간 이벤트 전송
- 연결 관리 (heartbeat, reconnection)

**Endpoints**:
- `GET /api/sse/orders` - 주문 실시간 스트림 (관리자 전용)

---

### 2.2 Services (Business Logic)

#### 2.2.1 MenuService
**Purpose**: 메뉴 비즈니스 로직

**Responsibilities**:
- 메뉴 CRUD 비즈니스 로직
- 메뉴 검증 (필수 필드, 가격 범위)
- 카테고리별 메뉴 조회
- 메뉴 순서 조정

#### 2.2.2 OrderService
**Purpose**: 주문 비즈니스 로직

**Responsibilities**:
- 주문 생성 로직 (재고 확인, 가격 계산)
- 주문 상태 변경 로직
- 주문 조회 로직 (세션 필터링)
- 주문 삭제 로직

#### 2.2.3 TableService
**Purpose**: 테이블 및 세션 비즈니스 로직

**Responsibilities**:
- 테이블 로그인 검증
- 세션 생성 및 관리
- 테이블 세션 종료 로직
- 과거 주문 조회 로직

#### 2.2.4 AuthService
**Purpose**: 인증 비즈니스 로직

**Responsibilities**:
- 로그인 검증 (비밀번호 bcrypt 비교)
- JWT 토큰 생성 및 검증
- 세션 관리 (16시간)
- 로그인 시도 제한

#### 2.2.5 NotificationService
**Purpose**: 실시간 알림 비즈니스 로직

**Responsibilities**:
- SSE 클라이언트 관리
- 주문 생성 시 모든 연결된 클라이언트에 알림
- 주문 상태 변경 시 알림
- 연결 유지 (heartbeat)

---

### 2.3 Repositories (Data Access)

#### 2.3.1 MenuRepository
**Purpose**: 메뉴 데이터 접근

**Responsibilities**:
- 메뉴 CRUD 쿼리
- 카테고리별 메뉴 조회
- 메뉴 검색 및 필터링

#### 2.3.2 OrderRepository
**Purpose**: 주문 데이터 접근

**Responsibilities**:
- 주문 CRUD 쿼리
- 주문 항목 CRUD 쿼리
- 세션별 주문 조회
- 테이블별 주문 조회

#### 2.3.3 TableRepository
**Purpose**: 테이블 데이터 접근

**Responsibilities**:
- 테이블 CRUD 쿼리
- 세션 CRUD 쿼리
- 과거 주문 조회

#### 2.3.4 UserRepository
**Purpose**: 사용자(관리자) 데이터 접근

**Responsibilities**:
- 사용자 CRUD 쿼리
- 사용자 인증 정보 조회
- 비밀번호 해시 저장/조회

---

### 2.4 Models (Domain Models with Business Logic)

#### 2.4.1 Menu Model
**Purpose**: 메뉴 도메인 모델

**Responsibilities**:
- 메뉴 엔티티 표현
- 메뉴 검증 로직
- 가격 계산 로직

#### 2.4.2 Order Model
**Purpose**: 주문 도메인 모델

**Responsibilities**:
- 주문 엔티티 표현
- 주문 총액 계산 로직
- 주문 상태 변경 로직
- 주문 검증 로직

#### 2.4.3 Table Model
**Purpose**: 테이블 도메인 모델

**Responsibilities**:
- 테이블 엔티티 표현
- 세션 관리 로직
- 테이블 상태 관리

#### 2.4.4 User Model
**Purpose**: 사용자(관리자) 도메인 모델

**Responsibilities**:
- 사용자 엔티티 표현
- 비밀번호 검증 로직
- 인증 토큰 관리

#### 2.4.5 Session Model
**Purpose**: 세션 도메인 모델

**Responsibilities**:
- 세션 엔티티 표현
- 세션 만료 확인 로직
- 세션 유효성 검증

---

## 3. Database Components (Data Access Layer)

### 3.1 Database Schema Entities

#### 3.1.1 stores
**Purpose**: 매장 정보 저장

**Columns**:
- id (PK)
- name
- store_id (unique identifier)
- created_at
- updated_at

#### 3.1.2 tables
**Purpose**: 테이블 정보 저장

**Columns**:
- id (PK)
- store_id (FK → stores)
- table_number
- password (hashed)
- created_at
- updated_at

#### 3.1.3 menus
**Purpose**: 메뉴 정보 저장

**Columns**:
- id (PK)
- store_id (FK → stores)
- category_id (FK → categories)
- name
- description
- price
- image_url
- display_order
- is_available
- created_at
- updated_at

#### 3.1.4 categories
**Purpose**: 메뉴 카테고리 저장

**Columns**:
- id (PK)
- store_id (FK → stores)
- name
- display_order
- created_at
- updated_at

#### 3.1.5 orders
**Purpose**: 주문 정보 저장

**Columns**:
- id (PK)
- store_id (FK → stores)
- table_id (FK → tables)
- session_id (FK → sessions)
- order_number
- total_amount
- status (pending/preparing/completed)
- created_at
- updated_at

#### 3.1.6 order_items
**Purpose**: 주문 항목 저장

**Columns**:
- id (PK)
- order_id (FK → orders)
- menu_id (FK → menus)
- menu_name (snapshot)
- quantity
- unit_price (snapshot)
- subtotal
- created_at

#### 3.1.7 users
**Purpose**: 관리자 사용자 정보 저장

**Columns**:
- id (PK)
- store_id (FK → stores)
- username
- password_hash
- role (admin/manager)
- created_at
- updated_at

#### 3.1.8 sessions
**Purpose**: 테이블 세션 정보 저장

**Columns**:
- id (PK)
- table_id (FK → tables)
- session_token (unique)
- started_at
- completed_at (nullable)
- is_active
- created_at
- updated_at

---

## Component Count Summary

- **Frontend Components**: ~40+ (Customer App + Admin App + Shared)
- **Backend Controllers**: 5
- **Backend Services**: 5
- **Backend Repositories**: 4
- **Domain Models**: 5
- **Database Tables**: 8

**Total Components**: ~67+
