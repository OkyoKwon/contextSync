# E2E Test Cases

> **총 99개 테스트 케이스** | Playwright + Custom Fixtures (auth, api, db)
>
> 테스트 경로: `e2e/tests/`

---

## 1. Smoke Tests

**파일:** `e2e/tests/smoke.spec.ts` (4 TC)

| #   | TC ID   | 테스트명                                | 설명                                 | 검증 항목                                  |
| --- | ------- | --------------------------------------- | ------------------------------------ | ------------------------------------------ |
| 1   | SMK-001 | API health check returns ok             | API 헬스체크 엔드포인트 정상 응답    | `GET /api/health` → `{ status: 'ok' }`     |
| 2   | SMK-002 | Login API returns token and user        | 로그인 API에서 토큰과 유저 정보 반환 | token, user.id, user.email, user.name 존재 |
| 3   | SMK-003 | Authenticated page can access dashboard | 인증된 사용자의 대시보드 접근        | URL이 `/login`이 아닌 것 확인              |
| 4   | SMK-004 | DB connection works                     | 데이터베이스 연결 확인               | `SELECT count(*) FROM users` 실행 가능     |

---

## 2. Authentication

### 2-1. Login Flow

**파일:** `e2e/tests/auth/login.spec.ts` (4 TC)

| #   | TC ID    | 테스트명                                                  | 설명                                           | 검증 항목                                 |
| --- | -------- | --------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------- |
| 5   | AUTH-001 | New user login → onboarding → dashboard                   | 신규 유저 로그인 후 온보딩 거쳐 대시보드 도달  | 온보딩 프로젝트 생성 → URL → `/dashboard` |
| 6   | AUTH-002 | Existing user login → dashboard directly                  | 기존 유저 로그인 시 대시보드 직행              | URL → `/dashboard`                        |
| 7   | AUTH-003 | Empty field submission is blocked                         | 빈 필드 제출 차단                              | URL이 `/login`에 유지                     |
| 8   | AUTH-004 | Authenticated user visiting /login redirects to dashboard | 인증 유저가 /login 방문 시 대시보드 리다이렉트 | URL → `/dashboard`                        |

### 2-2. Auto User

**파일:** `e2e/tests/auth/auto-user.spec.ts` (4 TC)

| #   | TC ID    | 테스트명                                         | 설명                           | 검증 항목                        |
| --- | -------- | ------------------------------------------------ | ------------------------------ | -------------------------------- |
| 9   | AUTO-001 | Auto login creates user with is_auto=true        | auto-login 시 Auto User 생성   | email에 `@local` 포함, name 확인 |
| 10  | AUTO-002 | Auto user can create project                     | Auto User도 프로젝트 생성 가능 | project.id 존재                  |
| 11  | AUTO-003 | Auto user is blocked from creating invitations   | Auto User 초대 생성 시 403     | status === 403, 에러 메시지 확인 |
| 12  | AUTO-004 | Auto user is blocked from removing collaborators | Auto User 협업자 삭제 시 403   | status === 403, 에러 메시지 확인 |

### 2-3. Auto User Upgrade

**파일:** `e2e/tests/auth/upgrade.spec.ts` (4 TC)

| #   | TC ID    | 테스트명                                    | 설명                                         | 검증 항목                             |
| --- | -------- | ------------------------------------------- | -------------------------------------------- | ------------------------------------- |
| 13  | UPGR-001 | Upgrade auto user with new email            | 새 이메일로 Auto User 업그레이드             | 업그레이드 후 email/name 변경 확인    |
| 14  | UPGR-002 | Upgraded user can create invitations        | 업그레이드 후 초대 생성 가능                 | invitation.id 존재                    |
| 15  | UPGR-003 | Upgrade with existing email merges data     | 기존 유저 이메일로 업그레이드 시 데이터 병합 | 기존 유저 ID 반환, 프로젝트 모두 소유 |
| 16  | UPGR-004 | Upgrade already-upgraded user returns error | 이미 업그레이드된 유저 재업그레이드 시 에러  | status === 400                        |

### 2-4. Auth Guard

**파일:** `e2e/tests/auth/auth-guard.spec.ts` (6 TC)

| #   | TC ID     | 테스트명                                         | 설명                                          | 검증 항목                         |
| --- | --------- | ------------------------------------------------ | --------------------------------------------- | --------------------------------- |
| 17  | GUARD-001 | /dashboard redirects to /login (unauthenticated) | 미인증 → /dashboard 접근 시 로그인 리다이렉트 | URL → `/login`                    |
| 18  | GUARD-002 | /project redirects to /login (unauthenticated)   | 미인증 → /project 접근 시 로그인 리다이렉트   | URL → `/login`                    |
| 19  | GUARD-003 | /conflicts redirects to /login (unauthenticated) | 미인증 → /conflicts 접근 시 로그인 리다이렉트 | URL → `/login`                    |
| 20  | GUARD-004 | /settings redirects to /login (unauthenticated)  | 미인증 → /settings 접근 시 로그인 리다이렉트  | URL → `/login`                    |
| 21  | GUARD-005 | / redirects to /login (unauthenticated)          | 미인증 → / 접근 시 auto-login 실패 → 로그인   | URL → `/login`                    |
| 22  | GUARD-006 | Public routes are accessible without auth        | 공개 라우트 (/docs, /login) 접근 가능         | 각 URL 정상 접근, 리다이렉트 없음 |

---

## 3. Routing

**파일:** `e2e/tests/routing/redirects.spec.ts` (4 TC)

| #   | TC ID     | 테스트명                                         | 설명                             | 검증 항목                     |
| --- | --------- | ------------------------------------------------ | -------------------------------- | ----------------------------- |
| 23  | ROUTE-001 | /sessions redirects to /project                  | 레거시 경로 리다이렉트           | URL → `/project`              |
| 24  | ROUTE-002 | /sessions/:id redirects to /project/sessions/:id | 세션 상세 레거시 경로 리다이렉트 | URL → `/project/sessions/:id` |
| 25  | ROUTE-003 | /settings/team redirects to /settings            | 팀 설정 경로 리다이렉트          | pathname === `/settings`      |
| 26  | ROUTE-004 | /settings/project redirects to /settings         | 프로젝트 설정 경로 리다이렉트    | pathname === `/settings`      |

---

## 4. API

### 4-1. API Response Envelope

**파일:** `e2e/tests/api/api-envelope.spec.ts` (4 TC)

| #   | TC ID   | 테스트명                           | 설명                          | 검증 항목                                                  |
| --- | ------- | ---------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| 27  | API-001 | Success response has correct shape | 성공 응답 구조 검증           | `{ success: true, data: non-null, error: null }`           |
| 28  | API-002 | Error response has correct shape   | 에러 응답 구조 검증           | `{ success: false, data: null, error: string }`            |
| 29  | API-003 | 401 response when no token         | 토큰 없이 요청 시 401         | status === 401                                             |
| 30  | API-004 | Paginated response includes meta   | 페이지네이션 응답에 meta 포함 | `meta.total`, `meta.page`, `meta.limit`, `meta.totalPages` |

### 4-2. Sessions API

**파일:** `e2e/tests/api/sessions-api.spec.ts` (5 TC)

| #   | TC ID    | 테스트명                                   | 설명                                       | 검증 항목                                                        |
| --- | -------- | ------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------- |
| 31  | SAPI-001 | Session list pagination                    | 세션 목록 페이지네이션 (3개 세션, limit=2) | data.length === 2, meta.total === 3, meta.totalPages === 2       |
| 32  | SAPI-002 | Session detail includes title and messages | 세션 상세에 제목과 메시지 포함             | title === 'Auth Feature Implementation', messages.length === 4   |
| 33  | SAPI-003 | Update session title                       | 세션 제목 수정                             | title === 'Updated Title'                                        |
| 34  | SAPI-004 | Delete session returns 404 on re-fetch     | 세션 삭제 후 재조회 시 404                 | status === 404                                                   |
| 35  | SAPI-005 | Dashboard stats endpoint returns data      | 대시보드 통계 엔드포인트                   | todaySessions, weekSessions, activeConflicts, activeMembers 존재 |

### 4-3. Conflicts API

**파일:** `e2e/tests/api/conflicts-api.spec.ts` (5 TC)

| #   | TC ID    | 테스트명                       | 설명                            | 검증 항목                         |
| --- | -------- | ------------------------------ | ------------------------------- | --------------------------------- |
| 36  | CAPI-001 | List conflicts with pagination | 충돌 목록 페이지네이션          | success === true, meta.page === 1 |
| 37  | CAPI-002 | Get conflict detail            | 충돌 상세 조회                  | id 일치, status 존재              |
| 38  | CAPI-003 | Update conflict status         | 충돌 상태 업데이트 (→ resolved) | status === 'resolved'             |
| 39  | CAPI-004 | Assign reviewer to conflict    | 충돌에 리뷰어 할당              | reviewerId === userB.id           |
| 40  | CAPI-005 | Add review notes to conflict   | 충돌에 리뷰 노트 추가           | reviewNotes 일치                  |

---

## 5. Admin

**파일:** `e2e/tests/admin/admin-dashboard.spec.ts` (3 TC)

| #   | TC ID   | 테스트명                                  | 설명                               | 검증 항목                       |
| --- | ------- | ----------------------------------------- | ---------------------------------- | ------------------------------- |
| 41  | ADM-001 | Admin page renders                        | 어드민 페이지 렌더링               | URL이 admin 또는 dashboard 포함 |
| 42  | ADM-002 | Regular user cannot access admin API      | 일반 유저 어드민 API 접근 차단     | status === 403                  |
| 43  | ADM-003 | Admin status endpoint requires admin role | 어드민 config 엔드포인트 권한 검증 | status === 403                  |

---

## 6. Navigation

### 6-1. Keyboard Shortcuts

**파일:** `e2e/tests/navigation/keyboard-shortcuts.spec.ts` (5 TC)

| #   | TC ID   | 테스트명                          | 설명                             | 검증 항목             |
| --- | ------- | --------------------------------- | -------------------------------- | --------------------- |
| 44  | NAV-001 | Meta+1 navigates to /dashboard    | 키보드 단축키로 대시보드 이동    | URL → `/dashboard`    |
| 45  | NAV-002 | Meta+2 navigates to /project      | 키보드 단축키로 프로젝트 이동    | URL → `/project`      |
| 46  | NAV-003 | Meta+3 navigates to /conflicts    | 키보드 단축키로 충돌 페이지 이동 | URL → `/conflicts`    |
| 47  | NAV-004 | Meta+4 navigates to /prd-analysis | 키보드 단축키로 PRD 분석 이동    | URL → `/prd-analysis` |
| 48  | NAV-005 | Meta+5 navigates to /settings     | 키보드 단축키로 설정 이동        | URL → `/settings`     |

### 6-2. Command Palette

**파일:** `e2e/tests/navigation/command-palette.spec.ts` (4 TC)

| #   | TC ID   | 테스트명                                     | 설명                                    | 검증 항목            |
| --- | ------- | -------------------------------------------- | --------------------------------------- | -------------------- |
| 49  | CMD-001 | Meta+K or search button opens search overlay | 검색 오버레이 열기                      | Search input visible |
| 50  | CMD-002 | Search button click opens overlay            | 검색 버튼 클릭으로 오버레이 열기        | Search input visible |
| 51  | CMD-003 | Typing query shows results or empty message  | 검색어 입력 시 결과 또는 빈 메시지 표시 | Search input 유지    |
| 52  | CMD-004 | Escape closes search overlay                 | ESC로 검색 오버레이 닫기                | Search input hidden  |

### 6-3. Sidebar

**파일:** `e2e/tests/navigation/sidebar.spec.ts` (3 TC)

| #   | TC ID    | 테스트명                            | 설명                                | 검증 항목                                |
| --- | -------- | ----------------------------------- | ----------------------------------- | ---------------------------------------- |
| 53  | SIDE-001 | Navigation links are rendered       | 사이드바 네비게이션 링크 렌더링     | Dashboard, Conversations, Conflicts 표시 |
| 54  | SIDE-002 | Clicking nav link navigates to page | 네비게이션 링크 클릭 시 페이지 이동 | URL → `/conflicts`                       |
| 55  | SIDE-003 | Sidebar collapse/expand toggle      | 사이드바 접기/펼치기 토글           | class 변경 (w-60 ↔ w-16)                 |

### 6-4. User Dropdown

**파일:** `e2e/tests/navigation/user-dropdown.spec.ts` (3 TC)

| #   | TC ID    | 테스트명                                    | 설명                                | 검증 항목                                       |
| --- | -------- | ------------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| 56  | DROP-001 | Avatar click opens dropdown with menu items | 아바타 클릭 시 드롭다운 메뉴 표시   | 'Log out' 표시                                  |
| 57  | DROP-002 | Theme toggle changes theme                  | 테마 토글로 테마 변경               | data-theme 속성 변경                            |
| 58  | DROP-003 | Logout clears auth and redirects            | 로그아웃 시 인증 해제 및 리다이렉트 | URL → `/` 또는 `/login`, localStorage 토큰 null |

---

## 7. Conflicts

### 7-1. Conflict Detection

**파일:** `e2e/tests/conflicts/conflict-detection.spec.ts` (3 TC)

| #   | TC ID    | 테스트명                                        | 설명                                     | 검증 항목                                  |
| --- | -------- | ----------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| 59  | CDET-001 | Overlapping file paths create conflicts         | 겹치는 파일 경로가 있는 세션 → 충돌 생성 | conflicts.length >= 1                      |
| 60  | CDET-002 | Non-overlapping file paths produce no conflicts | 겹치지 않는 파일 경로 → 충돌 없음        | conflicts.length === 0                     |
| 61  | CDET-003 | Conflict severity is valid                      | 충돌 severity 값 유효성 검증             | severity ∈ ['info', 'warning', 'critical'] |

### 7-2. Conflict Resolution

**파일:** `e2e/tests/conflicts/conflict-resolution.spec.ts` (4 TC)

| #   | TC ID    | 테스트명                             | 설명                         | 검증 항목                                 |
| --- | -------- | ------------------------------------ | ---------------------------- | ----------------------------------------- |
| 62  | CRES-001 | Conflicts page shows conflict list   | 충돌 페이지에 충돌 목록 표시 | 'conflict' 또는 'no conflict' 텍스트 포함 |
| 63  | CRES-002 | Filter conflicts by severity via API | severity 필터로 충돌 조회    | 필터된 결과의 severity === 'warning'      |
| 64  | CRES-003 | Resolve conflict via API             | API로 충돌 해결              | status === 'resolved'                     |
| 65  | CRES-004 | Resolve conflict via UI              | UI에서 충돌 해결 버튼 클릭   | 'resolved' 텍스트 표시                    |

---

## 8. Projects

### 8-1. Project CRUD

**파일:** `e2e/tests/projects/project-crud.spec.ts` (5 TC)

| #   | TC ID    | 테스트명                                       | 설명                                   | 검증 항목                       |
| --- | -------- | ---------------------------------------------- | -------------------------------------- | ------------------------------- |
| 66  | PROJ-001 | Create project via API and see it on dashboard | API로 프로젝트 생성 후 대시보드에 표시 | 대시보드에 프로젝트명 포함      |
| 67  | PROJ-002 | List projects via API                          | API로 프로젝트 목록 조회               | 생성한 프로젝트 존재            |
| 68  | PROJ-003 | Update project via API                         | API로 프로젝트 수정                    | name === 'Updated Project Name' |
| 69  | PROJ-004 | Delete project via API                         | API로 프로젝트 삭제                    | 삭제 후 목록에서 미발견         |
| 70  | PROJ-005 | Edit project on settings page                  | 설정 페이지에서 프로젝트 수정          | 변경된 이름 표시                |

### 8-2. Project Collaboration

**파일:** `e2e/tests/projects/project-collaboration.spec.ts` (5 TC)

| #   | TC ID      | 테스트명                            | 설명                                | 검증 항목                      |
| --- | ---------- | ----------------------------------- | ----------------------------------- | ------------------------------ |
| 71  | COLLAB-001 | Create invitation                   | 초대 생성                           | invitation.id 존재, email 일치 |
| 72  | COLLAB-002 | List project invitations            | 프로젝트 초대 목록 조회             | 생성한 초대 존재               |
| 73  | COLLAB-003 | Invitee can see pending invitation  | 초대받은 유저가 대기 중인 초대 확인 | myInvitations.length >= 1      |
| 74  | COLLAB-004 | Accept invitation adds collaborator | 초대 수락 시 협업자 추가            | collaborators.length >= 1      |
| 75  | COLLAB-005 | Cancel invitation removes it        | 초대 취소 시 목록에서 제거          | 취소된 초대 미발견             |

---

## 9. Sessions

### 9-1. Session List

**파일:** `e2e/tests/sessions/session-list.spec.ts` (3 TC)

| #   | TC ID    | 테스트명                           | 설명                         | 검증 항목                                                       |
| --- | -------- | ---------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| 76  | SESS-001 | Imported sessions exist via API    | 임포트된 세션 API에서 확인   | titles에 'Auth Feature Implementation', 'Auth Refactoring' 포함 |
| 77  | SESS-002 | Session detail page shows title    | 세션 상세 페이지에 제목 표시 | 페이지에 세션 제목 텍스트 포함                                  |
| 78  | SESS-003 | Delete session removes it from API | 세션 삭제 후 API에서 미발견  | 삭제된 세션 ID 미발견                                           |

### 9-2. Session Import

**파일:** `e2e/tests/sessions/session-import.spec.ts` (4 TC)

| #   | TC ID   | 테스트명                           | 설명                         | 검증 항목                           |
| --- | ------- | ---------------------------------- | ---------------------------- | ----------------------------------- |
| 79  | IMP-001 | Import JSON session via API        | JSON 세션 파일 API 임포트    | session.id 존재, messageCount === 4 |
| 80  | IMP-002 | Import JSONL session via API       | JSONL 세션 파일 API 임포트   | session.id 존재, messageCount === 2 |
| 81  | IMP-003 | Import session via UI upload modal | UI 업로드 모달로 세션 임포트 | 에러 없이 흐름 완료                 |
| 82  | IMP-004 | Reject missing file upload         | 파일 없이 임포트 시 실패     | success === false                   |

---

## 10. Search

**파일:** `e2e/tests/search/full-text-search.spec.ts` (3 TC)

| #   | TC ID    | 테스트명                                   | 설명                             | 검증 항목            |
| --- | -------- | ------------------------------------------ | -------------------------------- | -------------------- |
| 83  | SRCH-001 | Search API returns matching results        | 'auth' 검색 시 결과 반환         | results.length > 0   |
| 84  | SRCH-002 | Search with nonexistent term returns empty | 존재하지 않는 검색어 → 빈 결과   | results.length === 0 |
| 85  | SRCH-003 | Search type filter works                   | type 필터 (session/message) 적용 | 각 결과의 type 일치  |

---

## 11. PRD Analysis

**파일:** `e2e/tests/prd-analysis/prd-analysis.spec.ts` (4 TC)

| #   | TC ID   | 테스트명                                  | 설명                              | 검증 항목                     |
| --- | ------- | ----------------------------------------- | --------------------------------- | ----------------------------- |
| 86  | PRD-001 | Upload PRD document via API               | PRD 문서 API 업로드               | id 존재, title === 'Test PRD' |
| 87  | PRD-002 | List PRD documents                        | PRD 문서 목록 조회                | documents.length >= 1         |
| 88  | PRD-003 | Delete PRD document                       | PRD 문서 삭제                     | 삭제 후 목록에서 미발견       |
| 89  | PRD-004 | Analysis fails gracefully without API key | API 키 없이 분석 시 graceful 실패 | status >= 200                 |

---

## 12. Plans

**파일:** `e2e/tests/plans/plans.spec.ts` (3 TC)

| #   | TC ID    | 테스트명                        | 설명                      | 검증 항목                                              |
| --- | -------- | ------------------------------- | ------------------------- | ------------------------------------------------------ |
| 90  | PLAN-001 | Plans page renders              | Plans 페이지 렌더링       | URL → `/plans`, root 엘리먼트 visible                  |
| 91  | PLAN-002 | List plans via API              | API로 플랜 목록 조회      | Array.isArray(plans) === true                          |
| 92  | PLAN-003 | Empty state shown when no plans | 플랜 없을 때 빈 상태 표시 | 'plan', 'no plan', 'empty', 'get started' 중 하나 포함 |

---

## 13. Settings

**파일:** `e2e/tests/settings/settings.spec.ts` (4 TC)

| #   | TC ID   | 테스트명                      | 설명                               | 검증 항목                              |
| --- | ------- | ----------------------------- | ---------------------------------- | -------------------------------------- |
| 93  | SET-001 | Project info is displayed     | 설정 페이지에 프로젝트 정보 표시   | 'Project Info' 텍스트 visible          |
| 94  | SET-002 | Edit project name             | 설정 페이지에서 프로젝트 이름 수정 | 변경된 이름 표시                       |
| 95  | SET-003 | Delete project section exists | 프로젝트 삭제 섹션 존재            | 'Delete Project' 또는 'Delete' visible |
| 96  | SET-004 | Collaborators section exists  | 협업자 섹션 존재                   | 'Collaborators' heading visible        |

---

## 14. AI Evaluation

**파일:** `e2e/tests/ai-evaluation/ai-evaluation.spec.ts` (3 TC)

| #   | TC ID    | 테스트명                                            | 설명                                     | 검증 항목                                     |
| --- | -------- | --------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| 97  | EVAL-001 | Evaluation page renders                             | AI 평가 페이지 렌더링                    | URL → `/ai-evaluation`, root 엘리먼트 visible |
| 98  | EVAL-002 | Evaluation trigger fails gracefully without API key | API 키 없이 평가 트리거 시 graceful 실패 | success === false                             |
| 99  | EVAL-003 | Empty evaluation history                            | 빈 평가 히스토리 조회                    | data.length === 0                             |

---

## Test Infrastructure

### Fixtures

| Fixture           | 설명                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `auth.fixture.ts` | 인증 컨텍스트 — `apiClient`, `testUser`, `testProjectId`, `authenticatedPage`, `db` 제공    |
| `api.fixture.ts`  | API 클라이언트 — `fetchRaw`, `get`, `post`, `patch`, `del`, `importSession`, `uploadPrd` 등 |
| `db.fixture.ts`   | Kysely DB 인스턴스 직접 접근                                                                |

### Helpers

| Helper                  | 설명                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `test-data.ts`          | `buildUser()`, `buildProject()` — 고유한 테스트 데이터 생성 |
| `wait-for.ts`           | `waitForAppReady()` — 앱 로딩 완료 대기                     |
| `invitation-helpers.ts` | `addCollaborator()`, `getInvitationToken()` — DB 직접 조작  |

### Session Fixtures

| 파일                    | 설명                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| `sample-session.json`   | 'Auth Feature Implementation' (4 messages, paths: src/auth/login.ts 등) |
| `sample-session-2.json` | 'Auth Refactoring' (paths: src/auth/login.ts 등, 충돌 감지용)           |
| `sample-session.jsonl`  | JSONL 포맷 세션 (2 messages, 비충돌 경로)                               |
| `sample-prd.md`         | PRD 분석용 샘플 문서                                                    |
