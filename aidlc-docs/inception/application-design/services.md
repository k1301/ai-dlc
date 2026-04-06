# Services Layer Design

## Service Layer Overview

Service Layer는 비즈니스 로직을 캡슐화하고, Controller와 Data Access Layer 사이의 중재자 역할을 합니다.

**Key Principles**:
- 각 서비스는 단일 도메인 영역에 집중
- 트랜잭션 경계 관리
- 도메인 모델과 협업하여 비즈니스 규칙 적용
- Repository를 통해 데이터 접근

---

## 1. MenuService

### Purpose
메뉴 관리 비즈니스 로직 처리

### Responsibilities
- 메뉴 생성, 수정, 삭제 비즈니스 규칙 적용
- 메뉴 검증 (필수 필드, 가격 범위, 중복 확인)
- 카테고리별 메뉴 조회 로직
- 메뉴 노출 순서 관리
- 메뉴 가용성 관리

### Key Operations
- `createMenu(menuData)` - 새 메뉴 생성
- `updateMenu(menuId, menuData)` - 메뉴 정보 수정
- `deleteMenu(menuId)` - 메뉴 삭제
- `getMenusByCategory(categoryId)` - 카테고리별 메뉴 조회
- `getAllMenus(storeId)` - 매장의 전체 메뉴 조회
- `updateMenuOrder(menuIds, displayOrders)` - 메뉴 순서 변경

### Collaborators
- **MenuRepository**: 데이터 접근
- **Menu Model**: 도메인 로직 실행
- **CategoryRepository**: 카테고리 검증

---

## 2. OrderService

### Purpose
주문 생성 및 관리 비즈니스 로직 처리

### Responsibilities
- 주문 생성 로직 (총액 계산, 유효성 검증)
- 주문 상태 변경 로직 (상태 전이 규칙 적용)
- 주문 조회 로직 (세션 필터링, 권한 확인)
- 주문 삭제 로직 (권한 확인, cascade 처리)
- NotificationService와 협업하여 실시간 알림

### Key Operations
- `createOrder(orderData)` - 주문 생성
- `getOrders(sessionId, filters)` - 주문 목록 조회
- `getOrderById(orderId)` - 주문 상세 조회
- `updateOrderStatus(orderId, newStatus)` - 주문 상태 변경
- `deleteOrder(orderId)` - 주문 삭제
- `calculateTotal(orderItems)` - 주문 총액 계산

### Collaborators
- **OrderRepository**: 데이터 접근
- **Order Model**: 도메인 로직 실행
- **MenuRepository**: 메뉴 정보 조회 (가격 검증)
- **NotificationService**: 주문 생성/변경 시 실시간 알림

---

## 3. TableService

### Purpose
테이블 및 세션 관리 비즈니스 로직 처리

### Responsibilities
- 테이블 로그인 검증 (비밀번호 확인)
- 세션 생성 및 관리 (세션 토큰 발급)
- 테이블 세션 종료 처리 (주문 이력 이동)
- 과거 주문 내역 조회
- 테이블 초기 설정

### Key Operations
- `loginTable(storeId, tableNumber, password)` - 테이블 로그인
- `setupTable(storeId, tableNumber, password)` - 테이블 초기 설정
- `createSession(tableId)` - 새 세션 생성
- `completeSession(tableId, sessionId)` - 세션 종료
- `getSessionHistory(tableId, dateFilter)` - 과거 세션 조회
- `getCurrentSession(tableId)` - 현재 활성 세션 조회

### Collaborators
- **TableRepository**: 데이터 접근
- **SessionRepository**: 세션 데이터 접근
- **Table Model**: 도메인 로직 실행
- **Session Model**: 세션 도메인 로직 실행
- **OrderRepository**: 주문 이력 조회

---

## 4. AuthService

### Purpose
관리자 인증 및 세션 관리 비즈니스 로직 처리

### Responsibilities
- 로그인 검증 (사용자명/비밀번호 확인, bcrypt 비교)
- JWT 토큰 생성 (16시간 유효기간)
- JWT 토큰 검증 및 파싱
- 로그인 시도 제한 (rate limiting)
- 세션 관리

### Key Operations
- `login(storeId, username, password)` - 관리자 로그인
- `logout(userId)` - 관리자 로그아웃
- `generateToken(user)` - JWT 토큰 생성
- `verifyToken(token)` - JWT 토큰 검증
- `getCurrentUser(token)` - 토큰에서 사용자 정보 추출
- `checkLoginAttempts(username)` - 로그인 시도 횟수 확인

### Collaborators
- **UserRepository**: 사용자 데이터 접근
- **User Model**: 도메인 로직 실행
- **JWT Library**: 토큰 생성/검증

---

## 5. NotificationService

### Purpose
실시간 알림 (Server-Sent Events) 관리

### Responsibilities
- SSE 클라이언트 연결 관리
- 새 주문 발생 시 모든 연결된 관리자 클라이언트에 알림
- 주문 상태 변경 시 알림
- Heartbeat 전송 (연결 유지)
- 연결 종료 및 재연결 처리

### Key Operations
- `addClient(clientId, response)` - 새 SSE 클라이언트 추가
- `removeClient(clientId)` - SSE 클라이언트 제거
- `notifyNewOrder(order)` - 새 주문 알림 전송
- `notifyOrderStatusChange(order)` - 주문 상태 변경 알림
- `sendHeartbeat()` - 모든 클라이언트에 heartbeat 전송
- `getConnectedClients()` - 현재 연결된 클라이언트 수 조회

### Collaborators
- **SSEController**: SSE 연결 수립
- **OrderService**: 주문 이벤트 수신

---

## Service Orchestration Pattern

### Controller → Service → Repository → Database

**Example Flow: 주문 생성**

1. **OrderController** receives `POST /api/orders` request
2. **OrderController** validates request data
3. **OrderController** calls `OrderService.createOrder(orderData)`
4. **OrderService**:
   - Validates business rules (menu availability, quantity > 0)
   - Calculates total amount via `Order Model`
   - Calls `OrderRepository.create(order)`
5. **OrderRepository**: Executes INSERT query via Knex.js
6. **OrderService**: Calls `NotificationService.notifyNewOrder(order)`
7. **NotificationService**: Sends SSE event to all admin clients
8. **OrderService**: Returns created order to Controller
9. **OrderController**: Returns HTTP 201 response

### Service-to-Service Communication

Services may call other services when needed:
- **OrderService** → **NotificationService**: Order events
- **OrderService** → **MenuService**: Menu validation
- **TableService** → **OrderService**: Session-related order queries

**Note**: Avoid circular dependencies. Use events or mediator pattern if needed.

---

## Transaction Management

### Transactional Operations

Services handle transactional boundaries:

**Example: Order Creation with Transaction**
```javascript
async createOrder(orderData) {
  // Start transaction
  const trx = await knex.transaction();
  
  try {
    // Insert order
    const order = await OrderRepository.create(orderData, trx);
    
    // Insert order items
    await OrderRepository.createOrderItems(order.id, orderData.items, trx);
    
    // Commit transaction
    await trx.commit();
    
    // Notify (outside transaction)
    await NotificationService.notifyNewOrder(order);
    
    return order;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}
```

---

## Error Handling

### Service Layer Error Strategy

- **Validation Errors**: Throw `ValidationError` (HTTP 400)
- **Not Found**: Throw `NotFoundError` (HTTP 404)
- **Authorization**: Throw `UnauthorizedError` (HTTP 401)
- **Business Logic Errors**: Throw `BusinessLogicError` (HTTP 422)
- **Database Errors**: Catch and throw `DatabaseError` (HTTP 500)

Controllers catch service errors and return appropriate HTTP responses.

---

## Testing Strategy

### Unit Testing Services

- Mock repositories and other service dependencies
- Test business logic in isolation
- Test error handling scenarios
- Test transaction rollback

### Integration Testing Services

- Use test database
- Test service with real repositories
- Verify database state changes
- Test service-to-service interactions

---

## Summary

| Service | Primary Domain | Key Collaborators |
|---------|----------------|-------------------|
| MenuService | 메뉴 관리 | MenuRepository, Menu Model |
| OrderService | 주문 관리 | OrderRepository, Order Model, NotificationService |
| TableService | 테이블 및 세션 관리 | TableRepository, SessionRepository, Table/Session Models |
| AuthService | 인증 및 권한 | UserRepository, User Model, JWT |
| NotificationService | 실시간 알림 | SSEController, OrderService |

**Total Services**: 5
