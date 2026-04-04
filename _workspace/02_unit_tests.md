# 단위 테스트 보고서

## 작성된 테스트 파일

### 신규 생성 (이번 세션)

| 파일                                   | 테스트 수 | 대상                                                                                                                                                                                                                             |
| -------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth/auth.service.unit.test.ts`       | 25        | auth 서비스 전체 함수 (findOrCreateByEmail, findOrCreateByName, findUserById, updateUserPlan, updateApiKey, deleteApiKey, getUserApiKey, saveSupabaseToken, deleteSupabaseToken, getSupabaseToken)                               |
| `conflicts/conflict.service.test.ts`   | 26        | conflict 서비스 전체 함수 (detectConflicts, saveDetectedConflicts, getConflictsByProject, getConflictDetail, updateConflictStatus, batchResolveConflicts, aiVerifyConflict, assignReviewer, addReviewNotes, getConflictOverview) |
| `quota/quota.service.test.ts`          | 13        | getQuotaStatus, detectPlan, CLI 설정 파일 감지 (credentials.json, claude.json)                                                                                                                                                   |
| `quota/quota.repository.test.ts`       | 4         | updateUserPlanDetection, getUserPlanDetectionSource                                                                                                                                                                              |
| `activity/activity.repository.test.ts` | 5         | insertActivity, findActivitiesByProjectId (페이지네이션, metadata 파싱)                                                                                                                                                          |
| `setup/setup.service.test.ts`          | 8         | getDatabaseStatus (localhost, remote, supabase, hostname masking)                                                                                                                                                                |

### 기존 테스트 (이전 존재)

- `auth/auth.service.test.ts` (7) — 기본 서비스 테스트
- `sessions/session.service.test.ts` (14)
- `projects/project.service.test.ts` (37)
- `plans/plan.service.test.ts` (14)
- `admin/admin.service.test.ts` (8)
- 기타 schema, helper 테스트 다수

## 커버리지 변화 (주요 모듈)

| 모듈                | Before | After      |
| ------------------- | ------ | ---------- |
| auth                | 7.93%  | **100%**   |
| quota               | 4.42%  | **92.92%** |
| activity            | ~0%    | **89.74%** |
| conflicts (service) | ~0%    | **100%**   |
| setup               | 4.31%  | 14.38%     |

## 모킹 전략

- **서비스 테스트**: `vi.mock()` 으로 repository 모킹, 서비스 함수 실제 실행
- **Repository 테스트**: Kysely 체이닝 메서드 수동 모킹 (`mockReturnValue(chain)`)
- **파일 시스템 모킹**: `vi.mock('node:fs/promises')` — quota CLI 감지 테스트용
- **패턴**: AAA (Arrange-Act-Assert), `beforeEach(() => vi.clearAllMocks())`
