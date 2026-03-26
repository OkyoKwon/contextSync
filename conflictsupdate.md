# AI Conflict Verification — 기획서 (v2)

## 배경 및 문제

현재 Conflicts 감지는 **파일 경로 겹침(file path overlap)** 만으로 동작한다.

```
Session A (User 1): src/auth.ts, src/utils.ts 수정
Session B (User 2): src/auth.ts, src/config.ts 수정
→ 겹침 1개 → info severity conflict 생성
```

**한계:**

- `src/utils.ts`처럼 여러 사람이 자연스럽게 건드리는 유틸 파일도 conflict로 잡힘
- 같은 파일을 수정했어도 **서로 다른 함수/영역**을 수정한 경우 실제 충돌이 아님
- 반대로 파일은 다르지만 **동일한 기능을 각자 구현** 중인 경우는 감지하지 못함
- 심각도(severity)가 단순 겹침 개수 기반이라 신뢰도가 낮음

**목표:** AI가 양쪽 세션의 대화 내용, 수정 파일, 작업 맥락을 분석하여 **실제로 중복 작업인지 판단**하고, 충돌의 성격과 권장 조치를 제시하는 기능.

---

## 교차 검수 결과 (v1 대비 변경점)

### 기능 설계 보완

| 항목           | v1 문제             | v2 수정                                                                                           |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| 메시지 수집    | user role만 수집    | user + assistant 모두 수집. assistant 응답에 실제 코드 변경/결정이 포함되어 있어 충돌 판단에 필수 |
| 에러/로딩 상태 | 미정의              | AI Evaluation과 동일한 상태 흐름 적용 (`pending → analyzing → completed / failed`)                |
| 쿨다운         | 미정의              | conflict당 10분 쿨다운 (AI Evaluation의 8시간보다 짧게 — conflict는 상황 변화가 빠름)             |
| API Key 미설정 | 미고려              | API Key 없으면 "AI Verify" 버튼 비활성 + 툴팁으로 안내                                            |
| 토큰 추정      | input ~3,000 (과소) | input ~8,000 (2세션 × 10msg × 1500자 + system prompt ≈ 32K자 ≈ 8K tokens)                         |
| max_tokens     | 8192 (과다)         | 2048 (verdict 응답은 ~500 tokens)                                                                 |
| 재분석         | "덮어쓰기" 언급만   | 명시적 "Re-verify" 버튼 + 쿨다운 표시                                                             |

### UI/UX 개선

| 항목                    | v1 문제                                                            | v2 수정                                                                      |
| ----------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| ConflictCard 과부하     | 카드에 verdict 상세 내용 전부 표시 → 카드가 지나치게 길어짐        | **카드**: verdict 배지 + 한줄 요약만 / **DetailView**: 전체 분석 결과 표시   |
| ConflictDetailView 누락 | 기획에서 DetailView 언급 없음                                      | verdict 섹션을 DetailView의 Review Notes 아래에 배치                         |
| 버튼 계층 혼란          | "AI Verify"가 Resolve/Dismiss와 같은 줄 → 분석 vs 액션 구분 불명확 | **분리**: AI Verify는 파일 경로 아래 별도 줄, Resolve/Dismiss는 맨 하단 유지 |
| Verdict 필터            | Phase 2로 분류                                                     | Phase 1에 포함 (Select 하나 추가하면 됨, 구현 비용 극히 낮음)                |
| false_positive 처리     | 표시만                                                             | `false_positive` verdict 시 "Dismiss" 버튼에 추천 표시 (Dismiss suggested)   |

---

## 기능 개요

### 핵심 플로우

```
Conflict 감지 (기존 파일 경로 기반)
  ↓
ConflictCard에 "AI Verify" 버튼 노출
  ↓
사용자 클릭 → POST /api/conflicts/:id/ai-verify
  ↓
Backend: 양쪽 세션의 메시지 + 파일경로 + 메타데이터 수집
  ↓
Claude API: conflict 분석 프롬프트 전송
  ↓
결과 저장 (conflicts 테이블 ai_* 컬럼)
  ↓
UI: ConflictCard에 verdict 배지 표시
     ConflictDetailView에 상세 분석 결과 표시
```

### AI가 판단하는 항목

| 항목                      | 설명                                                                            |
| ------------------------- | ------------------------------------------------------------------------------- |
| **verdict**               | `real_conflict` / `likely_conflict` / `low_risk` / `false_positive`             |
| **confidence**            | 0-100, AI의 판단 확신도                                                         |
| **overlap_type**          | `same_function`, `same_feature`, `shared_utility`, `independent`                |
| **summary**               | 한국어 2-3문장 요약 (왜 충돌인지 / 아닌지)                                      |
| **risk_areas**            | 구체적 위험 지점 배열 (예: "두 사람 모두 `validateToken()` 함수를 리팩토링 중") |
| **recommendation**        | 권장 조치 (`coordinate`, `review_together`, `no_action`, `merge_carefully`)     |
| **recommendation_detail** | 권장 조치에 대한 구체적 설명                                                    |

---

## 상세 설계

### 1. 데이터 수집 전략

Conflict 하나에 대해 AI 분석 시 수집하는 데이터:

```
Session A (User 1)                    Session B (User 2)
├─ title                              ├─ title
├─ userName                           ├─ userName
├─ filePaths[]                        ├─ filePaths[]
├─ moduleNames[]                      ├─ moduleNames[]
├─ branch                             ├─ branch
├─ tags[]                             ├─ tags[]
├─ messages[] (user + assistant)      ├─ messages[] (user + assistant)
│  ├─ first 5 + last 5 per session    │  ├─ first 5 + last 5 per session
│  └─ 최대 1500자/메시지              │  └─ 최대 1500자/메시지
└─ createdAt                          └─ createdAt

Conflict 메타데이터:
├─ overlappingPaths[]
├─ severity (기존 파일 기반)
└─ conflictType
```

**메시지 샘플링 규칙:**

- 각 세션에서 user + assistant role 메시지 추출 (assistant 응답에 실제 코드 변경 내용 포함)
- 세션당 최대 10개 (첫 5개 + 마지막 5개, sort_order 기준)
- 메시지당 최대 1,500자 (초과 시 truncate + `...[truncated]`)
- 전체 프롬프트 최대 60,000자
- user 메시지: 작업 의도 파악 / assistant 메시지: 실제 변경 내용 파악

### 2. 시스템 프롬프트 설계

```
당신은 소프트웨어 개발팀의 작업 충돌 분석 전문가입니다.
두 팀원이 각각 AI 코딩 어시스턴트와 나눈 대화 및 작업 컨텍스트를 분석하여,
실제로 중복/충돌되는 작업을 하고 있는지 판단합니다.

## 판단 기준

1. **같은 함수/컴포넌트 수정** → real_conflict
   - 동일한 함수명, 클래스명, 컴포넌트명이 양쪽 대화에서 언급됨
   - 동일한 로직을 서로 다른 방식으로 변경하려 함
   - 같은 파일의 같은 영역을 수정 중

2. **같은 기능을 각자 구현** → likely_conflict
   - 파일은 다르지만 동일한 비즈니스 요구사항을 구현 중
   - 예: 한 명은 프론트엔드, 다른 한 명은 백엔드에서 같은 기능 작업
   - 서로의 작업 결과에 영향을 줄 가능성이 높음

3. **공유 유틸/설정 파일 수정** → low_risk
   - 공통 파일을 건드리지만 서로 다른 부분을 수정
   - 예: 한 명은 새 상수 추가, 다른 한 명은 기존 함수 수정
   - merge 시 minor conflict 가능하나 로직 충돌은 아님

4. **실제 관련 없음** → false_positive
   - 파일 경로만 겹칠 뿐 작업 내용이 완전히 독립적
   - 예: 한 명은 타입 추가, 다른 한 명은 테스트 작성
   - 동시 수정해도 문제없음

## 분석 시 고려 사항

- 파일 경로 겹침만으로 판단하지 말 것 — 대화 내용에서 실제 의도를 파악
- assistant 응답에서 실제 코드 변경 내용을 확인하여 수정 범위 파악
- 같은 브랜치에서 작업 중인지 확인 (같은 브랜치 = 위험도 높음)
- 시간적 근접성 고려 (같은 날 작업 = 위험도 높음)
- 유틸/설정/타입 파일은 자연스럽게 여러 사람이 수정 — 이것만으로 conflict 아님
- index.ts, package.json 등 공통 파일의 겹침은 가중치 낮게

## Output Format

Respond ONLY with valid JSON:
{
  "verdict": "real_conflict",
  "confidence": 85,
  "overlapType": "same_function",
  "summary": "한국어 2-3문장 요약",
  "riskAreas": ["위험 지점 1", "위험 지점 2"],
  "recommendation": "coordinate",
  "recommendationDetail": "구체적 권장 조치 설명"
}

## Guidelines
- verdict: real_conflict | likely_conflict | low_risk | false_positive
- confidence: 0-100 (데이터가 부족하면 낮게)
- overlapType: same_function | same_feature | shared_utility | independent
- recommendation: coordinate | review_together | no_action | merge_carefully
- summary, riskAreas, recommendationDetail은 한국어로 작성
- 근거 없이 추측하지 말 것 — 대화 내용에서 확인 가능한 사실만 기반으로 판단
```

### 3. AI 응답 포맷

```json
{
  "verdict": "real_conflict",
  "confidence": 85,
  "overlapType": "same_function",
  "summary": "두 사용자 모두 auth 모듈의 validateToken() 함수를 리팩토링하고 있습니다. User A는 JWT 검증 로직을 변경하려 하고, User B는 토큰 갱신 로직을 수정 중입니다. 같은 함수를 동시에 변경하면 merge conflict이 발생할 가능성이 높습니다.",
  "riskAreas": [
    "validateToken() 함수의 반환 타입 변경 충돌",
    "auth.middleware.ts의 에러 핸들링 로직 중복 수정"
  ],
  "recommendation": "coordinate",
  "recommendationDetail": "두 사람이 작업 범위를 명확히 나눈 뒤 순차적으로 머지하는 것을 권장합니다."
}
```

### 4. DB 스키마

기존 `conflicts` 테이블에 AI 분석 결과 컬럼 추가 (마이그레이션 030):

```sql
ALTER TABLE conflicts ADD COLUMN ai_verdict TEXT;               -- real_conflict | likely_conflict | low_risk | false_positive | NULL
ALTER TABLE conflicts ADD COLUMN ai_confidence INTEGER;         -- 0-100
ALTER TABLE conflicts ADD COLUMN ai_overlap_type TEXT;          -- same_function | same_feature | shared_utility | independent
ALTER TABLE conflicts ADD COLUMN ai_summary TEXT;               -- AI 분석 요약
ALTER TABLE conflicts ADD COLUMN ai_risk_areas TEXT[];          -- 위험 지점 배열
ALTER TABLE conflicts ADD COLUMN ai_recommendation TEXT;        -- coordinate | review_together | no_action | merge_carefully
ALTER TABLE conflicts ADD COLUMN ai_recommendation_detail TEXT; -- 권장 조치 상세
ALTER TABLE conflicts ADD COLUMN ai_analyzed_at TIMESTAMPTZ;    -- 분석 완료 시각
ALTER TABLE conflicts ADD COLUMN ai_model_used TEXT;            -- 사용 모델
ALTER TABLE conflicts ADD COLUMN ai_input_tokens INTEGER;       -- input 토큰
ALTER TABLE conflicts ADD COLUMN ai_output_tokens INTEGER;      -- output 토큰
```

**설계 의도:** Conflict 1개당 AI 분석 1개 (1:1 관계). 별도 테이블은 불필요한 JOIN만 추가. 재분석 시 덮어쓰기.

### 5. API 엔드포인트

```
POST /api/conflicts/:conflictId/ai-verify
```

- **Auth**: project access 확인 (`assertProjectAccess`)
- **Precondition**: `ANTHROPIC_API_KEY` 환경변수 필수 (없으면 400 에러)
- **Cooldown**: conflict당 10분 (이전 `ai_analyzed_at` 기준)
- **재분석**: 쿨다운 이후 재요청 가능 (기존 결과 덮어쓰기)
- **응답**: 분석 결과가 포함된 conflict 전체 객체

**에러 응답:**
| 상황 | HTTP | 메시지 |
|------|------|--------|
| API Key 미설정 | 400 | `Anthropic API Key가 설정되지 않았습니다` |
| 쿨다운 중 | 403 | `AI 분석 쿨다운 중입니다. N분 후 다시 시도해주세요` |
| 세션 메시지 부족 | 400 | `분석에 필요한 메시지가 부족합니다` |
| API 호출 실패 | 502 | `callWithRetry`의 `toAppError` 매핑 재사용 |

### 6. 프론트엔드 UI

#### 6-1. ConflictCard (요약 뷰)

verdict 있을 때 배지만 표시. 카드를 과도하게 늘리지 않음.

```
┌─────────────────────────────────────────────────────┐
│  ⚠️ Warning    detected           5 minutes ago      │
│                                                       │
│  Significant overlap: 4 file(s) modified by...        │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌───────────────┐     │
│  │ auth │ │ utils│ │ config │ │ middleware     │     │
│  └──────┘ └──────┘ └────────┘ └───────────────┘     │
│                                                       │
│  🔴 Real Conflict (85%)  두 사용자 모두 auth 모듈의  │
│                          validateToken()을 수정 중... │
│                                                       │
│  [AI Verify]                                          │
│  [Resolve]  [Dismiss]                                 │
└───────────────────────────────────────────────────────┘
```

- verdict 미분석: `[AI Verify]` 버튼만 표시
- 분석 중: 버튼이 spinner + "Analyzing..." 으로 변경
- 분석 완료: verdict 배지 + summary 첫 줄 표시, 버튼은 `[Re-verify]` 로 변경
- `false_positive` verdict: Dismiss 버튼에 "(Suggested)" 텍스트 추가

#### 6-2. ConflictDetailView (상세 뷰)

기존 Review Notes 아래에 AI Analysis 섹션 추가:

```
┌─ AI Analysis ─────────────────────────────────────────┐
│                                                        │
│  🔴 Real Conflict        Confidence: 85%               │
│  Overlap: Same Function  Analyzed: 2 minutes ago       │
│                                                        │
│  ── Summary ──────────────────────────────────────────│
│  두 사용자 모두 auth 모듈의 validateToken() 함수를     │
│  리팩토링하고 있습니다. User A는 JWT 검증 로직을       │
│  변경하려 하고, User B는 토큰 갱신 로직을 수정 중...  │
│                                                        │
│  ── Risk Areas ───────────────────────────────────────│
│  • validateToken() 함수의 반환 타입 변경 충돌          │
│  • auth.middleware.ts의 에러 핸들링 로직 중복 수정     │
│                                                        │
│  ── Recommendation ───────────────────────────────────│
│  💡 Coordinate                                         │
│  두 사람이 작업 범위를 명확히 나눈 뒤 순차적으로       │
│  머지하는 것을 권장합니다.                              │
│                                                        │
│  [Re-verify]                                           │
└────────────────────────────────────────────────────────┘
```

#### 6-3. ConflictsPage 필터 추가

기존 Severity / Status 필터 옆에 Verdict 필터 추가:

```
[All Severities ▾]  [All Statuses ▾]  [All Verdicts ▾]  (i)  [Resolve All (3)]
                                        ├─ All Verdicts
                                        ├─ Not Analyzed
                                        ├─ Real Conflict
                                        ├─ Likely Conflict
                                        ├─ Low Risk
                                        └─ False Positive
```

#### 6-4. Verdict 배지 색상

| Verdict           | 색상       | 라벨            | 의미           |
| ----------------- | ---------- | --------------- | -------------- |
| `real_conflict`   | red-500    | Real Conflict   | 즉시 조율 필요 |
| `likely_conflict` | orange-500 | Likely Conflict | 확인 권장      |
| `low_risk`        | blue-500   | Low Risk        | 낮은 위험      |
| `false_positive`  | green-500  | False Positive  | 실제 충돌 아님 |
| 미분석            | zinc-500   | Not Analyzed    | AI 분석 전     |

#### 6-5. 인터랙션 상세

| 상태                        | AI Verify 버튼                                    | Verdict 영역               |
| --------------------------- | ------------------------------------------------- | -------------------------- |
| 미분석                      | `[AI Verify]` (primary)                           | 미표시                     |
| 분석 중                     | `[Analyzing...]` (disabled, spinner)              | 미표시                     |
| 분석 완료                   | `[Re-verify]` (ghost)                             | 배지 + summary             |
| 쿨다운 중                   | `[Re-verify]` (disabled, 잔여시간 tooltip)        | 이전 결과 유지             |
| API Key 없음                | `[AI Verify]` (disabled, tooltip: "API Key 필요") | 미표시                     |
| 에러 발생                   | `[Retry]` (danger variant)                        | "분석 실패" 메시지         |
| conflict resolved/dismissed | 버튼 미표시                                       | 기존 결과 유지 (읽기 전용) |

---

## 비용 추정 (수정)

| 항목                 | 값                                              |
| -------------------- | ----------------------------------------------- |
| 분석당 input tokens  | ~8,000 (2세션 × 10msg × 1500자 + system prompt) |
| 분석당 output tokens | ~500                                            |
| Sonnet 4.6 비용/건   | ~$0.03                                          |
| 일 50건 기준 월 비용 | ~$45                                            |
| Haiku 4.5 사용 시    | ~$5/월                                          |

**권장:** MVP는 Sonnet 사용 (정확도 우선), Phase 2 자동 분석 도입 시 Haiku로 전환 검토.

---

## 구현 범위

### Phase 1 (MVP)

- [ ] `conflicts` 테이블에 AI 분석 컬럼 추가 (마이그레이션 030)
- [ ] `POST /api/conflicts/:conflictId/ai-verify` 엔드포인트
- [ ] `conflict-ai-analyzer.ts`: Claude API 호출 + 프롬프트 + 파싱
- [ ] ConflictCard에 verdict 배지 + "AI Verify" 버튼
- [ ] ConflictDetailView에 AI Analysis 상세 섹션
- [ ] ConflictsPage에 Verdict 필터 추가
- [ ] 쿨다운 (10분) + API Key 미설정 처리
- [ ] shared types/constants 업데이트

### Phase 2 (개선)

- [ ] 자동 분석: conflict 감지 시 자동으로 AI 분석 트리거 (백그라운드, Haiku)
- [ ] Batch AI Verify: 여러 conflict 일괄 분석
- [ ] verdict 기반 자동 dismiss: `false_positive`인 경우 자동 dismiss 옵션
- [ ] AI 분석 히스토리 (재분석 시 이전 결과 별도 저장)

### Phase 3 (고도화)

- [ ] 코드 diff 분석: 파일 경로뿐 아니라 실제 코드 변경 내용까지 분석
- [ ] Slack 알림: `real_conflict` 감지 시 해당 사용자에게 Slack DM
- [ ] 대시보드: 프로젝트별 false positive 비율, 실제 충돌 트렌드

---

## 기술 고려사항

### 기존 모듈 재사용

| 모듈                                                  | 재사용 대상                                          | 용도                                                    |
| ----------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| `apps/api/src/lib/claude-utils.ts`                    | `callWithRetry()`, `toAppError()`                    | Claude API 호출 + 재시도 + 에러 매핑                    |
| `apps/api/src/modules/ai-evaluation/claude-client.ts` | JSON 파싱 패턴 참고                                  | `parseEvaluationResponse()` 의 JSON 추출/검증 로직 참고 |
| `apps/api/src/modules/conflicts/conflict.service.ts`  | `assertProjectAccess()` 호출 패턴                    | 권한 확인                                               |
| `apps/api/src/modules/sessions/session.repository.ts` | `findMessagesBySessionId()`, `findSessionWithUser()` | 세션 + 메시지 조회                                      |
| `apps/web/src/lib/toast.ts`                           | `showToast`                                          | 성공/에러 피드백                                        |

**주의: 직접 재사용 불가한 모듈**

- `claude-client.ts`의 `sampleMessages()`: 단일 사용자 평가용 설계. conflict 분석은 2개 세션 비교이므로 새로운 샘플링 함수 필요.
- `callWithRetry()`의 `max_tokens: 8192`: conflict 분석은 응답이 짧으므로 `max_tokens: 2048`로 별도 호출 필요. → `callWithRetry`에 `maxTokens` 파라미터 추가하거나, conflict 전용 호출 함수 작성.

### 파일 구조

```
apps/api/src/
  lib/
    claude-utils.ts                    ← MODIFY: callWithRetry에 maxTokens 파라미터 추가
  modules/conflicts/
    conflict-ai-analyzer.ts            ← NEW: 프롬프트 구성 + Claude 호출 + 응답 파싱
    conflict.schema.ts                 ← MODIFY: aiVerifySchema 추가
    conflict.routes.ts                 ← MODIFY: POST /ai-verify 라우트 추가
    conflict.service.ts                ← MODIFY: aiVerifyConflict() 함수 추가
    conflict.repository.ts             ← MODIFY: updateAiAnalysis() + toConflict() 매핑 확장
  database/
    migrations/030_add_conflict_ai_analysis.ts  ← NEW
    types.ts                           ← MODIFY: ConflictsTable에 ai_* 컬럼 추가

apps/web/src/
  components/conflicts/
    ConflictCard.tsx                    ← MODIFY: verdict 배지 + AI Verify 버튼
    ConflictAiVerdict.tsx              ← NEW: verdict 상세 표시 컴포넌트
    ConflictDetailView.tsx             ← MODIFY: AI Analysis 섹션 추가
  hooks/
    use-conflicts.ts                   ← MODIFY: useAiVerifyConflict() hook 추가
  api/
    conflicts.api.ts                   ← MODIFY: aiVerify() 메서드 추가
  pages/
    ConflictsPage.tsx                  ← MODIFY: verdict 필터 추가

packages/shared/src/
  types/conflict.ts                    ← MODIFY: AI 분석 필드 추가
  constants/conflict-severity.ts       ← MODIFY: AI_VERDICTS, AI_RECOMMENDATIONS 상수 추가
  index.ts                             ← MODIFY: 새 타입/상수 export
```

---

## 구현 계획 (Phase 1 상세)

### Step 1: Shared 타입 및 상수 정의

**`packages/shared/src/constants/conflict-severity.ts`**

```typescript
export const AI_VERDICTS = [
  'real_conflict',
  'likely_conflict',
  'low_risk',
  'false_positive',
] as const;
export const AI_OVERLAP_TYPES = [
  'same_function',
  'same_feature',
  'shared_utility',
  'independent',
] as const;
export const AI_RECOMMENDATIONS = [
  'coordinate',
  'review_together',
  'no_action',
  'merge_carefully',
] as const;
export const AI_VERIFY_COOLDOWN_MINUTES = 10;
```

**`packages/shared/src/types/conflict.ts`** — Conflict 인터페이스에 추가:

```typescript
readonly aiVerdict: AiVerdict | null;
readonly aiConfidence: number | null;
readonly aiOverlapType: AiOverlapType | null;
readonly aiSummary: string | null;
readonly aiRiskAreas: readonly string[] | null;
readonly aiRecommendation: AiRecommendation | null;
readonly aiRecommendationDetail: string | null;
readonly aiAnalyzedAt: string | null;
readonly aiModelUsed: string | null;
```

**`packages/shared/src/index.ts`** — 새 타입/상수 export 추가

### Step 2: DB 마이그레이션 + 타입

**`apps/api/src/database/migrations/030_add_conflict_ai_analysis.ts`**

- `conflicts` 테이블에 11개 컬럼 추가 (모두 nullable)

**`apps/api/src/database/types.ts`** — `ConflictsTable`에 대응 컬럼 추가:

```typescript
ai_verdict: string | null;
ai_confidence: number | null;
ai_overlap_type: string | null;
ai_summary: string | null;
ai_risk_areas: string[] | null;
ai_recommendation: string | null;
ai_recommendation_detail: string | null;
ai_analyzed_at: Date | null;
ai_model_used: string | null;
ai_input_tokens: number | null;
ai_output_tokens: number | null;
```

### Step 3: Backend — claude-utils 확장

**`apps/api/src/lib/claude-utils.ts`**

- `callWithRetry`에 optional `maxTokens` 파라미터 추가 (기본값 8192 유지, 하위 호환)

### Step 4: Backend — conflict-ai-analyzer.ts (NEW)

핵심 로직 파일. 담당:

1. **`buildConflictAnalysisPrompt(sessionA, sessionB, conflict)`**
   - 양쪽 세션 메타데이터 + 샘플링된 메시지를 구조화
   - 겹치는 파일 경로 명시
   - 전체 60,000자 제한 내에서 구성

2. **`sampleSessionMessages(messages, maxPerSession=10, maxCharsPerMsg=1500)`**
   - 세션별 첫 5개 + 마지막 5개 메시지 추출
   - 메시지당 1,500자 truncate
   - `findMessagesBySessionId()` 결과를 입력으로 받음

3. **`analyzeConflict(apiKey, model, sessionA, messagesA, sessionB, messagesB, conflict)`**
   - 프롬프트 구성 → `callWithRetry(client, model, systemPrompt, userMessage, 1, 2048)` 호출
   - 응답 JSON 파싱 + 검증
   - 결과 반환

4. **`parseConflictAnalysisResponse(text)`**
   - JSON 추출 (markdown 코드블록 or raw)
   - verdict, confidence, overlapType 등 필드 검증
   - 유효하지 않은 값은 기본값으로 fallback

5. **시스템 프롬프트**: 상수로 파일 내 정의 (상세 설계 섹션 2의 프롬프트)

### Step 5: Backend — Repository, Service, Routes

**`conflict.repository.ts`** 수정:

- `updateAiAnalysis(db, conflictId, analysis)` — ai\_\* 컬럼 업데이트
- `toConflict()` — 새 ai\_\* 컬럼을 Conflict 객체에 매핑

**`conflict.service.ts`** 수정:

- `aiVerifyConflict(db, apiKey, model, conflictId, userId)` 추가:
  1. `findConflictById` → 존재 확인
  2. `assertProjectAccess` → 권한 확인
  3. 쿨다운 확인 (`ai_analyzed_at` + 10분)
  4. `findSessionWithUser` × 2 → 양쪽 세션 조회
  5. `findMessagesBySessionId` × 2 → 양쪽 메시지 조회
  6. `analyzeConflict` 호출
  7. `updateAiAnalysis` 로 결과 저장
  8. 업데이트된 conflict 반환

**`conflict.schema.ts`** — 별도 input 불필요 (POST body 없음)

**`conflict.routes.ts`** 수정:

- `POST /conflicts/:conflictId/ai-verify` 라우트 추가
  - `app.env.ANTHROPIC_API_KEY` 확인
  - dual-pool DB 라우팅 (기존 패턴)
  - `conflictService.aiVerifyConflict()` 호출

### Step 6: Frontend — API + Hook

**`conflicts.api.ts`** 수정:

```typescript
aiVerify: (conflictId: string) =>
  api.post<Conflict>(`/conflicts/${conflictId}/ai-verify`),
```

**`use-conflicts.ts`** 수정:

```typescript
export function useAiVerifyConflict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conflictId: string) => conflictsApi.aiVerify(conflictId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['conflict'] });
    },
  });
}
```

### Step 7: Frontend — ConflictAiVerdict 컴포넌트 (NEW)

**`ConflictAiVerdict.tsx`** — 재사용 가능한 verdict 표시 컴포넌트:

Props:

```typescript
interface ConflictAiVerdictProps {
  conflict: Conflict;
  variant: 'compact' | 'full'; // compact=카드용, full=디테일뷰용
}
```

- `compact`: verdict 배지 + summary 첫 줄 (ConflictCard에서 사용)
- `full`: 배지 + confidence + summary + riskAreas + recommendation (ConflictDetailView에서 사용)

### Step 8: Frontend — ConflictCard, ConflictDetailView 수정

**`ConflictCard.tsx`** 수정:

- 파일 경로 아래에 `<ConflictAiVerdict variant="compact" />` 조건부 렌더링
- "AI Verify" / "Re-verify" / "Analyzing..." 버튼 (Resolve/Dismiss와 분리된 줄)
- `false_positive` 시 Dismiss 버튼에 "(Suggested)" 추가

**`ConflictDetailView.tsx`** 수정:

- Review Notes 아래에 "AI Analysis" 섹션 추가
- `<ConflictAiVerdict variant="full" />` 렌더링
- "AI Verify" / "Re-verify" 버튼 (쿨다운 시 disabled + 잔여시간 표시)

### Step 9: Frontend — ConflictsPage 필터

**`ConflictsPage.tsx`** 수정:

- `verdict` state 추가
- Verdict 필터 Select 추가 (All / Not Analyzed / Real Conflict / Likely Conflict / Low Risk / False Positive)
- 필터링: verdict === 'not_analyzed'이면 `aiVerdict === null`인 항목만, 나머지는 `aiVerdict` 값으로 필터
- 백엔드 쿼리가 아닌 프론트엔드 필터로 구현 (conflict 목록이 이미 로드된 상태이므로)

### Step 10: 검증

1. `pnpm typecheck` — 타입 오류 없음 확인
2. `pnpm test` — 기존 테스트 통과 확인
3. 수동 테스트:
   - Conflicts 페이지 → AI Verify 클릭 → spinner 표시 → verdict 결과 표시
   - 10분 내 Re-verify 클릭 → 쿨다운 에러 toast
   - ConflictDetailView에서 상세 분석 결과 확인
   - Verdict 필터로 "Real Conflict" / "False Positive" 필터링 확인
   - API Key 미설정 시 버튼 비활성 확인
