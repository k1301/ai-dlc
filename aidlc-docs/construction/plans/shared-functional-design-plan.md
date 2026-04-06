# Shared Unit - Functional Design Plan

## Unit Context

**Unit Name**: Shared  
**Unit Type**: Shared Library  
**Purpose**: Frontend units 간 공유 코드 제공 (UI 컴포넌트, 타입, 유틸리티)  
**Technology Stack**: React, TypeScript, Vite (library mode)

**Components Summary**:
- **11 UI Components**: Layout (4) + UI (7)
- **TypeScript Types**: API request/response interfaces
- **Utilities**: formatCurrency, formatDate, API client helpers
- **Constants**: API_BASE_URL, STATUS_CODES

**Stories Supported by This Unit**: All 11 stories (간접적으로 모든 Frontend stories 지원)

**Dependencies**:
- No dependencies (독립적인 라이브러리)

**Depended By**:
- Customer Frontend unit
- Admin Frontend unit
- Backend unit (타입 정의만)

---

## Functional Design Objectives

Shared unit의 Functional Design은 다음을 정의합니다:
1. **UI Components Interface** - 각 컴포넌트의 props, variants, states
2. **TypeScript Types** - API request/response 타입, domain 타입
3. **Utilities** - formatCurrency, formatDate, API client helpers
4. **Constants** - API endpoints, status codes, error messages

---

## Design Questions

다음 질문들에 답변해주세요. 각 질문은 Shared unit의 설계에 영향을 미칩니다.

---

### Section 1: UI Components Design

#### Q1: Button Component Variants
Button 컴포넌트가 지원할 variants는 무엇인가요?

**Options**:
- **A**: Primary, Secondary, Danger (3가지)
- **B**: Primary, Secondary, Outline, Danger (4가지)
- **C**: Primary, Secondary, Outline, Danger, Ghost (5가지)
- **D**: Custom variants per use case (유동적)

**Recommendation**: **B** (4가지가 대부분의 use case 커버, MVP에 적합)

**[Answer]**: 

---

#### Q2: Modal Component Complexity
Modal 컴포넌트의 기능 범위는 어디까지인가요?

**Options**:
- **A**: Simple Modal (제목, 내용, 버튼만)
- **B**: Configurable Modal (크기, 위치, 애니메이션 옵션)
- **C**: Advanced Modal (복잡한 레이아웃, multi-step, 중첩 지원)
- **D**: Minimal Modal (내용만, 스타일링은 parent 책임)

**Recommendation**: **B** (유연성과 단순성의 균형, MVP에 적합)

**[Answer]**: 

---

#### Q3: Input Component Validation
Input 컴포넌트가 validation을 처리하는 방식은?

**Options**:
- **A**: Built-in Validation (Input 내부에서 validation logic 처리)
- **B**: External Validation (parent에서 error prop 전달, Input은 표시만)
- **C**: Hybrid (기본 validation 내장, 커스텀은 외부에서)
- **D**: No Validation (순수 UI만, validation은 form library 사용)

**Recommendation**: **B** (React best practice, 단순하고 유연함)

**[Answer]**: 

---

#### Q4: Card Component Layout
Card 컴포넌트의 레이아웃 구조는?

**Options**:
- **A**: Fixed Structure (header, body, footer 고정)
- **B**: Flexible Slots (children으로 자유롭게 구성)
- **C**: Compound Component (Card.Header, Card.Body, Card.Footer)
- **D**: Multiple Variants (CardMenu, CardOrder, CardTable 등 특화된 variants)

**Recommendation**: **C** (명확한 구조 + 유연성, 재사용성 높음)

**[Answer]**: 

---

#### Q5: Badge Component Use Cases
Badge 컴포넌트가 지원할 use cases는?

**Options**:
- **A**: Status Only (success, warning, error, info)
- **B**: Status + Count (status colors + notification count)
- **C**: Status + Count + Custom (status, count, 커스텀 텍스트/색상)
- **D**: Minimal (색상만, 텍스트는 parent 책임)

**Recommendation**: **B** (대부분의 use case 커버, MVP 충분)

**[Answer]**: 

---

### Section 2: TypeScript Types Design

#### Q6: API Response Type Structure
API response 타입을 어떻게 구조화할까요?

**Options**:
- **A**: Flat Types (각 endpoint마다 독립적인 타입)
- **B**: Generic Wrapper (ApiResponse<T> generic 사용)
- **C**: Domain-Centric (domain entity 중심, API는 래핑)
- **D**: Auto-Generated (OpenAPI spec에서 자동 생성)

**Recommendation**: **C** (domain 중심, 타입 안정성 높음, MVP 충분)

**[Answer]**: 

---

#### Q7: Type Naming Convention
타입과 인터페이스의 네이밍 규칙은?

**Options**:
- **A**: Prefix 'I' for Interface (IMenu, IOrder)
- **B**: Suffix 'Type' (MenuType, OrderType)
- **C**: No Prefix/Suffix (Menu, Order - domain name as-is)
- **D**: Different per Category (API: suffix 'Response', Domain: no suffix)

**Recommendation**: **D** (명확한 구분, TypeScript best practice)

**[Answer]**: 

---

#### Q8: Enum vs Union Types
상태 값(status, role 등)을 정의하는 방식은?

**Options**:
- **A**: TypeScript Enums (enum OrderStatus { Pending, Preparing, ... })
- **B**: Union Types (type OrderStatus = 'pending' | 'preparing' | ...)
- **C**: Const Objects (const ORDER_STATUS = { PENDING: 'pending', ... } as const)
- **D**: Mix (enum for some, union for others)

**Recommendation**: **B** (TypeScript best practice, 타입 안정성 높음, 런타임 overhead 없음)

**[Answer]**: 

---

### Section 3: Utilities Design

#### Q9: Currency Formatting
formatCurrency 함수가 지원할 기능은?

**Options**:
- **A**: Fixed KRW Only (항상 "12,000원" 형식)
- **B**: Configurable Locale (locale 파라미터로 다양한 통화 지원)
- **C**: Symbol + Decimal Options (통화 기호, 소수점 자릿수 옵션)
- **D**: Intl.NumberFormat Wrapper (브라우저 내장 API 래핑)

**Recommendation**: **A** (MVP는 KRW만, 단순하고 빠름)

**[Answer]**: 

---

#### Q10: Date Formatting
formatDate 함수가 지원할 포맷은?

**Options**:
- **A**: Single Format (ISO 8601: "2026-04-06T10:30:00Z")
- **B**: Multiple Presets (short: "2026-04-06", long: "2026년 4월 6일", time: "10:30")
- **C**: Custom Format String (format string 파라미터: "YYYY-MM-DD HH:mm")
- **D**: Intl.DateTimeFormat Wrapper (locale-aware, 브라우저 내장 API)

**Recommendation**: **B** (MVP에 필요한 3-4가지 preset, 단순하고 충분)

**[Answer]**: 

---

#### Q11: API Client Utility
API 호출을 위한 유틸리티를 제공할까요?

**Options**:
- **A**: No Utility (각 Frontend에서 직접 fetch 사용)
- **B**: Simple Fetch Wrapper (headers, error handling만 추가)
- **C**: Full API Client (axios 기반, interceptors, retry logic)
- **D**: Request/Response Transformers (타입 변환, validation 자동화)

**Recommendation**: **B** (MVP 충분, 단순하고 가벼움, 추후 확장 가능)

**[Answer]**: 

---

### Section 4: Constants Design

#### Q12: API Base URL Configuration
API_BASE_URL을 어떻게 관리할까요?

**Options**:
- **A**: Hardcoded (상수로 고정)
- **B**: Environment Variable (import.meta.env.VITE_API_BASE_URL)
- **C**: Runtime Config (config.json 파일에서 로드)
- **D**: Per-Environment Constants (DEV_API_URL, PROD_API_URL 분리)

**Recommendation**: **B** (Vite best practice, 환경별 빌드 가능)

**[Answer]**: 

---

#### Q13: Error Messages
에러 메시지를 어떻게 관리할까요?

**Options**:
- **A**: Inline Strings (컴포넌트 내부에 직접 문자열)
- **B**: Constants Object (ERROR_MESSAGES 객체로 중앙 관리)
- **C**: i18n Library (react-i18next로 다국어 지원)
- **D**: Backend-Driven (서버에서 에러 메시지 반환)

**Recommendation**: **B** (MVP 충분, 단순하고 일관성 유지, 추후 i18n 전환 가능)

**[Answer]**: 

---

#### Q14: HTTP Status Codes
HTTP 상태 코드를 어떻게 처리할까요?

**Options**:
- **A**: Magic Numbers (200, 401, 500 직접 사용)
- **B**: Named Constants (HTTP_STATUS.OK = 200, ...)
- **C**: No Constants (response.ok, response.status만 사용)
- **D**: Enum (enum HttpStatus { OK = 200, ... })

**Recommendation**: **B** (가독성 높음, TypeScript type safety)

**[Answer]**: 

---

### Section 5: Package Structure

#### Q15: Package Export Strategy
Shared 패키지를 어떻게 export할까요?

**Options**:
- **A**: Single Entry Point (모든 것을 index.js에서 export)
- **B**: Category Entry Points (components/index.js, types/index.ts, utils/index.js)
- **C**: Individual Exports (각 파일을 직접 import)
- **D**: Subpath Exports (package.json exports field 사용)

**Recommendation**: **D** (Tree-shaking 최적, 명확한 구조, 현대적 best practice)

**[Answer]**: 

---

## Next Steps

위 질문들에 답변해주시면:
1. 답변을 분석하여 모순이나 불명확한 부분을 확인합니다
2. 필요 시 clarification 질문을 드립니다
3. Functional Design artifacts를 생성합니다:
   - `component-interfaces.md` - 모든 UI 컴포넌트의 props, variants
   - `type-definitions.md` - TypeScript 타입 정의
   - `utilities-specification.md` - 유틸리티 함수 스펙
   - `constants-definition.md` - 상수 정의

답변이 완료되면 "done" 또는 "완료"라고 입력해주세요.
