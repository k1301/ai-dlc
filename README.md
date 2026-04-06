# 테이블오더 서비스

AI-DLC 기반 테이블 주문 관리 시스템

## 📋 프로젝트 개요

레스토랑 테이블에서 QR 코드를 통해 자동 로그인하여 메뉴를 주문하고, 관리자가 실시간으로 주문을 모니터링하는 시스템입니다.

**기술 스택**:
- **Frontend**: React 18+, Context API, Vite
- **Backend**: Node.js, Express, JWT, SSE
- **Database**: PostgreSQL 14, Knex.js
- **Infrastructure**: AWS (RDS, S3, CloudFront, EC2/ECS)

---

## 🏗️ 프로젝트 구조

```
ai-dlc/
├── database/              # Database migrations & seeds
├── backend/               # Backend API (개발자 B)
├── frontend/
│   ├── customer/         # Customer frontend (개발자 A)
│   └── admin/            # Admin frontend (개발자 A)
├── shared/
│   ├── types/            # TypeScript types (개발자 B)
│   └── components/       # React UI components (개발자 A)
├── aidlc-docs/           # AI-DLC documentation
├── CLAUDE.md             # AI-DLC workflow
└── DEVELOPER-GUIDE.md    # Developer guide (READ THIS FIRST!)
```

---

## 👥 팀 구성

**개발자 A - Frontend Specialist**:
- Shared Components
- Customer Frontend
- Admin Frontend

**개발자 B - Backend Specialist**:
- Shared Types
- Backend API

---

## 🚀 시작하기

### 1. 리포지토리 Clone

```bash
git clone https://github.com/k1301/ai-dlc.git
cd ai-dlc
git checkout develop
```

### 2. 개발자 가이드 읽기

```bash
# 각자 담당 units 확인 및 개발 프로세스 숙지
cat DEVELOPER-GUIDE.md
```

### 3. AI-DLC 세션 시작

```bash
# Claude Code CLI
claude

# 또는 VS Code Extension 사용
```

### 4. 코드 생성 요청

개발자 가이드의 "4️⃣ AI-DLC에게 작업 요청" 섹션 참고

---

## 📦 완료된 Units

- ✅ **Database** (develop 브랜치)
  - 8 tables (stores, tables, categories, menus, users, sessions, orders, order_items)
  - Knex.js migrations & seeds
  - Documentation

---

## 🔜 진행 중 Units

- ⏳ **Shared Types** (개발자 B)
- ⏳ **Shared Components** (개발자 A)
- ⏳ **Backend** (개발자 B)
- ⏳ **Customer Frontend** (개발자 A)
- ⏳ **Admin Frontend** (개발자 A)

---

## 📚 문서

- **개발자 가이드**: `DEVELOPER-GUIDE.md` ⭐ **필독!**
- **요구사항**: `aidlc-docs/inception/requirements/requirements.md`
- **User Stories**: `aidlc-docs/inception/user-stories/stories.md` (11개 stories)
- **아키텍처 설계**: `aidlc-docs/inception/application-design/`
- **Database 설계**: `aidlc-docs/construction/database/`
- **Database README**: `database/README.md`

---

## 🤝 협업 규칙

### Git Workflow

- **Base Branch**: `develop` (integration)
- **Feature Branches**: `feature/<unit-name>`
- **PR Review**: 최소 1명 approve 필요
- **Merge**: PR 생성자가 merge

### 브랜치 네이밍

- `feature/shared-types`
- `feature/shared-components`
- `feature/backend`
- `feature/frontend-customer`
- `feature/frontend-admin`

### Commit Message

```
<type>(<scope>): <subject>

Types: feat, fix, refactor, style, docs, test, chore
Scopes: shared, backend, customer, admin, database

Example:
feat(backend): Add menu API endpoints
```

---

## 🔧 개발 환경 설정

### 필수 설치

- Node.js 18+
- PostgreSQL 14+
- Git
- Claude Code (CLI or VS Code Extension)

### Database 설정

```bash
# 환경변수 설정
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=table_order_dev

# Dependencies 설치
npm install

# Migrations 실행
npm run db:migrate

# Seed data 삽입
npm run db:seed
```

---

## 📞 문제 발생 시

- **Git 문제**: `DEVELOPER-GUIDE.md` → "📞 문제 발생 시" 참고
- **AI-DLC 문제**: Claude Code 세션 재시작, CLAUDE.md 확인
- **질문/도움**: Slack `#team-table-order` 또는 GitHub Issues

---

## 🎯 프로젝트 목표

- ✅ Database unit 완료
- ⏳ 5개 units 코드 생성 (각자 진행)
- ⏳ 11개 user stories 구현
- ⏳ E2E 테스트 통과
- ⏳ NFR 목표 달성 (응답 < 1초, 실시간 < 2초)
- ⏳ Production 배포

---

## 📄 License

ISC

---

## 🚀 Next Steps

**개발자 A와 B**:
1. ✅ 이 README 읽기
2. 📖 `DEVELOPER-GUIDE.md` 읽기 (필수!)
3. 🎯 Claude Code 세션 시작
4. 💻 담당 units 코드 생성
5. 🔀 Git commit & push
6. 🔍 PR 생성 및 리뷰

**행운을 빕니다! 🎉**
