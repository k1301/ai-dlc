# Application Design Clarification Questions

답변을 분석한 결과 기술적 모순이 발견되어 추가 명확화가 필요합니다.

---

## Contradiction 1: Serverless Lambda vs SSE 실시간 통신

**발견된 모순**:
- Q2에서 "Serverless Functions (AWS Lambda)"를 선택했습니다
- Q4에서 "Dedicated SSE Service"를 선택했습니다

**문제점**:
AWS Lambda는 Server-Sent Events (SSE)를 **직접 지원하지 않습니다**. 이유는:
- **Lambda의 특성**: 짧은 실행 시간(최대 15분), stateless, event-driven
- **SSE의 요구사항**: Long-lived HTTP connection (클라이언트가 연결을 유지하고 서버가 지속적으로 이벤트 push)
- **API Gateway + Lambda**: Synchronous request-response만 지원, long-lived connection 불가

**SSE를 구현하려면**:
- EC2 또는 ECS/Fargate 같은 **장기 실행 컴퓨팅 환경** 필요
- 또는 API Gateway WebSocket + Lambda 조합 (SSE 대신 WebSocket 사용)
- 또는 IoT Core, AppSync 같은 관리형 실시간 서비스

### Clarification Question 1
백엔드 아키텍처를 어떻게 조정할까요?

A) **EC2/ECS로 변경** - SSE를 지원하기 위해 장기 실행 컴퓨팅 환경(EC2 또는 ECS/Fargate)에 Express 서버 배포
B) **Lambda + WebSocket으로 변경** - SSE 대신 API Gateway WebSocket + Lambda 사용하여 실시간 통신 구현
C) **Hybrid Architecture** - 대부분의 REST API는 Lambda로, SSE만 별도 EC2/ECS 서버로 분리
D) **Lambda 유지 + Polling** - SSE를 포기하고 클라이언트가 주기적으로 polling하는 방식으로 변경
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Contradiction 2: Lambda vs Service Layer 인증 처리

**발견된 모순**:
- Q2에서 "Serverless Functions (AWS Lambda)"를 선택했습니다
- Q7에서 "Backend Service Layer"를 선택했습니다

**문제점**:
"Backend Service Layer"는 전통적으로 **Express 같은 프레임워크의 서비스 계층**을 의미하는데, Lambda를 사용하면:
- 각 Lambda 함수가 독립적으로 동작
- 공유 Service Layer를 사용하려면 Lambda Layer 또는 공통 패키지로 배포 필요
- 전통적인 Express 미들웨어 패턴과는 다름

### Clarification Question 2
Lambda 환경에서 인증/세션을 어떻게 처리할까요?

A) **Lambda Authorizer** - API Gateway의 Lambda Authorizer(구 Custom Authorizer)로 JWT 검증
B) **각 Lambda 함수 내부** - 각 Lambda 함수가 시작 시 JWT를 검증 (공통 유틸리티 함수 사용)
C) **Shared Lambda Layer** - 인증 로직을 Lambda Layer로 패키징하여 모든 함수가 공유
D) **Cognito** - AWS Cognito를 사용하여 인증 관리
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## 권장사항

**SSE 실시간 통신 요구사항을 고려하면**:

### 옵션 1: EC2/ECS 기반 아키텍처 (권장)
- **장점**: 
  - SSE 완전 지원
  - 전통적인 Express 서버 구조 (익숙함)
  - Service Layer, Middleware 패턴 그대로 사용 가능
  - Layered Architecture와 잘 맞음
- **단점**: 
  - 서버 관리 필요
  - Auto-scaling 직접 구성

### 옵션 2: Hybrid (REST는 Lambda, SSE는 ECS)
- **장점**:
  - Lambda의 비용 효율성 (REST API)
  - SSE는 ECS로 안정적 지원
- **단점**:
  - 아키텍처 복잡도 증가
  - 두 가지 배포 환경 관리

### 옵션 3: WebSocket으로 변경
- **장점**:
  - Lambda 유지 가능
  - 양방향 통신 가능
- **단점**:
  - SSE 대신 WebSocket 사용 (요구사항 변경)
  - 클라이언트 코드 변경 필요

**개인적 권장**: Clarification Q1에서 **Option A (EC2/ECS로 변경)**를 추천합니다. 이유:
- 요구사항에 명시된 SSE를 그대로 사용 가능
- Layered Architecture와 Service Layer 패턴을 자연스럽게 적용
- MVP 개발에 적합한 단순성

---

## 다음 단계

1. 위 2개의 Clarification Questions에 답변해주세요
2. 답변 후 "완료" 또는 "done"이라고 알려주세요
3. 모순이 해결되면 Application Design 아티팩트 생성을 진행하겠습니다
