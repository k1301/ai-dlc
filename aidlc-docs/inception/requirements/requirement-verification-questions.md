# Requirements Verification Questions

요구사항 문서를 검토했습니다. 다음 질문들에 답변해주시면 더 정확한 요구사항 문서를 작성할 수 있습니다.

각 질문의 [Answer]: 태그 뒤에 선택한 옵션의 문자를 입력해주세요.

---

## Question 1: 백엔드 기술 스택
서버 측 애플리케이션을 어떤 기술로 구현할까요?

A) Node.js (Express, NestJS 등)
B) Python (Django, FastAPI, Flask 등)
C) Java (Spring Boot)
D) Go (Gin, Echo 등)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2: 프론트엔드 기술 스택
고객용 및 관리자용 웹 인터페이스를 어떤 기술로 구현할까요?

A) React
B) Vue.js
C) Angular
D) Vanilla JavaScript with HTML/CSS
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3: 데이터베이스 선택
데이터 저장소로 어떤 데이터베이스를 사용할까요?

A) PostgreSQL (관계형)
B) MySQL (관계형)
C) MongoDB (NoSQL 문서 기반)
D) DynamoDB (NoSQL 키-값)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4: 배포 환경
애플리케이션을 어디에 배포할 예정인가요?

A) AWS (EC2, ECS, Lambda 등)
B) On-premises servers
C) Docker containers (로컬 또는 클라우드)
D) Kubernetes cluster
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5: 인증 보안 수준
인증 및 세션 관리의 보안 수준을 어느 정도로 설정할까요?

A) Basic (비밀번호 bcrypt 해싱, 간단한 세션 관리)
B) Standard (bcrypt + JWT 토큰 + HTTPS 권장)
C) High (bcrypt + JWT + HTTPS 필수 + Rate limiting)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 6: 예상 동시 사용자 수
매장 내 동시 테이블 수 및 관리자를 포함한 예상 동시 사용자 수는?

A) 소규모 (10명 이하 - 소형 매장)
B) 중규모 (10-50명 - 중형 매장)
C) 대규모 (50-200명 - 대형 매장 또는 체인점)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 7: 응답 시간 요구사항
주문 생성 및 조회 시 허용 가능한 최대 응답 시간은?

A) 1초 이내
B) 2초 이내
C) 3초 이내
D) 5초 이내
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8: 실시간 업데이트 방식
관리자 대시보드의 실시간 주문 업데이트를 어떻게 구현할까요?

A) Server-Sent Events (SSE) - 요구사항에 명시됨
B) WebSocket (양방향 통신)
C) Polling (주기적 요청)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9: 이미지 저장 방식
메뉴 이미지를 어떻게 관리할까요?

A) 외부 이미지 URL만 사용 (S3, CDN 등 외부 링크)
B) 서버에 파일 업로드 및 저장
C) Base64 인코딩하여 DB에 저장
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10: 테스트 커버리지 요구사항
어느 정도의 테스트 커버리지를 목표로 할까요?

A) Minimal (핵심 비즈니스 로직만 단위 테스트)
B) Standard (단위 테스트 + 주요 API 통합 테스트)
C) Comprehensive (단위 + 통합 + E2E 테스트)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 11: 로깅 및 모니터링
로깅 및 에러 추적을 어떻게 처리할까요?

A) 기본 콘솔 로깅만
B) 파일 기반 로깅 (Winston, Log4j 등)
C) 중앙집중식 로깅 (CloudWatch, ELK Stack 등)
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 12: Security Extension
보안 확장 규칙을 이 프로젝트에 적용할까요?

A) Yes - 모든 보안 규칙을 필수 제약조건으로 적용 (프로덕션 수준 애플리케이션에 권장)
B) No - 보안 규칙 생략 (PoC, 프로토타입, 실험 프로젝트에 적합)
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## 답변 완료 후

모든 질문에 답변을 완료하셨으면 "완료" 또는 "done"이라고 알려주세요.
