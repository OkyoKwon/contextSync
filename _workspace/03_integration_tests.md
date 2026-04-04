# 통합 테스트 보고서

## 인프라

### 테스트 헬퍼

| 파일                              | 역할                                                   |
| --------------------------------- | ------------------------------------------------------ |
| `test-helpers/create-test-app.ts` | Fastify 앱 빌드 (모든 플러그인 + 라우트 등록, DB 모킹) |
| `test-helpers/auth-helper.ts`     | JWT 토큰 생성 (정상/만료/다중 사용자)                  |

### 통합 테스트 접근법

- **Fastify inject** 방식: `app.inject({ method, url, payload, headers })`
- DB는 `createMockDb()`로 모킹, Fastify 플러그인 체인은 실제 실행
- 서비스 레이어는 `vi.mock()`으로 모킹 → **routes 코드의 실제 커버리지 확보**
- JWT 인증: `@fastify/jwt`로 실제 토큰 서명/검증

## 작성된 통합 테스트

| 파일                                            | 테스트 수 | 대상 라우트                                                                                                                                                            |
| ----------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth/auth.routes.integration.test.ts`          | 29        | POST /login, /identify, /identify/select, GET /me, POST /refresh, PUT /me/plan, PUT /me/api-key, DELETE /me/api-key, PUT /me/supabase-token, DELETE /me/supabase-token |
| `projects/project.routes.integration.test.ts`   | 10        | POST /projects, GET /projects, GET /projects/:id, PATCH /projects/:id, DELETE /projects/:id, POST /projects/join                                                       |
| `sessions/session.routes.integration.test.ts`   | 5         | GET /projects/:id/sessions, GET /sessions/:id, GET /sessions/export/markdown                                                                                           |
| `conflicts/conflict.routes.integration.test.ts` | 6         | GET /projects/:id/conflicts, GET /conflicts/:id, PATCH /conflicts/:id, PATCH /batch-resolve                                                                            |
| `plans/plan.routes.integration.test.ts`         | 4         | GET /plans/local, GET /plans/local/:filename, DELETE /plans/local/:filename                                                                                            |
| `admin/admin.routes.integration.test.ts`        | 3         | GET /admin/status, GET /admin/config                                                                                                                                   |

**총 57개 통합 테스트**

## 검증 항목

- HTTP 상태 코드 (200, 201, 400, 401, 404, 500)
- 응답 body 구조 (success, data, error, meta)
- 인증 필요 엔드포인트의 401 응답
- 만료/잘못된 토큰 처리
- Zod 유효성 검사 실패 처리
- 페이지네이션 메타 반환

## 커버리지 변화 (Routes)

| 모듈               | Before | After           |
| ------------------ | ------ | --------------- |
| auth.routes.ts     | 0%     | **100%**        |
| project.routes.ts  | 0%     | **59.25%**      |
| session.routes.ts  | 0%     | **49.35%**      |
| conflict.routes.ts | 0%     | **51.26%**      |
| plan.routes.ts     | 0%     | **100% (추정)** |
| admin.routes.ts    | 0%     | **64.86%**      |
| activity.routes.ts | 0%     | **45.45%**      |
| search.routes.ts   | 0%     | **73.91%**      |
