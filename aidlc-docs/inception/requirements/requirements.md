# 테이블오더 서비스 요구사항 명세서

## Intent Analysis Summary

### User Request
테이블오더 서비스를 구축 - 고객이 테이블에서 직접 주문할 수 있고, 관리자가 실시간으로 주문을 모니터링하고 관리할 수 있는 디지털 주문 시스템

### Request Type
**New Project** - 전체 시스템 새로 구축

### Scope Estimate
**System-wide** - 고객 인터페이스, 관리자 인터페이스, 서버 시스템, 데이터 저장소를 포함한 전체 시스템

### Complexity Estimate
**Complex** - 실시간 통신, 세션 관리, 다중 사용자 인터페이스, 보안 인증을 포함한 복잡한 시스템

---

## 1. Functional Requirements (기능 요구사항)

### 1.1 고객용 기능 (Customer Interface)

#### FR-1.1: 테이블 태블릿 자동 로그인 및 세션 관리
- **Priority**: Critical
- **Description**: 고객이 별도 로그인 절차 없이 즉시 주문할 수 있도록 자동 인증
- **Requirements**:
  - 관리자가 1회 초기 설정 (매장 식별자, 테이블 번호, 테이블 비밀번호)
  - 로그인 정보 로컬 저장
  - 저장된 정보로 자동 로그인
  - 테이블 세션 유지 및 추적

#### FR-1.2: 메뉴 조회 및 탐색
- **Priority**: Critical
- **Description**: 고객이 매장의 메뉴를 쉽게 탐색하고 선택
- **Requirements**:
  - 메뉴 화면이 기본 화면으로 표시
  - 카테고리별 메뉴 분류 및 표시
  - 메뉴 상세 정보 표시 (메뉴명, 가격, 설명, 이미지)
  - 카테고리 간 빠른 이동
  - 카드 형태의 메뉴 레이아웃
  - 터치 친화적인 버튼 크기 (최소 44x44px)

#### FR-1.3: 장바구니 관리
- **Priority**: Critical
- **Description**: 주문 전 선택한 메뉴를 임시 저장하고 수정
- **Requirements**:
  - 메뉴 추가/삭제
  - 수량 조절 (증가/감소)
  - 총 금액 실시간 계산
  - 장바구니 비우기
  - 클라이언트 측 임시 저장 (페이지 새로고침 시에도 유지)

#### FR-1.4: 주문 생성
- **Priority**: Critical
- **Description**: 장바구니의 메뉴를 실제 주문으로 전환
- **Requirements**:
  - 주문 내역 최종 확인
  - 주문 확정 버튼
  - 주문 성공 시:
    - 주문 번호 표시
    - 장바구니 자동 비우기
    - 메뉴 화면으로 자동 리다이렉트
  - 주문 실패 시 에러 메시지 표시 및 장바구니 유지
- **Data Requirements**:
  - 매장 식별 정보
  - 테이블 식별 정보
  - 주문 메뉴 목록 (메뉴명, 수량, 단가)
  - 총 주문 금액
  - 세션 ID (테이블 세션 추적용)

#### FR-1.5: 주문 내역 조회
- **Priority**: High
- **Description**: 현재 테이블의 주문 이력 확인
- **Requirements**:
  - 주문 시간 순 정렬
  - 주문별 상세 정보 표시 (주문 번호, 시각, 메뉴 및 수량, 금액, 상태)
  - 주문 상태 (대기중/준비중/완료)
  - 현재 테이블 세션 주문만 표시
  - 매장 이용 완료 처리된 주문 제외
  - 페이지네이션 또는 무한 스크롤

### 1.2 관리자용 기능 (Admin Interface)

#### FR-2.1: 매장 인증
- **Priority**: Critical
- **Description**: 관리자가 자신의 매장 관리 시스템에 접근
- **Requirements**:
  - 매장 식별자 입력
  - 사용자명 및 비밀번호 입력
  - 16시간 세션 유지
  - JWT 토큰 기반 인증
  - 브라우저 새로고침 시 세션 유지
  - 16시간 후 자동 로그아웃
  - 비밀번호 bcrypt 해싱
  - 로그인 시도 제한

#### FR-2.2: 실시간 주문 모니터링
- **Priority**: Critical
- **Description**: 들어오는 주문을 실시간으로 확인하고 관리
- **Requirements**:
  - 주문 목록 실시간 업데이트 (Server-Sent Events 사용)
  - 그리드/대시보드 레이아웃:
    - 테이블별 카드 형태 표시
    - 각 테이블 카드에 총 주문액 표시
    - 최신 주문 n개 미리보기
  - 주문별 상세 정보 표시 (테이블 번호, 주문 번호, 시각, 메뉴 및 수량, 총 금액)
  - 주문 카드 클릭 시 전체 메뉴 목록 상세 보기
  - 주문 상태 변경 (대기중/준비중/완료)
  - 신규 주문 시각적 강조 (색상 변경, 애니메이션)
  - 2초 이내 주문 표시
  - 테이블별 필터링 기능

#### FR-2.3: 테이블 관리
- **Priority**: Critical
- **Description**: 테이블별 주문 상태 관리 및 세션 라이프사이클 관리
- **Requirements**:
  - **테이블 태블릿 초기 설정**:
    - 테이블 번호 및 비밀번호 설정
    - 16시간 세션 생성
    - 설정 정보 저장 및 자동 로그인 활성화
  - **주문 삭제 (직권 수정)**:
    - 특정 주문 삭제 버튼
    - 확인 팝업 표시
    - 주문 즉시 삭제
    - 테이블 총 주문액 재계산
    - 성공/실패 피드백
  - **테이블 세션 처리**:
    - 테이블 세션 시작 및 종료 관리
    - 확인 팝업 표시
    - 세션 종료 시 해당 세션의 주문 내역을 과거 이력으로 이동
    - 세션 종료 시 테이블 현재 주문 목록 및 총 주문액 0으로 리셋
    - 새 고객이 이전 주문 내역 없이 시작 가능
    - 성공/실패 피드백
  - **과거 주문 내역 조회**:
    - "과거 내역" 버튼
    - 테이블별 과거 주문 목록 표시 (시간 역순)
    - 각 주문 정보: 주문 번호, 시각, 메뉴 목록, 총 금액, 매장 이용 완료 시각
    - 날짜 필터링 기능
    - "닫기" 버튼으로 대시보드 복귀

#### FR-2.4: 메뉴 관리
- **Priority**: High
- **Description**: 메뉴 정보를 동적으로 관리
- **Requirements**:
  - 메뉴 조회 (카테고리별)
  - 메뉴 등록 (메뉴명, 가격, 설명, 카테고리, 이미지 URL)
  - 메뉴 수정
  - 메뉴 삭제
  - 메뉴 노출 순서 조정
  - 필수 필드 검증
  - 가격 범위 검증

---

## 2. Non-Functional Requirements (비기능 요구사항)

### 2.1 Technology Stack

#### Backend
- **Technology**: Node.js (Express or NestJS)
- **Rationale**: 요구사항 검증에서 선택됨

#### Frontend
- **Technology**: React
- **Rationale**: 요구사항 검증에서 선택됨

#### Database
- **Technology**: PostgreSQL (관계형 데이터베이스)
- **Rationale**: 요구사항 검증에서 선택됨

#### Deployment
- **Platform**: AWS (EC2, ECS, Lambda 등)
- **Rationale**: 요구사항 검증에서 선택됨

### 2.2 Performance Requirements

#### NFR-2.2.1: Response Time
- **Requirement**: 주문 생성 및 조회 시 1초 이내 응답
- **Priority**: High
- **Measurement**: 95 percentile 기준

#### NFR-2.2.2: Concurrent Users
- **Requirement**: 중규모 매장 지원 (10-50명 동시 사용자)
- **Priority**: High
- **Rationale**: 중형 매장의 테이블 수 및 관리자를 포함한 예상 사용자 수

#### NFR-2.2.3: Real-time Updates
- **Requirement**: 관리자 대시보드에 2초 이내 주문 표시
- **Technology**: Server-Sent Events (SSE)
- **Priority**: Critical

### 2.3 Security Requirements

#### NFR-2.3.1: Authentication Security
- **Level**: Standard
- **Requirements**:
  - 비밀번호 bcrypt 해싱
  - JWT 토큰 기반 인증
  - HTTPS 권장 (필수는 아님)
  - 16시간 세션 유지
  - 로그인 시도 제한

#### NFR-2.3.2: Session Management
- **Customer Sessions**: 테이블별 세션 추적 (세션 ID)
- **Admin Sessions**: 16시간 JWT 토큰 세션
- **Requirement**: 브라우저 새로고침 시에도 세션 유지

### 2.4 Usability Requirements

#### NFR-2.4.1: User Interface
- **Customer Interface**:
  - 터치 친화적 (최소 44x44px 버튼)
  - 직관적이고 사용하기 쉬운 인터페이스
  - 명확한 시각적 계층 구조
- **Admin Interface**:
  - 그리드 형태의 대시보드
  - 실시간 시각적 피드백 (색상, 애니메이션)

### 2.5 Data Management Requirements

#### NFR-2.5.1: Image Management
- **Approach**: 외부 이미지 URL만 사용 (S3, CDN 등)
- **Rationale**: 서버 파일 업로드/저장 제외

#### NFR-2.5.2: Data Persistence
- **Customer Cart**: 클라이언트 측 임시 저장 (페이지 새로고침 시 유지)
- **Order History**: 데이터베이스에 영구 저장 (OrderHistory 테이블)

### 2.6 Testing Requirements

#### NFR-2.6.1: Test Coverage
- **Level**: Minimal
- **Requirements**:
  - 핵심 비즈니스 로직만 단위 테스트
  - 주요 주문 생성/조회 API 기본 테스트
- **Rationale**: MVP 개발 범위에 적합

### 2.7 Logging and Monitoring

#### NFR-2.7.1: Logging Strategy
- **Approach**: 중앙집중식 로깅 (AWS CloudWatch)
- **Priority**: High
- **Requirements**:
  - 에러 추적 및 로그 수집
  - AWS CloudWatch를 통한 중앙 관리

---

## 3. Constraints and Exclusions (제약사항 및 제외 기능)

### 3.1 Excluded Features

다음 기능들은 구현 범위에서 **제외**됩니다:

#### 3.1.1 결제 관련
- 실제 결제 처리 (카드, 현금, 디지털 지갑)
- 결제 게이트웨이 연동 (PG사 연동)
- 영수증 발행 및 출력
- 환불 처리
- 포인트/쿠폰 시스템

#### 3.1.2 인증 및 보안
- 복잡한 사용자 인증 (OAuth, SNS 로그인)
- 다단계 인증 (2FA, OTP)

#### 3.1.3 파일 및 컨텐츠 관리
- 이미지 리사이징/최적화
- 컨텐츠 관리 시스템
- 광고 기능

#### 3.1.4 알림 시스템
- 푸시 알림 (모바일, 브라우저)
- SMS 알림
- 이메일 발송
- 소리/진동 알림

#### 3.1.5 주방 기능
- 주문 내역 주방 전달
- 주방 식재료 재고 관리

#### 3.1.6 고급 기능
- 데이터 분석 및 대시보드
- 매출 리포트 생성
- 재고 관리 시스템
- 직원 관리 및 권한 설정
- 예약 시스템
- 고객 리뷰 시스템
- 다국어 기능

#### 3.1.7 외부 연동
- 배달 플랫폼 연동
- POS 시스템 연동
- 소셜 미디어 공유
- 지도 API
- 번역 API

---

## 4. Key Terminology (용어 정의)

- **MVP**: Minimum Viable Product (최소 기능 제품)
- **API**: Application Programming Interface
- **UI/UX**: User Interface / User Experience
- **테이블 세션**: 특정 테이블에 고객이 앉아서 첫 주문 시작한 후부터 해당 테이블 이용 완료 처리까지의 시간. 세션 종료 후 다른 고객의 첫 주문 시작 시 새로운 세션 시작.
- **SSE**: Server-Sent Events (서버에서 클라이언트로의 단방향 실시간 통신)
- **JWT**: JSON Web Token (토큰 기반 인증 방식)

---

## 5. Success Criteria (성공 기준)

### 5.1 Functional Success
- ✅ 고객이 테이블 태블릿에서 자동 로그인 없이 메뉴를 조회하고 주문 가능
- ✅ 장바구니에 메뉴를 추가하고 주문 생성 가능
- ✅ 관리자가 실시간으로 들어오는 주문을 2초 이내에 확인 가능
- ✅ 관리자가 주문 상태를 변경하고 테이블 세션을 관리 가능
- ✅ 테이블 이용 완료 처리 후 새 고객이 이전 주문 없이 시작 가능

### 5.2 Non-Functional Success
- ✅ 주문 생성 및 조회 응답 시간 1초 이내
- ✅ 10-50명 동시 사용자 지원
- ✅ 16시간 세션 유지 (관리자, 테이블)
- ✅ 보안: bcrypt 해싱 + JWT 토큰 인증
- ✅ AWS에 안정적으로 배포 가능

---

## 6. Assumptions and Dependencies (가정 및 의존성)

### 6.1 Assumptions
- 매장은 안정적인 인터넷 연결을 보유
- 테이블마다 태블릿 또는 웹 브라우저가 사용 가능한 디바이스가 있음
- 메뉴 이미지는 외부 URL로 제공됨 (S3, CDN)
- 관리자는 웹 브라우저에서 관리 화면에 접근

### 6.2 Dependencies
- Node.js 런타임 환경
- React 프레임워크
- PostgreSQL 데이터베이스
- AWS 인프라 (EC2, CloudWatch 등)
- HTTPS 지원 (권장)

---

## 7. Risks and Mitigation (위험 및 완화 방안)

### 7.1 Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| SSE 연결 불안정 | High | Reconnection 로직 구현, Fallback 메커니즘 |
| 동시 사용자 증가 시 성능 저하 | Medium | 성능 테스트 및 모니터링, Auto-scaling 고려 |
| 세션 관리 복잡도 | Medium | JWT 토큰 표준 사용, 명확한 세션 로직 |

### 7.2 Operational Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| 인터넷 연결 끊김 | High | 장바구니 로컬 저장, 재연결 시 동기화 |
| 테이블 태블릿 초기 설정 오류 | Medium | 명확한 설정 UI, 에러 메시지 제공 |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-06 | AI-DLC | Initial requirements document created |
