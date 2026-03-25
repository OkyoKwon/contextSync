import { db, daysAgo, hoursAgo } from './helpers.js';

export async function seedSessions(projectId: string, users: ReadonlyArray<{ id: string }>) {
  const [alex, sarah, marcus, emily, jason, mina] = [
    users[0]!.id,
    users[1]!.id,
    users[2]!.id,
    users[3]!.id,
    users[4]!.id,
    users[5]!.id,
  ];

  const sessionData = [
    // 0
    {
      user_id: alex,
      title: 'feat: JWT authentication with refresh tokens',
      status: 'completed',
      file_paths: [
        'src/modules/auth/auth.service.ts',
        'src/modules/auth/auth.routes.ts',
        'src/modules/auth/auth.schema.ts',
        'src/plugins/auth.ts',
        'src/config/env.ts',
      ],
      module_names: ['auth'],
      branch: 'feat/auth',
      tags: ['auth', 'security', 'feature'],
      created_at: daysAgo(6),
    },
    // 1
    {
      user_id: sarah,
      title: 'feat: Real-time conflict detection engine',
      status: 'completed',
      file_paths: [
        'src/modules/conflicts/conflicts.service.ts',
        'src/modules/conflicts/detector.ts',
        'src/modules/conflicts/conflicts.routes.ts',
        'src/modules/conflicts/conflicts.schema.ts',
      ],
      module_names: ['conflicts'],
      branch: 'feat/conflicts',
      tags: ['conflicts', 'websocket'],
      created_at: daysAgo(5),
    },
    // 2
    {
      user_id: marcus,
      title: 'fix: Database connection pool exhaustion',
      status: 'completed',
      file_paths: ['src/database/client.ts', 'src/config/database.ts', 'src/config/env.ts'],
      module_names: ['database'],
      branch: 'fix/db-pool',
      tags: ['database', 'bugfix', 'critical'],
      created_at: daysAgo(5),
    },
    // 3
    {
      user_id: emily,
      title: 'refactor: Extract Zod validation schemas',
      status: 'completed',
      file_paths: [
        'src/utils/validate.ts',
        'packages/shared/src/validators/session.validator.ts',
        'packages/shared/src/validators/project.validator.ts',
        'src/modules/auth/auth.schema.ts',
        'src/modules/sessions/sessions.schema.ts',
        'src/modules/projects/projects.schema.ts',
      ],
      module_names: ['utils', 'shared'],
      branch: 'refactor/validators',
      tags: ['refactor', 'zod', 'utils'],
      created_at: daysAgo(4),
    },
    // 4
    {
      user_id: alex,
      title: 'feat: PRD analysis with Claude API integration',
      status: 'completed',
      file_paths: [
        'src/modules/prd-analysis/prd.service.ts',
        'src/modules/prd-analysis/prd.routes.ts',
        'src/modules/prd-analysis/prd.repository.ts',
        'src/modules/prd-analysis/prd.schema.ts',
      ],
      module_names: ['prd-analysis'],
      branch: 'feat/prd',
      tags: ['prd', 'ai', 'anthropic'],
      created_at: daysAgo(4),
    },
    // 5
    {
      user_id: sarah,
      title: 'feat: Full-text search with PostgreSQL tsvector',
      status: 'completed',
      file_paths: [
        'src/modules/search/search.service.ts',
        'src/modules/search/search.routes.ts',
        'src/database/migrations/012_add_search_vectors.ts',
      ],
      module_names: ['search'],
      branch: 'feat/search',
      tags: ['search', 'postgresql'],
      created_at: daysAgo(3),
    },
    // 6
    {
      user_id: marcus,
      title: 'feat: Team invitation & role management',
      status: 'active',
      file_paths: [
        'src/modules/projects/projects.service.ts',
        'src/modules/projects/projects.routes.ts',
        'src/modules/projects/projects.repository.ts',
        'src/modules/projects/projects.schema.ts',
        'src/modules/notifications/notifications.service.ts',
      ],
      module_names: ['projects', 'notifications'],
      branch: 'feat/team-roles',
      tags: ['team', 'rbac'],
      created_at: daysAgo(2),
    },
    // 7
    {
      user_id: alex,
      title: 'refactor: Migrate to Fastify 5 with ESM',
      status: 'completed',
      file_paths: [
        'src/app.ts',
        'src/plugins/auth.ts',
        'src/plugins/cors.ts',
        'src/plugins/error-handler.ts',
      ],
      module_names: ['core', 'plugins'],
      branch: 'refactor/fastify5',
      tags: ['refactor', 'migration'],
      created_at: daysAgo(3),
    },
    // 8
    {
      user_id: emily,
      title: 'fix: Session sync race condition on concurrent imports',
      status: 'active',
      file_paths: [
        'src/modules/local-sessions/local-sessions.service.ts',
        'src/modules/sessions/sessions.service.ts',
        'src/plugins/auto-sync.ts',
      ],
      module_names: ['local-sessions', 'sessions'],
      branch: 'fix/sync-race',
      tags: ['sync', 'concurrency'],
      created_at: daysAgo(1),
    },
    // 9
    {
      user_id: sarah,
      title: 'feat: Token usage analytics dashboard',
      status: 'completed',
      file_paths: [
        'src/modules/sessions/token-usage.repository.ts',
        'src/modules/sessions/sessions.routes.ts',
        'apps/web/src/components/sessions/TokenUsagePanel.tsx',
        'apps/web/src/hooks/use-token-usage.ts',
      ],
      module_names: ['sessions', 'web'],
      branch: 'feat/token-stats',
      tags: ['analytics', 'charts'],
      created_at: daysAgo(2),
    },
    // 10
    {
      user_id: marcus,
      title: 'docs: API endpoint documentation with OpenAPI',
      status: 'completed',
      file_paths: ['docs/openapi.yaml', 'docs/api-reference.md'],
      module_names: ['docs'],
      branch: 'docs/openapi',
      tags: ['docs', 'api'],
      created_at: daysAgo(1),
    },
    // 11
    {
      user_id: alex,
      title: 'feat: AI evaluation scoring system',
      status: 'active',
      file_paths: [
        'src/modules/ai-evaluation/evaluation.service.ts',
        'src/modules/ai-evaluation/evaluation.routes.ts',
        'src/modules/ai-evaluation/evaluation.repository.ts',
        'src/modules/ai-evaluation/evaluation.schema.ts',
      ],
      module_names: ['ai-evaluation'],
      branch: 'feat/ai-eval',
      tags: ['ai', 'evaluation', 'scoring'],
      created_at: hoursAgo(8),
    },
    // 12 — Jason (new)
    {
      user_id: jason,
      title: 'feat: Onboarding wizard for new team members',
      status: 'active',
      file_paths: [
        'apps/web/src/components/onboarding/OnboardingWizard.tsx',
        'apps/web/src/components/onboarding/StepIndicator.tsx',
        'src/modules/setup/setup.routes.ts',
      ],
      module_names: ['setup', 'web'],
      branch: 'feat/onboarding',
      tags: ['onboarding', 'ux'],
      created_at: hoursAgo(6),
    },
    // 13 — Mina (new)
    {
      user_id: mina,
      title: 'feat: Design token system (colors & spacing)',
      status: 'completed',
      file_paths: [
        'apps/web/src/index.css',
        'apps/web/src/components/ui/Button.tsx',
        'apps/web/src/components/ui/Card.tsx',
        'apps/web/src/components/ui/Badge.tsx',
        'apps/web/src/components/ui/Input.tsx',
        'apps/web/src/components/ui/Modal.tsx',
        'docs/design-system.md',
      ],
      module_names: ['web', 'docs'],
      branch: 'feat/design-tokens',
      tags: ['design', 'css', 'tokens'],
      created_at: daysAgo(3),
    },
    // 14 — Sarah (new)
    {
      user_id: sarah,
      title: 'fix: Dark mode contrast accessibility',
      status: 'completed',
      file_paths: [
        'apps/web/src/index.css',
        'apps/web/src/stores/theme.store.ts',
        'apps/web/src/hooks/use-theme.ts',
        'apps/web/src/components/layout/Sidebar.tsx',
      ],
      module_names: ['web'],
      branch: 'fix/a11y-contrast',
      tags: ['a11y', 'dark-mode', 'fix'],
      created_at: daysAgo(2),
    },
    // 15 — Jason (new)
    {
      user_id: jason,
      title: 'chore: CI pipeline optimization',
      status: 'completed',
      file_paths: ['.github/workflows/ci.yml', 'turbo.json'],
      module_names: ['ci'],
      branch: 'chore/ci-speed',
      tags: ['ci', 'performance'],
      created_at: daysAgo(2),
    },
    // 16 — Mina (new)
    {
      user_id: mina,
      title: 'feat: Responsive sidebar & mobile navigation',
      status: 'active',
      file_paths: [
        'apps/web/src/components/layout/Sidebar.tsx',
        'apps/web/src/components/layout/MobileNav.tsx',
        'apps/web/src/components/layout/AppLayout.tsx',
        'apps/web/src/hooks/use-media-query.ts',
        'apps/web/src/index.css',
      ],
      module_names: ['web'],
      branch: 'feat/responsive',
      tags: ['responsive', 'mobile'],
      created_at: hoursAgo(4),
    },
    // 17 — Emily (new)
    {
      user_id: emily,
      title: 'feat: Notification preferences & Slack webhook',
      status: 'completed',
      file_paths: [
        'src/modules/notifications/notifications.service.ts',
        'src/modules/notifications/notifications.routes.ts',
        'apps/web/src/components/settings/NotificationSettings.tsx',
      ],
      module_names: ['notifications', 'web'],
      branch: 'feat/notifications',
      tags: ['slack', 'notifications'],
      created_at: daysAgo(1),
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

  await seedMessages(sessions);

  return sessions;
}

interface MessageInput {
  readonly role: string;
  readonly content: string;
  readonly model_used?: string;
  readonly tokens_used?: number;
}

async function seedMessages(sessions: ReadonlyArray<{ id: string; title: string }>) {
  const messageGroups: ReadonlyArray<ReadonlyArray<MessageInput>> = [
    // Session 0: JWT Auth (6 messages)
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
          "리프레시 토큰 로테이션을 구현합니다. 각 리프레시 토큰은 1회만 사용 가능하며, 사용 시 새 액세스 토큰 + 새 리프레시 토큰 쌍을 발급합니다. 탈취 감지를 위해 토큰 패밀리 ID를 추적합니다.\n\n```typescript\nexport async function refreshToken(db: Db, oldToken: string) {\n  const decoded = verifyRefreshToken(oldToken);\n  const stored = await findRefreshToken(db, decoded.jti);\n  if (stored.used) {\n    await revokeTokenFamily(db, stored.familyId);\n    throw new UnauthorizedError('Token reuse detected');\n  }\n  await markTokenUsed(db, stored.id);\n  return issueTokenPair(db, stored.userId, stored.familyId);\n}\n```",
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
          "Vitest로 인증 모듈의 단위 테스트와 통합 테스트를 작성합니다. 총 12개 테스트 케이스로 주요 시나리오를 커버합니다.\n\n```typescript\ndescribe('auth.service', () => {\n  it('should create user and return JWT on first login', async () => {\n    const result = await login(db, { name: 'Test', email: 'test@example.com' });\n    expect(result.token).toBeDefined();\n    expect(result.user.email).toBe('test@example.com');\n  });\n\n  it('should reject expired refresh tokens', async () => {\n    const expired = signRefreshToken({ userId: 'x' }, { expiresIn: '-1h' });\n    await expect(refreshToken(db, expired)).rejects.toThrow('Token expired');\n  });\n\n  it('should revoke token family on reuse', async () => {\n    const { refreshToken: rt } = await login(db, testUser);\n    await refreshToken(db, rt); // first use\n    await expect(refreshToken(db, rt)).rejects.toThrow('Token reuse detected');\n  });\n});\n```\n\n✅ 12/12 테스트 통과, 커버리지 94%",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1800,
      },
    ],
    // Session 1: Conflict Detection (4 messages)
    [
      {
        role: 'human',
        content: '팀원들이 같은 파일을 동시에 수정할 때 충돌을 감지하는 시스템이 필요합니다.',
      },
      {
        role: 'assistant',
        content:
          '충돌 감지 엔진을 설계합니다. 세션이 생성/업데이트될 때마다 `file_paths`를 비교하여 오버랩을 탐지합니다. 심각도는 오버랩 정도에 따라 자동 분류됩니다.\n\n- **Critical:** 같은 함수/블록 수정\n- **Warning:** 같은 파일 수정\n- **Info:** 같은 모듈 수정\n\n```typescript\nexport function detectConflicts(sessions: Session[]): ConflictCandidate[] {\n  const fileMap = new Map<string, Session[]>();\n  for (const s of sessions) {\n    for (const fp of s.filePaths) {\n      const existing = fileMap.get(fp) ?? [];\n      fileMap.set(fp, [...existing, s]);\n    }\n  }\n  return [...fileMap.entries()]\n    .filter(([, s]) => s.length > 1)\n    .map(([path, s]) => classifyConflict(path, s));\n}\n```',
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
    // Session 2: DB Pool fix (2 messages)
    [
      {
        role: 'human',
        content:
          '프로덕션에서 간헐적으로 "too many clients" 에러가 발생합니다. 커넥션 풀 설정을 확인해주세요.',
      },
      {
        role: 'assistant',
        content:
          '문제를 분석한 결과, 풀 최대 연결 수가 기본값(10)으로 설정되어 있고 유휴 타임아웃이 없었습니다.\n\n수정사항:\n1. `pool.max = 20`, `idleTimeoutMillis = 30000` 설정\n2. 트랜잭션 헬퍼에 자동 해제 로직 추가\n3. health check 엔드포인트에 풀 상태 모니터링 추가\n\n```typescript\nconst pool = new pg.Pool({\n  connectionString,\n  max: 20,\n  idleTimeoutMillis: 30_000,\n  connectionTimeoutMillis: 5_000,\n});\n```',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1800,
      },
    ],
    // Session 3: Validation utils (2 messages)
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
    // Session 4: PRD Analysis (6 messages — rich for screenshot)
    [
      {
        role: 'human',
        content:
          'PRD 문서를 분석해서 현재 구현 상태를 평가해줘. 특히 인증 플로우와 충돌 감지 부분의 완성도를 중점적으로 봐줘.',
      },
      {
        role: 'assistant',
        content: `분석 결과를 정리합니다. 전체 16개 요구사항 중 현재 달성 현황:\n\n| 카테고리 | 요구사항 | 상태 | 신뢰도 |\n|---------|---------|------|--------|\n| Session Management | Auto-sync from ~/.claude/projects/ | achieved | 96% |\n| Session Management | Metadata extraction (branch, files) | achieved | 94% |\n| Conflict Detection | Real-time file overlap detection | achieved | 95% |\n| Conflict Detection | Severity classification | achieved | 92% |\n| Conflict Detection | Auto-resolve for stale conflicts | partial | 62% |\n| Dashboard | Real-time activity feed (WebSocket) | partial | 45% |\n| Team | Granular permissions (view/edit/admin) | not started | 22% |\n\n\`\`\`typescript\n// 현재 충돌 감지 구현\nexport async function detectConflicts(db: Db, projectId: string) {\n  const activeSessions = await findActiveSessions(db, projectId);\n  const candidates = findOverlappingPaths(activeSessions);\n  return candidates.map(classifyBySeverity);\n}\n\`\`\`\n\n전체 달성률: **78%** (이전 분석 대비 +4%)`,
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 2800,
      },
      {
        role: 'human',
        content: '부분 완성인 항목들의 남은 작업량을 구체적으로 알려줘',
      },
      {
        role: 'assistant',
        content:
          "각 partial 항목의 남은 작업을 분석합니다:\n\n**1. Auto-resolve for stale conflicts (62%)**\n- ✅ 완료: 충돌 감지, 수동 해결 워크플로우\n- 🔧 남은 작업:\n  - [ ] 7일 이상 미활동 세션의 충돌 자동 dismiss 로직\n  - [ ] 충돌 해결 시 관련 세션 상태 업데이트\n  - 예상 공수: 4~6시간\n\n**2. Real-time activity feed — WebSocket (45%)**\n- ✅ 완료: REST 기반 활동 피드, 폴링 기반 새로고침\n- 🔧 남은 작업:\n  - [ ] `@fastify/websocket` 플러그인 설정\n  - [ ] 이벤트 브로드캐스트 서비스 구현\n  - [ ] 프론트엔드 WebSocket 훅 구현\n  - 예상 공수: 8~12시간\n\n```diff\n// 현재 (폴링)\n- useQuery({ queryKey: ['activity'], refetchInterval: 30000 })\n// 변경 후 (WebSocket)\n+ const { messages } = useWebSocket('/ws/activity')\n```\n\n**3. Granular permissions (22%)**\n- ✅ 완료: Owner / Member 2단계 역할\n- 🔧 남은 작업:\n  - [ ] permissions 테이블 + 마이그레이션\n  - [ ] RBAC 미들웨어 구현\n  - [ ] 프론트엔드 권한 체크 HOC\n  - 예상 공수: 16~20시간",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 3200,
      },
      {
        role: 'human',
        content: '트렌드 차트용 데이터 포맷도 설계해줘',
      },
      {
        role: 'assistant',
        content:
          "트렌드 차트용 API 응답 스키마와 프론트엔드 차트 컴포넌트를 설계합니다.\n\n```typescript\n// API Response\ninterface PrdTrendPoint {\n  readonly date: string;       // ISO 8601\n  readonly overallRate: number; // 0-100\n  readonly achieved: number;\n  readonly partial: number;\n  readonly notStarted: number;\n}\n\ninterface PrdTrendResponse {\n  readonly points: readonly PrdTrendPoint[];\n  readonly delta: number;      // latest - previous\n  readonly direction: 'up' | 'down' | 'stable';\n}\n```\n\n```sql\n-- Migration: add index for trend queries\nCREATE INDEX idx_prd_analyses_trend\n  ON prd_analyses (prd_document_id, created_at DESC);\n```\n\n```tsx\n// SVG Line Chart Component\nfunction TrendChart({ points }: { points: PrdTrendPoint[] }) {\n  const width = 600, height = 200;\n  const xScale = (i: number) => (i / (points.length - 1)) * width;\n  const yScale = (v: number) => height - (v / 100) * height;\n  const d = points.map((p, i) =>\n    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.overallRate)}`\n  ).join(' ');\n  return <path d={d} stroke=\"var(--color-accent)\" fill=\"none\" />;\n}\n```",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 2400,
      },
    ],
    // Session 5: Full-text search (2 messages)
    [
      {
        role: 'human',
        content:
          '수천 개 세션에서 키워드 검색이 가능해야 합니다. PostgreSQL full-text search를 사용해주세요.',
      },
      {
        role: 'assistant',
        content:
          'PostgreSQL `tsvector` + `tsquery`를 활용한 전문 검색을 구현합니다.\n\n```sql\nCREATE INDEX idx_sessions_search ON sessions USING GIN(search_vector);\nCREATE INDEX idx_messages_search ON messages USING GIN(search_vector);\n```\n\n한국어 검색을 위해 `simple` 딕셔너리와 bigram 조합을 사용합니다.',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1400,
      },
    ],
    // Session 6: Team invitation (2 messages)
    [
      {
        role: 'human',
        content: '팀원 초대 기능을 구현해주세요. Join Code 방식 + 역할 지정이 필요합니다.',
      },
      {
        role: 'assistant',
        content:
          "Join Code 기반 초대 시스템을 구현합니다.\n\n```typescript\nexport async function generateJoinCode(db: Db, projectId: string) {\n  const code = `CTX-${new Date().getFullYear()}-${randomAlphanumeric(4)}`;\n  return db.updateTable('projects')\n    .set({ join_code: code })\n    .where('id', '=', projectId)\n    .returningAll()\n    .executeTakeFirstOrThrow();\n}\n```",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1700,
      },
    ],
    // Session 7: Fastify 5 migration (2 messages)
    [
      { role: 'human', content: 'Fastify 4에서 5로 마이그레이션해주세요. ESM 전환도 포함합니다.' },
      {
        role: 'assistant',
        content:
          'Fastify 5 마이그레이션 주요 변경사항:\n\n1. `"type": "module"` + import 경로 `.js` 확장자\n2. `reply.send()` → `return` 패턴 전환\n3. 스키마 검증 Zod 통일\n\n✅ 14개 라우트 파일, 6개 플러그인 마이그레이션 완료',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 2200,
      },
    ],
    // Session 8: Sync race condition (2 messages)
    [
      { role: 'human', content: '동시에 여러 세션을 임포트하면 중복 생성되는 버그가 있습니다.' },
      {
        role: 'assistant',
        content:
          '`pg-advisory-lock` 기반 분산 락을 도입합니다.\n\n```typescript\nawait db.transaction().execute(async (trx) => {\n  await sql`SELECT pg_advisory_xact_lock(hashtext(${externalId}))`.execute(trx);\n  const existing = await findSyncedSession(trx, projectId, externalId);\n  if (existing) return existing;\n  return createSyncedSession(trx, input);\n});\n```',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1900,
      },
    ],
    // Session 9: Token analytics (2 messages)
    [
      { role: 'human', content: '토큰 사용량을 모델별, 일별로 분석하는 대시보드를 만들어주세요.' },
      {
        role: 'assistant',
        content:
          "토큰 분석 대시보드를 구현합니다.\n\n```sql\nSELECT date_trunc('day', m.created_at) AS date,\n       m.model_used,\n       SUM(m.tokens_used) AS total_tokens,\n       COUNT(*) AS message_count\nFROM messages m\nJOIN sessions s ON s.id = m.session_id\nWHERE s.project_id = $1\nGROUP BY 1, 2 ORDER BY 1;\n```\n\n모델별 색상: opus → 보라(#c084fc), sonnet → 파랑(#60a5fa), haiku → 초록(#34d399)",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1500,
      },
    ],
    // Session 10: API docs (2 messages)
    [
      { role: 'human', content: 'API 엔드포인트 문서를 OpenAPI 형식으로 작성해주세요.' },
      {
        role: 'assistant',
        content:
          'OpenAPI 3.1 스펙 문서화 완료 — 23개 엔드포인트.\n\nAuth(3), Projects(5), Sessions(4), Conflicts(4), Search(1), PRD(3), Admin(3).',
        model_used: 'claude-haiku-4-5-20251001',
        tokens_used: 800,
      },
    ],
    // Session 11: AI evaluation (4 messages)
    [
      {
        role: 'human',
        content:
          '팀원의 AI 활용 능력을 평가하는 시스템을 만들어주세요. 세션 대화를 분석해서 점수를 매기는 방식입니다.',
      },
      {
        role: 'assistant',
        content:
          'AI 활용도 평가 시스템 설계:\n\n**5가지 평가 차원:**\n1. Prompt Quality (PQ)\n2. Task Complexity (TC)\n3. Iteration Pattern (IP)\n4. Context Utilization (CU)\n5. AI Capability Leverage (AL)\n\n각 0-100점, 가중 평균으로 전체 점수 산출.\n등급: Novice(0-29) / Developing(30-49) / Proficient(50-69) / Advanced(70-84) / Expert(85-100)',
        model_used: 'claude-opus-4-20250514',
        tokens_used: 3500,
      },
      { role: 'human', content: '근거가 되는 대화 발췌도 보여줄 수 있으면 좋겠어요.' },
      {
        role: 'assistant',
        content:
          "각 평가 차원에 대한 evidence를 세션 대화에서 추출하여 표시합니다.\n\n```typescript\ninterface Evidence {\n  excerpt: string;\n  sentiment: 'positive' | 'negative' | 'neutral';\n  annotation: string;\n}\n```\n\npositive → 녹색, negative → 빨간색 배지로 시각적 구분.",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1200,
      },
    ],
    // Session 12: Onboarding (Jason) — 2 messages
    [
      {
        role: 'human',
        content:
          '새 팀원이 처음 접속했을 때 보이는 온보딩 위자드를 만들어주세요. Step-by-step으로 프로젝트 설정을 안내하는 형태.',
      },
      {
        role: 'assistant',
        content:
          '4단계 온보딩 위자드를 구현합니다:\n\n1. **Welcome** — 이름 입력 + 팀 Join Code\n2. **Database** — Remote DB 연결 or 로컬 DB 선택\n3. **Project** — 프로젝트 생성 또는 참여\n4. **Done** — 대시보드로 이동\n\n```tsx\nfunction OnboardingWizard() {\n  const [step, setStep] = useState(0);\n  const steps = [WelcomeStep, DatabaseStep, ProjectStep, DoneStep];\n  const CurrentStep = steps[step]!;\n  return <CurrentStep onNext={() => setStep(s => s + 1)} />;\n}\n```',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1600,
      },
    ],
    // Session 13: Design tokens (Mina) — 2 messages
    [
      {
        role: 'human',
        content:
          'CSS 커스텀 프로퍼티 기반 디자인 토큰 시스템을 구축해주세요. 다크/라이트 테마 모두 지원해야 합니다.',
      },
      {
        role: 'assistant',
        content:
          '시맨틱 컬러 토큰 체계를 설계합니다:\n\n```css\n:root {\n  --color-bg-page: #0a0a0f;\n  --color-bg-surface: #12121a;\n  --color-text-primary: #e4e4e7;\n  --color-text-secondary: #a1a1aa;\n  --color-accent: #3b82f6;\n  --color-success: #10b981;\n  --color-warning: #f59e0b;\n  --color-critical: #ef4444;\n}\n\n[data-theme="light"] {\n  --color-bg-page: #fafafa;\n  --color-bg-surface: #ffffff;\n  --color-text-primary: #18181b;\n  --color-text-secondary: #52525b;\n}\n```\n\n14개 시맨틱 토큰, 5단계 spacing scale(4/8/12/16/24px) 정의 완료.',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1300,
      },
    ],
    // Session 14: Dark mode a11y (Sarah) — 2 messages
    [
      {
        role: 'human',
        content: '다크 모드에서 텍스트 대비율이 WCAG AA 기준(4.5:1)을 만족하지 않는 곳이 있습니다.',
      },
      {
        role: 'assistant',
        content:
          '전체 컬러 토큰을 WCAG AA 기준으로 감사하고 수정합니다.\n\n수정 항목:\n- `--color-text-tertiary`: `#52525b` → `#71717a` (대비율 4.1 → 5.2)\n- `--color-text-muted`: `#3f3f46` → `#52525b` (대비율 2.8 → 4.5)\n- Badge 텍스트: `text-xs` → `text-xs font-medium` (가독성 보조)\n\n검증 도구: axe-core + Lighthouse accessibility audit 94점 → 100점',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1100,
      },
    ],
    // Session 15: CI optimization (Jason) — 2 messages
    [
      {
        role: 'human',
        content: 'CI 파이프라인이 12분 걸립니다. 5분 이내로 줄일 수 있을까요?',
      },
      {
        role: 'assistant',
        content:
          'Turborepo 캐시 + 병렬 실행으로 최적화합니다.\n\n변경 전: 12분 (순차)\n변경 후: 4분 30초 (병렬 + 캐시)\n\n- pnpm store 캐시: -2분\n- Turborepo remote cache: -3분\n- typecheck/lint/test 병렬: -2.5분',
        model_used: 'claude-haiku-4-5-20251001',
        tokens_used: 650,
      },
    ],
    // Session 16: Responsive sidebar (Mina) — 2 messages
    [
      {
        role: 'human',
        content: '모바일에서 사이드바가 화면을 가립니다. 반응형으로 만들어주세요.',
      },
      {
        role: 'assistant',
        content:
          "768px 브레이크포인트 기준 반응형 레이아웃:\n\n- **Desktop (≥768px):** 고정 사이드바 240px\n- **Mobile (<768px):** 슬라이드 오버레이 + 햄버거 버튼\n\n```tsx\nfunction AppLayout({ children }: Props) {\n  const isMobile = useMediaQuery('(max-width: 767px)');\n  return isMobile\n    ? <MobileLayout>{children}</MobileLayout>\n    : <DesktopLayout>{children}</DesktopLayout>;\n}\n```",
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1400,
      },
    ],
    // Session 17: Notification preferences (Emily) — 2 messages
    [
      {
        role: 'human',
        content: '알림 설정을 사용자가 커스터마이즈할 수 있게 해주세요. Slack webhook도 연동.',
      },
      {
        role: 'assistant',
        content:
          '알림 설정 시스템:\n\n```typescript\ninterface NotificationSettings {\n  readonly conflictAlerts: boolean;\n  readonly dailyDigest: boolean;\n  readonly slackWebhookUrl: string | null;\n  readonly emailNotifications: boolean;\n}\n```\n\nSlack webhook은 프로젝트 단위로 설정하며, 충돌 감지/PRD 분석 완료/팀원 참여 이벤트를 전송합니다.',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 1350,
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
