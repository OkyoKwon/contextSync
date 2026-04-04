# 커버리지 분석 보고서 (Phase 3 완료)

## 전체 현황

| 패키지               | 시작    | 최종          | 목표 | 변화        |
| -------------------- | ------- | ------------- | ---- | ----------- |
| @context-sync/api    | 16.52%  | **52.85%**    | 80%  | **+36.33%** |
| @context-sync/shared | 100%    | 100%          | 80%  | -           |
| @context-sync/web    | 실패1건 | **전체 통과** | 80%  | 실패 수정   |

## API 테스트 통계

- 테스트 파일: 34개 → **75개** (+41)
- 테스트 수: ~450개 → **827개** (+377)
- Branch: 81.58% → **83.93%**
- Functions: 38.5% → **60.69%**

## API 모듈별 상세 커버리지

### 80% 이상 달성 (8개 모듈)

| 모듈          | Stmts      |
| ------------- | ---------- |
| auth          | **100%**   |
| database      | **100%**   |
| lib           | **97.85%** |
| notifications | **97.5%**  |
| search        | **93.93%** |
| quota         | **92.92%** |
| activity      | **89.74%** |
| config        | **85%**    |

### 50-79% (5개 모듈)

| 모듈      | Stmts      |
| --------- | ---------- |
| sessions  | **63.65%** |
| conflicts | **63.25%** |
| projects  | **52.89%** |
| plans     | **51.62%** |
| plugins   | **50.73%** |

### 30-49% (4개 모듈)

| 모듈           | Stmts      |
| -------------- | ---------- |
| ai-evaluation  | **43.81%** |
| local-sessions | **36.99%** |
| setup          | **35.97%** |
| admin          | **34.69%** |

### 30% 미만 (2개 모듈)

| 모듈                | Stmts      |
| ------------------- | ---------- |
| prd-analysis        | **24.14%** |
| supabase-onboarding | **~20%**   |

## 80% 달성 로드맵 (남은 ~27%)

### 즉시 가능 (+10%)

- sessions: routes 나머지 (PATCH, DELETE), getDashboardStats/getTeamStats
- projects: routes 나머지 (collaborators, join-code)
- conflicts: conflict-ai-analyzer 모킹
- plans: service 나머지 (parsers 등)

### 중간 난이도 (+10%)

- ai-evaluation: repository CRUD (큰 파일이지만 패턴 동일)
- prd-analysis: codebase-scanner, claude-client 모킹
- local-sessions: 파일시스템 모킹
- admin: SQL 의존 함수
- plugins: auto-sync.plugin

### 고난이도 (+7%)

- ai-evaluation: multi-perspective 분석 파이프라인
- supabase-onboarding: 전체 외부 API 모킹
- setup: switchToRemote (Kysely+pg 모킹)
