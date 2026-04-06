# 개발자 가이드 - 병렬 개발 워크플로우

## 📋 프로젝트 개요

**프로젝트**: 테이블오더 서비스  
**Git Repository**: https://github.com/k1301/ai-dlc.git  
**개발 방식**: 2명 병렬 개발 (각자 AI-DLC 세션 실행)

---

## 👥 팀 구성

### 개발자 A - Frontend Specialist
**담당 Units**:
- Shared Components (UI 컴포넌트)
- Customer Frontend (고객용 앱)
- Admin Frontend (관리자용 앱)

**Git 브랜치**:
- `feature/shared-components`
- `feature/frontend-customer`
- `feature/frontend-admin`

---

### 개발자 B - Backend Specialist
**담당 Units**:
- Shared Types (TypeScript 타입, 유틸리티)
- Backend (Express API, Services)

**Git 브랜치**:
- `feature/shared-types`
- `feature/backend`

---

## 🚀 시작하기

### 1️⃣ 사전 준비

**필수 설치**:
- Git
- Node.js 18+
- Claude Code CLI 또는 VS Code Extension

**Claude Code 설치** (선택):
```bash
# CLI 설치
npm install -g @anthropic-ai/claude-code

# 또는 VS Code Extension 사용
# VS Code에서 "Claude Code" 검색 후 설치
```

---

### 2️⃣ 리포지토리 Clone

```bash
# 리포지토리 복제
git clone https://github.com/k1301/ai-dlc.git

# 디렉토리 이동
cd ai-dlc

# Develop 브랜치로 전환
git checkout develop

# 현재 상태 확인
git log --oneline
# feat(database): Complete database unit 이 보여야 함

# 파일 확인
ls -la
# database/, aidlc-docs/, knexfile.js, package.json, CLAUDE.md 등
```

---

### 3️⃣ AI-DLC 세션 시작

**Claude Code CLI 사용**:
```bash
# 프로젝트 디렉토리에서 실행
claude

# 또는 특정 파일 컨텍스트와 함께
claude --files "aidlc-docs/**/*.md"
```

**VS Code Extension 사용**:
1. VS Code에서 프로젝트 열기
2. Claude Code 패널 열기
3. 새 세션 시작

---

### 4️⃣ AI-DLC에게 작업 요청

#### 개발자 A (Frontend)

Claude Code 세션에서 다음과 같이 요청:

```
안녕하세요. 테이블오더 서비스 프로젝트를 진행 중입니다.

현재 상태:
- Database unit 완료 (develop 브랜치)
- 나는 개발자 A (Frontend Specialist)

다음 units의 CONSTRUCTION 단계를 진행해주세요:
1. Shared Components unit (React UI 컴포넌트)
2. Customer Frontend unit (고객용 앱)
3. Admin Frontend unit (관리자용 앱)

각 unit마다 Functional Design부터 Code Generation까지 완료해주세요.
질문이 있으면 답변하겠습니다.
```

**AI가 자동으로 진행**:
1. Functional Design 질문 → 답변
2. NFR Requirements 질문 → 답변
3. NFR Design 질문 → 답변
4. Infrastructure Design 질문 → 답변 (필요시)
5. Code Generation → 코드 생성
6. → shared/components/, frontend/customer/, frontend/admin/ 생성됨

---

#### 개발자 B (Backend)

Claude Code 세션에서 다음과 같이 요청:

```
안녕하세요. 테이블오더 서비스 프로젝트를 진행 중입니다.

현재 상태:
- Database unit 완료 (develop 브랜치)
- 나는 개발자 B (Backend Specialist)

다음 units의 CONSTRUCTION 단계를 진행해주세요:
1. Shared Types unit (TypeScript 타입, 유틸리티)
2. Backend unit (Express API, Services)

각 unit마다 Functional Design부터 Code Generation까지 완료해주세요.
질문이 있으면 답변하겠습니다.
```

**AI가 자동으로 진행**:
1. Functional Design 질문 → 답변
2. NFR Requirements 질문 → 답변
3. NFR Design 질문 → 답변
4. Infrastructure Design 질문 → 답변 (필요시)
5. Code Generation → 코드 생성
6. → shared/types/, backend/ 생성됨

---

### 5️⃣ 코드 확인 및 수정

AI가 코드 생성을 완료하면:

```bash
# 생성된 파일 확인
ls -la shared/
ls -la backend/  # 또는 frontend/

# 생성된 코드 검토
# VS Code 또는 원하는 에디터로 열기

# 필요시 수정/개선
# 비즈니스 로직 추가
# 스타일 조정 등
```

---

### 6️⃣ Git Commit & Push

#### 개발자 A

```bash
# Feature 브랜치 생성 (Shared Components)
git checkout -b feature/shared-components

# Shared Components만 staging
git add shared/components/

# Commit
git commit -m "feat(shared): Add UI components

- Add Button, Modal, Input, Select components
- Add Card, Badge, Spinner components
- Add Layout components (Header, Footer, Sidebar, NavBar)

Co-Authored-By: AI-DLC <noreply@anthropic.com>"

# Push
git push origin feature/shared-components

# GitHub에서 PR 생성
# Base: develop, Head: feature/shared-components


# Customer Frontend 브랜치
git checkout develop
git checkout -b feature/frontend-customer

git add frontend/customer/

git commit -m "feat(customer): Add customer frontend

- Add menu browsing pages
- Add cart management
- Add order creation flow
- Add auto-login functionality

Co-Authored-By: AI-DLC <noreply@anthropic.com>"

git push origin feature/frontend-customer

# PR 생성


# Admin Frontend 브랜치
git checkout develop
git checkout -b feature/frontend-admin

git add frontend/admin/

git commit -m "feat(admin): Add admin frontend

- Add real-time dashboard with SSE
- Add order management
- Add table session management
- Add menu/category management

Co-Authored-By: AI-DLC <noreply@anthropic.com>"

git push origin feature/frontend-admin

# PR 생성
```

---

#### 개발자 B

```bash
# Feature 브랜치 생성 (Shared Types)
git checkout -b feature/shared-types

# Shared Types만 staging
git add shared/types/

# Commit
git commit -m "feat(shared): Add TypeScript types and utilities

- Add API request/response types
- Add domain entity types
- Add utility functions (formatCurrency, formatDate)
- Add constants (API_BASE_URL, HTTP_STATUS)

Co-Authored-By: AI-DLC <noreply@anthropic.com>"

# Push
git push origin feature/shared-types

# GitHub에서 PR 생성
# Base: develop, Head: feature/shared-types


# Backend 브랜치
git checkout develop
git checkout -b feature/backend

git add backend/

git commit -m "feat(backend): Add backend API and services

- Add 15 API endpoints (Menu, Order, Auth, Table, SSE)
- Add JWT authentication middleware
- Add Services layer (5 services)
- Add Repositories layer (4 repositories)
- Add Models (5 models)
- Add SSE server for real-time updates

Co-Authored-By: AI-DLC <noreply@anthropic.com>"

git push origin feature/backend

# PR 생성
```

---

## 🔄 코드 리뷰 및 Merge

### PR 리뷰 프로세스

1. **PR 생성자**: GitHub에서 PR 생성
   - Base branch: `develop`
   - Reviewers: 상대방 개발자 지정
   - Labels 추가: `frontend` 또는 `backend`

2. **리뷰어**: 24시간 이내 리뷰
   - 코드 품질 확인
   - 로직 검증
   - 테스트 확인
   - Comment 또는 Approve

3. **Merge**: Approve 받으면 PR 생성자가 merge
   - Merge 버튼 클릭
   - Delete branch (옵션)

---

## 🤝 협업 체크포인트

### Checkpoint 1: Shared 완료 후
**개발자 A와 B 모두 Shared unit 완료 시**
- Slack 또는 미팅에서 공유
- API 타입 인터페이스 확인
- UI 컴포넌트 사용법 공유

### Checkpoint 2: Backend 완료 후
**개발자 B가 Backend 완료 시**
- API 계약 문서 공유
- Postman Collection 또는 OpenAPI spec 제공
- Frontend가 API 연동 시작

### Checkpoint 3: Full Integration Test
**모든 unit 완료 후**
- 전체 E2E 테스트
- Customer → Backend → Admin 플로우 검증
- NFR 목표 달성 확인 (응답 시간, 실시간 latency)

---

## ⚠️ 주의사항

### Git Conflict 방지
- 매일 develop에서 pull 받기
- 다른 사람의 디렉토리 수정 금지
  - 개발자 A: `shared/components/`, `frontend/`
  - 개발자 B: `shared/types/`, `backend/`
- package.json 수정 시 상대방에게 알리기

### Shared 관련 변경
- Shared 컴포넌트/타입 변경 시 반드시 공유
- Breaking change는 주간 단위로만
- Semantic versioning 준수

### AI-DLC 활용 팁
- 질문에 명확히 답변 (A, B, C, D)
- "done" 입력으로 다음 단계 진행
- 생성된 코드 검토 필수 (AI가 완벽하지 않음)
- 필요 시 "Request Changes" 선택하여 재생성

---

## 📞 문제 발생 시

### Git 문제
```bash
# Conflict 발생 시
git checkout develop
git pull origin develop
git checkout feature/my-branch
git rebase develop
# Conflict 해결 후
git add .
git rebase --continue
git push --force
```

### AI-DLC 문제
- Claude Code 세션 재시작
- aidlc-docs/ 폴더 확인 (기존 설계 문서)
- CLAUDE.md 파일 확인 (워크플로우 정의)

### 질문/도움
- Slack `#team-table-order`
- GitHub Issues
- 상대방 개발자와 협의

---

## 🎯 성공 기준

### 개발자 A 완료 기준
- [ ] Shared Components 11개 컴포넌트 완성
- [ ] Customer Frontend 5 stories 완료
- [ ] Admin Frontend 6 stories 완료
- [ ] All PRs merged to develop

### 개발자 B 완료 기준
- [ ] Shared Types 타입 정의 완성
- [ ] Backend 15 API endpoints 완료
- [ ] JWT 인증 완료
- [ ] SSE 실시간 통신 완료
- [ ] All PRs merged to develop

### 전체 완료 기준
- [ ] 모든 11 user stories 구현 완료
- [ ] E2E 테스트 통과
- [ ] NFR 목표 달성 (응답 < 1초, 실시간 < 2초)
- [ ] develop → main merge 준비 완료

---

## 📚 참고 문서

**프로젝트 문서** (aidlc-docs/):
- `inception/requirements/requirements.md` - 전체 요구사항
- `inception/user-stories/stories.md` - 11개 user stories
- `inception/application-design/` - 전체 아키텍처 설계
- `inception/application-design/team-allocation.md` - 팀 할당 세부사항
- `construction/database/` - Database 설계 및 스키마

**AI-DLC 워크플로우**:
- `CLAUDE.md` - AI-DLC 워크플로우 정의
- `.aidlc-rule-details/` - 각 단계별 상세 규칙

---

## 🚀 시작하세요!

1. ✅ Git clone 완료
2. ✅ Claude Code 설치 확인
3. ✅ 자기 담당 units 확인
4. 🎯 AI-DLC 세션 시작
5. 🎯 코드 생성 및 개발 시작

**행운을 빕니다! 🎉**
