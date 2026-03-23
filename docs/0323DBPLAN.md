# 듀얼 DB 풀 아키텍처 기획안

> 2026-03-23 · 프로젝트별 로컬/리모트 DB 분리

---

## 1. 배경

ContextSync에서 한 유저가 여러 프로젝트를 가질 수 있고, 각 프로젝트는:

- **개인 프로젝트** → 로컬 DB (Docker PostgreSQL)
- **팀 프로젝트** → 리모트 DB (Supabase 등)

현재는 앱 전체가 단일 `DATABASE_URL`을 사용하여 로컬 또는 리모트 중 하나만 선택 가능. 두 종류의 프로젝트를 동시에 운영하려면 듀얼 DB 풀 아키텍처가 필요.

---

## 2. 현재 아키텍처

```
.env
  └─ DATABASE_URL (단일)

app.ts
  └─ createDb(DATABASE_URL) → app.db (단일 Kysely 인스턴스)

route handler
  └─ app.db → service(db, ...) → repository(db, ...)
```

**제약:**

- `app.db`가 Fastify에 단일 인스턴스로 decorate됨
- 모든 라우트/서비스/레포지토리가 동일한 `db` 인스턴스 사용
- 15개 라우트 파일, 19개 서비스 파일, 10개 레포지토리 파일 영향

---

## 3. 목표 아키텍처

```
.env
  ├─ DATABASE_URL (로컬 — 항상 존재)
  └─ REMOTE_DATABASE_URL (리모트 — 선택)

app.ts
  ├─ createDb(DATABASE_URL) → app.localDb
  ├─ createDb(REMOTE_DATABASE_URL) → app.remoteDb (optional)
  └─ app.resolveDb(projectId) → localDb | remoteDb

route handler
  └─ app.resolveDb(projectId) → service(db, ...) → repository(db, ...)
```

### 3.1 데이터 분리 원칙

| 데이터                    | 저장 위치     | 이유                                                              |
| ------------------------- | ------------- | ----------------------------------------------------------------- |
| **users**                 | 로컬 DB only  | 유저는 기기 소유자. 각 팀원이 자신의 로컬에 유저 데이터 보유      |
| **projects (메타)**       | 로컬 DB only  | 프로젝트 목록/설정은 로컬에서 관리. `database_mode` 컬럼으로 구분 |
| **project_collaborators** | 로컬 DB only  | 협업자 관계는 로컬에서 관리                                       |
| **sessions**              | 프로젝트의 DB | 개인 프로젝트 → 로컬, 팀 프로젝트 → 리모트                        |
| **messages**              | 프로젝트의 DB | 세션에 종속                                                       |
| **conflicts**             | 프로젝트의 DB | 세션에 종속                                                       |
| **activity_log**          | 프로젝트의 DB | 팀 활동은 리모트에서 공유                                         |
| **prd_documents**         | 프로젝트의 DB | 프로젝트 문서                                                     |
| **ai_evaluations**        | 프로젝트의 DB | 프로젝트별 평가                                                   |

### 3.2 핵심 설계: 유저 동기화 문제

**문제:** 리모트 DB의 `sessions.user_id`가 로컬 DB의 `users.id`를 참조하는데, FK가 DB 간에 걸리지 않음.

**해결안: 유저 레코드 리모트 동기화**

팀 프로젝트에 참여할 때, 유저 레코드(id, name, avatar_url)를 리모트 DB의 `users` 테이블에도 **복제**:

- 리모트 DB에도 동일한 `users` 테이블 존재 (마이그레이션 동일)
- `joinByCode` 시 유저 정보를 리모트 DB에 upsert
- 리모트 DB의 FK가 정상 작동
- 유저 이름 변경 시 리모트에도 동기

```
[로컬 DB]                    [리모트 DB]
users ──────── sync ────────→ users (복제)
projects                      sessions
project_collaborators         messages
                              conflicts
                              activity_log
```

---

## 4. 스키마 변경

### 4.1 projects 테이블 — `database_mode` 컬럼 추가

```sql
ALTER TABLE projects ADD COLUMN database_mode VARCHAR(10) NOT NULL DEFAULT 'local';
-- 값: 'local' | 'remote'
```

### 4.2 환경 변수 추가

```env
# 기존
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/contextsync

# 신규 (선택)
REMOTE_DATABASE_URL=postgresql://postgres.ref:pass@pooler.supabase.com:6543/postgres
REMOTE_DATABASE_SSL=true
```

### 4.3 env.ts 확장

```typescript
// 기존 DATABASE_URL은 필수 (로컬)
// REMOTE_DATABASE_URL은 선택
REMOTE_DATABASE_URL: z.string().url().optional(),
REMOTE_DATABASE_SSL: z.coerce.boolean().default(false),
```

---

## 5. 백엔드 변경

### 5.1 app.ts — 듀얼 DB 인스턴스

```typescript
const localDb = createDb({ connectionString: env.DATABASE_URL, ssl: env.DATABASE_SSL });
const remoteDb = env.REMOTE_DATABASE_URL
  ? createDb({ connectionString: env.REMOTE_DATABASE_URL, ssl: env.REMOTE_DATABASE_SSL })
  : null;

app.decorate('localDb', localDb);
app.decorate('remoteDb', remoteDb);
app.decorate('resolveDb', async (projectId: string) => {
  // projects 테이블은 항상 localDb에서 조회
  const project = await localDb
    .selectFrom('projects')
    .select('database_mode')
    .where('id', '=', projectId)
    .executeTakeFirst();

  if (project?.database_mode === 'remote' && remoteDb) {
    return remoteDb;
  }
  return localDb;
});
```

### 5.2 라우트 핸들러 패턴 변경

```typescript
// 기존
app.get('/sessions/:id', async (request, reply) => {
  const session = await getSession(app.db, sessionId);
});

// 변경
app.get('/sessions/:id', async (request, reply) => {
  const db = await app.resolveDb(projectId);
  const session = await getSession(db, sessionId);
});
```

### 5.3 유저/인증 라우트 — 항상 localDb

```typescript
// 유저 관련은 항상 localDb
app.post('/auth/identify', async (request, reply) => {
  const result = await findOrCreateByName(app.localDb, name);
  // ...
});
```

### 5.4 유저 동기화 — joinByCode 확장

```typescript
export async function joinByCode(localDb, remoteDb, code, userId) {
  // 1. localDb에서 프로젝트 찾기
  const project = await findProjectByJoinCode(localDb, code);

  // 2. localDb에 collaborator 추가
  await addCollaborator(localDb, project.id, userId, 'member');

  // 3. 리모트 프로젝트면 유저를 리모트 DB에 동기
  if (project.databaseMode === 'remote' && remoteDb) {
    const user = await findUserById(localDb, userId);
    await upsertUserToRemote(remoteDb, user);
  }

  return project;
}
```

---

## 6. 프론트엔드 변경

### 6.1 프로젝트 생성 시 DB 모드 선택

온보딩/프로젝트 생성 UI에서:

- "Personal (local)" / "Team (remote)" 선택지 추가
- Team 선택 시 리모트 DB 설정 필요 안내
- `createProject` API에 `databaseMode` 파라미터 추가

### 6.2 프로젝트 목록에 모드 표시

- 프로젝트 카드에 "Local" / "Team" 배지 표시

---

## 7. 마이그레이션 전략

### 7.1 기존 데이터 처리

**시나리오 A: 현재 로컬 DB만 사용 중**

- `database_mode = 'local'` 기본값으로 자동 적용
- 변경 없음

**시나리오 B: 현재 리모트 DB로 전환된 상태**

- 모든 기존 프로젝트를 `database_mode = 'remote'`로 설정
- `.env`의 `DATABASE_URL`을 `REMOTE_DATABASE_URL`로 이동
- 로컬 Docker PostgreSQL을 `DATABASE_URL`로 재설정
- 기존 데이터는 리모트에 유지

### 7.2 마이그레이션 순서

```
1. projects 테이블에 database_mode 컬럼 추가 (migration 027)
2. env.ts에 REMOTE_DATABASE_URL 지원 추가
3. app.ts에 듀얼 DB 인스턴스 + resolveDb 구현
4. 라우트 핸들러 15개 파일 업데이트 (resolveDb 사용)
5. joinByCode에 유저 동기화 추가
6. 프론트엔드 프로젝트 생성 UI 업데이트
7. setup:team 스크립트 업데이트
```

---

## 8. 영향 범위

### 백엔드 변경 파일

| 파일                                               | 변경                                              |
| -------------------------------------------------- | ------------------------------------------------- |
| `apps/api/src/config/env.ts`                       | `REMOTE_DATABASE_URL`, `REMOTE_DATABASE_SSL` 추가 |
| `apps/api/src/app.ts`                              | localDb + remoteDb + resolveDb 구현               |
| `apps/api/src/database/migrations/027_*.ts`        | `projects.database_mode` 컬럼                     |
| `apps/api/src/database/types.ts`                   | `ProjectsTable.database_mode` 추가                |
| `apps/api/src/modules/*/routes.ts` (15개)          | `app.db` → `app.resolveDb(projectId)`             |
| `apps/api/src/modules/auth/*.ts`                   | `app.localDb` 사용                                |
| `apps/api/src/modules/projects/project.service.ts` | 프로젝트 생성 시 `databaseMode` 처리              |
| `apps/api/src/modules/projects/project.service.ts` | `joinByCode` 유저 동기화                          |
| `apps/api/src/modules/setup/setup.service.ts`      | 리모트 전환 → `REMOTE_DATABASE_URL` 기반          |

### 프론트엔드 변경 파일

| 파일                                                      | 변경                     |
| --------------------------------------------------------- | ------------------------ |
| `packages/shared/src/types/project.ts`                    | `databaseMode` 필드 추가 |
| `apps/web/src/pages/OnboardingPage.tsx`                   | 프로젝트 모드 선택 UI    |
| `apps/web/src/components/projects/CreateProjectModal.tsx` | 모드 선택                |
| 프로젝트 카드/목록 컴포넌트                               | Local/Team 배지          |

---

## 9. 리스크 및 고려사항

| 항목                    | 내용                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **FK 무결성**           | 리모트 DB에 유저 복제 시 동기 지연 가능. upsert로 처리하되, 실패 시 세션 생성은 계속 진행       |
| **커넥션 풀**           | 로컬 + 리모트 각각 max 20 → 총 40 커넥션. 로컬 환경에서는 충분                                  |
| **마이그레이션 동기화** | 로컬/리모트 DB 모두 동일한 마이그레이션 필요. 앱 시작 시 양쪽 모두 migrate                      |
| **resolveDb 성능**      | 매 요청마다 projects 테이블 조회. 캐시(in-memory Map)로 해결 가능                               |
| **대규모 리팩터**       | 15개 라우트 파일 일괄 변경. 점진적 마이그레이션 가능 (resolveDb가 remoteDb 없으면 localDb 반환) |
| **테스트**              | 모든 E2E/통합 테스트가 단일 DB 가정. 듀얼 DB 테스트 환경 필요                                   |

---

## 10. 구현 우선순위

| 순서  | 항목                                | 복잡도           |
| ----- | ----------------------------------- | ---------------- |
| **1** | env.ts + app.ts 듀얼 DB 인프라      | 낮음             |
| **2** | projects.database_mode 마이그레이션 | 낮음             |
| **3** | resolveDb 함수 + 캐시               | 중간             |
| **4** | 라우트 핸들러 15개 업데이트         | 중간 (반복 작업) |
| **5** | joinByCode 유저 동기화              | 중간             |
| **6** | 프론트엔드 프로젝트 모드 선택 UI    | 중간             |
| **7** | 기존 데이터 마이그레이션 가이드     | 낮음             |
| **8** | setup:team 스크립트 업데이트        | 낮음             |

---

## 11. 점진적 도입 전략

리팩터 규모가 크므로 단계적으로 도입:

**Phase A: 인프라 준비 (영향 최소)**

- env.ts에 REMOTE_DATABASE_URL 추가 (optional)
- app.ts에 localDb/remoteDb/resolveDb 구현
- resolveDb가 remoteDb 없으면 항상 localDb 반환 → 기존 동작 유지
- projects.database_mode 마이그레이션 (default 'local')

**Phase B: 라우트 전환 (점진적)**

- 모듈 하나씩 `app.db` → `app.resolveDb(projectId)` 전환
- 각 모듈 전환 후 테스트 → 다음 모듈
- auth 모듈은 항상 `app.localDb` 사용

**Phase C: 팀 프로젝트 활성화**

- 프로젝트 생성 시 모드 선택 UI 추가
- joinByCode 유저 동기화 구현
- setup:team에서 `REMOTE_DATABASE_URL` 설정

---

## 12. 교차검수 결과

> 실제 코드 대비 기획안 검증 (2026-03-23)

### Critical 블로커 (3건)

| #   | 문제                                            | 해결안                                                |
| --- | ----------------------------------------------- | ----------------------------------------------------- |
| 1   | `runMigrations()`가 단일 DB만 지원              | `index.ts`에서 순차적으로 localDb, remoteDb 각각 호출 |
| 2   | `env.ts`에 `REMOTE_DATABASE_URL` 미존재         | Zod 스키마에 optional로 추가                          |
| 3   | `/sessions/:sessionId` 등 projectId 없는 라우트 | "양쪽 DB 탐색" 헬퍼 + projectId→DB 캐시(LRU)          |

### 중간 이슈 (7건)

| #   | 문제                                                    | 영향 | 해결안                                             |
| --- | ------------------------------------------------------- | ---- | -------------------------------------------------- |
| 1   | `getTeamStats`에서 sessions→users JOIN                  | 높음 | 유저 리모트 복제 (기획 3.2에 명시됨)               |
| 2   | `/sessions/:sessionId`, `/conflicts/:conflictId` 라우트 | 높음 | 양쪽 DB 탐색 헬퍼 + LRU 캐시 (TTL 5분)             |
| 3   | 마이그레이션 중복 실행 (index.ts + app.ts)              | 중간 | 듀얼 DB 마이그레이션 로직 통합                     |
| 4   | `resolveDb()` 매 요청 projects 조회                     | 중간 | in-memory Map 캐시 (TTL 5분)                       |
| 5   | 세션 동기화 함수가 generic `db` 사용                    | 중간 | localDb 파라미터 명시 전달                         |
| 6   | `joinByCode`에 remoteDb 인자 부재                       | 중간 | 서비스 시그니처 확장 + `upsertUserToRemote()` 구현 |
| 7   | admin 서비스 `runMigrations` 단일 DB                    | 중간 | 양쪽 DB에 순차 실행                                |

### 라우트별 projectId 가용성

| 모듈           | 라우트 패턴                            | projectId     | DB 라우팅              |
| -------------- | -------------------------------------- | ------------- | ---------------------- |
| sessions       | `/projects/:projectId/sessions`        | params에 있음 | `resolveDb(projectId)` |
| sessions       | `/sessions/:sessionId`                 | **없음**      | 양쪽 DB 탐색 필요      |
| search         | `/projects/:projectId/search`          | params에 있음 | `resolveDb(projectId)` |
| activity       | `/projects/:projectId/activity`        | params에 있음 | `resolveDb(projectId)` |
| conflicts      | `/projects/:projectId/conflicts`       | params에 있음 | `resolveDb(projectId)` |
| conflicts      | `/conflicts/:conflictId`               | **없음**      | 양쪽 DB 탐색 필요      |
| prd-analysis   | `/projects/:projectId/prd/*`           | params에 있음 | `resolveDb(projectId)` |
| ai-evaluation  | `/projects/:projectId/ai-evaluation/*` | params에 있음 | `resolveDb(projectId)` |
| projects       | `/projects/*`                          | -             | 항상 localDb           |
| auth           | `/auth/*`                              | -             | 항상 localDb           |
| setup          | `/setup/*`                             | -             | 항상 localDb           |
| local-sessions | `/sessions/local/*`                    | -             | 항상 localDb           |
| plans          | `/plans/local/*`                       | -             | 항상 localDb           |

### 결론

**실현 가능성: 높음 (80%)**. 아키텍처가 잘 분리되어 있어 service/repository 레이어 변경 불필요. 라우트 핸들러 15개와 인프라 코드만 수정하면 됨.

---

## 13. 구체적 구현 계획

### Phase A: 인프라 준비 (기존 동작 유지)

#### A-1. `apps/api/src/config/env.ts`

```typescript
// 기존 스키마에 추가
REMOTE_DATABASE_URL: z.string().url().optional(),
REMOTE_DATABASE_SSL: z.coerce.boolean().default(false),
REMOTE_DATABASE_SSL_CA: z.string().optional(),
```

#### A-2. `apps/api/src/database/migrations/027_add_project_database_mode.ts`

```typescript
export async function up(db) {
  await db.schema
    .alterTable('projects')
    .addColumn('database_mode', 'varchar(10)', (col) => col.notNull().defaultTo('local'))
    .execute();
}
```

#### A-3. `apps/api/src/database/types.ts`

```typescript
// ProjectsTable에 추가
database_mode: Generated<string>;
```

#### A-4. `packages/shared/src/types/project.ts`

```typescript
// Project 인터페이스에 추가
readonly databaseMode: 'local' | 'remote';
```

#### A-5. `apps/api/src/app.ts` — 듀얼 DB + resolveDb

```typescript
const localDb = createDb({ connectionString: env.DATABASE_URL, ssl: env.DATABASE_SSL });
const remoteDb = env.REMOTE_DATABASE_URL
  ? createDb({ connectionString: env.REMOTE_DATABASE_URL, ssl: env.REMOTE_DATABASE_SSL })
  : null;

// projectId → databaseMode 캐시
const dbModeCache = new Map<string, { mode: string; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

async function resolveDb(projectId: string): Promise<Db> {
  const cached = dbModeCache.get(projectId);
  if (cached && cached.expiry > Date.now()) {
    return cached.mode === 'remote' && remoteDb ? remoteDb : localDb;
  }

  const project = await localDb
    .selectFrom('projects')
    .select('database_mode')
    .where('id', '=', projectId)
    .executeTakeFirst();

  const mode = project?.database_mode ?? 'local';
  dbModeCache.set(projectId, { mode, expiry: Date.now() + CACHE_TTL });
  return mode === 'remote' && remoteDb ? remoteDb : localDb;
}

app.decorate('localDb', localDb);
app.decorate('remoteDb', remoteDb);
app.decorate('resolveDb', resolveDb);

// 하위 호환: app.db는 localDb로 유지 (점진적 전환)
app.decorate('db', localDb);
```

#### A-6. `apps/api/src/index.ts` — 듀얼 마이그레이션

```typescript
// 로컬 DB 마이그레이션
await runMigrations({ connectionString: env.DATABASE_URL, sslEnabled: env.DATABASE_SSL });

// 리모트 DB 마이그레이션 (설정된 경우)
if (env.REMOTE_DATABASE_URL) {
  await runMigrations({
    connectionString: env.REMOTE_DATABASE_URL,
    sslEnabled: env.REMOTE_DATABASE_SSL,
  });
}
```

**Phase A 완료 시:** `app.db`가 여전히 동작하므로 기존 코드 전혀 영향 없음. `resolveDb`가 준비되어 있지만 아직 사용되지 않는 상태.

---

### Phase B: 라우트 전환 (모듈별 점진)

#### B-1. projectId가 있는 라우트 (12개 모듈)

패턴 변경:

```typescript
// 기존
const sessions = await getSessionsByProject(app.db, projectId, userId);

// 변경
const db = await app.resolveDb(projectId);
const sessions = await getSessionsByProject(db, projectId, userId);
```

대상 모듈: sessions, search, activity, conflicts, prd-analysis, ai-evaluation, notifications, invitations

#### B-2. projectId 없는 라우트 — 양쪽 DB 탐색 헬퍼

```typescript
// apps/api/src/lib/resolve-entity-db.ts (신규)
export async function resolveSessionDb(
  localDb: Db,
  remoteDb: Db | null,
  sessionId: string,
): Promise<{ db: Db; session: Session }> {
  const local = await sessionRepo.findSessionById(localDb, sessionId);
  if (local) return { db: localDb, session: local };

  if (remoteDb) {
    const remote = await sessionRepo.findSessionById(remoteDb, sessionId);
    if (remote) return { db: remoteDb, session: remote };
  }

  throw new NotFoundError('Session');
}
```

대상: `/sessions/:sessionId`, `/conflicts/:conflictId`

#### B-3. 항상 localDb 사용 라우트

`app.db` → `app.localDb`로 변경:

- auth, projects, setup, local-sessions, plans, quota, admin

---

### Phase C: 팀 프로젝트 활성화

#### C-1. 유저 리모트 동기화

```typescript
// apps/api/src/lib/user-sync.ts (신규)
export async function syncUserToRemote(remoteDb: Db, user: User): Promise<void> {
  await remoteDb
    .insertInto('users')
    .values({ id: user.id, name: user.name, email: user.email, ... })
    .onConflict((oc) => oc.column('id').doUpdateSet({ name: user.name, ... }))
    .execute();
}
```

호출 시점:

- `joinByCode` 성공 시 (팀 프로젝트인 경우)
- 유저 이름 변경 시

#### C-2. 프로젝트 생성 시 모드 선택

- `createProject` API에 `databaseMode` 파라미터 추가
- 프론트엔드 온보딩/프로젝트 생성 UI에 "Personal" / "Team" 선택지

#### C-3. setup:team 스크립트 업데이트

- `REMOTE_DATABASE_URL`로 .env 생성 (기존 `DATABASE_URL` → 로컬 Docker)
- 로컬 DB도 자동 시작 (Docker compose up)

---

### 검증 체크리스트

```bash
# Phase A 검증
pnpm typecheck
pnpm test
pnpm dev  # 기존 동작 유지 확인 (app.db = localDb)

# Phase B 검증 (모듈별)
pnpm test -- sessions  # 각 모듈 전환 후 테스트
pnpm test:e2e          # 전체 E2E

# Phase C 검증
# 수동 테스트:
# 1. 로컬 프로젝트 생성 → 세션 동기화 → 로컬 DB에 저장 확인
# 2. 팀 프로젝트 생성 → 세션 동기화 → 리모트 DB에 저장 확인
# 3. 두 프로젝트 전환하며 데이터 격리 확인
```
