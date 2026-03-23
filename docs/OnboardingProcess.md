# Onboarding Process

ContextSync의 온보딩 프로세스를 단계별로 정리한 문서입니다.

---

## 목차

1. [전체 흐름 요약](#전체-흐름-요약)
2. [Phase 1: 앱 진입 및 자동 로그인](#phase-1-앱-진입-및-자동-로그인)
3. [Phase 2: 로그인](#phase-2-로그인)
4. [Phase 3: 프로젝트 생성 (온보딩)](#phase-3-프로젝트-생성-온보딩)
5. [Phase 4: 데이터베이스 설정 (선택)](#phase-4-데이터베이스-설정-선택)
6. [Auto User 업그레이드](#auto-user-업그레이드)
7. [라우트 보호 및 리다이렉트 규칙](#라우트-보호-및-리다이렉트-규칙)
8. [관련 API 엔드포인트](#관련-api-엔드포인트)
9. [관련 파일 목록](#관련-파일-목록)
10. [E2E 테스트 커버리지](#e2e-테스트-커버리지)

---

## 전체 흐름 요약

```
[앱 진입 "/"]
  │
  ├─ 토큰 없음 → POST /auth/auto (자동 로그인, Auto User 생성)
  │                  ↓
  │              토큰 발급 → 인증 완료
  │
  └─ 토큰 있음 → GET /auth/me (사용자 정보 갱신)
                    ↓
                 인증 완료
                    │
                    ├─ currentProjectId 있음 → /dashboard
                    └─ currentProjectId 없음 → /onboarding
                                                  │
                                                  ├─ Step 1: 프로젝트 이름 입력
                                                  ├─ Step 2: 로컬 디렉터리 선택 (선택)
                                                  └─ POST /projects → /project
```

### 별도 로그인 경로

```
["/login"]
  │
  └─ 이름 + 이메일 입력 → POST /auth/login
                            ↓
                        토큰 발급
                            │
                            ├─ currentProjectId 있음 → /dashboard
                            └─ currentProjectId 없음 → /onboarding
```

---

## Phase 1: 앱 진입 및 자동 로그인

### 컴포넌트: `AppEntryRedirect`

사용자가 루트 경로(`/`)에 접속하면 실행되는 진입점 컴포넌트입니다.

#### 상태 머신

```
EntryState: 'checking' | 'logging-in' | 'authenticated' | 'error'
```

#### 처리 로직

**1. 기존 토큰이 있는 경우 (재방문 사용자)**

- 상태: `authenticated`로 즉시 설정
- `GET /auth/me` 호출하여 사용자 정보 갱신 (실패 시 무시 — 캐시된 정보로 계속)
- `AuthenticatedRedirect` 컴포넌트로 이동

**2. 토큰이 없는 경우 (첫 방문 사용자)**

- 상태: `checking` → `logging-in`
- `POST /auth/auto` 호출
  - 서버에서 `auto_<uuid>@local` 이메일로 임시 사용자 생성
  - `is_auto: true` 플래그 설정
  - JWT 토큰 발급
- 성공: `setAuth(token, user)` → 상태 `authenticated`
- 실패: 상태 `error` → 에러 화면 + 재시도 버튼

**3. 인증 완료 후 리다이렉트 (`AuthenticatedRedirect`)**

`useOnboardingStatus()` 훅 결과에 따라:

| 상태              | 동작                         |
| ----------------- | ---------------------------- |
| `'loading'`       | 로딩 중 (빈 화면)            |
| `'needs-project'` | `/onboarding`으로 리다이렉트 |
| `'ready'`         | `/dashboard`로 리다이렉트    |

#### `useOnboardingStatus` 훅 로직

```typescript
type OnboardingStatus = 'loading' | 'needs-project' | 'ready';
```

1. `currentProjectId`가 Zustand 스토어에 있으면 → `'ready'`
2. 없으면 → `GET /projects` 호출
   - 프로젝트가 있으면 → 첫 번째 프로젝트를 `currentProjectId`로 자동 설정 → `'ready'`
   - 프로젝트가 없으면 → `'needs-project'`

---

## Phase 2: 로그인

### 컴포넌트: `LoginHero`

이메일/이름 기반의 간단한 로그인 폼입니다. 비밀번호 없이 동작합니다.

#### 입력 필드

| 필드  | 타입  | 필수 | 설명                      |
| ----- | ----- | ---- | ------------------------- |
| Name  | text  | O    | 사용자 이름               |
| Email | email | O    | 이메일 주소 (고유 식별자) |

#### 처리 흐름

1. 사용자가 이름, 이메일 입력 후 "Get Started" 클릭
2. `POST /auth/login` 호출 (`{ name, email }`)
3. 서버 처리 (`findOrCreateByEmail`):
   - 이메일로 기존 사용자 검색
   - **기존 사용자**: 이름 업데이트 + `updated_at` 갱신
   - **신규 사용자**: `{ email, name, avatar_url: null }` 로 생성
4. JWT 토큰 발급 (`{ userId, email }`, 만료: `JWT_EXPIRES_IN`, 기본 7일)
5. `setAuth(token, user)` — Zustand 스토어에 저장 (localStorage 영속화)
6. 리다이렉트:
   - `currentProjectId` 있음 → `/dashboard`
   - `currentProjectId` 없음 → `/onboarding`

---

## Phase 3: 프로젝트 생성 (온보딩)

### 페이지: `OnboardingPage`

프로젝트가 없는 사용자가 처음으로 프로젝트를 생성하는 2단계 위자드입니다.

#### 진입 조건 검사

```
토큰 없음        → /login으로 리다이렉트
status = loading → 빈 화면
status = ready   → /dashboard로 리다이렉트 (이미 프로젝트 있음)
```

#### Step 1: 프로젝트 이름 입력

| 요소           | 설명                                                            |
| -------------- | --------------------------------------------------------------- |
| 입력 필드      | 프로젝트 이름 (placeholder: "My Project")                       |
| "Next" 버튼    | 로컬 디렉터리가 있으면 Step 2로, 없으면 바로 프로젝트 생성      |
| "Skip for now" | `currentProjectId`를 `'skipped'`로 설정하고 `/dashboard`로 이동 |

#### Step 2: 로컬 디렉터리 선택 (조건부)

로컬 디렉터리가 감지된 경우에만 표시됩니다.

| 요소                  | 설명                                                           |
| --------------------- | -------------------------------------------------------------- |
| `DirectoryPicker`     | 활성/비활성 로컬 디렉터리 목록 표시, 커스텀 경로 브라우징 가능 |
| "Back" 버튼           | Step 1로 돌아감                                                |
| "Create Project" 버튼 | 프로젝트 생성 실행                                             |

#### 디렉터리 데이터 소스

- `GET /sessions/local-directories` 호출
- 첫 번째 활성 디렉터리가 자동 선택됨

#### 프로젝트 생성

```
POST /projects
Body: { name: string, localDirectory?: string }
```

- 성공 시:
  1. `setCurrentProject(result.data.id)` — Zustand 스토어에 프로젝트 ID 저장
  2. `invalidateQueries(['projects'])` — 프로젝트 목록 캐시 무효화
  3. `/project`로 네비게이트

---

## Phase 4: 데이터베이스 설정 (선택)

초기 온보딩 이후, 팀 협업을 위해 원격 데이터베이스 설정이 필요할 수 있습니다. Settings 페이지에서 진행합니다.

### 옵션 A: Supabase 자동 설정 (`SupabaseAutoSetup`)

#### Step 1: Supabase 토큰 저장

1. 사용자가 [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)에서 Personal Access Token 발급
2. `PUT /auth/me/supabase-token` 호출
3. 서버에서 `JWT_SECRET`을 키로 AES 암호화하여 `users.supabase_access_token`에 저장

#### Step 2: 프로젝트 선택

**기존 프로젝트 연결:**

1. `GET /supabase/projects` — 사용자의 Supabase 프로젝트 목록 조회
2. 프로젝트 선택 + 데이터베이스 비밀번호 입력
3. `POST /supabase/auto-setup` 호출
   - 연결 테스트 → 마이그레이션 실행 → `.env` 파일 업데이트

**새 프로젝트 생성:**

1. `GET /supabase/organizations` — 사용자의 Supabase 조직 목록 조회
2. 이름, 리전, 조직, 비밀번호 입력
3. `POST /supabase/create-and-setup` 호출
   - Supabase API로 프로젝트 생성 → 연결 대기 (최대 60초, 10회 재시도) → 마이그레이션 → `.env` 업데이트

### 옵션 B: Self-Hosted 설정 (`SelfHostedSetup`)

#### Step 1: 연결 테스트

1. PostgreSQL 연결 URL 입력
2. SSL 토글 (On/Off)
3. `POST /setup/test-connection` 호출
4. 성공 시 지연시간(latency)과 PostgreSQL 버전 표시

#### Step 2: 데이터베이스 전환

1. `POST /setup/switch-to-remote` 호출
2. 서버 처리:
   - 연결 테스트 재실행
   - 임시 Kysely 인스턴스로 전체 마이그레이션 실행
   - `.env` 파일의 `DATABASE_URL`, `DATABASE_SSL` 업데이트
3. API 서버 재시작 필요 (`requiresRestart: true`)

### 데이터베이스 상태 확인

`GET /setup/status` — 현재 DB 모드 조회

```typescript
interface DatabaseStatus {
  databaseMode: 'local' | 'remote';
  provider: 'local' | 'supabase' | 'custom';
  host: string; // 원격인 경우 마스킹 (예: *.supabase.co)
}
```

---

## Auto User 업그레이드

자동 생성된 임시 사용자(`is_auto: true`)를 정식 사용자로 업그레이드하는 프로세스입니다.

### API: `POST /auth/upgrade`

```typescript
// 요청
{ autoUserId: string, name: string, email: string }

// 응답
{ token: string, user: User }
```

### 업그레이드 시나리오

**1. 이메일이 기존 사용자와 일치하지 않는 경우**

- Auto User의 이메일, 이름을 업데이트
- `is_auto: false`로 설정
- 기존 데이터 유지

**2. 이메일이 기존 사용자와 일치하는 경우 (Merge)**

트랜잭션으로 Auto User의 모든 데이터를 기존 사용자에게 이전:

| 테이블                  | 이전 필드                                |
| ----------------------- | ---------------------------------------- |
| `projects`              | `owner_id`                               |
| `sessions`              | `user_id`                                |
| `project_collaborators` | `user_id`                                |
| `activity_log`          | `user_id`                                |
| `prd_documents`         | `user_id`                                |
| `prompt_templates`      | `author_id`                              |
| `conflicts`             | `resolved_by`                            |
| `ai_evaluations`        | `target_user_id`, `triggered_by_user_id` |

이전 완료 후 Auto User 레코드 삭제.

---

## 라우트 보호 및 리다이렉트 규칙

### `ProtectedRoute` 컴포넌트

모든 보호된 라우트를 감싸는 가드 컴포넌트:

```
토큰 없음              → /login
onboardingStatus = loading      → null (빈 화면)
onboardingStatus = needs-project → /onboarding
통과                    → 자식 컴포넌트 렌더링
```

### 라우트 구조

| 경로                    | 보호               | 컴포넌트            |
| ----------------------- | ------------------ | ------------------- |
| `/`                     | X                  | `AppEntryRedirect`  |
| `/login`                | X                  | `LoginPage`         |
| `/onboarding`           | X (자체 토큰 검사) | `OnboardingPage`    |
| `/dashboard`            | O                  | `DashboardPage`     |
| `/project`              | O                  | `ProjectPage`       |
| `/project/sessions/:id` | O                  | `SessionDetailPage` |
| `/settings`             | O                  | `SettingsPage`      |
| 기타 보호 라우트        | O                  | 각 페이지 컴포넌트  |

---

## 관련 API 엔드포인트

### 인증

| Method   | 경로                      | 인증 | 설명                                       |
| -------- | ------------------------- | ---- | ------------------------------------------ |
| `POST`   | `/auth/login`             | X    | 이메일/이름 로그인 (사용자 생성 또는 조회) |
| `POST`   | `/auth/auto`              | X    | Auto User 생성 (자동 로그인)               |
| `GET`    | `/auth/me`                | O    | 현재 사용자 정보 조회                      |
| `POST`   | `/auth/refresh`           | O    | JWT 토큰 갱신                              |
| `POST`   | `/auth/upgrade`           | O    | Auto User → 정식 사용자 업그레이드         |
| `PUT`    | `/auth/me/api-key`        | O    | Anthropic API 키 저장                      |
| `DELETE` | `/auth/me/api-key`        | O    | Anthropic API 키 삭제                      |
| `PUT`    | `/auth/me/supabase-token` | O    | Supabase 토큰 저장 (암호화)                |
| `DELETE` | `/auth/me/supabase-token` | O    | Supabase 토큰 삭제                         |
| `PUT`    | `/auth/me/plan`           | O    | Claude 플랜 업데이트                       |

### 프로젝트

| Method | 경로        | 인증 | 설명                   |
| ------ | ----------- | ---- | ---------------------- |
| `POST` | `/projects` | O    | 프로젝트 생성          |
| `GET`  | `/projects` | O    | 사용자의 프로젝트 목록 |

### 데이터베이스 설정

| Method | 경로                      | 인증 | 설명                          |
| ------ | ------------------------- | ---- | ----------------------------- |
| `GET`  | `/setup/status`           | O    | 현재 DB 모드 조회             |
| `POST` | `/setup/test-connection`  | O    | PostgreSQL 연결 테스트        |
| `POST` | `/setup/switch-to-remote` | O    | 원격 DB로 전환 + 마이그레이션 |

### Supabase

| Method | 경로                         | 인증 | 설명                             |
| ------ | ---------------------------- | ---- | -------------------------------- |
| `GET`  | `/supabase/projects`         | O    | Supabase 프로젝트 목록           |
| `GET`  | `/supabase/organizations`    | O    | Supabase 조직 목록               |
| `POST` | `/supabase/auto-setup`       | O    | 기존 Supabase 프로젝트 연결      |
| `POST` | `/supabase/create-and-setup` | O    | 새 Supabase 프로젝트 생성 + 연결 |

---

## 관련 파일 목록

### Frontend

| 파일                                                                     | 설명                                 |
| ------------------------------------------------------------------------ | ------------------------------------ |
| `apps/web/src/routes.tsx`                                                | 라우트 정의 + `ProtectedRoute`       |
| `apps/web/src/pages/OnboardingPage.tsx`                                  | 온보딩 페이지 (프로젝트 생성 위자드) |
| `apps/web/src/pages/LoginPage.tsx`                                       | 로그인 페이지                        |
| `apps/web/src/components/auth/AppEntryRedirect.tsx`                      | 앱 진입점 + 자동 로그인              |
| `apps/web/src/components/auth/LoginHero.tsx`                             | 로그인 폼 컴포넌트                   |
| `apps/web/src/components/projects/DirectoryPicker.tsx`                   | 로컬 디렉터리 선택 컴포넌트          |
| `apps/web/src/hooks/use-onboarding-status.ts`                            | 온보딩 상태 판단 훅                  |
| `apps/web/src/stores/auth.store.ts`                                      | 인증 상태 관리 (Zustand)             |
| `apps/web/src/api/auth.api.ts`                                           | 인증 API 클라이언트                  |
| `apps/web/src/api/projects.api.ts`                                       | 프로젝트 API 클라이언트              |
| `apps/web/src/components/settings/supabase-setup/SupabaseAutoSetup.tsx`  | Supabase 자동 설정 UI                |
| `apps/web/src/components/settings/self-hosted-setup/SelfHostedSetup.tsx` | Self-Hosted DB 설정 UI               |

### Backend

| 파일                                                                      | 설명                        |
| ------------------------------------------------------------------------- | --------------------------- |
| `apps/api/src/modules/auth/auth.routes.ts`                                | 인증 라우트 핸들러          |
| `apps/api/src/modules/auth/auth.service.ts`                               | 인증 비즈니스 로직          |
| `apps/api/src/modules/auth/auth.schema.ts`                                | 인증 입력 검증 스키마       |
| `apps/api/src/modules/projects/project.routes.ts`                         | 프로젝트 라우트             |
| `apps/api/src/modules/projects/project.service.ts`                        | 프로젝트 비즈니스 로직      |
| `apps/api/src/modules/setup/setup.routes.ts`                              | DB 설정 라우트              |
| `apps/api/src/modules/setup/setup.service.ts`                             | DB 전환 로직                |
| `apps/api/src/modules/supabase-onboarding/supabase-onboarding.routes.ts`  | Supabase 설정 라우트        |
| `apps/api/src/modules/supabase-onboarding/supabase-onboarding.service.ts` | Supabase 설정 로직          |
| `apps/api/src/lib/encryption.ts`                                          | Supabase 토큰 암호화/복호화 |

### Shared

| 파일                                               | 설명                    |
| -------------------------------------------------- | ----------------------- |
| `packages/shared/src/types/supabase-onboarding.ts` | Supabase 관련 타입 정의 |
| `packages/shared/src/types/user.ts`                | User 타입 정의          |

---

## E2E 테스트 커버리지

`e2e/tests/clean-env/onboarding.spec.ts`

| 테스트 ID | 설명                                                      |
| --------- | --------------------------------------------------------- |
| CLEAN-009 | 신규 사용자 로그인 시 `/onboarding`으로 리다이렉트        |
| CLEAN-010 | 온보딩 완료 시 프로젝트 생성 후 `/dashboard`로 리다이렉트 |
| CLEAN-011 | 기존 프로젝트가 있는 사용자는 온보딩 건너뜀               |
| CLEAN-012 | "Skip for now" 버튼 동작 확인                             |

---

## 인증 보안 참고사항

- **JWT 기반 인증**: `{ userId, email }` 페이로드, 기본 7일 만료
- **비밀번호 없음**: 이메일/이름만으로 인증 (로컬 개발 환경 중심)
- **토큰 저장**: localStorage (Zustand persist 미들웨어)
- **Supabase 토큰 암호화**: AES 암호화, `JWT_SECRET`을 키로 사용
- **Auto User**: `auto_<uuid>@local` 형식, `is_auto: true` 플래그로 구분
