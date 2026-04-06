# Team Allocation - 2명 팀 구성

## 팀 구성 전략: Frontend/Backend 분리

**선택된 옵션**: Frontend/Backend 분리 전략

**팀 크기**: 2명
**개발 방식**: 병렬 개발 (Parallel development)
**예상 기간**: ~3-4 weeks
**Git 전략**: Feature branching with pull requests

---

## 👥 개발자별 담당 Units

### 개발자 A - Frontend Specialist

**담당 Units**:
- Unit 1: Customer Frontend
- Unit 2: Admin Frontend
- Unit 5: Shared (frontend 부분 - UI 컴포넌트)

**작업량**: ~3 weeks

**주요 책임**:
- Shared UI 컴포넌트 개발 (Button, Modal, Card, Input, Badge, Spinner 등)
- Customer Frontend 5개 stories 구현
- Admin Frontend 6개 stories 구현
- SSE 클라이언트 구현 (Admin)
- 메뉴 조회, 장바구니 관리, 주문 생성, 실시간 대시보드 기능

**Stories**:
- ✅ Story 1: 테이블 자동 로그인 (Critical)
- ✅ Story 2: 메뉴 탐색 및 선택 (Critical)
- ✅ Story 3: 장바구니 관리 (Critical)
- ✅ Story 4: 주문 생성 (Critical)
- ⚠️ Story 5: 주문 내역 조회 (High)
- ✅ Story 6: 관리자 로그인 (Critical)
- ✅ Story 7: 실시간 주문 모니터링 (Critical) - **SSE 구현**
- ✅ Story 8: 주문 상태 관리 (Critical)
- ✅ Story 9: 테이블 세션 관리 (Critical)
- ⚠️ Story 10: 메뉴 관리 (High)
- ⚠️ Story 11: 테이블 초기 설정 (High)

**컴포넌트 수**: ~61 (17 Customer + 22 Admin + 11 Shared + 재사용)

**기술 스택**:
- React 18+
- React Context + useReducer
- React Router
- EventSource API (SSE)
- Vite
- CSS Modules

**디렉토리**:
- `frontend/customer/`
- `frontend/admin/`
- `shared/src/components/`

**Git 브랜치**:
- `feature/shared-components`
- `feature/frontend-customer`
- `feature/frontend-admin`

---

### 개발자 B - Backend Specialist

**담당 Units**:
- Unit 3: Backend
- Unit 4: Database (✅ 이미 완료)
- Unit 5: Shared (types, utils 부분)

**작업량**: ~2.5 weeks (Database 완료됨)

**주요 책임**:
- Backend 15 API endpoints 구현
- JWT 인증 구현
- SSE 서버 구현
- 비즈니스 로직 (Services, Repositories)
- 공통 타입 정의 (TypeScript interfaces)
- Database는 이미 완료 (migrations, seeds, scripts)

**Stories**: 모든 11개 stories 지원 (API 제공)

**컴포넌트 수**: 19 (Backend)

**기술 스택**:
- Node.js 18+
- Express.js
- Knex.js (Query Builder)
- PostgreSQL (✅ Schema 완료)
- JWT (jsonwebtoken)
- bcrypt
- Server-Sent Events

**디렉토리**:
- `backend/`
- `database/` (✅ 완료)
- `shared/src/types/`
- `shared/src/utils/`

**Git 브랜치**:
- `feature/backend`
- `feature/shared-types`

**특별 과제**: SSE 서버 구현 (connection pool, heartbeat, event broadcasting)

---

## 🌳 Git Branching Strategy

### Branch Structure

```
main (production-ready)
  ├── develop (integration branch)
      ├── feature/shared-components (개발자 A)
      ├── feature/shared-types (개발자 B)
      ├── feature/frontend-customer (개발자 A)
      ├── feature/frontend-admin (개발자 A)
      └── feature/backend (개발자 B)
```

### Branch Naming Convention

**Feature Branches**:
- `feature/<unit-name>` - 메인 unit 작업
- `feature/<unit-name>-<story-id>` - 특정 story 작업 (선택)
- `hotfix/<issue-description>` - 긴급 수정

**예시**:
```bash
feature/shared-components
feature/frontend-customer
feature/frontend-customer-story2
feature/backend
feature/shared-types
```

### Workflow

#### 개발자 A (Frontend)

```bash
# 1. Shared 컴포넌트 먼저 시작
git checkout develop
git pull origin develop
git checkout -b feature/shared-components

# 작업 후 commit & push
git add .
git commit -m "feat(shared): Add Button, Modal, Input components"
git push origin feature/shared-components

# PR 생성 → develop으로 merge

# 2. Customer Frontend 시작
git checkout develop
git pull origin develop
git checkout -b feature/frontend-customer

# 작업 후 commit & push
git add .
git commit -m "feat(customer): Implement auto-login and menu page"
git push origin feature/frontend-customer

# PR 생성 → develop으로 merge

# 3. Admin Frontend 시작
git checkout develop
git pull origin develop
git checkout -b feature/frontend-admin

# 작업 후 commit & push
git add .
git commit -m "feat(admin): Implement dashboard and SSE client"
git push origin feature/frontend-admin

# PR 생성 → develop으로 merge
```

#### 개발자 B (Backend)

```bash
# 1. Shared types 먼저 시작
git checkout develop
git pull origin develop
git checkout -b feature/shared-types

# 작업 후 commit & push
git add .
git commit -m "feat(shared): Define API request/response types"
git push origin feature/shared-types

# PR 생성 → develop으로 merge

# 2. Backend 시작
git checkout develop
git pull origin develop
git checkout -b feature/backend

# 작업 후 commit & push
git add .
git commit -m "feat(backend): Implement auth and menu APIs"
git push origin feature/backend

# PR 생성 → develop으로 merge
```

### Pull Request Rules

**PR 생성 시**:
1. **Title**: `[Unit] Description` 형식
   - 예: `[Shared] Add UI components`, `[Backend] Implement auth API`
2. **Description**: 변경 사항 요약, 관련 Story ID
3. **Reviewer**: 최소 1명 (상대방 개발자)
4. **Labels**: `frontend`, `backend`, `shared`, `in-progress`, `ready-for-review`

**Merge 규칙**:
- ✅ 최소 1명 approve 필요
- ✅ 모든 CI checks 통과 필수
- ✅ Conflict 해결 완료
- ✅ 단위 테스트 통과 (if applicable)

**Merge 빈도**:
- **개발자 A**: Weekly merge (금요일) 또는 major milestone 완료 시
- **개발자 B**: Weekly merge (금요일) 또는 API 완료 시
- **Shared**: 변경 시 즉시 merge (다른 unit의 dependency)

### Commit Message Convention

**Format**: `<type>(<scope>): <subject>`

**Types**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `style`: 코드 포맷팅, 세미콜론 추가 등
- `docs`: 문서 수정
- `test`: 테스트 코드 추가
- `chore`: 빌드, 패키지 설정 등

**Scopes**:
- `shared`: Shared unit
- `customer`: Customer Frontend
- `admin`: Admin Frontend
- `backend`: Backend
- `database`: Database

**예시**:
```bash
feat(shared): Add Button and Modal components
fix(customer): Fix cart total calculation bug
refactor(backend): Extract auth middleware
docs(admin): Update SSE integration guide
test(backend): Add order service unit tests
```

---

## 📅 주차별 작업 계획

### Week 1: Foundation (기반 구축)

#### 개발자 A (Frontend)
**Day 1-2**:
- [ ] Git 브랜치 생성 (`feature/shared-components`)
- [ ] Shared 프로젝트 셋업 (Vite library mode)
- [ ] Button, Modal, Input 컴포넌트 구현
- [ ] **PR 생성**: Shared components v0.1.0
- [ ] Customer Frontend 프로젝트 셋업 (`feature/frontend-customer`)

**Day 3-4**:
- [ ] Card, Badge, Spinner 컴포넌트 추가
- [ ] Shared components **PR merge**
- [ ] Customer: 라우팅 구조 설정 (React Router)
- [ ] Customer: AutoLoginProvider 구현 (Context API)
- [ ] Customer: Menu 페이지 기본 구조

**Day 5**:
- [ ] Customer: Mock API 클라이언트 설정
- [ ] Customer: MenuPage 기본 UI
- [ ] Admin Frontend 프로젝트 셋업 (`feature/frontend-admin`)
- [ ] Admin: 라우팅 구조 설정

**Deliverables**:
- ✅ Shared components v0.1.0 (merged to develop)
- ✅ Customer Frontend routing 완료
- ✅ Admin Frontend 프로젝트 셋업

**Git Milestones**:
- `feature/shared-components` → develop (Day 3)
- `feature/frontend-customer` WIP (진행 중)
- `feature/frontend-admin` WIP (진행 중)

---

#### 개발자 B (Backend)
**Day 1**:
- [ ] Git 브랜치 생성 (`feature/shared-types`)
- [ ] Shared types 프로젝트 셋업 (TypeScript)
- [ ] API request/response 타입 정의
- [ ] **PR 생성**: Shared types v0.1.0

**Day 2-3**:
- [ ] Shared types **PR merge**
- [ ] Backend 프로젝트 셋업 (`feature/backend`)
- [ ] Express + Knex 설정
- [ ] Database connection 검증 (이미 완료된 migrations 사용)
- [ ] API 계약 문서 작성 (OpenAPI 3.0)

**Day 4-5**:
- [ ] Mock API endpoints 구현 (json-server 또는 Express with mock data)
- [ ] JWT middleware 기본 구조
- [ ] Repository pattern 기본 구조
- [ ] **협업 체크포인트**: API 계약 리뷰 (개발자 A와)

**Deliverables**:
- ✅ Shared types v0.1.0 (merged to develop)
- ✅ API 계약 문서 완료
- ✅ Mock API endpoints 제공

**Git Milestones**:
- `feature/shared-types` → develop (Day 2)
- `feature/backend` WIP (진행 중)

---

### Week 2: Core Implementation (핵심 기능 구현)

#### 개발자 A (Frontend)
**Day 1-2**:
- [ ] Customer: 메뉴 조회 기능 (Story 2)
  - CategoryTabs, MenuGrid, MenuCard, MenuDetail 모달
  - GET /api/menus API 연동
- [ ] Customer: 장바구니 기능 (Story 3)
  - Cart Context + useReducer, CartPage, localStorage

**Day 3**:
- [ ] Customer: 주문 생성 (Story 4)
  - OrderConfirmModal, POST /api/orders API 연동
  - OrderSuccessModal, 장바구니 초기화
- [ ] **협업 체크포인트**: Backend 통합 (개발자 B와 Mock → Real API 전환)

**Day 4-5**:
- [ ] Admin: LoginPage UI (Shared 컴포넌트 사용)
- [ ] Admin: AuthProvider 구현 (Context API)
- [ ] Admin: SSE 연결 custom hook 설계 (useSSE)
- [ ] Admin: Dashboard 기본 구조

**Deliverables**:
- ✅ Customer Story 2, 3, 4 완료
- ✅ Admin 인증 구조 완료

**Git Milestones**:
- `feature/frontend-customer` 진행 중 (Story 2-4 완료)
- `feature/frontend-admin` 진행 중 (인증 구조 완료)

---

#### 개발자 B (Backend)
**Day 1-2**:
- [ ] Menu API 구현
  - MenuController, MenuService, MenuRepository
  - GET /api/menus, POST /api/menus, PUT /api/menus/:id, DELETE /api/menus/:id
- [ ] Order API 구현 (Part 1)
  - OrderController, OrderService, OrderRepository
  - POST /api/orders, GET /api/orders

**Day 3**:
- [ ] **협업 체크포인트**: Backend 통합 (개발자 A와 Mock → Real API 전환)
- [ ] Order API 구현 (Part 2)
  - PATCH /api/orders/:id/status, DELETE /api/orders/:id
- [ ] Auth API 구현
  - AuthController, AuthService, UserRepository
  - POST /api/auth/login, JWT 토큰 생성

**Day 4-5**:
- [ ] SSE 서버 구현
  - SSEController, NotificationService (connection pool)
  - GET /api/sse/orders
  - Heartbeat (30초마다), Event broadcasting
- [ ] Table API 구현
  - POST /api/tables/login, POST /api/tables/:id/complete
  - GET /api/tables/:id/history

**Deliverables**:
- ✅ Menu, Order, Auth API 완료
- ✅ SSE 서버 기본 구조 완료

**Git Milestones**:
- `feature/backend` 진행 중 (Menu, Order, Auth API 완료)

---

### Week 3: Advanced Features & Integration

#### 개발자 A (Frontend)
**Day 1-2**:
- [ ] Admin: 실시간 대시보드 (Story 7)
  - SSE 연결 구현 (EventSource)
  - TableGrid 실시간 업데이트
  - 신규 주문 강조 (animation)
- [ ] **협업 체크포인트**: SSE 통합 (개발자 B와 SSE 서버 ↔ 클라이언트 테스트)

**Day 3**:
- [ ] Admin: 주문 상태 관리 (Story 8)
  - OrderStatusButton, PATCH /api/orders/:id/status
  - OrderDeleteButton, DELETE /api/orders/:id
- [ ] Admin: 테이블 세션 관리 (Story 9)
  - CompleteSessionButton, HistoryModal

**Day 4-5**:
- [ ] Customer: 주문 내역 조회 (Story 5)
  - OrderHistoryPage, OrderList, OrderCard
- [ ] Admin: 메뉴 관리 (Story 10)
  - MenuManagementPage, MenuForm, MenuList
- [ ] Admin: 테이블 초기 설정 (Story 11)
  - TableSetupModal

**Deliverables**:
- ✅ Customer Story 5 완료
- ✅ Admin Story 7, 8, 9, 10, 11 완료

**Git Milestones**:
- `feature/frontend-customer` → develop (**Week 3 중간 merge**)
- `feature/frontend-admin` 진행 중 (모든 Admin stories 완료)

---

#### 개발자 B (Backend)
**Day 1-2**:
- [ ] **협업 체크포인트**: SSE 통합 (개발자 A와 SSE 서버 ↔ 클라이언트 테스트)
- [ ] SSE 안정성 강화
  - Reconnection 시나리오 테스트
  - Connection pool 최적화
  - Heartbeat 안정성 개선

**Day 3-4**:
- [ ] 성능 최적화
  - Database 인덱스 검증 (이미 migrations에 포함됨)
  - N+1 쿼리 최적화
  - Response time 측정 (< 1초 목표)
- [ ] 에러 처리 강화
  - 통일된 에러 응답 포맷
  - Validation 강화 (express-validator)

**Day 5**:
- [ ] 통합 테스트
  - API E2E 테스트 (Supertest)
  - SSE 통합 테스트
- [ ] Backend 문서화
- [ ] **PR 생성**: Backend 전체 기능 완료

**Deliverables**:
- ✅ SSE 서버 완성 및 안정화
- ✅ Backend 성능 최적화 완료
- ✅ 통합 테스트 완료

**Git Milestones**:
- `feature/backend` → develop (**Week 3 끝 merge**)

---

### Week 4: Polish & Deployment (완성 및 배포)

#### 개발자 A (Frontend)
**Day 1-2**:
- [ ] Customer E2E 테스트 (모든 Customer stories)
- [ ] Admin E2E 테스트 (모든 Admin stories)
- [ ] UX 개선 (애니메이션, 터치 최적화)
- [ ] 성능 최적화 (React.memo, useMemo)

**Day 3-4**:
- [ ] 에러 처리 강화 (모든 API 호출)
- [ ] Loading states 추가 (모든 비동기 작업)
- [ ] SSE 재연결 로직 강화
- [ ] **협업 체크포인트**: Full System Test (개발자 A, B 전체 플로우 검증)

**Day 5**:
- [ ] Frontend 문서화 (Customer, Admin)
- [ ] Shared 문서화
- [ ] **PR merge**: Admin Frontend → develop
- [ ] 배포 준비 (AWS S3 + CloudFront)

**Deliverables**:
- ✅ Customer Frontend 완성 (v1.0.0)
- ✅ Admin Frontend 완성 (v1.0.0)
- ✅ Shared v1.0.0

**Git Milestones**:
- `feature/frontend-admin` → develop (**Week 4 중간 merge**)
- develop → main (**Week 4 끝 merge**)

---

#### 개발자 B (Backend)
**Day 1-2**:
- [ ] 부하 테스트 (10-50 concurrent users)
- [ ] 메모리 leak 검증
- [ ] 로깅 강화 (CloudWatch)

**Day 3-4**:
- [ ] **협업 체크포인트**: Full System Test (개발자 A, B 전체 플로우 검증)
- [ ] NFR 목표 검증
  - Response time < 1초
  - SSE latency < 2초
  - 동시 접속 10-50명
- [ ] 보안 강화 (CORS, rate limiting, input validation)

**Day 5**:
- [ ] API 문서 최종 업데이트 (OpenAPI 3.0)
- [ ] 배포 준비 (AWS EC2/ECS)
- [ ] CI/CD 파이프라인 설정 (GitHub Actions)

**Deliverables**:
- ✅ Backend 완성 및 최적화 (v1.0.0)
- ✅ 배포 준비 완료

**Git Milestones**:
- develop → main (**Week 4 끝 merge**)

---

## 🤝 협업 체크포인트

### Checkpoint 1: API Contract & Shared Types Review (Week 1 끝)
**참석자**: 개발자 A, B
**시간**: 1시간
**목표**:
- API 계약 최종 확인
- Request/Response 타입 검증
- Shared types 확인
- Mock API 사용법 공유

**Git 상태**:
- `feature/shared-components` → develop (merged)
- `feature/shared-types` → develop (merged)

---

### Checkpoint 2: Backend Integration (Week 2 중간)
**참석자**: 개발자 A, B
**시간**: 1시간
**목표**:
- Mock API → 실제 Backend 전환
- API 응답 검증
- CORS 설정 확인
- 에러 처리 확인

**Git 상태**:
- `feature/frontend-customer` 진행 중 (Story 2-4 완료)
- `feature/backend` 진행 중 (Menu, Order API 완료)

---

### Checkpoint 3: SSE Integration (Week 3 초반)
**참석자**: 개발자 A, B
**시간**: 1.5시간
**목표**:
- SSE 서버 ↔ 클라이언트 통합 테스트
- Reconnection 시나리오 테스트
- Heartbeat 동작 확인
- 실시간 업데이트 latency 측정 (< 2초)

**Git 상태**:
- `feature/frontend-admin` 진행 중 (SSE 클라이언트 구현 완료)
- `feature/backend` 진행 중 (SSE 서버 구현 완료)

---

### Checkpoint 4: Full System Test (Week 4 중간)
**참석자**: 개발자 A, B
**시간**: 2시간
**목표**:
- 모든 11 stories E2E 테스트
- Customer → Backend → Admin 전체 플로우 검증
- NFR 목표 달성 확인 (1초 응답, 2초 실시간)
- 버그 목록 작성 및 우선순위 설정

**Git 상태**:
- `feature/frontend-customer` → develop (merged)
- `feature/frontend-admin` → develop (merged)
- `feature/backend` → develop (merged)

---

## 🔄 Daily Standup (15분)

**매일 오전 9:30**

**각 개발자 공유 사항**:
1. 어제 완료한 작업 (+ Git branch/commit 언급)
2. 오늘 계획한 작업
3. Blocker 또는 도움 필요 사항
4. PR 리뷰 요청 사항

**특별 주의사항**:
- API 변경사항 즉시 공유 (Shared types 업데이트 필요 시)
- Shared 컴포넌트 변경 시 알림 (Breaking change 주의)
- PR 리뷰는 24시간 이내 완료
- 의존성 이슈 우선 해결

---

## 📋 Communication Guidelines

### Slack Channels
- `#team-table-order`: 전체 팀 커뮤니케이션
- `#code-review`: PR 리뷰 요청 및 논의
- `#integration`: API, Shared 변경사항 공유
- `#daily-standup`: Daily standup 로그

### PR Review Protocol

**PR 생성자**:
1. Slack `#code-review`에 PR 링크 공유
2. 리뷰 포인트 요약 (특히 주의할 부분)
3. 관련 Story ID 명시

**PR 리뷰어**:
1. 24시간 이내 리뷰 완료
2. 코드 품질, 로직 검증, 테스트 확인
3. 질문이나 제안은 PR comment로
4. Approve 또는 Request Changes

**Merge 담당**:
- PR 생성자가 직접 merge (리뷰 승인 후)
- Conflict 발생 시 생성자가 해결
- Merge 후 Slack 알림

---

## 🎯 Success Criteria

### Week 1 완료 기준
- [x] Database schema 완료 (✅ 이미 완료)
- [ ] Shared 컴포넌트 v0.1.0 사용 가능 (merged to develop)
- [ ] Shared types v0.1.0 사용 가능 (merged to develop)
- [ ] API 계약 문서 완료 및 승인
- [ ] Frontend 2개 프로젝트 셋업 완료
- [ ] Backend 프로젝트 셋업 완료

### Week 2 완료 기준
- [ ] Customer Frontend: Story 1-4 완료
- [ ] Admin Frontend: 인증 구조 완료
- [ ] Backend: Menu, Order, Auth API 완료
- [ ] Mock API → Real API 전환 완료

### Week 3 완료 기준
- [ ] Customer Frontend: Story 5 완료 (all Customer stories done)
- [ ] Admin Frontend: Story 7-9 완료
- [ ] Backend: SSE 서버 완료
- [ ] SSE 클라이언트 ↔ 서버 통합 완료

### Week 4 완료 기준
- [ ] 모든 11 stories 완료
- [ ] E2E 테스트 통과
- [ ] NFR 목표 달성 (1초 응답, 2초 실시간)
- [ ] 배포 준비 완료
- [ ] develop → main merge

---

## ⚠️ Risk Mitigation

### Risk 1: Frontend 작업량이 많아 개발자 A가 병목이 될 수 있음
**완화 전략**:
- Shared 컴포넌트를 Week 1에 먼저 완료하여 재사용 최대화
- Customer Frontend를 Admin보다 먼저 완료 (우선순위 높음)
- 개발자 B가 Week 3에 Frontend 테스트 지원 가능

### Risk 2: SSE 구현 복잡도
**완화 전략**:
- Week 1에 개발자 A, B가 SSE 설계 협의
- native EventSource 사용 (socket.io 대신)
- Week 3 초반에 충분한 통합 테스트 시간 확보
- Checkpoint 3에서 집중 검증

### Risk 3: Shared 컴포넌트/타입 변경 시 블로킹
**완화 전략**:
- Semantic versioning 엄격히 준수
- Breaking change는 주간 단위로만 허용 (금요일 merge)
- 변경 시 Slack `#integration` 채널에 즉시 공유
- Shared 변경은 가급적 Week 1에 집중

### Risk 4: Git Conflict
**완화 전략**:
- 매일 develop 브랜치에서 rebase (최신 상태 유지)
- Shared 관련 파일은 개발자 A, B가 명확히 분리 (components vs types)
- Conflict 발생 시 즉시 Slack으로 협의
- 큰 변경사항은 PR 전에 미리 공유

---

## 📊 작업량 분석

| 개발자 | Stories | Units | Components | Effort (days) | Balance |
|--------|---------|-------|-----------|---------------|---------|
| **개발자 A** | 11 | 3 | 61 | 15-18 | ⭐⭐⭐ |
| **개발자 B** | 11 (지원) | 3 | 19 | 12-15 | ⭐⭐⭐⭐ |

**균형도**: 적정 (개발자 A가 3-5일 더 소요, Frontend가 더 많은 작업)

**조정 방안**:
- 개발자 B가 Week 4에 Frontend 테스트, 문서화 지원 가능
- 개발자 B가 Backend 완료 후 CI/CD 설정 담당 (추가 작업)

---

## 📞 Contact Information

**개발자 A (Frontend Specialist)**:
- Slack: @developer-a
- Email: developer-a@example.com
- 주요 역할: Frontend Lead, Shared Components Owner, SSE Client Owner

**개발자 B (Backend Specialist)**:
- Slack: @developer-b
- Email: developer-b@example.com
- 주요 역할: Backend Lead, API Contract Owner, SSE Server Owner, Database Owner

---

## 🚀 Next Steps

### 개발자 A
1. `git checkout -b feature/shared-components` (Day 1 시작)
2. Shared 프로젝트 셋업 및 기본 컴포넌트 구현
3. PR 생성 및 merge 후 Customer Frontend 시작
4. Weekly progress update (매주 금요일)

### 개발자 B
1. `git checkout -b feature/shared-types` (Day 1 시작)
2. Shared types 프로젝트 셋업 및 API 타입 정의
3. PR 생성 및 merge 후 Backend 시작
4. API 계약 문서 작성 및 공유 (Week 1 끝)

### 전체
1. Daily standup 시작 (매일 오전 9:30)
2. PR 리뷰는 24시간 이내 완료
3. Checkpoint 참석 필수
4. Git best practice 준수 (commit message, branch naming)

---

## 📝 Appendix: Git Command Cheat Sheet

### 일상적인 작업 플로우

```bash
# 1. 최신 develop 가져오기
git checkout develop
git pull origin develop

# 2. Feature 브랜치 생성 또는 전환
git checkout -b feature/my-feature  # 새 브랜치
git checkout feature/my-feature     # 기존 브랜치

# 3. 작업 후 commit
git add .
git commit -m "feat(scope): description"

# 4. Push to remote
git push origin feature/my-feature

# 5. PR 생성 (GitHub에서)

# 6. PR merge 후 로컬 정리
git checkout develop
git pull origin develop
git branch -d feature/my-feature  # 로컬 브랜치 삭제
```

### Conflict 해결

```bash
# 1. develop에서 최신 변경사항 가져오기
git checkout develop
git pull origin develop

# 2. Feature 브랜치로 돌아가서 rebase
git checkout feature/my-feature
git rebase develop

# 3. Conflict 발생 시
# 파일 수정 후
git add <conflicted-files>
git rebase --continue

# 4. Push (force push 필요)
git push origin feature/my-feature --force

# 5. PR에서 conflict 해결 확인
```

### Shared 변경사항 가져오기

```bash
# Shared 컴포넌트가 업데이트되었을 때
git checkout develop
git pull origin develop

# 내 feature 브랜치에 반영
git checkout feature/my-feature
git rebase develop

# Package 업데이트 (if Shared published to npm)
cd frontend/customer  # 또는 frontend/admin
npm install @table-order/shared@latest
```
