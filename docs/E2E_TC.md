# E2E Test Cases

> **103 total test cases** | Playwright + Custom Fixtures (auth, api, db)
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

### 2-2. Auto User

**File:** `e2e/tests/auth/auto-user.spec.ts` (4 TC)

| #   | TC ID    | Test Name                                        | Description                                         | Assertions                             |
| --- | -------- | ------------------------------------------------ | --------------------------------------------------- | -------------------------------------- |
| 9   | AUTO-001 | Auto login creates user with is_auto=true        | Auto-login creates an auto user                     | Email contains `@local`, name verified |
| 10  | AUTO-002 | Auto user can create project                     | Auto user can create projects                       | project.id exists                      |
| 11  | AUTO-003 | Auto user is blocked from creating invitations   | Auto user blocked from creating invitations (403)   | status === 403, error message verified |
| 12  | AUTO-004 | Auto user is blocked from removing collaborators | Auto user blocked from removing collaborators (403) | status === 403, error message verified |

### 2-3. Auto User Upgrade

**File:** `e2e/tests/auth/upgrade.spec.ts` (4 TC)

| #   | TC ID    | Test Name                                   | Description                                         | Assertions                                  |
| --- | -------- | ------------------------------------------- | --------------------------------------------------- | ------------------------------------------- |
| 13  | UPGR-001 | Upgrade auto user with new email            | Upgrade auto user with new email                    | Email/name changed after upgrade            |
| 14  | UPGR-002 | Upgraded user can create invitations        | Upgraded user can create invitations                | invitation.id exists                        |
| 15  | UPGR-003 | Upgrade with existing email merges data     | Upgrading with existing user's email merges data    | Returns existing user ID, owns all projects |
| 16  | UPGR-004 | Upgrade already-upgraded user returns error | Re-upgrading an already upgraded user returns error | status === 400                              |

### 2-4. Auth Guard

**File:** `e2e/tests/auth/auth-guard.spec.ts` (6 TC)

| #   | TC ID     | Test Name                                        | Description                                               | Assertions                      |
| --- | --------- | ------------------------------------------------ | --------------------------------------------------------- | ------------------------------- |
| 17  | GUARD-001 | /dashboard redirects to /login (unauthenticated) | Unauthenticated → /dashboard redirects to login           | URL → `/login`                  |
| 18  | GUARD-002 | /project redirects to /login (unauthenticated)   | Unauthenticated → /project redirects to login             | URL → `/login`                  |
| 19  | GUARD-003 | /conflicts redirects to /login (unauthenticated) | Unauthenticated → /conflicts redirects to login           | URL → `/login`                  |
| 20  | GUARD-004 | /settings redirects to /login (unauthenticated)  | Unauthenticated → /settings redirects to login            | URL → `/login`                  |
| 21  | GUARD-005 | / redirects to /login (unauthenticated)          | Unauthenticated → / auto-login fails → redirects to login | URL → `/login`                  |
| 22  | GUARD-006 | Public routes are accessible without auth        | Public routes (/docs, /login) are accessible              | Each URL loads without redirect |

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

### 8-2. Project Collaboration

**File:** `e2e/tests/projects/project-collaboration.spec.ts` (6 TC)

> **Prerequisite:** COLLAB-001~005 insert remote DB active status via `activateRemoteDb()` at test start.
> Without a remote DB, the invitation API returns 403 (verified in COLLAB-006).

| #   | TC ID      | Test Name                            | Description                                      | Assertions                                 |
| --- | ---------- | ------------------------------------ | ------------------------------------------------ | ------------------------------------------ |
| 71  | COLLAB-001 | Create invitation                    | Create invitation (remote DB active)             | invitation.id exists, email matches        |
| 72  | COLLAB-002 | List project invitations             | List project invitations                         | Created invitation exists                  |
| 73  | COLLAB-003 | Invitee can see pending invitation   | Invitee can see pending invitation               | myInvitations.length >= 1                  |
| 74  | COLLAB-004 | Accept invitation adds collaborator  | Accepting invitation adds collaborator           | collaborators.length >= 1                  |
| 75  | COLLAB-005 | Cancel invitation removes it         | Cancelling invitation removes it from list       | Cancelled invitation not found             |
| 76  | COLLAB-006 | Invitation blocked without remote DB | Invitation attempt without remote DB returns 403 | status === 403, error contains 'Remote DB' |

---

## 9. Sessions

### 9-1. Session List

**File:** `e2e/tests/sessions/session-list.spec.ts` (3 TC)

| #   | TC ID    | Test Name                          | Description                        | Assertions                                                       |
| --- | -------- | ---------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| 77  | SESS-001 | Imported sessions exist via API    | Imported sessions verified via API | Titles include 'Auth Feature Implementation', 'Auth Refactoring' |
| 78  | SESS-002 | Session detail page shows title    | Session detail page shows title    | Page contains session title text                                 |
| 79  | SESS-003 | Delete session removes it from API | Deleted session removed from API   | Deleted session ID not found                                     |

### 9-2. Session Import

**File:** `e2e/tests/sessions/session-import.spec.ts` (4 TC)

| #   | TC ID   | Test Name                          | Description                        | Assertions                            |
| --- | ------- | ---------------------------------- | ---------------------------------- | ------------------------------------- |
| 80  | IMP-001 | Import JSON session via API        | Import JSON session file via API   | session.id exists, messageCount === 4 |
| 81  | IMP-002 | Import JSONL session via API       | Import JSONL session file via API  | session.id exists, messageCount === 2 |
| 82  | IMP-003 | Import session via UI upload modal | Import session via UI upload modal | Flow completes without errors         |
| 83  | IMP-004 | Reject missing file upload         | Import without file fails          | success === false                     |

---

## 10. Search

**File:** `e2e/tests/search/full-text-search.spec.ts` (3 TC)

| #   | TC ID    | Test Name                                  | Description                           | Assertions                 |
| --- | -------- | ------------------------------------------ | ------------------------------------- | -------------------------- |
| 84  | SRCH-001 | Search API returns matching results        | Search for 'auth' returns results     | results.length > 0         |
| 85  | SRCH-002 | Search with nonexistent term returns empty | Nonexistent search term returns empty | results.length === 0       |
| 86  | SRCH-003 | Search type filter works                   | Type filter (session/message) applied | Each result's type matches |

---

## 11. PRD Analysis

**File:** `e2e/tests/prd-analysis/prd-analysis.spec.ts` (4 TC)

| #   | TC ID   | Test Name                                 | Description                               | Assertions                       |
| --- | ------- | ----------------------------------------- | ----------------------------------------- | -------------------------------- |
| 87  | PRD-001 | Upload PRD document via API               | Upload PRD document via API               | id exists, title === 'Test PRD'  |
| 88  | PRD-002 | List PRD documents                        | List PRD documents                        | documents.length >= 1            |
| 89  | PRD-003 | Delete PRD document                       | Delete PRD document                       | Not found in list after deletion |
| 90  | PRD-004 | Analysis fails gracefully without API key | Analysis fails gracefully without API key | status >= 200                    |

---

## 12. Plans

**File:** `e2e/tests/plans/plans.spec.ts` (3 TC)

| #   | TC ID    | Test Name                       | Description                     | Assertions                                            |
| --- | -------- | ------------------------------- | ------------------------------- | ----------------------------------------------------- |
| 91  | PLAN-001 | Plans page renders              | Plans page renders              | URL → `/plans`, root element visible                  |
| 92  | PLAN-002 | List plans via API              | List plans via API              | Array.isArray(plans) === true                         |
| 93  | PLAN-003 | Empty state shown when no plans | Empty state shown when no plans | Contains 'plan', 'no plan', 'empty', or 'get started' |

---

## 13. Settings

**File:** `e2e/tests/settings/settings.spec.ts` (7 TC)

| #   | TC ID   | Test Name                                        | Description                                      | Assertions                               |
| --- | ------- | ------------------------------------------------ | ------------------------------------------------ | ---------------------------------------- |
| 94  | SET-001 | Project info is displayed                        | Project info displayed on settings page          | 'Project Info' text visible              |
| 95  | SET-002 | Edit project name                                | Edit project name on settings page               | Updated name shown                       |
| 96  | SET-003 | Delete project section exists                    | Delete project section exists                    | 'Delete Project' or 'Delete' visible     |
| 97  | SET-004 | Collaborators section exists                     | Collaborators section exists                     | 'Collaborators' heading visible          |
| 98  | SET-005 | Remote Database section exists                   | Remote Database section exists                   | 'Remote Database' heading visible        |
| 99  | SET-006 | Connect Remote Database button visible for owner | Connect Remote Database button visible for owner | 'Connect Remote Database' button visible |
| 100 | SET-007 | Collaborator invite disabled without remote DB   | Invite input disabled without remote DB          | 'Connect a remote database' message      |

---

## 14. AI Evaluation

**File:** `e2e/tests/ai-evaluation/ai-evaluation.spec.ts` (3 TC)

| #   | TC ID    | Test Name                                           | Description                                         | Assertions                                   |
| --- | -------- | --------------------------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| 101 | EVAL-001 | Evaluation page renders                             | AI evaluation page renders                          | URL → `/ai-evaluation`, root element visible |
| 102 | EVAL-002 | Evaluation trigger fails gracefully without API key | Evaluation trigger fails gracefully without API key | success === false                            |
| 103 | EVAL-003 | Empty evaluation history                            | Empty evaluation history query                      | data.length === 0                            |

---

## Test Infrastructure

### Fixtures

| Fixture           | Description                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `auth.fixture.ts` | Auth context — provides `apiClient`, `testUser`, `testProjectId`, `authenticatedPage`, `db` |
| `api.fixture.ts`  | API client — `fetchRaw`, `get`, `post`, `patch`, `del`, `importSession`, `uploadPrd`, etc.  |
| `db.fixture.ts`   | Direct Kysely DB instance access                                                            |

### Helpers

| Helper                  | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `test-data.ts`          | `buildUser()`, `buildProject()` — generate unique test data          |
| `wait-for.ts`           | `waitForAppReady()` — wait for app loading to complete               |
| `invitation-helpers.ts` | `addCollaborator()`, `getInvitationToken()` — direct DB manipulation |

### Session Fixtures

| File                    | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `sample-session.json`   | 'Auth Feature Implementation' (4 messages, paths: src/auth/login.ts, etc.)  |
| `sample-session-2.json` | 'Auth Refactoring' (paths: src/auth/login.ts, etc., for conflict detection) |
| `sample-session.jsonl`  | JSONL format session (2 messages, non-conflicting paths)                    |
| `sample-prd.md`         | Sample document for PRD analysis                                            |
