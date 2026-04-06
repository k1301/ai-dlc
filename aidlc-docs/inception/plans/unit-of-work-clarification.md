# Unit of Work Clarification Questions

답변을 분석한 결과 일관성 문제가 발견되어 추가 명확화가 필요합니다.

---

## Contradiction 1: Q1 vs Q2 - Frontend Units 수

**발견된 모순**:
- Q1에서 **"4 Units"**를 선택: Customer Frontend, Admin Frontend, Backend API, Database Schema
- Q2에서 **"Single Unit"**를 선택: 하나의 Frontend unit에서 Customer + Admin 함께

**문제점**:
Q1에서 이미 Customer Frontend와 Admin Frontend를 **별도 units**로 선택했는데, Q2에서 다시 Frontend를 **하나로 합치는** 옵션을 선택했습니다. 이는 서로 모순됩니다.

### Clarification Question 1
Frontend units을 어떻게 구성할까요?

A) **Customer Frontend와 Admin Frontend를 별도 units로** (Q1-A의 의도대로, 총 2개의 독립적인 Frontend units)
B) **Frontend를 하나의 unit으로** (Q2-B의 의도대로, Customer + Admin을 하나의 unit에서 개발)
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Contradiction 2: Q5 Shared Unit vs Q1의 Unit 수

**발견된 모순**:
- Q1에서 **"4 Units"**를 선택: Customer Frontend, Admin Frontend, Backend API, Database Schema (총 4개)
- Q5에서 **"Shared Unit"**를 선택: 공유 코드를 별도 unit으로 분리

**문제점**:
Q1의 4 units에는 Shared Unit이 포함되지 않았습니다. Q5에서 Shared Unit을 별도로 선택하면 총 unit 수가 5개가 되는데, 이것이 의도인가요?

### Clarification Question 2
Shared Unit을 추가할까요?

A) **Yes, add Shared Unit** - 총 5 units (Customer Frontend, Admin Frontend, Backend, Database, Shared)
B) **No, include shared code in existing units** - 총 4 units, 공유 코드는 Backend나 Frontend에 포함
C) **No shared code needed** - 각 unit이 독립적, 필요시 코드 복제
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Contradiction 3: Q7 Simple Structure vs 여러 Frontend Units

**발견된 모순**:
- Q1에서 Customer Frontend와 Admin Frontend를 **별도 units**로 선택 (CQ1 답변 대기 중)
- Q7에서 **"Simple structure (frontend/, backend/, database/)"**를 선택

**문제점**:
Simple structure의 `frontend/` 디렉토리 하나로는 Customer Frontend와 Admin Frontend 2개의 독립적인 units를 표현하기 어렵습니다. 

**만약 CQ1에서 Option A (별도 units)를 선택한다면**:
- `frontend/`를 어떻게 나눌 것인가? 
  - `frontend/customer/`와 `frontend/admin/`?
  - 또는 `customer-app/`과 `admin-app/` (최상위 분리)?

**만약 CQ1에서 Option B (하나의 unit)를 선택한다면**:
- Q7의 Simple structure가 적합합니다.

### Clarification Question 3 (CQ1 답변에 따라 조건부)
**IF CQ1 = A (별도 units)**:
Customer Frontend와 Admin Frontend를 디렉토리 구조상 어떻게 분리할까요?

A) **Subdirectories** - `frontend/customer/`와 `frontend/admin/` (frontend 하위에 subdirectories)
B) **Top-level separation** - `customer-app/`과 `admin-app/` (최상위 레벨 분리)
C) **Apps directory** - `apps/customer/`와 `apps/admin/` (Monorepo 스타일)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

**IF CQ1 = B (하나의 unit)**:
Q7의 Simple structure (`frontend/, backend/, database/`)가 적합하므로 추가 질문 불필요.

---

## Summary

총 3개의 Clarification Questions:
1. **CQ1**: Frontend units 구성 (별도 vs 통합)
2. **CQ2**: Shared Unit 추가 여부
3. **CQ3**: (CQ1이 A인 경우) Directory structure 상세

**다음 단계:**
1. CQ1, CQ2에 답변해주세요
2. CQ1 답변이 A이면 CQ3에도 답변해주세요 (B이면 CQ3 스킵)
3. 모든 답변 완료 후 "완료" 또는 "done"이라고 알려주세요
