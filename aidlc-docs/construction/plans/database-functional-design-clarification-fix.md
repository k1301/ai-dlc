# Database Functional Design - Clarification Fix Needed

## Issue with CQ4 Answer

**발견된 문제**:
CQ4의 `[Answer (scope)]`에 **F**를 선택하셨는데, Scope 옵션은 A, B, C, D, E만 있습니다.

**F와 G는 필터링 방식 옵션**입니다 (추가 질문):
- F) Filter by default
- G) Explicit filter

**Scope 옵션** (원래 질문):
- A) Limited Scope - menus, categories, users만
- B) Extended Scope - menus, categories, users, tables
- C) All Except Orders/Sessions
- D) Truly All - 8개 테이블 모두
- E) Other

---

## CQ4 재답변 필요

### Question: Soft Delete 적용 테이블 범위

A) **Limited Scope** - `menus`, `categories`, `users` 테이블만 (추천)
B) **Extended Scope** - `menus`, `categories`, `users`, `tables` 테이블
C) **All Except Orders/Sessions**
D) **Truly All** - 8개 테이블 모두
E) Other

[Answer (scope)]: A

### Question: Soft Delete 필터링 방식

F) **Filter by default** - 모든 쿼리에서 기본적으로 deleted_at IS NULL 필터 (추천)
G) **Explicit filter** - 필요시에만 명시적으로 필터링

[Answer (filter)]: G (이미 선택하신 답변)

---

**Scope 질문에만 답변해주세요** (A, B, C, D, E 중 선택)
