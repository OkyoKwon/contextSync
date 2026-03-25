# E2E Test Cases

> **163 total test cases** | Playwright + Custom Fixtures (auth, api, db)
>
> Test path: `e2e/tests/`

---

## 1. Smoke Tests

**File:** `e2e/tests/smoke.spec.ts` (4 TC)

| #   | TC ID   | Test Name                               | Description                             | Assertions                                  |
| --- | ------- | --------------------------------------- | --------------------------------------- | ------------------------------------------- |
| 1   | SMK-001 | API health check returns ok             | API health check endpoint responds OK   | `GET /api/health` → `{ status: 'ok' }`      |
| 2   | SMK-002 | Login API returns token and user        | Login API returns token and user info   | token, user.id, user.email, user.name exist |
| 3   | SMK-003 | Authenticated page can access dashboard | Authenticated user can access dashboard | URL is not `/login`                         |
| 4   | SMK-004 | DB connection works                     | Database connection verification        | `SELECT count(*) FROM users` executes       |

---

## 2. Authentication

### 2-1. Login Flow

**File:** `e2e/tests/auth/login.spec.ts` (4 TC)

| #   | TC ID    | Test Name                                                 | Description                                               | Assertions                                      |
| --- | -------- | --------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------- |
| 5   | AUTH-001 | New user login → onboarding → dashboard                   | New user logs in, completes onboarding, reaches dashboard | Onboarding project created → URL → `/dashboard` |
| 6   | AUTH-002 | Existing user login → dashboard directly                  | Existing user logs in directly to dashboard               | URL → `/dashboard`                              |
| 7   | AUTH-003 | Empty field submission is blocked                         | Empty field submission is blocked                         | URL remains at `/login`                         |
| 8   | AUTH-004 | Authenticated user visiting /login redirects to dashboard | Authenticated user visiting /login redirects to dashboard | URL → `/dashboard`                              |

### 2-2. Auth Guard

**File:** `e2e/tests/auth/auth-guard.spec.ts` (6 TC)

| #   | TC ID     | Test Name                                        | Description                                               | Assertions                      |
| --- | --------- | ------------------------------------------------ | --------------------------------------------------------- | ------------------------------- |
| 17  | GUARD-001 | /dashboard redirects to /login (unauthenticated) | Unauthenticated → /dashboard redirects to login           | URL → `/login`                  |
| 18  | GUARD-002 | /project redirects to /login (unauthenticated)   | Unauthenticated → /project redirects to login             | URL → `/login`                  |
| 19  | GUARD-003 | /conflicts redirects to /login (unauthenticated) | Unauthenticated → /conflicts redirects to login           | URL → `/login`                  |
| 20  | GUARD-004 | /settings redirects to /login (unauthenticated)  | Unauthenticated → /settings redirects to login            | URL → `/login`                  |
| 21  | GUARD-005 | / redirects to /login (unauthenticated)          | Unauthenticated → / auto-login fails → redirects to login | URL → `/login`                  |
| 22  | GUARD-006 | Public routes are accessible without auth        | Public routes (/docs, /login) are accessible              | Each URL loads without redirect |

### 2-5. Identify Flow

**File:** `e2e/tests/auth/identify.spec.ts` (4 TC)

| #   | TC ID        | Test Name                                              | Description                                                                | Assertions                                    |
| --- | ------------ | ------------------------------------------------------ | -------------------------------------------------------------------------- | --------------------------------------------- |
| 149 | IDENTIFY-001 | New name creates user and redirects to onboarding      | Enter a new name at /identify, user is created, redirect to /onboarding    | Token issued, URL contains '/onboarding'      |
| 150 | IDENTIFY-002 | Existing name recovers user and redirects to dashboard | Enter existing user name at /identify, user is recovered with existing JWT | Token issued, URL contains '/dashboard'       |
| 151 | IDENTIFY-003 | Duplicate names show candidate selection UI            | Enter a name shared by multiple users, candidate list is displayed         | Candidate list visible, user count matches    |
| 152 | IDENTIFY-004 | Duplicate names allow creating new account             | From candidate selection, click create new account                         | New user created, token issued, redirect to / |

---

## 3. Routing

**File:** `e2e/tests/routing/redirects.spec.ts` (4 TC)

| #   | TC ID     | Test Name                                        | Description                          | Assertions                    |
| --- | --------- | ------------------------------------------------ | ------------------------------------ | ----------------------------- |
| 23  | ROUTE-001 | /sessions redirects to /project                  | Legacy route redirect                | URL → `/project`              |
| 24  | ROUTE-002 | /sessions/:id redirects to /project/sessions/:id | Session detail legacy route redirect | URL → `/project/sessions/:id` |
| 25  | ROUTE-003 | /settings/team redirects to /settings            | Team settings route redirect         | pathname === `/settings`      |
| 26  | ROUTE-004 | /settings/project redirects to /settings         | Project settings route redirect      | pathname === `/settings`      |

---

## 4. API

### 4-1. API Response Envelope

**File:** `e2e/tests/api/api-envelope.spec.ts` (4 TC)

| #   | TC ID   | Test Name                          | Description                       | Assertions                                                 |
| --- | ------- | ---------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| 27  | API-001 | Success response has correct shape | Verify success response structure | `{ success: true, data: non-null, error: null }`           |
| 28  | API-002 | Error response has correct shape   | Verify error response structure   | `{ success: false, data: null, error: string }`            |
| 29  | API-003 | 401 response when no token         | Request without token returns 401 | status === 401                                             |
| 30  | API-004 | Paginated response includes meta   | Paginated response includes meta  | `meta.total`, `meta.page`, `meta.limit`, `meta.totalPages` |

### 4-2. Sessions API

**File:** `e2e/tests/api/sessions-api.spec.ts` (5 TC)

| #   | TC ID    | Test Name                                  | Description                                   | Assertions                                                        |
| --- | -------- | ------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------- |
| 31  | SAPI-001 | Session list pagination                    | Session list pagination (3 sessions, limit=2) | data.length === 2, meta.total === 3, meta.totalPages === 2        |
| 32  | SAPI-002 | Session detail includes title and messages | Session detail includes title and messages    | title === 'Auth Feature Implementation', messages.length === 4    |
| 33  | SAPI-003 | Update session title                       | Update session title                          | title === 'Updated Title'                                         |
| 34  | SAPI-004 | Delete session returns 404 on re-fetch     | Deleted session returns 404 on re-fetch       | status === 404                                                    |
| 35  | SAPI-005 | Dashboard stats endpoint returns data      | Dashboard stats endpoint                      | todaySessions, weekSessions, activeConflicts, activeMembers exist |

### 4-3. Conflicts API

**File:** `e2e/tests/api/conflicts-api.spec.ts` (5 TC)

| #   | TC ID    | Test Name                      | Description                         | Assertions                        |
| --- | -------- | ------------------------------ | ----------------------------------- | --------------------------------- |
| 36  | CAPI-001 | List conflicts with pagination | Conflict list with pagination       | success === true, meta.page === 1 |
| 37  | CAPI-002 | Get conflict detail            | Get conflict detail                 | id matches, status exists         |
| 38  | CAPI-003 | Update conflict status         | Update conflict status (→ resolved) | status === 'resolved'             |
| 39  | CAPI-004 | Assign reviewer to conflict    | Assign reviewer to conflict         | reviewerId === userB.id           |
| 40  | CAPI-005 | Add review notes to conflict   | Add review notes to conflict        | reviewNotes match                 |

---

## 5. Admin

**File:** `e2e/tests/admin/admin-dashboard.spec.ts` (3 TC)

| #   | TC ID   | Test Name                                 | Description                               | Assertions                      |
| --- | ------- | ----------------------------------------- | ----------------------------------------- | ------------------------------- |
| 41  | ADM-001 | Admin page renders                        | Admin page renders                        | URL contains admin or dashboard |
| 42  | ADM-002 | Regular user cannot access admin API      | Regular user blocked from admin API       | status === 403                  |
| 43  | ADM-003 | Admin status endpoint requires admin role | Admin config endpoint requires admin role | status === 403                  |

---

## 6. Navigation

### 6-1. Keyboard Shortcuts

**File:** `e2e/tests/navigation/keyboard-shortcuts.spec.ts` (5 TC)

| #   | TC ID   | Test Name                         | Description                         | Assertions            |
| --- | ------- | --------------------------------- | ----------------------------------- | --------------------- |
| 44  | NAV-001 | Meta+1 navigates to /dashboard    | Keyboard shortcut to dashboard      | URL → `/dashboard`    |
| 45  | NAV-002 | Meta+2 navigates to /project      | Keyboard shortcut to project        | URL → `/project`      |
| 46  | NAV-003 | Meta+3 navigates to /conflicts    | Keyboard shortcut to conflicts page | URL → `/conflicts`    |
| 47  | NAV-004 | Meta+4 navigates to /prd-analysis | Keyboard shortcut to PRD analysis   | URL → `/prd-analysis` |
| 48  | NAV-005 | Meta+5 navigates to /settings     | Keyboard shortcut to settings       | URL → `/settings`     |

### 6-2. Command Palette

**File:** `e2e/tests/navigation/command-palette.spec.ts` (4 TC)

| #   | TC ID   | Test Name                                    | Description                                 | Assertions           |
| --- | ------- | -------------------------------------------- | ------------------------------------------- | -------------------- |
| 49  | CMD-001 | Meta+K or search button opens search overlay | Open search overlay                         | Search input visible |
| 50  | CMD-002 | Search button click opens overlay            | Click search button to open overlay         | Search input visible |
| 51  | CMD-003 | Typing query shows results or empty message  | Typing query shows results or empty message | Search input present |
| 52  | CMD-004 | Escape closes search overlay                 | ESC closes search overlay                   | Search input hidden  |

### 6-3. Sidebar

**File:** `e2e/tests/navigation/sidebar.spec.ts` (3 TC)

| #   | TC ID    | Test Name                           | Description                         | Assertions                                |
| --- | -------- | ----------------------------------- | ----------------------------------- | ----------------------------------------- |
| 53  | SIDE-001 | Navigation links are rendered       | Sidebar navigation links render     | Dashboard, Conversations, Conflicts shown |
| 54  | SIDE-002 | Clicking nav link navigates to page | Clicking nav link navigates to page | URL → `/conflicts`                        |
| 55  | SIDE-003 | Sidebar collapse/expand toggle      | Sidebar collapse/expand toggle      | Class changes (w-60 ↔ w-16)               |

### 6-4. User Dropdown

**File:** `e2e/tests/navigation/user-dropdown.spec.ts` (3 TC)

| #   | TC ID    | Test Name                                   | Description                      | Assertions                                     |
| --- | -------- | ------------------------------------------- | -------------------------------- | ---------------------------------------------- |
| 56  | DROP-001 | Avatar click opens dropdown with menu items | Avatar click opens dropdown menu | 'Log out' shown                                |
| 57  | DROP-002 | Theme toggle changes theme                  | Theme toggle changes theme       | data-theme attribute changes                   |
| 58  | DROP-003 | Logout clears auth and redirects            | Logout clears auth and redirects | URL → `/` or `/login`, localStorage token null |

---

## 7. Conflicts

### 7-1. Conflict Detection

**File:** `e2e/tests/conflicts/conflict-detection.spec.ts` (3 TC)

| #   | TC ID    | Test Name                                       | Description                                           | Assertions                                 |
| --- | -------- | ----------------------------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| 59  | CDET-001 | Overlapping file paths create conflicts         | Sessions with overlapping file paths create conflicts | conflicts.length >= 1                      |
| 60  | CDET-002 | Non-overlapping file paths produce no conflicts | Non-overlapping file paths produce no conflicts       | conflicts.length === 0                     |
| 61  | CDET-003 | Conflict severity is valid                      | Conflict severity value validation                    | severity ∈ ['info', 'warning', 'critical'] |

### 7-2. Conflict Resolution

**File:** `e2e/tests/conflicts/conflict-resolution.spec.ts` (4 TC)

| #   | TC ID    | Test Name                            | Description                          | Assertions                                   |
| --- | -------- | ------------------------------------ | ------------------------------------ | -------------------------------------------- |
| 62  | CRES-001 | Conflicts page shows conflict list   | Conflicts page shows conflict list   | Contains 'conflict' or 'no conflict' text    |
| 63  | CRES-002 | Filter conflicts by severity via API | Filter conflicts by severity via API | Filtered results have severity === 'warning' |
| 64  | CRES-003 | Resolve conflict via API             | Resolve conflict via API             | status === 'resolved'                        |
| 65  | CRES-004 | Resolve conflict via UI              | Resolve conflict via UI button click | 'resolved' text shown                        |

---

## 8. Projects

### 8-1. Project CRUD

**File:** `e2e/tests/projects/project-crud.spec.ts` (5 TC)

| #   | TC ID    | Test Name                                      | Description                                 | Assertions                       |
| --- | -------- | ---------------------------------------------- | ------------------------------------------- | -------------------------------- |
| 66  | PROJ-001 | Create project via API and see it on dashboard | Create project via API, verify on dashboard | Dashboard contains project name  |
| 67  | PROJ-002 | List projects via API                          | List projects via API                       | Created project exists           |
| 68  | PROJ-003 | Update project via API                         | Update project via API                      | name === 'Updated Project Name'  |
| 69  | PROJ-004 | Delete project via API                         | Delete project via API                      | Not found in list after deletion |
| 70  | PROJ-005 | Edit project on settings page                  | Edit project on settings page               | Updated name shown               |

### 8-2. Project Collaboration (Join Code)

**File:** `e2e/tests/projects/project-collaboration.spec.ts` (5 TC)

> Join Code 기반 협업 시스템. Owner가 Join Code를 생성하면 팀원이 코드를 입력하여 프로젝트에 참여.

| #   | TC ID      | Test Name                         | Description                                          | Assertions                                   |
| --- | ---------- | --------------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| 71  | COLLAB-001 | Generate join code                | Owner generates a 6-character join code for project  | joinCode exists, length === 6                |
| 72  | COLLAB-002 | Join project by code              | New user joins project using join code               | joined project ID matches, collaborators ≥ 1 |
| 73  | COLLAB-003 | Regenerate join code              | Owner regenerates join code (old code invalidated)   | New code differs from original               |
| 74  | COLLAB-004 | Delete join code disables joining | Deleting join code prevents new members from joining | Attempt with old code returns 404            |
| 75  | COLLAB-005 | Invalid join code returns 404     | Non-existent join code returns 404                   | status === 404                               |

---

## 9. Sessions

### 9-1. Session List

**File:** `e2e/tests/sessions/session-list.spec.ts` (3 TC)

| #   | TC ID    | Test Name                          | Description                        | Assertions                                                       |
| --- | -------- | ---------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| 76  | SESS-001 | Imported sessions exist via API    | Imported sessions verified via API | Titles include 'Auth Feature Implementation', 'Auth Refactoring' |
| 77  | SESS-002 | Session detail page shows title    | Session detail page shows title    | Page contains session title text                                 |
| 78  | SESS-003 | Delete session removes it from API | Deleted session removed from API   | Deleted session ID not found                                     |

### 9-2. Session Import

**File:** `e2e/tests/sessions/session-import.spec.ts` (4 TC)

| #   | TC ID   | Test Name                          | Description                        | Assertions                            |
| --- | ------- | ---------------------------------- | ---------------------------------- | ------------------------------------- |
| 79  | IMP-001 | Import JSON session via API        | Import JSON session file via API   | session.id exists, messageCount === 4 |
| 80  | IMP-002 | Import JSONL session via API       | Import JSONL session file via API  | session.id exists, messageCount === 2 |
| 81  | IMP-003 | Import session via UI upload modal | Import session via UI upload modal | Flow completes without errors         |
| 82  | IMP-004 | Reject missing file upload         | Import without file fails          | success === false                     |

---

## 10. Search

**File:** `e2e/tests/search/full-text-search.spec.ts` (3 TC)

| #   | TC ID    | Test Name                                  | Description                           | Assertions                 |
| --- | -------- | ------------------------------------------ | ------------------------------------- | -------------------------- |
| 83  | SRCH-001 | Search API returns matching results        | Search for 'auth' returns results     | results.length > 0         |
| 84  | SRCH-002 | Search with nonexistent term returns empty | Nonexistent search term returns empty | results.length === 0       |
| 85  | SRCH-003 | Search type filter works                   | Type filter (session/message) applied | Each result's type matches |

---

## 11. PRD Analysis

**File:** `e2e/tests/prd-analysis/prd-analysis.spec.ts` (4 TC)

| #   | TC ID   | Test Name                                 | Description                               | Assertions                       |
| --- | ------- | ----------------------------------------- | ----------------------------------------- | -------------------------------- |
| 86  | PRD-001 | Upload PRD document via API               | Upload PRD document via API               | id exists, title === 'Test PRD'  |
| 87  | PRD-002 | List PRD documents                        | List PRD documents                        | documents.length >= 1            |
| 88  | PRD-003 | Delete PRD document                       | Delete PRD document                       | Not found in list after deletion |
| 89  | PRD-004 | Analysis fails gracefully without API key | Analysis fails gracefully without API key | status >= 200                    |

---

## 12. Plans

**File:** `e2e/tests/plans/plans.spec.ts` (3 TC)

| #   | TC ID    | Test Name                       | Description                     | Assertions                                            |
| --- | -------- | ------------------------------- | ------------------------------- | ----------------------------------------------------- |
| 90  | PLAN-001 | Plans page renders              | Plans page renders              | URL → `/plans`, root element visible                  |
| 91  | PLAN-002 | List plans via API              | List plans via API              | Array.isArray(plans) === true                         |
| 92  | PLAN-003 | Empty state shown when no plans | Empty state shown when no plans | Contains 'plan', 'no plan', 'empty', or 'get started' |

---

## 13. Settings

**File:** `e2e/tests/settings/settings.spec.ts` (6 TC)

| #   | TC ID   | Test Name                                   | Description                                 | Assertions                           |
| --- | ------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------ |
| 93  | SET-001 | Project info is displayed                   | Project info displayed on settings page     | 'Project Info' text visible          |
| 94  | SET-002 | Edit project name                           | Edit project name on settings page          | Updated name shown                   |
| 95  | SET-003 | Delete project section exists               | Delete project section exists               | 'Delete Project' or 'Delete' visible |
| 96  | SET-004 | Collaborators section exists                | Collaborators section exists                | 'Collaborators' heading visible      |
| 97  | SET-005 | Collaboration section exists                | Collaboration (Join Code) section exists    | 'Collaboration' heading visible      |
| 98  | SET-006 | Generate Join Code button visible for owner | Generate Join Code button visible for owner | 'Generate Join Code' button visible  |

---

## 14. AI Evaluation

**File:** `e2e/tests/ai-evaluation/ai-evaluation.spec.ts` (3 TC)

| #   | TC ID    | Test Name                                           | Description                                         | Assertions                                   |
| --- | -------- | --------------------------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| 99  | EVAL-001 | Evaluation page renders                             | AI evaluation page renders                          | URL → `/ai-evaluation`, root element visible |
| 100 | EVAL-002 | Evaluation trigger fails gracefully without API key | Evaluation trigger fails gracefully without API key | success === false                            |
| 101 | EVAL-003 | Empty evaluation history                            | Empty evaluation history query                      | data.length === 0                            |

---

## 15. Auth Profile & Token

**File:** `e2e/tests/auth/auth-profile.spec.ts` (4 TC)

| #   | TC ID    | Test Name                               | Description                      | Assertions                            |
| --- | -------- | --------------------------------------- | -------------------------------- | ------------------------------------- |
| 102 | PROF-001 | GET /me returns current user            | Fetch authenticated user profile | user.id, email, name match login data |
| 103 | PROF-002 | GET /me returns 401 without token       | Unauthenticated request rejected | status === 401                        |
| 104 | PROF-003 | POST /refresh returns new token         | Refresh JWT token                | token is truthy, typeof === 'string'  |
| 105 | PROF-004 | POST /refresh returns 401 without token | Unauthenticated refresh rejected | status === 401                        |

---

## 16. API Key Management

**File:** `e2e/tests/auth/api-key.spec.ts` (4 TC)

| #   | TC ID    | Test Name                            | Description                  | Assertions                       |
| --- | -------- | ------------------------------------ | ---------------------------- | -------------------------------- |
| 106 | AKEY-001 | Set API key via PUT /me/api-key      | Save Anthropic API key       | status === 200, success === true |
| 107 | AKEY-002 | GET /me reflects hasApiKey after set | Profile shows API key status | user.hasAnthropicApiKey === true |
| 108 | AKEY-003 | DELETE /me/api-key removes key       | Remove API key               | status === 200, success === true |
| 109 | AKEY-004 | PUT /me/api-key rejects empty key    | Empty/invalid key rejected   | status === 400                   |

---

## 17. Session Export

**File:** `e2e/tests/api/session-export.spec.ts` (3 TC)

| #   | TC ID    | Test Name                                   | Description                     | Assertions                                  |
| --- | -------- | ------------------------------------------- | ------------------------------- | ------------------------------------------- |
| 110 | SEXP-001 | Export sessions as markdown                 | Export project sessions         | status === 200, body contains session title |
| 111 | SEXP-002 | Export empty project returns valid response | No sessions to export           | status === 200                              |
| 112 | SEXP-003 | Export requires authentication              | Unauthenticated export rejected | status === 401                              |

---

## 18. Token Usage

**File:** `e2e/tests/api/token-usage.spec.ts` (4 TC)

| #   | TC ID    | Test Name                         | Description                          | Assertions                                    |
| --- | -------- | --------------------------------- | ------------------------------------ | --------------------------------------------- |
| 113 | TKUS-001 | Token usage endpoint returns data | Get token usage for project          | status === 200, success === true, data exists |
| 114 | TKUS-002 | Token usage with period filter    | Filter by 7d/30d/90d                 | Each period returns valid response            |
| 115 | TKUS-003 | Token usage after session import  | Import session, check usage reflects | response data exists                          |
| 116 | TKUS-004 | Recalculate tokens endpoint       | POST recalculate-tokens              | status === 200, success === true              |

---

## 19. Local Sessions

**File:** `e2e/tests/sessions/local-sessions.spec.ts` (6 TC)

| #   | TC ID    | Test Name                                | Description                                                   | Assertions                        |
| --- | -------- | ---------------------------------------- | ------------------------------------------------------------- | --------------------------------- |
| 117 | LSES-001 | List local sessions endpoint responds    | GET /sessions/local returns response                          | status === 200, data is array     |
| 118 | LSES-002 | Browse local directory endpoint responds | GET /sessions/local/browse returns response                   | status === 200                    |
| 119 | LSES-003 | Local directories endpoint responds      | GET /sessions/local/directories returns response              | status === 200, data is array     |
| 120 | LSES-004 | Manual sync rejects empty sessionIds     | POST /projects/:id/sessions/sync with empty array returns 400 | status === 400, success === false |
| 121 | LSES-005 | Recalculate tokens endpoint responds     | POST /projects/:id/sessions/recalculate-tokens returns ok     | status === 200, success === true  |
| 122 | LSES-006 | Manual sync requires authentication      | POST /projects/:id/sessions/sync without token                | status === 401                    |

---

## 20. Clean Environment

> Docker postgres부터 시작하여 DB 생성 → 마이그레이션 → 시드 → API/Web 기동 → 온보딩까지, "from zero" 전체 경로를 검증.
>
> Config: `e2e/playwright.clean-env.config.ts` | Port: API 3098, Web 5198, DB 5433

### 20-1. Fresh Setup

**File:** `e2e/tests/clean-env/fresh-setup.spec.ts` (8 TC)

| #   | TC ID     | Test Name                                 | Description                                         | Assertions                                             |
| --- | --------- | ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| 127 | CLEAN-001 | All 27 migrations apply to fresh database | 빈 DB에서 마이그레이션 전체 적용 확인               | count === 27, last === '027_add_project_database_mode' |
| 128 | CLEAN-002 | All application tables are created        | information_schema에서 15개 테이블 전부 존재 확인   | 모든 테이블 존재                                       |
| 129 | CLEAN-003 | Search vector columns exist               | sessions.search_vector, messages.search_vector 확인 | 두 컬럼 모두 존재                                      |
| 130 | CLEAN-004 | API health check responds                 | `GET /api/health` → 200                             | status === 200                                         |
| 131 | CLEAN-005 | Web frontend loads                        | `GET /` → 200, text/html                            | status === 200, content-type: text/html                |
| 132 | CLEAN-006 | Auth flow works on fresh database         | login → token → GET /me 성공                        | token, user.id 존재, /me 응답 일치                     |
| 133 | CLEAN-007 | Full CRUD works after fresh setup         | 프로젝트 생성 → 세션 import → 조회 → 삭제           | 각 단계 성공, 삭제 후 404                              |
| 134 | CLEAN-008 | Seed script runs without errors           | seed 스크립트 실행 → 시드 데이터 DB 조회            | exit code 0, users/projects count > 0                  |

### 20-2. Onboarding

**File:** `e2e/tests/clean-env/onboarding.spec.ts` (4 TC)

| #   | TC ID     | Test Name                                                   | Description                                     | Assertions                 |
| --- | --------- | ----------------------------------------------------------- | ----------------------------------------------- | -------------------------- |
| 135 | CLEAN-009 | New user login redirects to onboarding                      | 새 유저 로그인 → URL `/onboarding` 포함         | URL contains '/onboarding' |
| 136 | CLEAN-010 | Onboarding creates first project and redirects to dashboard | 온보딩에서 프로젝트 생성 → `/dashboard` 도달    | URL contains '/dashboard'  |
| 137 | CLEAN-011 | Second login skips onboarding                               | 프로젝트 보유 유저 재로그인 → `/dashboard` 직행 | URL contains '/dashboard'  |
| 138 | CLEAN-012 | Onboarding skip works                                       | 새 유저 → 온보딩 Skip → `/dashboard` 도달       | URL contains '/dashboard'  |

### 20-3. Team Collaboration

**File:** `e2e/tests/clean-env/team-collaboration.spec.ts` (19 TC)

| #   | TC ID     | Test Name                                      | Description                                                                | Assertions                                        |
| --- | --------- | ---------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| 139 | CLEAN-013 | Remote DB — Self-Hosted setup form UI          | Settings > Integrations > Self-Hosted PostgreSQL 탭 선택 → URL 입력 → Test | Connection successful, latency/version 표시       |
| 140 | CLEAN-014 | Remote DB — test-connection API                | POST /setup/test-connection → clean-env DB URL                             | success: true, latencyMs > 0, version: PostgreSQL |
| 141 | CLEAN-015 | Owner generates Join Code via UI               | Settings > Team > Generate Join Code 클릭                                  | 6자리+ Join Code 표시                             |
| 142 | CLEAN-016 | Member joins project via Join Code UI          | 사이드바 Join → JoinProjectDialog → Join Code 입력 → Join                  | 프로젝트 참여 확인 (API)                          |
| 143 | CLEAN-017 | Collaborator list shows both users             | Owner Settings > Team → Members 리스트                                     | Owner + Member 2명 표시, member role badge        |
| 144 | CLEAN-018 | Owner imports session                          | API로 sample-session.json 임포트 → Dashboard에서 확인                      | 'Auth Feature Implementation' 표시                |
| 145 | CLEAN-019 | Member imports session with conflict detection | API로 sample-session-2.json 임포트                                         | detectedConflicts > 0                             |
| 146 | CLEAN-020 | Dashboard shows sessions from both users       | Owner Dashboard 타임라인에 양쪽 세션                                       | 두 세션 제목 + 두 유저 이름 표시                  |
| 147 | CLEAN-021 | Conflict details include overlapping paths     | GET /projects/:id/conflicts                                                | overlappingPaths에 src/auth/login.ts 포함         |
| 148 | CLEAN-022 | Team stats show activity from both users       | GET /projects/:id/team-stats                                               | 2명 유저 활동 데이터                              |

#### Remote Sync & DB Routing

> 리모트 전환 후 dual-DB 라우팅(resolveDb)이 올바르게 동작하는지 검증. 세션 데이터가 올바른 DB로 라우팅되고, 팀원 간 양방향 조회가 가능한지 확인.

| #   | TC ID     | Test Name                                               | Description                                                  | Assertions                             |
| --- | --------- | ------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| 155 | CLEAN-029 | switchToRemote syncs project and returns migration info | setup/status 확인 → databaseMode === 'remote'                | databaseMode 'remote'                  |
| 156 | CLEAN-030 | Session import works after remote switch                | 리모트 전환 후 세션 조회 가능 확인                           | sessions.length ≥ 1                    |
| 157 | CLEAN-031 | Owner sees member sessions on remote project            | Owner가 /projects/:id/sessions 조회 → Member 세션 포함       | member userId 가진 세션 ≥ 1            |
| 158 | CLEAN-032 | Member sees owner sessions on remote project            | Member가 /projects/:id/sessions 조회 → Owner 세션 포함       | owner userId 가진 세션 ≥ 1             |
| 159 | CLEAN-033 | Team stats reflect both users on remote project         | GET /projects/:id/team-stats → 양쪽 sessionCount > 0         | 2명 userId, 각 sessionCount ≥ 1        |
| 160 | CLEAN-034 | Dashboard stats returns session counts                  | GET /projects/:id/stats → todaySessions, weekSessions 존재   | typeof number, ≥ 0                     |
| 161 | CLEAN-035 | Manual sync endpoint responds on remote project         | POST /projects/:id/sessions/sync → 비존재 세션 ID            | status 201, success true               |
| 162 | CLEAN-036 | Recalculate tokens works on remote project              | POST /projects/:id/sessions/recalculate-tokens               | updatedSessions ≥ 0                    |
| 163 | CLEAN-037 | Local-only project sessions isolated from remote        | 별도 local 프로젝트에 세션 import → remote 프로젝트에 미반영 | remote project에 local session ID 없음 |

### 20-4. Team Onboarding (Profile)

**File:** `e2e/tests/clean-env/team-onboarding.spec.ts` (6 TC)

| #   | TC ID     | Test Name                                     | Description                                               | Assertions                                          |
| --- | --------- | --------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| 149 | CLEAN-023 | Owner creates project and generates join code | 프로젝트 생성 → Join Code 발급                            | joinCode 길이 ≥ 6                                   |
| 150 | CLEAN-024 | Member joins project via join code API        | POST /projects/join → collaborator 등록                   | 참여한 프로젝트 ID 일치, projects 목록에 포함       |
| 151 | CLEAN-025 | Profile name derived from project name        | toProfileName() 다양한 입력 → kebab-case 변환             | 소문자, 하이픈, 30자 이내, 특수문자 제거            |
| 152 | CLEAN-026 | Port allocation avoids conflicts              | allocatePorts() 기존 env 파일 스캔 후 충돌 없는 포트 반환 | apiPort ≥ 3101, webPort ≥ 5273, 기본 포트와 불일치  |
| 153 | CLEAN-027 | Profile env content has correct structure     | buildEnvContent() 생성된 env 내용 검증                    | PORT, VITE_PORT, DATABASE_URL, FRONTEND_URL 등 포함 |
| 154 | CLEAN-028 | Member sees joined project in dashboard       | Join 후 Member가 대시보드에서 프로젝트 접근               | 프로젝트 이름이 페이지에 표시                       |

---

## Test Infrastructure

### Fixtures

| Fixture           | Description                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `auth.fixture.ts` | Auth context — provides `apiClient`, `testUser`, `testProjectId`, `authenticatedPage`, `db` |
| `api.fixture.ts`  | API client — `fetchRaw`, `get`, `post`, `patch`, `del`, `importSession`, `uploadPrd`, etc.  |
| `db.fixture.ts`   | Direct Kysely DB instance access                                                            |

### Helpers

| Helper                  | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `test-data.ts`          | `buildUser()`, `buildProject()` — generate unique test data |
| `wait-for.ts`           | `waitForAppReady()` — wait for app loading to complete      |
| `invitation-helpers.ts` | `addCollaborator()` — direct DB manipulation for tests      |

### Session Fixtures

| File                    | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `sample-session.json`   | 'Auth Feature Implementation' (4 messages, paths: src/auth/login.ts, etc.)  |
| `sample-session-2.json` | 'Auth Refactoring' (paths: src/auth/login.ts, etc., for conflict detection) |
| `sample-session.jsonl`  | JSONL format session (2 messages, non-conflicting paths)                    |
| `sample-prd.md`         | Sample document for PRD analysis                                            |

---

## QuickStart — Full Onboarding (`e2e/tests/quickstart/`)

> git clone → bootstrap → dev → 브라우저 온보딩까지 전체 파이프라인 검증.
> 실행: `pnpm test:quickstart` (셸 스크립트 + Playwright)

| TC ID  | Description                                          | File                    |
| ------ | ---------------------------------------------------- | ----------------------- |
| QS-001 | Root URL (`/`) redirects to `/identify`              | full-onboarding.spec.ts |
| QS-002 | New user enters name → redirected to `/onboarding`   | full-onboarding.spec.ts |
| QS-003 | Full journey: name → project → dashboard with verify | full-onboarding.spec.ts |
