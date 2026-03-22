import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './types.js';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString }),
  }),
});

// ── helpers ──────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

// ── main ─────────────────────────────────────────────────

async function main() {
  console.log('🎨 Seeding marketing demo data...\n');

  // 1. Users
  const users = await seedUsers();
  console.log(`  ✓ ${users.length} users created`);

  // 2. Project
  const project = await seedProject(users[0]!.id);
  console.log(`  ✓ Project "${project.name}" created`);

  // 3. Collaborators
  await seedCollaborators(project.id, users);
  console.log('  ✓ Collaborators added');

  // 4. Sessions + Messages
  const sessions = await seedSessions(project.id, users);
  console.log(`  ✓ ${sessions.length} sessions created`);

  // 5. Conflicts
  await seedConflicts(project.id, sessions, users);
  console.log('  ✓ 4 conflicts created');

  // 6. PRD data
  await seedPrd(project.id, users[0]!.id);
  console.log('  ✓ PRD analysis data created');

  // 7. AI evaluation
  await seedAiEvaluation(project.id, users[0]!.id, sessions);
  console.log('  ✓ AI evaluation data created');

  // 8. Activity log
  await seedActivityLog(project.id, users, sessions);
  console.log('  ✓ Activity log entries created');

  await db.destroy();
  console.log('\n✅ Marketing seed completed');
}

// ── users ────────────────────────────────────────────────

async function seedUsers() {
  const userData = [
    { email: 'alex@contextsync.io', name: 'Alex Kim' },
    { email: 'sarah@contextsync.io', name: 'Sarah Chen' },
    { email: 'marcus@contextsync.io', name: 'Marcus Park' },
    { email: 'emily@contextsync.io', name: 'Emily Davis' },
  ] as const;

  const users: Array<{ id: string; email: string; name: string }> = [];

  for (const u of userData) {
    const row = await db
      .insertInto('users')
      .values({ email: u.email, name: u.name, avatar_url: null })
      .onConflict((oc) => oc.column('email').doUpdateSet({ name: u.name }))
      .returningAll()
      .executeTakeFirstOrThrow();
    users.push({ id: row.id, email: row.email, name: row.name });
  }

  return users;
}

// ── project ──────────────────────────────────────────────

async function seedProject(ownerId: string) {
  return db
    .insertInto('projects')
    .values({
      owner_id: ownerId,
      name: 'ContextSync',
      description:
        'AI session context management platform — archive, sync, search, and detect conflicts',
      repo_url: 'https://github.com/contextsync/contextsync',
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

// ── collaborators ────────────────────────────────────────

async function seedCollaborators(projectId: string, users: ReadonlyArray<{ id: string }>) {
  const roles = ['admin', 'member', 'member'] as const;
  for (let i = 1; i < users.length; i++) {
    await db
      .insertInto('project_collaborators')
      .values({
        project_id: projectId,
        user_id: users[i]!.id,
        role: roles[i - 1]!,
      })
      .execute();
  }
}

// ── sessions ─────────────────────────────────────────────

async function seedSessions(projectId: string, users: ReadonlyArray<{ id: string }>) {
  const [alex, sarah, marcus, emily] = [users[0]!.id, users[1]!.id, users[2]!.id, users[3]!.id];

  const sessionData = [
    {
      user_id: alex,
      title: 'feat: Implement JWT authentication flow',
      status: 'completed',
      file_paths: ['src/auth/login.ts', 'src/auth/middleware.ts', 'src/routes/auth.ts'],
      module_names: ['auth'],
      branch: 'feat/auth',
      tags: ['auth', 'feature'],
      created_at: daysAgo(6),
    },
    {
      user_id: sarah,
      title: 'feat: Add real-time conflict detection engine',
      status: 'completed',
      file_paths: [
        'src/conflicts/detector.ts',
        'src/conflicts/resolver.ts',
        'src/conflicts/types.ts',
      ],
      module_names: ['conflicts'],
      branch: 'feat/conflicts',
      tags: ['conflicts', 'feature'],
      created_at: daysAgo(5),
    },
    {
      user_id: marcus,
      title: 'fix: Resolve database connection pooling issue',
      status: 'completed',
      file_paths: ['src/database/client.ts', 'src/config/database.ts'],
      module_names: ['database'],
      branch: 'fix/db-pool',
      tags: ['database', 'bugfix'],
      created_at: daysAgo(5),
    },
    {
      user_id: emily,
      title: 'refactor: Extract validation utilities',
      status: 'completed',
      file_paths: ['src/utils/validate.ts', 'src/schemas/user.ts', 'src/schemas/session.ts'],
      module_names: ['utils', 'schemas'],
      branch: 'refactor/validation',
      tags: ['refactor', 'utils'],
      created_at: daysAgo(4),
    },
    {
      user_id: alex,
      title: 'feat: PRD analysis with Claude API integration',
      status: 'completed',
      file_paths: ['src/prd/analyzer.ts', 'src/prd/dashboard.ts', 'src/prd/types.ts'],
      module_names: ['prd'],
      branch: 'feat/prd',
      tags: ['prd', 'ai'],
      created_at: daysAgo(4),
    },
    {
      user_id: sarah,
      title: 'feat: Full-text search with PostgreSQL tsvector',
      status: 'completed',
      file_paths: ['src/search/index.ts', 'src/database/migrations/012.ts'],
      module_names: ['search'],
      branch: 'feat/search',
      tags: ['search', 'feature'],
      created_at: daysAgo(3),
    },
    {
      user_id: marcus,
      title: 'feat: Team invitation & role management',
      status: 'active',
      file_paths: ['src/team/invite.ts', 'src/team/roles.ts', 'src/team/permissions.ts'],
      module_names: ['team'],
      branch: 'feat/team',
      tags: ['team', 'collaboration'],
      created_at: daysAgo(2),
    },
    {
      user_id: alex,
      title: 'refactor: Migrate to Fastify 5 with ESM',
      status: 'completed',
      file_paths: [
        'src/app.ts',
        'src/plugins/auth.ts',
        'src/plugins/cors.ts',
        'src/routes/index.ts',
      ],
      module_names: ['core', 'plugins'],
      branch: 'refactor/fastify5',
      tags: ['refactor', 'migration'],
      created_at: daysAgo(3),
    },
    {
      user_id: emily,
      title: 'fix: Session sync race condition on concurrent imports',
      status: 'active',
      file_paths: ['src/sync/manager.ts', 'src/sync/queue.ts'],
      module_names: ['sync'],
      branch: 'fix/sync-race',
      tags: ['sync', 'bugfix'],
      created_at: daysAgo(1),
    },
    {
      user_id: sarah,
      title: 'feat: Token usage analytics dashboard',
      status: 'completed',
      file_paths: ['src/dashboard/charts.ts', 'src/dashboard/stats.ts', 'src/dashboard/types.ts'],
      module_names: ['dashboard'],
      branch: 'feat/analytics',
      tags: ['analytics', 'feature'],
      created_at: daysAgo(2),
    },
    {
      user_id: marcus,
      title: 'docs: API endpoint documentation with OpenAPI',
      status: 'completed',
      file_paths: ['docs/openapi.yaml', 'docs/api-reference.md'],
      module_names: ['docs'],
      branch: 'docs/api',
      tags: ['docs'],
      created_at: daysAgo(1),
    },
    {
      user_id: alex,
      title: 'feat: AI evaluation scoring system',
      status: 'active',
      file_paths: [
        'src/evaluation/scorer.ts',
        'src/evaluation/dimensions.ts',
        'src/evaluation/report.ts',
      ],
      module_names: ['evaluation'],
      branch: 'feat/ai-eval',
      tags: ['ai', 'evaluation'],
      created_at: hoursAgo(8),
    },
  ];

  const sessions = [];
  for (const s of sessionData) {
    const row = await db
      .insertInto('sessions')
      .values({
        project_id: projectId,
        user_id: s.user_id,
        title: s.title,
        source: 'claude-code',
        status: s.status,
        file_paths: s.file_paths,
        module_names: s.module_names,
        branch: s.branch,
        tags: s.tags,
        created_at: s.created_at,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    sessions.push(row);
  }

  // Messages for each session
  await seedMessages(sessions);

  return sessions;
}

// ── messages ─────────────────────────────────────────────

async function seedMessages(sessions: ReadonlyArray<{ id: string; title: string }>) {
  const messageGroups: Array<
    ReadonlyArray<{
      role: string;
      content: string;
      model_used?: string;
      tokens_used?: number;
    }>
  > = [
    // Session 0: JWT Auth
    [
      {
        role: 'human',
        content:
          'JWT 인증 플로우를 구현해야 합니다. 로그인, 토큰 갱신, 보호 라우트 미들웨어를 포함해주세요.',
      },
      {
        role: 'assistant',
        content:
          'JWT 인증 모듈을 구현하겠습니다. 먼저 `@fastify/jwt` 플러그인을 설정하고, 로그인 라우트에서 이메일 기반 사용자 조회 후 토큰을 발급합니다. 미들웨어는 `onRequest` 훅으로 등록하여 보호 라우트에 자동 적용합니다.\n\n```typescript\nexport async function authPlugin(app: FastifyInstance) {\n  app.register(jwt, {\n    secret: env.JWT_SECRET,\n    sign: { expiresIn: env.JWT_EXPIRES_IN },\n  });\n}\n```',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1250,
      },
      {
        role: 'human',
        content:
          '리프레시 토큰 로테이션 전략도 추가해주세요. 보안을 위해 단발성 리프레시 토큰을 사용하고 싶습니다.',
      },
      {
        role: 'assistant',
        content:
          "리프레시 토큰 로테이션을 구현합니다. 각 리프레시 토큰은 1회만 사용 가능하며, 사용 시 새 액세스 토큰 + 새 리프레시 토큰 쌍을 발급합니다. 탈취 감지를 위해 토큰 패밀리 ID를 추적합니다.\n\n```typescript\nexport async function refreshToken(db: Db, oldToken: string) {\n  const decoded = verifyRefreshToken(oldToken);\n  const stored = await findRefreshToken(db, decoded.jti);\n  if (stored.used) {\n    await revokeTokenFamily(db, stored.familyId);\n    throw new UnauthorizedError('Token reuse detected');\n  }\n  // ... issue new pair\n}\n```",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 2100,
      },
      {
        role: 'human',
        content:
          '테스트 코드도 작성해주세요. 로그인 성공/실패, 토큰 만료, 리프레시 시나리오를 커버해야 합니다.',
      },
      {
        role: 'assistant',
        content:
          "Vitest로 인증 모듈의 단위 테스트와 통합 테스트를 작성합니다. 총 12개 테스트 케이스로 주요 시나리오를 커버합니다.\n\n```typescript\ndescribe('auth.service', () => {\n  it('should create user and return JWT on first login', async () => {\n    const result = await login(db, { name: 'Test', email: 'test@example.com' });\n    expect(result.token).toBeDefined();\n    expect(result.user.email).toBe('test@example.com');\n  });\n\n  it('should reject expired refresh tokens', async () => {\n    // ...\n  });\n});\n```\n\n✅ 12/12 테스트 통과, 커버리지 94%",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1800,
      },
    ],
    // Session 1: Conflict Detection
    [
      {
        role: 'human',
        content: '팀원들이 같은 파일을 동시에 수정할 때 충돌을 감지하는 시스템이 필요합니다.',
      },
      {
        role: 'assistant',
        content:
          '충돌 감지 엔진을 설계합니다. 세션이 생성/업데이트될 때마다 `file_paths`를 비교하여 오버랩을 탐지합니다. 심각도는 오버랩 정도에 따라 자동 분류됩니다.\n\n- **Critical:** 같은 함수/블록 수정\n- **Warning:** 같은 파일 수정\n- **Info:** 같은 모듈 수정',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1500,
      },
      { role: 'human', content: '충돌 알림을 Slack으로 보내는 것도 추가해주세요.' },
      {
        role: 'assistant',
        content:
          "Slack Incoming Webhook을 통한 알림을 구현합니다. 충돌 심각도에 따라 메시지 포맷이 달라집니다.\n\n```typescript\nexport async function notifyConflict(conflict: Conflict) {\n  const emoji = conflict.severity === 'critical' ? '🔴' : '🟡';\n  await webhook.send({\n    text: `${emoji} Conflict detected: ${conflict.description}`,\n    blocks: [/* ... rich block format ... */],\n  });\n}\n```",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1200,
      },
    ],
    // Session 2: DB Pool fix
    [
      {
        role: 'human',
        content:
          '프로덕션에서 간헐적으로 "too many clients" 에러가 발생합니다. 커넥션 풀 설정을 확인해주세요.',
      },
      {
        role: 'assistant',
        content:
          '문제를 분석한 결과, 풀 최대 연결 수가 기본값(10)으로 설정되어 있고 유휴 타임아웃이 없었습니다. 또한 일부 쿼리에서 커넥션을 명시적으로 해제하지 않는 코드가 있었습니다.\n\n수정사항:\n1. `pool.max = 20`, `idleTimeoutMillis = 30000` 설정\n2. 트랜잭션 헬퍼에 자동 해제 로직 추가\n3. health check 엔드포인트에 풀 상태 모니터링 추가\n\n```typescript\nconst pool = new pg.Pool({\n  connectionString,\n  max: 20,\n  idleTimeoutMillis: 30_000,\n  connectionTimeoutMillis: 5_000,\n});\n```',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1800,
      },
    ],
    // Session 3: Validation utils
    [
      {
        role: 'human',
        content: '각 모듈에 흩어진 검증 로직을 Zod 스키마 기반 유틸리티로 추출해주세요.',
      },
      {
        role: 'assistant',
        content:
          "Zod 기반 검증 유틸리티를 `packages/shared/src/validators/`에 생성합니다. 각 도메인 별로 스키마를 정의하고 재사용 가능한 검증 함수를 제공합니다.\n\n```typescript\nexport const sessionSchema = z.object({\n  title: z.string().min(1).max(200),\n  source: z.enum(['claude-code', 'manual']),\n  filePaths: z.array(z.string()).default([]),\n  tags: z.array(z.string()).default([]),\n});\n\nexport type CreateSessionInput = z.infer<typeof sessionSchema>;\n```",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1100,
      },
    ],
    // Session 4: PRD Analysis
    [
      {
        role: 'human',
        content:
          'PRD 문서를 업로드하면 Claude API로 요구사항 달성률을 분석하는 기능을 구현해주세요.',
      },
      {
        role: 'assistant',
        content:
          'PRD 분석 파이프라인을 구현합니다.\n\n1. **문서 업로드:** Multipart 파일 업로드 → DB 저장\n2. **요구사항 추출:** Claude API로 PRD에서 개별 요구사항 파싱\n3. **세션 매칭:** 각 요구사항을 프로젝트 세션 대화와 매칭\n4. **달성률 계산:** achieved / partial / not_started 분류\n\n```typescript\nexport async function analyzePrd(db: Db, documentId: string) {\n  const doc = await findDocument(db, documentId);\n  const requirements = await extractRequirements(doc.content);\n  const sessions = await findProjectSessions(db, doc.projectId);\n  return calculateFulfillment(requirements, sessions);\n}\n```',
        model_used: 'claude-opus-4-20250514',
        tokens_used: 3200,
      },
      {
        role: 'human',
        content: '트렌드 차트도 필요합니다. 분석할 때마다 달성률 변화를 추적해주세요.',
      },
      {
        role: 'assistant',
        content:
          '트렌드 추적을 위해 각 분석 결과를 시계열로 저장합니다. 프론트엔드에서는 SVG 기반 라인 차트로 시각화합니다.\n\n```typescript\n// Smooth curve with gradient fill\nconst points = analyses.map((a, i) => ({\n  x: (i / (analyses.length - 1)) * width,\n  y: height - (a.overallRate / 100) * height,\n}));\nconst path = smoothCurve(points);\n```\n\n일별 변화율(delta)도 표시하여 개선 추이를 한눈에 파악할 수 있습니다.',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1600,
      },
    ],
    // Session 5: Full-text search
    [
      {
        role: 'human',
        content:
          '수천 개 세션에서 키워드 검색이 가능해야 합니다. PostgreSQL full-text search를 사용해주세요.',
      },
      {
        role: 'assistant',
        content:
          'PostgreSQL `tsvector` + `tsquery`를 활용한 전문 검색을 구현합니다.\n\n1. 마이그레이션에서 `search_vector` 컬럼 + GIN 인덱스 추가\n2. 트리거로 INSERT/UPDATE 시 자동 벡터 생성\n3. `ts_rank`로 관련도 정렬\n\n```sql\nCREATE INDEX idx_sessions_search ON sessions USING GIN(search_vector);\nCREATE INDEX idx_messages_search ON messages USING GIN(search_vector);\n```\n\n한국어 검색을 위해 `simple` 딕셔너리와 bigram 조합을 사용합니다.',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1400,
      },
    ],
    // Session 6: Team invitation
    [
      {
        role: 'human',
        content: '팀원 초대 기능을 구현해주세요. 이메일 초대 + 역할 지정이 필요합니다.',
      },
      {
        role: 'assistant',
        content:
          "초대 시스템을 구현합니다.\n\n1. **초대 생성:** 이메일 + 역할 → 고유 토큰 생성 (72시간 만료)\n2. **초대 수락:** 토큰 검증 → 프로젝트 협업자 추가\n3. **권한 체계:** Owner > Admin > Member\n\n```typescript\nexport async function createInvitation(db: Db, input: CreateInvitationInput) {\n  const token = crypto.randomUUID();\n  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);\n  return db.insertInto('project_invitations').values({\n    project_id: input.projectId,\n    inviter_id: input.inviterId,\n    email: input.email,\n    token,\n    role: input.role,\n    expires_at: expiresAt,\n  }).returningAll().executeTakeFirstOrThrow();\n}\n```",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1700,
      },
    ],
    // Session 7: Fastify 5 migration
    [
      { role: 'human', content: 'Fastify 4에서 5로 마이그레이션해주세요. ESM 전환도 포함합니다.' },
      {
        role: 'assistant',
        content:
          'Fastify 5 마이그레이션을 진행합니다. 주요 변경사항:\n\n1. `"type": "module"` 설정 + import 경로에 `.js` 확장자 추가\n2. `fastify.register()` → 비동기 플러그인 패턴 유지\n3. `reply.send()` 대신 `return` 사용 (Fastify 5 권장)\n4. 스키마 검증을 Zod로 통일\n\n모든 플러그인과 라우트를 순차적으로 마이그레이션하고, 기존 테스트가 통과하는지 확인합니다.\n\n✅ 14개 라우트 파일, 6개 플러그인 마이그레이션 완료',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 2200,
      },
    ],
    // Session 8: Sync race condition
    [
      { role: 'human', content: '동시에 여러 세션을 임포트하면 중복 생성되는 버그가 있습니다.' },
      {
        role: 'assistant',
        content:
          '레이스 컨디션을 분석한 결과, `synced_sessions` 테이블의 유니크 제약 조건이 누락되어 있었습니다. 또한 임포트 큐가 동시 처리를 허용하고 있었습니다.\n\n수정:\n1. `UNIQUE(project_id, external_session_id)` 제약 추가\n2. `pg-advisory-lock` 기반 분산 락 도입\n3. 임포트 큐에 concurrency: 1 설정\n\n```typescript\nawait db.transaction().execute(async (trx) => {\n  await sql`SELECT pg_advisory_xact_lock(hashtext(${externalId}))`.execute(trx);\n  const existing = await findSyncedSession(trx, projectId, externalId);\n  if (existing) return existing;\n  return createSyncedSession(trx, input);\n});\n```',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1900,
      },
    ],
    // Session 9: Token analytics
    [
      { role: 'human', content: '토큰 사용량을 모델별, 일별로 분석하는 대시보드를 만들어주세요.' },
      {
        role: 'assistant',
        content:
          "토큰 사용량 분석 대시보드를 구현합니다.\n\n**백엔드:** 일별/모델별 토큰 집계 쿼리\n```sql\nSELECT date_trunc('day', m.created_at) AS date,\n       m.model_used AS model,\n       SUM(m.tokens_used) AS total_tokens,\n       COUNT(*) AS message_count\nFROM messages m\nJOIN sessions s ON s.id = m.session_id\nWHERE s.project_id = $1\nGROUP BY 1, 2\nORDER BY 1;\n```\n\n**프론트엔드:** 스택형 바 차트 (모델별 색상 구분)\n- claude-opus-4: 보라색 (#c084fc)\n- claude-sonnet-4: 파란색 (#60a5fa)\n- claude-haiku-4: 초록색 (#34d399)\n\n비용 계산도 포함하여 USD 기준 일별 비용을 표시합니다.",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1500,
      },
    ],
    // Session 10: API docs
    [
      { role: 'human', content: 'API 엔드포인트 문서를 OpenAPI 형식으로 작성해주세요.' },
      {
        role: 'assistant',
        content:
          'OpenAPI 3.1 스펙으로 전체 API 문서를 작성합니다.\n\n총 23개 엔드포인트를 문서화했습니다:\n- Auth: 3개 (login, auto, upgrade)\n- Projects: 5개 (CRUD + collaborators)\n- Sessions: 4개 (list, detail, import, export)\n- Conflicts: 4개 (list, detail, assign, resolve)\n- Search: 1개 (full-text search)\n- PRD: 3개 (upload, analyze, results)\n- Admin: 3개 (health, migrations, stats)\n\n각 엔드포인트에 request/response 스키마, 에러 코드, 인증 요구사항을 포함합니다.',
        model_used: 'claude-haiku-4-5-20251001',
        tokens_used: 800,
      },
    ],
    // Session 11: AI evaluation
    [
      {
        role: 'human',
        content:
          '팀원의 AI 활용 능력을 평가하는 시스템을 만들어주세요. 세션 대화를 분석해서 점수를 매기는 방식입니다.',
      },
      {
        role: 'assistant',
        content:
          'AI 활용도 평가 시스템을 설계합니다.\n\n**5가지 평가 차원:**\n1. Prompt Quality (프롬프트 품질)\n2. Task Complexity (작업 복잡도)\n3. Iteration Pattern (반복 패턴)\n4. Context Utilization (컨텍스트 활용)\n5. AI Capability Leverage (AI 기능 활용)\n\n각 차원을 0-100 점으로 평가하고, 가중 평균으로 전체 점수를 산출합니다. 등급은 Beginner(0-39) / Intermediate(40-59) / Advanced(60-79) / Expert(80-100)로 분류합니다.\n\n```typescript\nexport function calculateOverallScore(dimensions: EvaluationDimension[]): number {\n  const weights = { prompt_quality: 0.25, task_complexity: 0.2, ... };\n  return dimensions.reduce((sum, d) => sum + d.score * weights[d.dimension], 0);\n}\n```',
        model_used: 'claude-opus-4-20250514',
        tokens_used: 3500,
      },
      { role: 'human', content: '근거가 되는 대화 발췌도 보여줄 수 있으면 좋겠어요.' },
      {
        role: 'assistant',
        content:
          "각 평가 차원에 대한 근거(evidence)를 세션 대화에서 추출하여 표시합니다.\n\n```typescript\ninterface Evidence {\n  excerpt: string;      // 대화 발췌\n  sentiment: 'positive' | 'negative' | 'neutral';\n  annotation: string;   // AI의 분석 코멘트\n}\n```\n\nUI에서는 각 차원 카드를 펼치면 관련 대화 발췌와 함께 왜 그 점수를 받았는지 설명을 확인할 수 있습니다. positive는 녹색, negative는 빨간색 배지로 시각적으로 구분합니다.",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1200,
      },
    ],
  ];

  for (let i = 0; i < sessions.length; i++) {
    const messages = messageGroups[i];
    if (!messages) continue;

    for (let j = 0; j < messages.length; j++) {
      const m = messages[j]!;
      await db
        .insertInto('messages')
        .values({
          session_id: sessions[i]!.id,
          role: m.role,
          content: m.content,
          content_type: 'text',
          model_used: m.model_used ?? null,
          tokens_used: m.tokens_used ?? null,
          sort_order: j + 1,
        })
        .execute();
    }
  }
}

// ── conflicts ────────────────────────────────────────────

async function seedConflicts(
  projectId: string,
  sessions: ReadonlyArray<{ id: string }>,
  users: ReadonlyArray<{ id: string }>,
) {
  const conflictData = [
    {
      session_a_id: sessions[0]!.id,
      session_b_id: sessions[2]!.id,
      conflict_type: 'file_overlap',
      severity: 'warning',
      status: 'reviewing',
      description:
        'Both sessions modified database configuration files — potential config divergence',
      overlapping_paths: ['src/config/database.ts'],
      reviewer_id: users[1]!.id,
      review_notes:
        'Auth changes may conflict with pool settings. Need to verify connection config is compatible.',
    },
    {
      session_a_id: sessions[1]!.id,
      session_b_id: sessions[6]!.id,
      conflict_type: 'file_overlap',
      severity: 'critical',
      status: 'open',
      description:
        'Critical overlap in conflict detection module — two developers modifying the same core logic',
      overlapping_paths: ['src/conflicts/detector.ts', 'src/conflicts/types.ts'],
      reviewer_id: null,
      review_notes: null,
    },
    {
      session_a_id: sessions[4]!.id,
      session_b_id: sessions[9]!.id,
      conflict_type: 'module_overlap',
      severity: 'info',
      status: 'resolved',
      description:
        'Dashboard module modifications overlap — PRD dashboard and analytics dashboard share stats utilities',
      overlapping_paths: ['src/dashboard/stats.ts'],
      reviewer_id: users[0]!.id,
      review_notes: 'Resolved by extracting shared stats functions into a common utility module.',
      resolved_by: users[0]!.id,
    },
    {
      session_a_id: sessions[7]!.id,
      session_b_id: sessions[3]!.id,
      conflict_type: 'file_overlap',
      severity: 'warning',
      status: 'open',
      description: 'Fastify 5 migration touched validation schemas that were also refactored',
      overlapping_paths: ['src/utils/validate.ts'],
      reviewer_id: null,
      review_notes: null,
    },
  ];

  for (const c of conflictData) {
    await db
      .insertInto('conflicts')
      .values({
        project_id: projectId,
        session_a_id: c.session_a_id,
        session_b_id: c.session_b_id,
        conflict_type: c.conflict_type,
        severity: c.severity,
        status: c.status,
        description: c.description,
        overlapping_paths: c.overlapping_paths,
        reviewer_id: c.reviewer_id,
        review_notes: c.review_notes,
        resolved_by: c.resolved_by ?? null,
        resolved_at: c.status === 'resolved' ? daysAgo(1) : null,
      })
      .execute();
  }
}

// ── PRD ──────────────────────────────────────────────────

async function seedPrd(projectId: string, userId: string) {
  const doc = await db
    .insertInto('prd_documents')
    .values({
      project_id: projectId,
      user_id: userId,
      title: 'ContextSync v2.0 Requirements',
      content: `# ContextSync v2.0 Product Requirements

## 1. Session Management
- Users can import local Claude Code sessions
- Sessions are grouped by project
- Full conversation history is preserved
- File path tracking per session

## 2. Conflict Detection
- Auto-detect file overlaps between team sessions
- Severity classification (critical/warning/info)
- Reviewer assignment workflow
- Slack/email notifications

## 3. Search
- Full-text search across all sessions
- Filter by file path, message content, tags
- Relevance-ranked results

## 4. Dashboard
- Daily session count and trends
- Token usage by model with cost analysis
- Team activity timeline
- Hot files ranking

## 5. PRD Analysis
- Document upload and requirement extraction
- Auto-calculate fulfillment rate
- Trend tracking over time

## 6. Team Collaboration
- Role-based access (Owner/Admin/Member)
- Email invitation system
- Activity feed per project`,
      file_name: 'contextsync-v2-prd.md',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // 7 analyses over 7 days showing progress
  const rates = [45, 52, 62, 68, 71, 74, 78];
  const achieved = [5, 6, 7, 8, 8, 9, 9];
  const partial = [2, 2, 2, 1, 2, 1, 2];
  const notStarted = [5, 4, 3, 3, 2, 2, 1];

  for (let i = 0; i < 7; i++) {
    const analysis = await db
      .insertInto('prd_analyses')
      .values({
        prd_document_id: doc.id,
        project_id: projectId,
        status: 'completed',
        overall_rate: rates[i]!,
        total_items: 12,
        achieved_items: achieved[i]!,
        partial_items: partial[i]!,
        not_started_items: notStarted[i]!,
        scanned_files_count: 24 + i * 3,
        model_used: 'claude-sonnet-4-20250514',
        input_tokens_used: 8000 + i * 500,
        output_tokens_used: 3000 + i * 200,
        created_at: daysAgo(6 - i),
        completed_at: daysAgo(6 - i),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Requirements for the latest analysis only
    if (i === 6) {
      const requirements = [
        {
          text: 'Users can import local Claude Code sessions',
          category: 'Session Management',
          status: 'achieved',
          confidence: 95,
        },
        {
          text: 'Sessions are grouped by project',
          category: 'Session Management',
          status: 'achieved',
          confidence: 98,
        },
        {
          text: 'Full conversation history is preserved',
          category: 'Session Management',
          status: 'achieved',
          confidence: 92,
        },
        {
          text: 'File path tracking per session',
          category: 'Session Management',
          status: 'achieved',
          confidence: 90,
        },
        {
          text: 'Auto-detect file overlaps between team sessions',
          category: 'Conflict Detection',
          status: 'achieved',
          confidence: 88,
        },
        {
          text: 'Severity classification (critical/warning/info)',
          category: 'Conflict Detection',
          status: 'achieved',
          confidence: 95,
        },
        {
          text: 'Reviewer assignment workflow',
          category: 'Conflict Detection',
          status: 'achieved',
          confidence: 85,
        },
        {
          text: 'Slack/email notifications for conflicts',
          category: 'Conflict Detection',
          status: 'partial',
          confidence: 60,
        },
        {
          text: 'Full-text search across all sessions',
          category: 'Search',
          status: 'achieved',
          confidence: 93,
        },
        {
          text: 'Token usage by model with cost analysis',
          category: 'Dashboard',
          status: 'achieved',
          confidence: 91,
        },
        {
          text: 'Auto-calculate PRD fulfillment rate',
          category: 'PRD Analysis',
          status: 'partial',
          confidence: 55,
        },
        {
          text: 'Email invitation system for team members',
          category: 'Team Collaboration',
          status: 'not_started',
          confidence: 20,
        },
      ];

      for (let j = 0; j < requirements.length; j++) {
        const r = requirements[j]!;
        await db
          .insertInto('prd_requirements')
          .values({
            prd_analysis_id: analysis.id,
            requirement_text: r.text,
            category: r.category,
            status: r.status,
            confidence: r.confidence,
            evidence:
              r.status === 'achieved' ? 'Implementation found in codebase with tests' : null,
            file_paths: [],
            sort_order: j + 1,
          })
          .execute();
      }
    }
  }
}

// ── AI evaluation ────────────────────────────────────────

async function seedAiEvaluation(
  projectId: string,
  userId: string,
  sessions: ReadonlyArray<{ id: string }>,
) {
  const evaluation = await db
    .insertInto('ai_evaluations')
    .values({
      project_id: projectId,
      target_user_id: userId,
      triggered_by_user_id: userId,
      status: 'completed',
      overall_score: 82,
      prompt_quality_score: 85,
      task_complexity_score: 78,
      iteration_pattern_score: 80,
      context_utilization_score: 88,
      ai_capability_leverage_score: 84,
      proficiency_tier: 'expert',
      sessions_analyzed: 8,
      messages_analyzed: 42,
      date_range_start: daysAgo(7),
      date_range_end: new Date(),
      model_used: 'claude-opus-4-20250514',
      input_tokens_used: 45000,
      output_tokens_used: 12000,
      improvement_summary:
        'Strong overall AI utilization with excellent context management. Main improvement area: provide more specific constraints in prompts to reduce iteration cycles.',
      completed_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const dimensions = [
    {
      dimension: 'prompt_quality',
      score: 85,
      confidence: 90,
      summary:
        'Clear and well-structured prompts with specific requirements. Consistently provides context and constraints.',
      strengths: [
        'Provides clear acceptance criteria',
        'Includes relevant code context',
        'Uses examples effectively',
      ],
      weaknesses: ['Occasionally lacks edge case specification'],
      suggestions: [
        'Add more boundary conditions to prompts',
        'Specify error handling expectations upfront',
      ],
    },
    {
      dimension: 'task_complexity',
      score: 78,
      confidence: 85,
      summary:
        'Tackles moderately complex tasks including architectural decisions and multi-file refactoring.',
      strengths: ['Handles multi-file changes well', 'Good at breaking down complex tasks'],
      weaknesses: ['Could attempt more ambitious architectural changes'],
      suggestions: ['Try using AI for system design, not just implementation'],
    },
    {
      dimension: 'iteration_pattern',
      score: 80,
      confidence: 88,
      summary:
        'Efficient iteration pattern with good follow-up questions. Average 3.2 turns per task completion.',
      strengths: [
        'Builds on previous responses effectively',
        'Asks clarifying questions when needed',
      ],
      weaknesses: ['Sometimes restarts instead of building on context'],
      suggestions: ['Reference previous conversation context more explicitly'],
    },
    {
      dimension: 'context_utilization',
      score: 88,
      confidence: 92,
      summary:
        'Excellent use of project context, file references, and codebase knowledge in prompts.',
      strengths: [
        'Always references relevant files',
        'Provides existing code patterns',
        'Uses project-specific terminology',
      ],
      weaknesses: [],
      suggestions: ['Share test files alongside source files for better test generation'],
    },
    {
      dimension: 'ai_capability_leverage',
      score: 84,
      confidence: 87,
      summary: 'Good use of AI capabilities including code generation, review, and documentation.',
      strengths: [
        'Uses AI for both creation and review',
        'Leverages AI for test generation',
        'Multi-language support',
      ],
      weaknesses: ['Underutilizes AI for architectural analysis'],
      suggestions: [
        'Use AI for architecture decision records',
        'Try AI-assisted code review workflows',
      ],
    },
  ];

  for (let i = 0; i < dimensions.length; i++) {
    const d = dimensions[i]!;
    const dim = await db
      .insertInto('ai_evaluation_dimensions')
      .values({
        evaluation_id: evaluation.id,
        dimension: d.dimension,
        score: d.score,
        confidence: d.confidence,
        summary: d.summary,
        strengths: d.strengths,
        weaknesses: d.weaknesses,
        suggestions: d.suggestions,
        sort_order: i + 1,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Add evidence for each dimension
    if (sessions[0]) {
      await db
        .insertInto('ai_evaluation_evidence')
        .values({
          dimension_id: dim.id,
          session_id: sessions[0].id,
          excerpt:
            'JWT 인증 플로우를 구현해야 합니다. 로그인, 토큰 갱신, 보호 라우트 미들웨어를 포함해주세요.',
          sentiment: 'positive',
          annotation: 'Clear and specific prompt with well-defined scope',
          sort_order: 1,
        })
        .execute();
    }
  }
}

// ── activity log ─────────────────────────────────────────

async function seedActivityLog(
  projectId: string,
  users: ReadonlyArray<{ id: string }>,
  sessions: ReadonlyArray<{ id: string }>,
) {
  const [alex, sarah, marcus, emily] = [users[0]!.id, users[1]!.id, users[2]!.id, users[3]!.id];

  const entries = [
    {
      user_id: alex,
      action: 'session.created',
      entity_type: 'session',
      entity_id: sessions[11]?.id ?? null,
      created_at: hoursAgo(2),
    },
    {
      user_id: sarah,
      action: 'conflict.detected',
      entity_type: 'conflict',
      entity_id: null,
      created_at: hoursAgo(4),
    },
    {
      user_id: marcus,
      action: 'session.synced',
      entity_type: 'session',
      entity_id: sessions[6]?.id ?? null,
      created_at: hoursAgo(6),
    },
    {
      user_id: emily,
      action: 'session.created',
      entity_type: 'session',
      entity_id: sessions[8]?.id ?? null,
      created_at: hoursAgo(8),
    },
    {
      user_id: alex,
      action: 'prd.analyzed',
      entity_type: 'prd_document',
      entity_id: null,
      created_at: hoursAgo(24),
    },
    {
      user_id: sarah,
      action: 'session.completed',
      entity_type: 'session',
      entity_id: sessions[9]?.id ?? null,
      created_at: hoursAgo(28),
    },
    {
      user_id: alex,
      action: 'conflict.resolved',
      entity_type: 'conflict',
      entity_id: null,
      created_at: hoursAgo(30),
    },
    {
      user_id: marcus,
      action: 'session.completed',
      entity_type: 'session',
      entity_id: sessions[10]?.id ?? null,
      created_at: hoursAgo(36),
    },
    {
      user_id: emily,
      action: 'session.completed',
      entity_type: 'session',
      entity_id: sessions[3]?.id ?? null,
      created_at: hoursAgo(48),
    },
    {
      user_id: alex,
      action: 'session.completed',
      entity_type: 'session',
      entity_id: sessions[7]?.id ?? null,
      created_at: hoursAgo(50),
    },
  ];

  for (const e of entries) {
    await db
      .insertInto('activity_log')
      .values({
        project_id: projectId,
        user_id: e.user_id,
        action: e.action,
        entity_type: e.entity_type,
        entity_id: e.entity_id,
        created_at: e.created_at,
      })
      .execute();
  }
}

// ── run ──────────────────────────────────────────────────

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
