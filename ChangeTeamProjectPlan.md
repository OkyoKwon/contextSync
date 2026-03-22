# 로컬 → 팀 프로젝트 전환 기능 기획

## 1. 개요

### 배경

현재 ContextSync는 개인(personal) 모드와 팀(team) 모드를 지원하지만, **로컬에서 혼자 작업하던 프로젝트를 팀 프로젝트로 전환**하는 워크플로우가 없다. 팀 프로젝트는 여러 사용자의 세션을 동기화해야 하므로 중앙 DB가 필수이며, 프로젝트 리더가 이 전환을 쉽게 수행할 수 있는 UI가 필요하다.

### 목표

1. 로컬 프로젝트 → 팀 프로젝트 전환 플로우 제공
2. 로컬 DB → 중앙 DB(Supabase 등) 연결 설정 UI
3. 기존 세션/데이터의 안전한 마이그레이션
4. 팀원 초대 및 온보딩 통합

---

## 2. 현재 상태 분석

### 기존 인프라

| 구분                | 현재 상태                                        |
| ------------------- | ------------------------------------------------ |
| DB                  | 로컬 Docker PostgreSQL 16 (self-hosted)          |
| `DATABASE_PROVIDER` | `'self-hosted'` \| `'supabase'` (env 레벨 전환)  |
| `DEPLOYMENT_MODE`   | `'personal'` \| `'team-host'` \| `'team-member'` |
| 프로젝트 소유       | `owner_id` (개인) 또는 `team_id` (팀)            |
| 협업자              | `project_collaborators` 테이블 존재              |

### 현재 한계

- DB 전환이 **환경변수 수동 변경**으로만 가능 (서버 재시작 필요)
- 로컬 DB → 중앙 DB 데이터 마이그레이션 도구 없음
- 프로젝트 단위가 아닌 **서버 단위**로 DB가 결정됨
- 팀 전환 시 기존 세션/충돌/활동 로그 유실 위험

---

## 3. 핵심 설계

### 3.1 아키텍처 결정: 프로젝트 단위 DB 연결

현재 서버 전체가 하나의 DB를 사용하는 구조에서, **프로젝트별로 DB 연결을 관리**하는 방식으로 확장한다.

```
┌─────────────────────────────────────────────┐
│  ContextSync API Server                     │
│                                             │
│  ┌─────────┐   ┌─────────────────────────┐  │
│  │ Local DB │   │  Central DB Registry    │  │
│  │ (default)│   │  project_id → db_config │  │
│  └─────────┘   └─────────────────────────┘  │
│       │                    │                │
│       ▼                    ▼                │
│  개인 프로젝트        팀 프로젝트            │
│  (owner_id)          (team_id)              │
│  로컬 세션 저장       중앙 DB 세션 동기화     │
└─────────────────────────────────────────────┘
```

**핵심 원칙:** 로컬 프로젝트는 기존 로컬 DB를 그대로 사용하고, 팀 전환 시에만 중앙 DB 연결이 추가된다.

### 3.2 DB 연결 레지스트리

프로젝트별 DB 연결 정보를 로컬 DB에 저장하고, 팀 프로젝트 요청 시 해당 연결을 사용한다.

```sql
-- 새 테이블: project_db_configs
CREATE TABLE project_db_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'self-hosted',  -- 'self-hosted' | 'supabase' | 'neon' | 'custom'
  connection_url_encrypted TEXT NOT NULL,                -- AES-256-GCM 암호화
  ssl_required BOOLEAN NOT NULL DEFAULT true,
  connection_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'connected' | 'failed'
  last_health_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id)
);
```

### 3.3 Supabase 연동 전략

Supabase를 **1순위 외부 DB 솔루션**으로 지원한다.

| 항목   | 설계                                                                     |
| ------ | ------------------------------------------------------------------------ |
| 연결   | Supabase 프로젝트 URL + `service_role` 키 또는 직접 DB connection string |
| 스키마 | ContextSync 마이그레이션을 Supabase DB에 실행 (동일 스키마)              |
| 인증   | 기존 JWT 인증 유지 (Supabase Auth 사용 안 함, DB만 활용)                 |
| RLS    | 비활성화 — 앱 레벨에서 권한 관리 (기존 `assertAccess` 패턴 유지)         |

**왜 Supabase인가:**

- 무료 티어로 팀 프로젝트 시작 가능 (500MB, 2 프로젝트)
- 관리형 PostgreSQL → 별도 인프라 운영 불필요
- Connection pooling (Supavisor) 내장
- 대시보드에서 DB 모니터링 가능

---

## 4. 기능 상세

### 4.1 Phase 1: 중앙 DB 연결 설정 UI

#### 4.1.1 설정 페이지 추가

프로젝트 Settings 페이지에 **"Database Connection"** 섹션을 추가한다.

```
프로젝트 설정
├── 프로젝트 정보 (기존)
├── 협업자 관리 (기존)
├── 🆕 데이터베이스 연결
│   ├── 현재 상태: 로컬 DB / 중앙 DB (연결됨)
│   ├── Provider 선택: Supabase / Self-hosted / Custom
│   ├── 연결 설정 폼
│   └── 연결 테스트 버튼
└── 위험 영역 (기존)
```

#### 4.1.2 Provider별 설정 폼

**Supabase:**

```
┌──────────────────────────────────────┐
│  Supabase 연결 설정                   │
│                                      │
│  Project URL:  [supabase.co/...]     │
│  DB Password:  [••••••••••]          │
│                                      │
│  또는                                │
│                                      │
│  Connection String: [postgresql://...│
│                                      │
│  [연결 테스트]  [저장]                │
│                                      │
│  ℹ️ Supabase 프로젝트 생성 가이드 →   │
└──────────────────────────────────────┘
```

**Self-hosted (원격 PostgreSQL):**

```
┌──────────────────────────────────────┐
│  PostgreSQL 연결 설정                 │
│                                      │
│  Host:     [db.example.com]          │
│  Port:     [5432]                    │
│  Database: [contextsync]             │
│  Username: [admin]                   │
│  Password: [••••••••]               │
│  SSL:      [✓] 필수                  │
│                                      │
│  [연결 테스트]  [저장]                │
└──────────────────────────────────────┘
```

#### 4.1.3 연결 테스트 API

```
POST /api/projects/:projectId/db-config/test
Body: { provider, connectionUrl } 또는 { provider, host, port, database, username, password, ssl }
Response: { success: true, latencyMs: 45, version: "PostgreSQL 16.2" }
         | { success: false, error: "Connection refused" }
```

테스트 항목:

1. TCP 연결 가능 여부
2. 인증 성공 여부
3. 스키마 호환성 (마이그레이션 상태 확인)
4. 응답 지연 시간

#### 4.1.4 연결 정보 암호화

- `connection_url_encrypted`: AES-256-GCM으로 암호화하여 저장
- 암호화 키: `DB_ENCRYPTION_KEY` 환경변수 (필수, 32바이트)
- 프론트엔드에는 연결 상태만 노출, connection string은 마스킹

### 4.2 Phase 2: 로컬 → 팀 전환 워크플로우

#### 4.2.1 전환 플로우 UI

프로젝트 리더가 "팀 프로젝트로 전환" 버튼을 클릭하면 스텝 위저드가 표시된다.

```
Step 1: 중앙 DB 설정
  └─ Provider 선택 + 연결 정보 입력 + 연결 테스트

Step 2: 데이터 마이그레이션 미리보기
  └─ 마이그레이션 대상 표시:
     - 세션 N개
     - 메시지 N개
     - 충돌 기록 N개
     - 파일 변경 N개
  └─ 예상 소요 시간
  └─ "로컬 데이터 유지" 체크박스 (기본: ON)

Step 3: 마이그레이션 실행
  └─ 프로그레스 바 (실시간)
  └─ 단계별 상태:
     ✅ 스키마 마이그레이션 완료
     ✅ 세션 데이터 전송 (127/127)
     ⏳ 메시지 데이터 전송 (2,340/5,120)
     ⬚ 검색 인덱스 재구축
     ⬚ 무결성 검증

Step 4: 팀원 초대
  └─ 이메일로 팀원 초대
  └─ 초대 링크 생성
  └─ 역할 지정 (admin / member)

Step 5: 완료
  └─ 전환 성공 요약
  └─ 팀원 온보딩 가이드 링크
```

#### 4.2.2 데이터 마이그레이션 API

```
POST /api/projects/:projectId/migrate-to-team
Body: {
  dbConfig: { provider, connectionUrl, ... },
  options: {
    keepLocalCopy: true,       // 로컬 DB에 데이터 유지
    includeSessions: true,
    includeConflicts: true,
    includeActivityLog: true
  }
}

Response (SSE stream):
  event: progress
  data: { step: "schema", status: "completed", progress: 100 }

  event: progress
  data: { step: "sessions", status: "in_progress", progress: 65, current: 83, total: 127 }

  event: complete
  data: { success: true, summary: { sessions: 127, messages: 5120, conflicts: 12 } }

  event: error
  data: { step: "messages", error: "Connection lost", canRetry: true }
```

#### 4.2.3 마이그레이션 로직

```
1. 중앙 DB에 스키마 마이그레이션 실행
   - migrations/ 폴더의 모든 마이그레이션을 원격 DB에 적용
   - 이미 적용된 마이그레이션은 스킵

2. 사용자 데이터 동기화
   - 프로젝트 소유자 → 중앙 DB users 테이블에 upsert
   - 기존 협업자 → 동일하게 upsert

3. 프로젝트 데이터 전송 (트랜잭션 단위)
   a. projects 레코드 (owner_id → team_id 전환)
   b. project_collaborators 레코드
   c. sessions + messages (배치 단위, 100개씩)
   d. conflicts + conflict 관련 데이터
   e. activity_log
   f. search_vector 재구축 (tsvector)

4. 무결성 검증
   - 로컬 vs 중앙 레코드 수 비교
   - FK 참조 무결성 확인
   - search_vector 인덱스 상태 확인

5. 프로젝트 메타데이터 업데이트
   - project_db_configs에 연결 정보 저장
   - projects.team_id 설정 (새 teams 레코드 생성)
   - projects.owner_id를 collaborator(owner 역할)로 전환
```

#### 4.2.4 롤백 전략

마이그레이션 실패 시:

- 중앙 DB의 해당 프로젝트 데이터를 트랜잭션 롤백
- 로컬 DB는 변경하지 않음 (keepLocalCopy 기본값)
- 사용자에게 실패 원인 + 재시도 옵션 제공
- 부분 성공 시 재시도는 이어서 진행 (idempotent upsert)

### 4.3 Phase 3: 팀 프로젝트 운영

#### 4.3.1 Dual-DB 라우팅

팀 전환 후 API 요청은 프로젝트의 DB 설정에 따라 라우팅된다.

```typescript
// 의사코드
async function getDbForProject(projectId: string): Promise<Db> {
  const config = await projectDbConfigRepo.findByProjectId(localDb, projectId);
  if (!config) return localDb; // 로컬 프로젝트
  return getOrCreateConnection(config); // 중앙 DB 커넥션 풀
}
```

**커넥션 풀 관리:**

- 프로젝트별 Kysely 인스턴스 캐싱 (LRU, max 10개)
- idle 커넥션 5분 후 해제
- health check 주기: 60초

#### 4.3.2 팀원 온보딩 플로우

팀원이 초대를 수락하면:

1. 로그인/회원가입 (기존 auth 플로우)
2. 초대 수락 → `project_collaborators`에 추가 (중앙 DB)
3. 로컬 디렉토리 설정 (자신의 작업 경로)
4. 세션 동기화 시작

#### 4.3.3 동기화 상태 표시

대시보드에 DB 연결 상태 인디케이터:

```
┌────────────────────────────┐
│  🟢 중앙 DB 연결됨          │
│  Provider: Supabase        │
│  Latency: 45ms             │
│  Last sync: 2분 전          │
└────────────────────────────┘
```

연결 끊김 시:

```
┌────────────────────────────┐
│  🔴 중앙 DB 연결 끊김       │
│  마지막 연결: 5분 전         │
│  [재연결] [로컬 모드로 전환]  │
└────────────────────────────┘
```

---

## 5. API 설계

### 새로운 엔드포인트

```
# DB 설정
POST   /api/projects/:projectId/db-config          — 중앙 DB 연결 설정
GET    /api/projects/:projectId/db-config           — 현재 DB 설정 조회 (마스킹)
PUT    /api/projects/:projectId/db-config           — DB 설정 수정
DELETE /api/projects/:projectId/db-config           — 중앙 DB 연결 해제
POST   /api/projects/:projectId/db-config/test      — 연결 테스트
GET    /api/projects/:projectId/db-config/health     — 헬스체크

# 마이그레이션
POST   /api/projects/:projectId/migrate-to-team     — 팀 전환 시작 (SSE)
GET    /api/projects/:projectId/migration-status     — 마이그레이션 상태 조회
POST   /api/projects/:projectId/migrate-to-team/retry — 실패 시 재시도

# 팀 관리
POST   /api/projects/:projectId/convert-to-personal  — 팀 → 개인 복귀 (owner만)
```

### 권한

| 엔드포인트        | 필요 권한                      |
| ----------------- | ------------------------------ |
| DB 설정 CRUD      | `project:edit` (owner + admin) |
| 마이그레이션 실행 | owner only                     |
| 팀 → 개인 복귀    | owner only                     |
| 헬스체크 조회     | `data:read` (모든 멤버)        |

---

## 6. 데이터 모델 변경

### 새 테이블

```sql
-- project_db_configs: 프로젝트별 중앙 DB 연결 정보
CREATE TABLE project_db_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  connection_url_encrypted TEXT NOT NULL,
  ssl_required BOOLEAN NOT NULL DEFAULT true,
  connection_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  last_health_check TIMESTAMPTZ,
  migration_status VARCHAR(20) DEFAULT 'none',  -- 'none' | 'in_progress' | 'completed' | 'failed'
  migration_progress JSONB,                      -- { step, current, total, startedAt }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migration_logs: 마이그레이션 실행 이력
CREATE TABLE migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  direction VARCHAR(20) NOT NULL,  -- 'to_team' | 'to_personal'
  status VARCHAR(20) NOT NULL,     -- 'started' | 'completed' | 'failed'
  summary JSONB,                   -- { sessions, messages, conflicts, duration_ms }
  error_detail TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### 기존 테이블 변경

```sql
-- projects 테이블에 db_mode 컬럼 추가
ALTER TABLE projects ADD COLUMN db_mode VARCHAR(20) NOT NULL DEFAULT 'local';
-- 'local': 로컬 DB 사용
-- 'remote': 중앙 DB 사용 (project_db_configs 참조)
```

---

## 7. 프론트엔드 구현

### 새 컴포넌트

```
apps/web/src/
  components/
    projects/
      DatabaseConfigSection.tsx      — 설정 페이지 DB 섹션
      DatabaseProviderSelect.tsx     — Provider 선택 드롭다운
      ConnectionForm.tsx             — 연결 정보 입력 폼
      ConnectionTestButton.tsx       — 연결 테스트 + 결과 표시
      MigrationWizard.tsx            — 전환 스텝 위저드 (모달)
      MigrationProgress.tsx          — 실시간 프로그레스
      MigrationPreview.tsx           — 마이그레이션 대상 미리보기
      DbStatusIndicator.tsx          — 연결 상태 뱃지
    layout/
      DbConnectionBadge.tsx          — 사이드바/헤더 상태 표시
  hooks/
    use-db-config.ts                 — DB 설정 CRUD 훅
    use-migration.ts                 — 마이그레이션 SSE 훅
  api/
    db-config.api.ts                 — DB 설정 API 클라이언트
```

### 새 백엔드 모듈

```
apps/api/src/
  modules/
    db-config/
      db-config.routes.ts
      db-config.service.ts
      db-config.repository.ts
      db-config.schema.ts
  lib/
    encryption.ts                    — AES-256-GCM 암복호화
    db-pool-manager.ts               — 프로젝트별 커넥션 풀 관리
    migration-runner.ts              — 원격 DB 마이그레이션 실행기
    data-migrator.ts                 — 로컬 → 원격 데이터 전송
```

---

## 8. 환경변수 추가

| 변수                | 필수                 | 설명                                  |
| ------------------- | -------------------- | ------------------------------------- |
| `DB_ENCRYPTION_KEY` | 팀 기능 사용 시 필수 | DB 연결 정보 암호화 키 (32바이트 hex) |

---

## 9. 구현 단계

### Phase 1: 기반 (1주)

- [ ] `project_db_configs`, `migration_logs` 마이그레이션 작성
- [ ] `projects.db_mode` 컬럼 추가
- [ ] `encryption.ts` 유틸리티 구현
- [ ] `db-pool-manager.ts` — 프로젝트별 Kysely 인스턴스 관리
- [ ] `db-config` 모듈 (CRUD + 연결 테스트 API)
- [ ] 기본 연결 설정 UI (DatabaseConfigSection)

### Phase 2: 마이그레이션 엔진 (1주)

- [ ] `migration-runner.ts` — 원격 DB 스키마 마이그레이션
- [ ] `data-migrator.ts` — 배치 데이터 전송 (SSE 스트림)
- [ ] 마이그레이션 미리보기 API
- [ ] 롤백/재시도 로직
- [ ] 무결성 검증

### Phase 3: 전환 UI (1주)

- [ ] MigrationWizard 스텝 위저드
- [ ] MigrationProgress 실시간 표시
- [ ] MigrationPreview 미리보기
- [ ] 팀원 초대 통합 (기존 invitation 모듈 연동)
- [ ] DbStatusIndicator + DbConnectionBadge

### Phase 4: Dual-DB 라우팅 (1주)

- [ ] 미들웨어: 요청별 프로젝트 DB 라우팅
- [ ] 세션/메시지/충돌 모듈의 DB 인스턴스 동적 주입
- [ ] 헬스체크 + 자동 재연결
- [ ] 연결 끊김 시 로컬 폴백 옵션

### Phase 5: 안정화 (1주)

- [ ] E2E 테스트: 전환 플로우 전체
- [ ] 엣지 케이스 처리 (대용량 데이터, 네트워크 불안정)
- [ ] Supabase 무료 티어 제한 안내 UI
- [ ] 문서 업데이트

---

## 10. 보안 고려사항

| 위험                        | 대응                                            |
| --------------------------- | ----------------------------------------------- |
| DB 연결 정보 노출           | AES-256-GCM 암호화 저장, 프론트엔드 마스킹      |
| 중앙 DB 무단 접근           | 앱 레벨 JWT 인증 + 프로젝트 권한 검사 유지      |
| 마이그레이션 중 데이터 손실 | 로컬 원본 유지 (기본값), 트랜잭션 단위 전송     |
| 연결 문자열 인젝션          | Zod 스키마로 URL 형식 검증                      |
| 암호화 키 관리              | `DB_ENCRYPTION_KEY` 환경변수, 시작 시 존재 검증 |

---

## 11. UX 시나리오

### 시나리오 A: 첫 팀 전환 (Supabase)

1. 프로젝트 리더가 Settings → Database Connection 진입
2. "팀 프로젝트로 전환" 클릭
3. Provider에서 "Supabase" 선택
4. Supabase 프로젝트 URL + DB 비밀번호 입력
5. "연결 테스트" → 성공 (✅ 45ms)
6. "다음" → 마이그레이션 미리보기 (세션 23개, 메시지 1,240개)
7. "마이그레이션 시작" → 프로그레스 바 진행
8. 완료 → 팀원 초대 화면
9. 이메일로 2명 초대 → 완료

### 시나리오 B: 연결 오류 복구

1. 마이그레이션 중 네트워크 끊김
2. 에러 표시: "메시지 전송 중 연결 끊김 (1,200/1,240)"
3. "재시도" 클릭 → 1,200번부터 이어서 전송
4. 완료

### 시나리오 C: 팀 → 개인 복귀

1. Owner가 Settings → "팀 프로젝트 해제" 클릭
2. 경고: "중앙 DB 연결이 해제됩니다. 팀원의 접근이 차단됩니다."
3. 옵션: "중앙 DB 데이터를 로컬로 가져오기" 체크
4. 확인 → 데이터 역마이그레이션 → 로컬 프로젝트로 복귀
