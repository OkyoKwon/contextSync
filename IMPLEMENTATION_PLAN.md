# ContextSync MVP 구현 계획서 (Phase 1 - 8주)

> **문서 버전:** v1.0
> **작성일:** 2026-03-19
> **대상:** 개발자가 바로 따라 구현할 수 있는 상세 실행 계획

---

## 1. 아키텍처 의사결정

### 1.1 백엔드 프레임워크: Node.js + Fastify

| 기준 | Fastify | FastAPI |
|------|---------|---------|
| 프론트엔드와의 언어 통일 | TypeScript 단일 언어 | Python 별도 언어 |
| 타입 공유 | 프론트/백 간 interface 공유 가능 | 불가 (별도 코드 생성 필요) |
| WebSocket 생태계 | `@fastify/websocket` + Socket.io 성숙 | 비교적 제한적 |
| JSON Schema 검증 | 내장 (Ajv 기반, 매우 빠름) | Pydantic (별도 레이어) |
| 성능 | Node.js 프레임워크 중 최고 수준 | 동등하게 우수 |
| 팀 규모 고려 | 소규모 팀에서 단일 언어 스택이 유지보수 비용 절감 | 백/프론트 별도 전문성 필요 |

**결론:** 2-10인 소규모 팀 대상 SaaS에서 TypeScript 단일 언어 스택은 코드 공유, 타입 안전성, 인력 유연성 측면에서 명확한 이점.

### 1.2 모노레포 구조

pnpm workspace + Turborepo 기반 모노레포. 프론트/백 간 타입 정의(`packages/shared`)를 공유하여 API 계약을 컴파일 타임에 검증.

### 1.3 MVP에서 제외하는 기술

- **Elasticsearch:** PostgreSQL `tsvector` 전문 검색으로 대체 (초기 데이터 규모에서 충분)
- **Redis:** JWT 기반 stateless 인증으로 불필요. Phase 2 실시간 기능과 함께 도입
- **WebSocket:** Phase 2에서 실시간 대시보드와 함께 도입. MVP 타임라인은 폴링 기반

---

## 2. 프로젝트 구조

```
contextSync/
├── package.json                    # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json                      # Turborepo 빌드 파이프라인
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI: lint, test, build
│       └── deploy.yml              # CD: Railway/Render 배포
├── packages/
│   └── shared/                     # 프론트/백 공유 타입 패키지
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── types/
│           │   ├── user.ts
│           │   ├── team.ts
│           │   ├── project.ts
│           │   ├── session.ts
│           │   ├── conflict.ts
│           │   └── api.ts          # API 응답 Envelope, 페이지네이션
│           ├── constants/
│           │   ├── roles.ts
│           │   ├── session-status.ts
│           │   └── conflict-severity.ts
│           └── validators/
│               ├── session.validator.ts
│               └── project.validator.ts
├── apps/
│   ├── api/                        # Fastify 백엔드
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   ├── src/
│   │   │   ├── index.ts            # 서버 엔트리포인트
│   │   │   ├── app.ts              # Fastify 앱 팩토리
│   │   │   ├── config/
│   │   │   │   ├── env.ts          # 환경변수 검증
│   │   │   │   └── database.ts
│   │   │   ├── plugins/
│   │   │   │   ├── auth.plugin.ts
│   │   │   │   ├── cors.plugin.ts
│   │   │   │   └── error-handler.plugin.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.schema.ts
│   │   │   │   │   ├── github-oauth.client.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── users/
│   │   │   │   │   ├── user.routes.ts
│   │   │   │   │   ├── user.service.ts
│   │   │   │   │   ├── user.repository.ts
│   │   │   │   │   ├── user.schema.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── teams/
│   │   │   │   │   ├── team.routes.ts
│   │   │   │   │   ├── team.service.ts
│   │   │   │   │   ├── team.repository.ts
│   │   │   │   │   ├── team.schema.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── projects/
│   │   │   │   │   ├── project.routes.ts
│   │   │   │   │   ├── project.service.ts
│   │   │   │   │   ├── project.repository.ts
│   │   │   │   │   ├── project.schema.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── sessions/
│   │   │   │   │   ├── session.routes.ts
│   │   │   │   │   ├── session.service.ts
│   │   │   │   │   ├── session.repository.ts
│   │   │   │   │   ├── session.schema.ts
│   │   │   │   │   ├── session-import.service.ts
│   │   │   │   │   ├── parsers/
│   │   │   │   │   │   ├── json-session.parser.ts
│   │   │   │   │   │   └── markdown-session.parser.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── conflicts/
│   │   │   │   │   ├── conflict.routes.ts
│   │   │   │   │   ├── conflict.service.ts
│   │   │   │   │   ├── conflict.repository.ts
│   │   │   │   │   ├── conflict-detector.ts
│   │   │   │   │   ├── conflict.schema.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── notification.routes.ts
│   │   │   │   │   ├── notification.service.ts
│   │   │   │   │   ├── channels/
│   │   │   │   │   │   ├── email.channel.ts
│   │   │   │   │   │   └── slack.channel.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   └── search/
│   │   │   │       ├── search.routes.ts
│   │   │   │       ├── search.service.ts
│   │   │   │       └── __tests__/
│   │   │   ├── database/
│   │   │   │   ├── client.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── migrations/
│   │   │   │       ├── 001_create_users.ts
│   │   │   │       ├── 002_create_teams.ts
│   │   │   │       ├── 003_create_projects.ts
│   │   │   │       ├── 004_create_sessions.ts
│   │   │   │       ├── 005_create_messages.ts
│   │   │   │       ├── 006_create_conflicts.ts
│   │   │   │       ├── 007_create_prompt_templates.ts
│   │   │   │       └── 008_add_search_indexes.ts
│   │   │   └── lib/
│   │   │       └── api-response.ts
│   │   └── vitest.config.ts
│   └── web/                        # React 프론트엔드
│       ├── package.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── routes.tsx
│       │   ├── api/
│       │   │   ├── client.ts
│       │   │   ├── auth.api.ts
│       │   │   ├── sessions.api.ts
│       │   │   ├── projects.api.ts
│       │   │   ├── teams.api.ts
│       │   │   ├── conflicts.api.ts
│       │   │   └── search.api.ts
│       │   ├── hooks/
│       │   │   ├── use-auth.ts
│       │   │   ├── use-sessions.ts
│       │   │   ├── use-projects.ts
│       │   │   ├── use-teams.ts
│       │   │   ├── use-conflicts.ts
│       │   │   └── use-search.ts
│       │   ├── stores/
│       │   │   └── auth.store.ts
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Input.tsx
│       │   │   │   ├── Card.tsx
│       │   │   │   ├── Badge.tsx
│       │   │   │   ├── Modal.tsx
│       │   │   │   ├── Avatar.tsx
│       │   │   │   ├── Spinner.tsx
│       │   │   │   └── ApiErrorBoundary.tsx
│       │   │   ├── layout/
│       │   │   │   ├── AppLayout.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── Header.tsx
│       │   │   │   └── ProjectSelector.tsx
│       │   │   ├── auth/
│       │   │   │   └── GitHubLoginButton.tsx
│       │   │   ├── sessions/
│       │   │   │   ├── SessionList.tsx
│       │   │   │   ├── SessionCard.tsx
│       │   │   │   ├── SessionDetail.tsx
│       │   │   │   ├── SessionUploadModal.tsx
│       │   │   │   └── MessageThread.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── Timeline.tsx
│       │   │   │   ├── TimelineItem.tsx
│       │   │   │   ├── DashboardStats.tsx
│       │   │   │   └── ActiveConflictsSidebar.tsx
│       │   │   ├── conflicts/
│       │   │   │   ├── ConflictList.tsx
│       │   │   │   ├── ConflictCard.tsx
│       │   │   │   └── ConflictDetailView.tsx
│       │   │   ├── teams/
│       │   │   │   ├── TeamSettings.tsx
│       │   │   │   └── MemberList.tsx
│       │   │   └── search/
│       │   │       ├── SearchBar.tsx
│       │   │       └── SearchResults.tsx
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── OAuthCallbackPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── SessionsPage.tsx
│       │   │   ├── SessionDetailPage.tsx
│       │   │   ├── ConflictsPage.tsx
│       │   │   ├── ProjectSettingsPage.tsx
│       │   │   └── TeamSettingsPage.tsx
│       │   └── lib/
│       │       ├── date.ts
│       │       └── format.ts
│       ├── __tests__/
│       └── vitest.config.ts
```

---

## 3. 데이터베이스 스키마

ORM: **Kysely** (타입 안전 쿼리 빌더 + 내장 마이그레이션)

### 3.1 마이그레이션 SQL

```sql
-- 001_create_users.ts
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id       INTEGER NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    avatar_url      VARCHAR(512),
    role            VARCHAR(20) NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'admin', 'member')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_email ON users(email);

-- 002_create_teams.ts
CREATE TABLE teams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    settings        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'admin', 'member')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- 003_create_projects.ts
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    repo_url        VARCHAR(512),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_team_id ON projects(team_id);

-- 004_create_sessions.ts
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    source          VARCHAR(20) NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('claude_code', 'claude_ai', 'api', 'manual')),
    status          VARCHAR(20) NOT NULL DEFAULT 'completed'
                    CHECK (status IN ('active', 'completed', 'archived')),
    file_paths      TEXT[] NOT NULL DEFAULT '{}',
    module_names    TEXT[] NOT NULL DEFAULT '{}',
    branch          VARCHAR(255),
    tags            TEXT[] NOT NULL DEFAULT '{}',
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_file_paths ON sessions USING GIN(file_paths);

-- 005_create_messages.ts
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT NOT NULL,
    content_type    VARCHAR(20) NOT NULL DEFAULT 'prompt'
                    CHECK (content_type IN ('prompt', 'response', 'plan')),
    tokens_used     INTEGER,
    model_used      VARCHAR(100),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_sort_order ON messages(session_id, sort_order);

-- 006_create_conflicts.ts
CREATE TABLE conflicts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_a_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    session_b_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    conflict_type   VARCHAR(20) NOT NULL DEFAULT 'file'
                    CHECK (conflict_type IN ('file', 'design', 'dependency', 'plan')),
    severity        VARCHAR(20) NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info', 'warning', 'critical')),
    status          VARCHAR(20) NOT NULL DEFAULT 'detected'
                    CHECK (status IN ('detected', 'reviewing', 'resolved', 'dismissed')),
    description     TEXT NOT NULL,
    overlapping_paths TEXT[] NOT NULL DEFAULT '{}',
    diff_data       JSONB NOT NULL DEFAULT '{}',
    resolved_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    CHECK (session_a_id <> session_b_id)
);

CREATE INDEX idx_conflicts_project_id ON conflicts(project_id);
CREATE INDEX idx_conflicts_status ON conflicts(status);
CREATE INDEX idx_conflicts_severity ON conflicts(severity);

-- 007_create_prompt_templates.ts (테이블만 생성, UI는 Phase 2)
CREATE TABLE prompt_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    author_id       UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    content         TEXT NOT NULL,
    variables       JSONB NOT NULL DEFAULT '[]',
    category        VARCHAR(100),
    tags            TEXT[] NOT NULL DEFAULT '{}',
    usage_count     INTEGER NOT NULL DEFAULT 0,
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 008_add_search_indexes.ts (Elasticsearch 대체)
ALTER TABLE sessions ADD COLUMN search_vector tsvector;
ALTER TABLE messages ADD COLUMN search_vector tsvector;

CREATE INDEX idx_sessions_search ON sessions USING GIN(search_vector);
CREATE INDEX idx_messages_search ON messages USING GIN(search_vector);

CREATE FUNCTION update_session_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple',
        coalesce(NEW.title, '') || ' ' ||
        coalesce(array_to_string(NEW.tags, ' '), '') || ' ' ||
        coalesce(array_to_string(NEW.file_paths, ' '), '') || ' ' ||
        coalesce(array_to_string(NEW.module_names, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sessions_search_vector
    BEFORE INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_session_search_vector();

CREATE FUNCTION update_message_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', coalesce(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_messages_search_vector
    BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_message_search_vector();
```

---

## 4. API 엔드포인트 설계

### 4.1 API 응답 Envelope

```typescript
// packages/shared/src/types/api.ts
interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: PaginationMeta;
}

interface PaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
```

### 4.2 엔드포인트 목록

**인증 (Auth)**

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/auth/github` | GitHub OAuth 시작 |
| GET | `/api/auth/github/callback` | GitHub OAuth 콜백 |
| POST | `/api/auth/refresh` | JWT 토큰 갱신 |
| GET | `/api/auth/me` | 현재 사용자 정보 |
| POST | `/api/auth/logout` | 로그아웃 |

**팀 (Teams)**

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/teams` | 팀 생성 |
| GET | `/api/teams` | 내 팀 목록 |
| GET | `/api/teams/:teamId` | 팀 상세 |
| PATCH | `/api/teams/:teamId` | 팀 정보 수정 |
| POST | `/api/teams/:teamId/members` | 팀원 초대 |
| DELETE | `/api/teams/:teamId/members/:userId` | 팀원 제거 |

**프로젝트 (Projects)**

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/teams/:teamId/projects` | 프로젝트 생성 |
| GET | `/api/teams/:teamId/projects` | 프로젝트 목록 |
| GET | `/api/projects/:projectId` | 프로젝트 상세 |
| PATCH | `/api/projects/:projectId` | 프로젝트 수정 |

**세션 (Sessions)**

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/projects/:projectId/sessions/import` | 세션 업로드 (JSON/MD) |
| GET | `/api/projects/:projectId/sessions` | 세션 목록 (필터/페이지네이션) |
| GET | `/api/sessions/:sessionId` | 세션 상세 (메시지 포함) |
| PATCH | `/api/sessions/:sessionId` | 세션 메타데이터 수정 |
| DELETE | `/api/sessions/:sessionId` | 세션 삭제 |

**타임라인/대시보드 (Dashboard)**

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects/:projectId/timeline` | 타임라인 데이터 |
| GET | `/api/projects/:projectId/stats` | 대시보드 통계 |

**충돌 (Conflicts)**

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects/:projectId/conflicts` | 충돌 목록 |
| GET | `/api/conflicts/:conflictId` | 충돌 상세 |
| PATCH | `/api/conflicts/:conflictId` | 충돌 상태 변경 |

**검색 (Search)**

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects/:projectId/search?q=...&type=...` | 전문 검색 |

**알림 설정 (Notifications)**

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/users/me/notification-settings` | 알림 설정 조회 |
| PUT | `/api/users/me/notification-settings` | 알림 설정 변경 |

---

## 5. 프론트엔드 컴포넌트 계층구조

```
App
├── LoginPage
│   └── GitHubLoginButton
├── OAuthCallbackPage
└── AppLayout (인증 필요)
    ├── Header
    │   ├── ProjectSelector
    │   ├── SearchBar
    │   └── Avatar (사용자 메뉴)
    ├── Sidebar
    │   ├── NavItem (대시보드)
    │   ├── NavItem (세션)
    │   ├── NavItem (충돌)
    │   └── NavItem (설정)
    └── <Outlet />
        ├── DashboardPage
        │   ├── DashboardStats (StatCard x4)
        │   ├── Timeline → TimelineItem
        │   └── ActiveConflictsSidebar → ConflictCard
        ├── SessionsPage
        │   ├── SessionUploadModal
        │   ├── 필터 바
        │   └── SessionList → SessionCard
        ├── SessionDetailPage
        │   ├── 세션 메타 정보 헤더
        │   └── MessageThread → MessageBubble
        ├── ConflictsPage
        │   └── ConflictList → ConflictCard
        ├── ConflictDetailView
        │   ├── Side-by-side 세션 비교
        │   └── Resolve / Dismiss 버튼
        ├── ProjectSettingsPage
        └── TeamSettingsPage → MemberList
```

**상태관리:**
- 서버 상태: TanStack Query (캐싱, 리패치)
- 클라이언트 상태: Zustand (인증 토큰, 선택된 프로젝트)
- 폼: React Hook Form + zod

---

## 6. 주차별 상세 구현 계획

### Week 1: 프로젝트 인프라 및 인증 (백엔드)

**목표:** 모노레포 셋업, CI 파이프라인, GitHub OAuth 인증 완료

1. **모노레포 초기화** — pnpm-workspace, turbo.json, ESLint + Prettier, tsconfig.base.json
2. **`packages/shared`** — types/api.ts, types/user.ts, types/team.ts, types/project.ts, constants/
3. **`apps/api` Fastify 셋업** — app.ts (팩토리), index.ts, config/env.ts, plugins/, lib/api-response.ts
4. **DB 셋업** — Kysely 클라이언트, 마이그레이션 001-003 (users, teams, projects)
5. **GitHub OAuth (TDD)** — github-oauth.client.ts, auth.service.ts, auth.routes.ts, auth.plugin.ts
6. **CI 파이프라인** — .github/workflows/ci.yml

**Deliverable:** GitHub OAuth → JWT 발급 백엔드, users/teams/projects 테이블

---

### Week 2: 인증 (프론트엔드) + 팀/프로젝트 CRUD

**목표:** 로그인 UI, 팀 생성, 프로젝트 생성 기능 완료

1. **`apps/web` React 셋업** — Vite, TailwindCSS v4, React Router v7, fetch wrapper, Zustand
2. **인증 UI** — LoginPage, OAuthCallbackPage, GitHubLoginButton, route guard
3. **레이아웃** — AppLayout, Sidebar, Header, 공통 UI 컴포넌트 (Button, Input, Card 등)
4. **팀/프로젝트 백엔드 CRUD** — repository, service, routes (TDD)
5. **팀/프로젝트 프론트엔드** — TeamSettingsPage, ProjectSettingsPage, ProjectSelector

**Deliverable:** GitHub 로그인 → 팀 생성 → 프로젝트 생성 full flow

---

### Week 3: 세션 Import (수동 업로드)

**목표:** JSON/Markdown 파일 업로드로 세션 데이터 저장

1. **마이그레이션** — 004 (sessions), 005 (messages)
2. **파서 구현 (TDD)**
   - `json-session.parser.ts` — Claude Code JSONL 파싱, 파일 경로 자동 추출
   - `markdown-session.parser.ts` — `## User`/`## Assistant` 헤더 기반 분리
3. **Import 서비스** — 파일 타입 감지, 파서 라우팅, 트랜잭션 저장
4. **API** — `POST /api/projects/:projectId/sessions/import` (multipart, 10MB 제한)
5. **업로드 UI** — SessionUploadModal (드래그앤드롭, 진행률, 피드백)

**Deliverable:** JSON/MD 업로드 → 세션 + 메시지 저장, 파일 경로 자동 추출

---

### Week 4: 세션 목록/상세 뷰

**목표:** 세션 목록 조회, 필터링, 상세 대화 내용 열람

1. **목록 API** — 페이지네이션, 필터 (status, userId, date range, sortBy)
2. **상세 API** — 메시지 포함, 권한 체크
3. **목록 UI** — SessionsPage, SessionList, SessionCard (필터, 정렬, 페이지네이션)
4. **상세 UI** — SessionDetailPage, MessageThread (마크다운 렌더링, 코드 하이라이팅)

**Deliverable:** 세션 목록/상세 뷰 (필터, 마크다운, 코드 하이라이팅)

---

### Week 5: 팀 대시보드 (타임라인 뷰)

**목표:** 프로젝트 전체의 AI 작업 흐름을 시간순으로 조망

1. **타임라인 API** — 세션 요약 목록 (cursor 기반 페이지네이션)
2. **통계 API** — 오늘/주간 세션 수, 활성 충돌, 팀원별 세션, Hot 파일 Top 5
3. **대시보드 UI** — DashboardPage (3-column), DashboardStats, Timeline, TimelineItem, ActiveConflictsSidebar

**Deliverable:** 타임라인 대시보드, 통계 카드, 무한 스크롤

---

### Week 6: 기본 검색

**목표:** 세션 제목, 메시지 내용, 파일 경로 기반 전문 검색

1. **마이그레이션** — 008 (tsvector + 트리거), 기존 데이터 일괄 업데이트
2. **검색 서비스** — PostgreSQL ts_query + ts_rank, ts_headline 하이라이트
3. **검색 UI** — SearchBar (디바운스 300ms), SearchResults (세션/메시지 탭), 하이라이트

**Deliverable:** PostgreSQL tsvector 기반 전문 검색 + UI

---

### Week 7: 규칙 기반 충돌 감지

**목표:** 동일 파일 경로에 대한 동시 작업 자동 감지

1. **마이그레이션** — 006 (conflicts)
2. **충돌 감지 엔진 (TDD, 핵심 로직)**
   - `conflict-detector.ts` — 순수 함수
   - 최근 7일 이내 다른 사용자 세션과 file_paths 교집합 계산
   - 심각도: 1-2개 info, 3-5개 warning, 6개+ critical
3. **세션 Import 연결** — 저장 후 자동 충돌 감지 실행
4. **충돌 API** — 목록, 상세, 상태 변경
5. **충돌 UI** — ConflictsPage, ConflictCard (심각도 색상), ConflictDetailView (Side-by-side), Resolve/Dismiss

**Deliverable:** 자동 충돌 감지, 목록/상세 UI, 해결 기능

---

### Week 8: 알림 + 통합 테스트 + 배포

**목표:** 충돌 알림, E2E 테스트, 프로덕션 배포

1. **알림 채널** — email.channel.ts (Resend/SendGrid), slack.channel.ts (Incoming Webhook)
2. **알림 서비스** — 채널 라우팅, 중복 방지, 충돌 감지 시 자동 전송
3. **알림 설정 API/UI** — Slack Webhook URL, 이메일 on/off, 심각도 임계값
4. **E2E 테스트** — Playwright (로그인, 팀/프로젝트 생성, 세션 업로드→충돌 감지→해결)
5. **배포** — 백엔드: Railway/Render (Docker), 프론트: Vercel, DB: Neon PostgreSQL
6. **최종 점검** — API 일관성, 에러 핸들링, docker-compose.yml (로컬)

**Deliverable:** 이메일/Slack 알림, E2E 테스트, 프로덕션 배포 완료

---

## 7. 테스트 전략

| 영역 | 도구 | 대상 |
|------|------|------|
| 단위 테스트 | Vitest | 서비스, 리포지토리, 파서, 유틸리티 |
| API 통합 테스트 | Vitest + `fastify.inject()` | 라우트 + DB |
| 컴포넌트 테스트 | Vitest + Testing Library | React 컴포넌트 |
| E2E 테스트 | Playwright | 핵심 사용자 플로우 |

### TDD 최우선 대상

1. `conflict-detector.ts` — 핵심 비즈니스 로직, 엣지 케이스 다수
2. `json-session.parser.ts` / `markdown-session.parser.ts` — 입력 파싱
3. `auth.service.ts` — 보안 관련
4. `search.service.ts` — 쿼리 생성 로직

### 테스트 DB

- `testcontainers`로 PostgreSQL Docker 컨테이너
- 테스트 suite마다 마이그레이션 → 트랜잭션 롤백 패턴

### 커버리지 목표

| 모듈 | 목표 |
|------|------|
| 서비스 | 90%+ |
| 리포지토리 | 80%+ |
| 파서 | 95%+ |
| 충돌 감지 엔진 | 95%+ |
| React 컴포넌트 | 70%+ |
| **전체** | **80%+** |

---

## 8. 배포 전략

### 환경

| 환경 | 용도 | 트리거 |
|------|------|--------|
| Local | 개발 | docker-compose up |
| Preview | PR 리뷰 | PR 생성 시 자동 (Vercel Preview) |
| Production | 서비스 | main 머지 시 |

### 인프라

```
[Vercel]  ──── apps/web (정적 빌드)
                    │
                    ▼
[Railway/Render] ── apps/api (Docker)
                    │
                    ▼
[Neon PostgreSQL] ── 데이터베이스
```

---

## 9. 주요 의존성

### 백엔드 (`apps/api`)

| 패키지 | 용도 |
|--------|------|
| fastify | HTTP 프레임워크 |
| @fastify/cors, @fastify/multipart, @fastify/jwt | 플러그인 |
| kysely + pg | 타입 안전 SQL 쿼리 빌더 + 드라이버 |
| zod | 런타임 입력 검증 |
| resend 또는 @sendgrid/mail | 이메일 |
| @slack/webhook | Slack 알림 |
| vitest + testcontainers | 테스트 |

### 프론트엔드 (`apps/web`)

| 패키지 | 용도 |
|--------|------|
| react + react-dom | UI |
| react-router | 라우팅 |
| @tanstack/react-query | 서버 상태 관리 |
| zustand | 클라이언트 상태 |
| react-hook-form + zod | 폼 + 검증 |
| tailwindcss | 스타일링 |
| react-markdown + remark-gfm | 마크다운 렌더링 |
| shiki | 코드 구문 강조 |
| react-dropzone | 파일 업로드 |
| date-fns | 날짜 포맷 |
| vitest + @testing-library/react | 컴포넌트 테스트 |
| playwright | E2E 테스트 |

---

## 10. 리스크 및 완화 전략

| 리스크 | 완화 전략 |
|--------|----------|
| Claude Code Export 형식 변경 | 파서를 전략 패턴으로 설계, 단위 테스트에 실제 샘플 포함 |
| PostgreSQL 전문 검색 성능 한계 | MVP 충분. Phase 2에서 Elasticsearch 마이그레이션 경로 확보 |
| 파일 경로 기반 충돌 감지 오탐 | 보수적 임계값 (3개+부터 warning), dismissed로 피드백 수집 |
| 8주 일정 압박 | 알림은 Slack 우선, 이메일 후순위. E2E는 핵심 3개 플로우로 제한 |
| 팀원 초대 플로우 | 초대 링크 기반 단순 방식. 이메일 초대는 Phase 2 |

---

## 11. 코딩 컨벤션

1. **불변성:** 모든 데이터 변환은 새 객체 반환
2. **파일 크기:** 200-400줄 목표, 800줄 초과 금지
3. **Repository 패턴:** 모든 DB 접근은 repository 통해서만
4. **API 응답:** 항상 `ApiResponse<T>` envelope, `ok()` / `fail()` / `paginated()` 헬퍼
5. **에러 핸들링:** 서비스에서 도메인 에러 throw, 라우트에서 HTTP 상태 코드 매핑
6. **입력 검증:** zod 스키마로 경계에서 검증
