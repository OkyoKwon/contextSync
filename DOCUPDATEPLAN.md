# 문서 & 이미지 에셋 전면 업데이트 기획

> 작성일: 2026-03-25
> 목적: 현재 UI/UX와 일치하지 않는 스크린샷 전면 교체 + 문서 내용 검토 및 개선

---

## 1. 이미지 에셋 현황

### 1.1 스크린샷 파일 목록 (3/22 촬영 — 3일 경과)

| 파일                       | 크기 | 사용처                                                                | 교체 필요 여부              |
| -------------------------- | ---- | --------------------------------------------------------------------- | --------------------------- |
| `dashboard-full.png`       | 323K | README 히어로, 랜딩 히어로, Docs Getting Started                      | **교체** — 메인 대표 이미지 |
| `dashboard-stats.png`      | 146K | README "Dashboard & Analytics"                                        | **교체**                    |
| `session-conversation.png` | 310K | README, 랜딩 FeatureShowcase #01, Docs Features, Docs Getting Started | **교체**                    |
| `session-detail.png`       | 302K | public에만 존재 (미사용)                                              | **검토** — Docs에 활용 가능 |
| `conflicts-list.png`       | 238K | README, 랜딩 FeatureShowcase #02, Docs Features                       | **교체**                    |
| `conflict-detail.png`      | 234K | public에만 존재 (미사용)                                              | **검토** — Docs에 활용 가능 |
| `prd-analysis.png`         | 246K | 랜딩 FeatureShowcase #03, Docs Features                               | **교체**                    |
| `prd-trend-chart.png`      | 46K  | public에만 존재 (미사용)                                              | **검토**                    |
| `search-overlay.png`       | 309K | Docs Features                                                         | **교체**                    |
| `settings-team.png`        | 232K | Docs Features, Docs Getting Started                                   | **교체**                    |
| `ai-evaluation.png`        | 147K | Docs Features                                                         | **교체**                    |
| `token-usage-chart.png`    | 109K | imageAsset에만 (public 미복사)                                        | **복사 후 활용**            |

### 1.2 Optional 에셋 (미사용)

| 파일              | 위치                   | 활용 방안                                              |
| ----------------- | ---------------------- | ------------------------------------------------------ |
| `admin-panel.png` | `imageAsset/optional/` | Docs Features 또는 README "More features"에 추가       |
| `plans-view.png`  | `imageAsset/optional/` | Docs Features Plans 항목에 스크린샷 추가 (현재 `null`) |

### 1.3 로고/파비콘

| 파일          | 위치               | 상태      |
| ------------- | ------------------ | --------- |
| `logo.png`    | `apps/web/public/` | 검토 필요 |
| `favicon.png` | `apps/web/public/` | 검토 필요 |

---

## 2. 스크린샷 교체 작업

### 2.1 촬영 기준

- **해상도**: Retina 2x (1600×1000 이상) 권장
- **테마**: 다크 모드 기본, 라이트 모드는 선택
- **브라우저 크롬**: 제거 (앱 내부 영역만 캡처)
- **데이터**: 시드 데이터로 자연스러운 더미 데이터 표시
- **일관성**: 동일 프로젝트/세션으로 연결된 스토리 형태

### 2.2 촬영 목록 (총 14장)

#### 필수 (현재 사용 중 — 11장)

| #   | 화면            | 파일명                     | 촬영 포인트                                       |
| --- | --------------- | -------------------------- | ------------------------------------------------- |
| 1   | 대시보드 전체   | `dashboard-full.png`       | 프로젝트 선택 상태, 세션 목록 + 통계 카드 표시    |
| 2   | 대시보드 통계   | `dashboard-stats.png`      | 7일 활동 차트, 토큰 사용량, 핫 파일 영역 클로즈업 |
| 3   | 세션 대화       | `session-conversation.png` | 메시지 목록 + 코드 블록이 보이는 대화 내용        |
| 4   | 세션 상세       | `session-detail.png`       | 세션 메타데이터 + 파일 변경 목록                  |
| 5   | 충돌 목록       | `conflicts-list.png`       | 다양한 severity (info/warning/critical) 혼재      |
| 6   | 충돌 상세       | `conflict-detail.png`      | 파일 diff 또는 충돌 해결 화면                     |
| 7   | PRD 분석        | `prd-analysis.png`         | PRD 업로드 후 분석 결과 화면                      |
| 8   | PRD 트렌드 차트 | `prd-trend-chart.png`      | 시간별 요구사항 충족도 추이                       |
| 9   | 검색 오버레이   | `search-overlay.png`       | 전문 검색 결과 (세션/메시지/파일 매칭)            |
| 10  | 팀 설정         | `settings-team.png`        | 멤버 목록, 역할, 초대 코드                        |
| 11  | AI 평가         | `ai-evaluation.png`        | 다차원 점수 + 숙련도 등급                         |

#### 추가 촬영 (현재 미사용 자리에 배치 — 3장)

| #   | 화면             | 파일명                  | 배치 대상                                 |
| --- | ---------------- | ----------------------- | ----------------------------------------- |
| 12  | 토큰 사용량 차트 | `token-usage-chart.png` | Docs Features 또는 README                 |
| 13  | Plans 뷰         | `plans-view.png`        | Docs Features #5 (현재 `null`)            |
| 14  | Admin 패널       | `admin-panel.png`       | Docs Features 또는 README "More features" |

### 2.3 파일 배포 경로

```
촬영 원본 → imageAsset/screenshots/  (소스 보관)
          → apps/web/public/screenshots/  (웹 배포)
```

- `token-usage-chart.png`은 현재 `public/screenshots/`에 누락 — 복사 필요
- `plans-view.png`, `admin-panel.png`은 `imageAsset/optional/`에서 `imageAsset/screenshots/`로 이동 후 `public/screenshots/`에도 복사

---

## 3. 문서별 업데이트 검토

### 3.1 README.md

| 항목                   | 현재 상태                                             | 개선 사항                                              | 우선순위   |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------ | ---------- |
| 히어로 이미지          | `dashboard-full.png` (3/22)                           | 최신 스크린샷으로 교체                                 | **HIGH**   |
| 기능 스크린샷 3장      | session-conversation, conflicts-list, dashboard-stats | 최신 스크린샷으로 교체                                 | **HIGH**   |
| Roadmap                | 체크박스만, 상태 표시 없음                            | 상태 뱃지 추가 (🔄 In Progress / 📋 Planned / ✅ Done) | **MEDIUM** |
| "More features" 테이블 | AI Evaluation, Plans 등 텍스트만                      | 주요 기능에 스크린샷 축소판 추가 고려                  | **LOW**    |
| 최근 추가 기능         | dual-DB routing, auto-sync 등 미반영                  | Key Features에 "Local Session Auto-Sync" 추가          | **MEDIUM** |
| Project Site 링크      | `okyokwon.github.io/contextSync/`                     | 실제 동작 여부 확인 필요                               | **MEDIUM** |

### 3.2 Landing Page (LandingPage.tsx + 컴포넌트)

| 컴포넌트           | 이미지 사용                   | 개선 사항                                       | 우선순위 |
| ------------------ | ----------------------------- | ----------------------------------------------- | -------- |
| `LandingHero`      | `dashboard-full.png`          | 최신 스크린샷 교체                              | **HIGH** |
| `FeatureShowcase`  | 3장 (session, conflicts, prd) | 최신 스크린샷 교체                              | **HIGH** |
| `FeatureShowcase`  | 3개 피처만 표시               | Dashboard/Analytics 피처 추가 고려 (4번째 카드) | **LOW**  |
| `ProblemStatement` | 이미지 없음 (터미널 데모)     | 현행 유지                                       | —        |
| `SocialProof`      | 이미지 없음 (통계만)          | GitHub Stars 실시간 반영 확인                   | **LOW**  |

### 3.3 Docs Page (DocsPage.tsx + 컴포넌트)

| 컴포넌트                | 이미지 사용                        | 개선 사항                                  | 우선순위   |
| ----------------------- | ---------------------------------- | ------------------------------------------ | ---------- |
| `DocsHero`              | 없음                               | 현행 유지                                  | —          |
| `GettingStartedSection` | 3장 (session, dashboard, settings) | 최신 스크린샷 교체                         | **HIGH**   |
| `FeatureSection`        | 7장 (Plans만 `null`)               | 최신 스크린샷 교체 + `plans-view.png` 추가 | **HIGH**   |
| `FaqSection`            | 없음                               | FAQ 내용 최신 기능 반영 확인               | **MEDIUM** |

### 3.4 docs/architecture.md

| 항목      | 현재 상태                        | 개선 사항                            | 우선순위 |
| --------- | -------------------------------- | ------------------------------------ | -------- |
| 이미지    | 없음 (텍스트/Mermaid 다이어그램) | 현행 유지 — 다이어그램은 코드로 관리 | —        |
| 모듈 목록 | 15개 모듈 기술                   | 최근 추가 모듈 반영 확인             | **LOW**  |
| DB 테이블 | 18개 테이블, 27개 마이그레이션   | 최신 마이그레이션 반영 확인          | **LOW**  |
| 환경변수  | REMOTE_DATABASE_URL 등 포함      | 최신 상태 — 변경 없음                | —        |

### 3.5 docs/design-system.md

| 항목              | 현재 상태     | 개선 사항                          | 우선순위 |
| ----------------- | ------------- | ---------------------------------- | -------- |
| 이미지            | 없음          | 컴포넌트 스크린샷 추가 고려 (선택) | **LOW**  |
| 컴포넌트 카탈로그 | 19개 컴포넌트 | 최근 추가 컴포넌트 반영 확인       | **LOW**  |
| 색상 토큰         | hex 값 포함   | 현재 CSS와 일치 여부 확인          | **LOW**  |

### 3.6 docs/setup-guide.md

| 항목               | 현재 상태             | 개선 사항                                    | 우선순위   |
| ------------------ | --------------------- | -------------------------------------------- | ---------- |
| 이미지             | 없음                  | 셋업 과정 스크린샷 추가 고려 (Login 화면 등) | **LOW**    |
| 한국어 텍스트      | Line 193 한국어 혼재  | 영어로 통일 또는 i18n 분리                   | **MEDIUM** |
| Bootstrap 문제해결 | `pnpm bootstrap` 참조 | `bash scripts/setup.sh` 기준으로 수정        | **LOW**    |

### 3.7 docs/E2E_TC.md

| 항목          | 현재 상태 | 개선 사항                      | 우선순위   |
| ------------- | --------- | ------------------------------ | ---------- |
| 이미지        | 없음      | 이미지 불필요                  | —          |
| 파일 크기     | 11,369줄  | 도메인별 분할 고려             | **LOW**    |
| 테스트 케이스 | 178개 TC  | 최근 추가 E2E 테스트 반영 확인 | **MEDIUM** |

---

## 4. 실행 계획

### Phase 1: 스크린샷 전면 촬영 및 교체 (HIGH)

**작업 순서:**

1. **개발 서버 실행** + 시드 데이터 확인
   - `pnpm dev`로 서버 기동
   - 시드 데이터로 자연스러운 화면 구성

2. **필수 11장 + 추가 3장 스크린샷 촬영**
   - 위 2.2 촬영 목록 기준
   - 다크 모드 기본, 일관된 창 크기

3. **에셋 파일 교체**
   - `imageAsset/screenshots/` 원본 교체
   - `apps/web/public/screenshots/` 배포본 교체
   - `token-usage-chart.png` public 복사
   - optional → screenshots 이동 (plans-view, admin-panel)

4. **코드 수정** (이미지 추가분)
   - `FeatureSection.tsx`: `FEATURE_SCREENSHOTS[4]` (`plans-view.png`) 추가
   - `FEATURE_SCREENSHOT_ALT_KEYS[4]` 번역 키 추가
   - i18n 파일에 alt 텍스트 추가

### Phase 2: README 업데이트 (HIGH-MEDIUM)

1. 스크린샷 4장 자동 반영 (파일명 동일하므로 경로 변경 불필요)
2. Roadmap 상태 뱃지 추가
3. 최근 기능 (Local Auto-Sync, Dual-DB Routing) 반영
4. Project Site 링크 확인 및 수정

### Phase 3: Landing/Docs 페이지 콘텐츠 업데이트 (MEDIUM)

1. 랜딩 FeatureShowcase — 스크린샷 자동 반영
2. Docs FeatureSection — Plans 스크린샷 연결
3. Docs FaqSection — 최신 기능 반영 확인
4. i18n 번역 파일 동기화 (en/ko/ja)

### Phase 4: 기타 문서 정비 (LOW)

1. `docs/setup-guide.md` 한국어 텍스트 영어 통일
2. `docs/architecture.md` 모듈/마이그레이션 목록 최신화
3. `docs/design-system.md` 컴포넌트 카탈로그 확인
4. `docs/E2E_TC.md` 최근 TC 반영 확인

---

## 5. 데모 데이터 기획 — 스크린샷용 시각 연출

> 현재 `seed-marketing/`에 기본 데모 데이터가 있으나, 스크린샷에서 시각적 다채로움이 부족함.
> 아래 기획에 따라 데모 데이터를 보강하여 각 화면이 풍성하고 설득력 있게 보이도록 구성.

### 5.1 프로젝트 & 사용자 — "실감나는 팀" 연출

**현재**: 4명 (Alex, Sarah, Marcus, Emily), 1 프로젝트

**개선안**: 6명으로 확장, 프로젝트 2개

| 이름            | 역할       | 아바타                                                    | 특징                          |
| --------------- | ---------- | --------------------------------------------------------- | ----------------------------- |
| Alex Kim        | Owner      | `ui-avatars.com/api/?name=AK&background=3b82f6&color=fff` | 백엔드 리드, 가장 많은 세션   |
| Sarah Chen      | Member     | `ui-avatars.com/api/?name=SC&background=8b5cf6&color=fff` | 프론트엔드 전문, 충돌 리뷰어  |
| Marcus Park     | Member     | `ui-avatars.com/api/?name=MP&background=10b981&color=fff` | DevOps + 인프라               |
| Emily Davis     | Member     | `ui-avatars.com/api/?name=ED&background=f59e0b&color=fff` | 풀스택, 테스트 전문           |
| **Jason Lee**   | **Member** | `ui-avatars.com/api/?name=JL&background=ef4444&color=fff` | **신규** — 주니어, 온보딩 중  |
| **Mina Tanaka** | **Member** | `ui-avatars.com/api/?name=MT&background=ec4899&color=fff` | **신규** — 디자인 시스템 담당 |

**프로젝트 2개:**
| 프로젝트 | 설명 | 멤버 | 데이터베이스 모드 |
|---------|------|------|----------------|
| **ContextSync** | AI development context hub | 6명 전원 | `dual` (local + remote) |
| **Design System** | UI component library | Mina, Sarah, Emily | `local` |

> 6명의 아바타 색상이 모두 다르므로 Team Activity, Timeline, Conflict 화면에서 시각적 구분이 명확해짐.

---

### 5.2 세션 데이터 — 다양한 상태/소스/브랜치 혼재

**현재**: 12 세션 (3 active, 9 completed)

**개선안**: 18 세션으로 확장 — 다양한 시각 요소 확보

| #   | 사용자    | 제목                                             | 상태       | 소스        | 브랜치                | 태그                       | 파일 수 | 메시지 수 |
| --- | --------- | ------------------------------------------------ | ---------- | ----------- | --------------------- | -------------------------- | ------- | --------- |
| 1   | Alex      | feat: JWT authentication with refresh tokens     | completed  | claude_code | `feat/auth`           | auth, security, feature    | 5       | 12        |
| 2   | Sarah     | feat: Real-time conflict detection engine        | completed  | claude_code | `feat/conflicts`      | conflicts, websocket       | 4       | 8         |
| 3   | Marcus    | fix: Database connection pool exhaustion         | completed  | claude_code | `fix/db-pool`         | database, bugfix, critical | 3       | 6         |
| 4   | Emily     | refactor: Extract Zod validation schemas         | completed  | claude_code | `refactor/validators` | refactor, zod, utils       | 6       | 10        |
| 5   | Alex      | feat: PRD analysis with Claude API               | completed  | claude_code | `feat/prd`            | prd, ai, anthropic         | 4       | 14        |
| 6   | Sarah     | feat: Full-text search (tsvector + GIN)          | completed  | claude_code | `feat/search`         | search, postgresql         | 3       | 7         |
| 7   | Marcus    | feat: Team invitation & role management          | **active** | claude_code | `feat/team-roles`     | team, rbac                 | 5       | 9         |
| 8   | Emily     | fix: Session sync race condition                 | **active** | claude_code | `fix/sync-race`       | sync, concurrency          | 3       | 5         |
| 9   | Alex      | feat: Token usage analytics dashboard            | completed  | claude_code | `feat/token-stats`    | analytics, charts          | 4       | 11        |
| 10  | Marcus    | docs: OpenAPI 3.1 endpoint documentation         | completed  | claude_code | `docs/openapi`        | docs, api                  | 2       | 4         |
| 11  | Alex      | feat: AI evaluation scoring system               | **active** | claude_code | `feat/ai-eval`        | ai, evaluation, scoring    | 4       | 8         |
| 12  | **Jason** | feat: Onboarding wizard for new users            | **active** | claude_code | `feat/onboarding`     | onboarding, ux             | 3       | 6         |
| 13  | **Mina**  | feat: Design token system (colors & spacing)     | completed  | claude_code | `feat/design-tokens`  | design, css, tokens        | 7       | 9         |
| 14  | **Sarah** | fix: Dark mode contrast accessibility            | completed  | claude_code | `fix/a11y-contrast`   | a11y, dark-mode, fix       | 4       | 5         |
| 15  | **Jason** | chore: CI pipeline optimization                  | completed  | claude_code | `chore/ci-speed`      | ci, performance            | 2       | 3         |
| 16  | **Mina**  | feat: Responsive sidebar + mobile nav            | **active** | claude_code | `feat/responsive`     | responsive, mobile         | 5       | 7         |
| 17  | **Emily** | feat: Notification preferences & Slack webhook   | completed  | claude_code | `feat/notifications`  | slack, notifications       | 3       | 8         |
| 18  | **Alex**  | perf: Query optimization for large session lists | completed  | claude_code | `perf/query-opt`      | performance, database      | 3       | 6         |

**시각적 효과:**

- 상태 혼재 (5 active / 13 completed) → 대시보드 "Today Sessions" 카드에 숫자 표시
- 6명의 다양한 사용자 → Timeline에 컬러풀한 아바타 행렬
- 태그 다양성 → 세션 목록에서 다채로운 태그 배지
- 브랜치명 → 세션 상세에서 git 아이콘 + 브랜치 표시

---

### 5.3 메시지 데이터 — 코드 블록 & 다국어 포함

**촬영 대상 세션의 메시지 상세 구성** (session-conversation.png 용)

**Session #5 (PRD Analysis) 추천** — 가장 시각적으로 풍부:

| 순서 | 역할      | 내용 요약                                                                                                      | 토큰  | 모델                     |
| ---- | --------- | -------------------------------------------------------------------------------------------------------------- | ----- | ------------------------ |
| 1    | human     | "PRD 문서를 분석해서 현재 구현 상태를 평가해줘. 특히 인증 플로우와 충돌 감지 부분의 완성도를 중점적으로 봐줘." | —     | —                        |
| 2    | assistant | 분석 결과 개요 + 요구사항 테이블 (achieved/partial/not_started) + 코드 블록 (TypeScript 예시)                  | 2,800 | claude-sonnet-4-20250514 |
| 3    | human     | "부분 완성인 항목들의 남은 작업량을 구체적으로 알려줘"                                                         | —     | —                        |
| 4    | assistant | 각 partial 항목별 TODO 리스트 + 예상 공수 + 코드 diff 블록                                                     | 3,200 | claude-sonnet-4-20250514 |
| 5    | human     | "트렌드 차트용 데이터 포맷도 설계해줘"                                                                         | —     | —                        |
| 6    | assistant | JSON 스키마 정의 + 차트 컴포넌트 코드 + 마이그레이션 SQL                                                       | 2,400 | claude-sonnet-4-20250514 |

**핵심 포인트:**

- 한국어 프롬프트 → 영어 응답 (다국어 지원 시각화)
- 코드 블록 (TypeScript, SQL, JSON) → 구문 강조 색상
- 테이블 형태 응답 → 구조화된 데이터 표시
- 토큰 카운트 표시 → 사용량 메트릭 시각화

---

### 5.4 충돌 데이터 — severity 분포 + 다양한 상태

**현재**: 4개 충돌

**개선안**: 7개로 확장 — 세 가지 severity가 고르게 분포

| #   | 세션 A → B                   | 유형           | 심각도       | 상태          | 겹치는 파일                                                           | 리뷰어 |
| --- | ---------------------------- | -------------- | ------------ | ------------- | --------------------------------------------------------------------- | ------ |
| 1   | Alex(#1) ↔ Marcus(#3)        | file_overlap   | **critical** | **open**      | `src/config/database.ts`, `src/config/env.ts`                         | —      |
| 2   | Sarah(#2) ↔ Marcus(#7)       | file_overlap   | **critical** | **reviewing** | `src/modules/conflicts/detector.ts`, `src/modules/conflicts/types.ts` | Sarah  |
| 3   | Alex(#5) ↔ Alex(#9)          | module_overlap | **warning**  | **resolved**  | `src/modules/dashboard/stats.service.ts`                              | Alex   |
| 4   | Emily(#4) ↔ Alex(#1)         | file_overlap   | **warning**  | **open**      | `src/utils/validate.ts`                                               | —      |
| 5   | **Mina(#13) ↔ Sarah(#14)**   | file_overlap   | **warning**  | **reviewing** | `src/styles/tokens.css`, `src/components/ui/Button.tsx`               | Emily  |
| 6   | **Jason(#12) ↔ Emily(#17)**  | module_overlap | **info**     | **open**      | `src/modules/notifications/service.ts`                                | —      |
| 7   | **Marcus(#10) ↔ Jason(#15)** | file_overlap   | **info**     | **resolved**  | `scripts/ci.yml`                                                      | Marcus |

**시각적 효과:**

- severity 분포: critical(2) / warning(3) / info(2) → 필터 버튼에 각각 숫자 표시
- status 분포: open(3) / reviewing(2) / resolved(2) → 모든 상태 뱃지 색상 노출
- 리뷰어 할당/미할당 혼재 → 액션 버튼 다양화
- 파일 경로 2개씩 → 겹치는 파일 태그가 시각적으로 풍부

---

### 5.5 PRD 분석 데이터 — 상승 곡선 트렌드

**현재**: 7일간 45% → 78% (7개 분석)

**개선안**: 10일간 38% → 82% (10개 분석) — 더 드라마틱한 상승 곡선

| Day    | 달성률  | Achieved  | Partial  | Not Started | 스캔 파일 | 입력 토큰  | 출력 토큰 |
| ------ | ------- | --------- | -------- | ----------- | --------- | ---------- | --------- |
| 1      | 38%     | 5/16      | 2/16     | 9/16        | 18        | 7,200      | 2,800     |
| 2      | 42%     | 5/16      | 4/16     | 7/16        | 22        | 7,800      | 3,100     |
| 3      | 48%     | 6/16      | 4/16     | 6/16        | 26        | 8,400      | 3,400     |
| 4      | 55%     | 7/16      | 4/16     | 5/16        | 30        | 9,000      | 3,600     |
| 5      | 58%     | 8/16      | 3/16     | 5/16        | 33        | 9,400      | 3,800     |
| 6      | 64%     | 9/16      | 3/16     | 4/16        | 36        | 9,800      | 4,000     |
| 7      | 70%     | 10/16     | 3/16     | 3/16        | 39        | 10,200     | 4,200     |
| 8      | 74%     | 10/16     | 4/16     | 2/16        | 42        | 10,600     | 4,400     |
| 9      | 78%     | 11/16     | 3/16     | 2/16        | 45        | 11,000     | 4,600     |
| **10** | **82%** | **12/16** | **3/16** | **1/16**    | **48**    | **11,400** | **4,800** |

**요구사항 16개 (6개 카테고리):**

| 카테고리           | 요구사항                                          | 상태            | 신뢰도 |
| ------------------ | ------------------------------------------------- | --------------- | ------ |
| Session Management | Auto-sync from `~/.claude/projects/`              | achieved        | 96%    |
| Session Management | Session metadata extraction (branch, files, tags) | achieved        | 94%    |
| Session Management | Multi-project session grouping                    | achieved        | 91%    |
| Session Management | Session status lifecycle (active → completed)     | achieved        | 88%    |
| Conflict Detection | Real-time file overlap detection                  | achieved        | 95%    |
| Conflict Detection | Severity classification (info/warning/critical)   | achieved        | 92%    |
| Conflict Detection | Review workflow with assignee                     | achieved        | 85%    |
| Conflict Detection | **Auto-resolve for stale conflicts**              | **partial**     | 62%    |
| Search             | Full-text search across sessions & messages       | achieved        | 97%    |
| Search             | **File path + tag combined filtering**            | **partial**     | 58%    |
| Dashboard          | Daily usage charts (7-day)                        | achieved        | 90%    |
| Dashboard          | Token usage breakdown by model                    | achieved        | 87%    |
| Dashboard          | **Real-time activity feed (WebSocket)**           | **partial**     | 45%    |
| PRD Analysis       | Claude-powered requirement extraction             | achieved        | 93%    |
| Team               | Role-based access (Owner / Member)                | achieved        | 89%    |
| Team               | **Granular permissions (view/edit/admin)**        | **not_started** | 22%    |

**시각적 효과:**

- 82% 달성률 → 큰 녹색 퍼센트 표시 + 프로그레스 바
- +4% 상승 → 화살표 + delta 표시
- 16개 요구사항 → 긴 목록으로 스크롤 가능 영역 시연
- 카테고리 뱃지 6종 → 다채로운 색상 분포
- 신뢰도 22%~97% 분포 → 숫자 색상 변화 (빨강~녹색)

---

### 5.6 AI 평가 데이터 — 멤버별 차별화된 점수

**현재**: Alex 1명 (82점 Expert)

**개선안**: 4명 평가 — 다양한 등급 분포

| 멤버        | 종합 점수 | 등급           | PQ  | TC  | IP  | CU  | AL  |
| ----------- | --------- | -------------- | --- | --- | --- | --- | --- |
| Alex Kim    | 8.4       | **Expert**     | 88  | 80  | 82  | 92  | 78  |
| Sarah Chen  | 7.6       | **Advanced**   | 82  | 74  | 78  | 76  | 70  |
| Emily Davis | 6.8       | **Proficient** | 72  | 68  | 70  | 74  | 56  |
| Jason Lee   | 4.2       | **Developing** | 48  | 38  | 52  | 44  | 28  |

> Marcus, Mina는 분석 대상 세션 부족으로 미평가 — "Not enough data" 표시

**차원별 상세 (Alex 기준):**

| 차원                   | 점수 | 신뢰도 | 강점                                 | 약점                         |
| ---------------------- | ---- | ------ | ------------------------------------ | ---------------------------- |
| Prompt Quality         | 88   | 92%    | 명확한 인수 조건, 코드 컨텍스트 제공 | 경계 케이스 명시 부족        |
| Task Complexity        | 80   | 87%    | 아키텍처 수준 작업 도전              | 더 야심찬 리팩토링 시도 필요 |
| Iteration Pattern      | 82   | 90%    | 효율적 후속 질문, 평균 2.8턴 완료    | 가끔 컨텍스트 리셋           |
| Context Utilization    | 92   | 95%    | 파일/프로젝트/용어 참조 우수         | — (약점 없음)                |
| AI Capability Leverage | 78   | 85%    | 생성·리뷰·테스트 다방면 활용         | 아키텍처 분석 미활용         |

**시각적 효과:**

- 4명 카드 그리드 → 점수 바 색상이 초록/파랑/노랑/빨강으로 다채롭게 분포
- Expert~Developing 4단계 등급 뱃지 → 모든 색상 조합 노출
- Alex 상세 뷰: 5개 차원 바 차트에서 92(높음)~78(보통) 시각적 대비
- Strengths/Weaknesses 목록 → 카드 UI 풍성함

---

### 5.7 토큰 사용량 데이터 — 모델 다양성 + 일별 변화

**Token Usage Panel 연출:**

| 항목        | 값                       | 시각 효과            |
| ----------- | ------------------------ | -------------------- |
| 총 토큰     | **2.47M**                | 큰 숫자 포맷         |
| 감지된 플랜 | **Pro** (via CLI)        | Pro 뱃지 + 소스 표시 |
| Top 모델    | claude-sonnet-4-20250514 | 모델명 표시          |

**모델별 사용량 테이블:**

| 모델                      | 총 토큰 | 메시지 수 | 비율  |
| ------------------------- | ------- | --------- | ----- |
| claude-sonnet-4-20250514  | 1.62M   | 89        | 65.6% |
| claude-opus-4-20250514    | 548K    | 24        | 22.2% |
| claude-haiku-4-5-20251001 | 302K    | 45        | 12.2% |

**일별 사용량 차트 (7일):**

| 날짜      | 토큰 | 세션 수 | 특징                   |
| --------- | ---- | ------- | ---------------------- |
| 3/19 (수) | 180K | 3       | 시작                   |
| 3/20 (목) | 320K | 5       | 증가                   |
| 3/21 (금) | 480K | 7       | **피크**               |
| 3/22 (토) | 120K | 2       | 주말 감소              |
| 3/23 (일) | 85K  | 1       | 최저                   |
| 3/24 (월) | 520K | 8       | **최대** — 월요일 복귀 |
| 3/25 (화) | 410K | 6       | 오늘 (진행 중)         |

**시각적 효과:**

- 주중/주말 패턴 → 차트에 자연스러운 골짜기
- 월요일 스파이크 → 시각적 하이라이트
- 3종 모델 → 테이블에 3행 (적절한 양)
- "오늘" 바가 다른 색으로 구분

---

### 5.8 핫 파일 데이터 — 다양한 경로 분포

| 파일 경로                                  | 편집 횟수 | 관련 기능     |
| ------------------------------------------ | --------- | ------------- |
| `src/modules/auth/auth.service.ts`         | 14        | 인증          |
| `src/modules/conflicts/detector.ts`        | 12        | 충돌 감지     |
| `src/config/database.ts`                   | 11        | DB 설정       |
| `src/modules/sessions/sessions.service.ts` | 9         | 세션 관리     |
| `src/utils/validate.ts`                    | 8         | 유틸리티      |
| `src/modules/prd-analysis/prd.service.ts`  | 7         | PRD 분석      |
| `src/components/ui/Button.tsx`             | 6         | 디자인 시스템 |
| `src/styles/tokens.css`                    | 5         | CSS 토큰      |

**시각적 효과:**

- 8개 항목 → 리스트가 가득 참
- 편집 횟수 14→5 그라데이션 → 바 차트 느낌
- 백엔드/프론트엔드/유틸 혼재 → 다양한 경로 구조

---

### 5.9 활동 피드 데이터 — 시간 분산 + 다양한 액션

| 시간      | 사용자 | 액션                 | 대상                                    |
| --------- | ------ | -------------------- | --------------------------------------- |
| 12분 전   | Alex   | session.created      | "feat: AI evaluation scoring system"    |
| 38분 전   | Mina   | session.synced       | "feat: Responsive sidebar + mobile nav" |
| 1시간 전  | Jason  | conflict.detected    | critical — detector.ts                  |
| 2시간 전  | Sarah  | conflict.reviewing   | conflicts/types.ts                      |
| 3시간 전  | Emily  | session.completed    | "fix: Session sync race condition"      |
| 5시간 전  | Alex   | prd.analyzed         | 82% 달성 (↑4%)                          |
| 8시간 전  | Marcus | conflict.resolved    | scripts/ci.yml                          |
| 12시간 전 | Sarah  | session.completed    | "feat: Full-text search"                |
| 1일 전    | Emily  | evaluation.completed | Alex Kim — Expert                       |
| 2일 전    | Alex   | session.created      | "perf: Query optimization"              |

**시각적 효과:**

- 10개 항목 → 피드가 빽빽하게 참
- 6명의 서로 다른 아바타 색상 → 다채로운 시각
- 7종 액션 타입 → 다양한 아이콘/텍스트
- "12분 전" ~ "2일 전" 분포 → 활발한 팀 느낌

---

### 5.10 검색 결과 데이터 — 풍부한 매칭

**검색어**: `"authentication"` (search-overlay.png 촬영 시)

| 결과 타입 | 제목/내용                                                          | 매칭 하이라이트  |
| --------- | ------------------------------------------------------------------ | ---------------- |
| Session   | "feat: JWT **authentication** with refresh tokens"                 | 세션 제목 매치   |
| Message   | "...implement **authentication** middleware using @fastify/jwt..." | 메시지 본문 매치 |
| Message   | "...the **authentication** flow should validate refresh tokens..." | 메시지 본문 매치 |
| File Path | `src/modules/**auth**/auth.service.ts`                             | 파일 경로 매치   |
| Session   | "fix: **Auth** guard redirect loop"                                | 세션 제목 매치   |
| Tag       | `auth`, `security`                                                 | 태그 매치        |

**시각적 효과:**

- 6개 이상 결과 → 오버레이가 풍성하게 채워짐
- 다양한 결과 타입 (Session, Message, File, Tag) → 아이콘 분류
- 검색어 하이라이트 (bold/yellow) → 시각적 포인트
- 코드 경로 모노스페이스 → 기술적 느낌

---

### 5.11 Plans 데이터 — 마크다운 문서 풍부함

**현재**: Plans 기능에 스크린샷 없음 (FeatureSection에서 `null`)

**연출용 Plan 3개:**

| Plan                                 | 프로젝트      | 크기   | 수정일 | 내용                                           |
| ------------------------------------ | ------------- | ------ | ------ | ---------------------------------------------- |
| `authentication-v2.md`               | ContextSync   | 4.2 KB | 1일 전 | 인증 리팩토링 계획 (4개 phase, 코드 블록 포함) |
| `conflict-detection-improvements.md` | ContextSync   | 3.8 KB | 3일 전 | 자동 해결 알고리즘 설계 (Mermaid 다이어그램)   |
| `design-system-migration.md`         | Design System | 2.9 KB | 오늘   | CSS 토큰 마이그레이션 가이드 (체크리스트)      |

**Plans 뷰어에 표시할 마크다운 (authentication-v2.md):**

```markdown
# Authentication V2 — Refresh Token Architecture

## Phase 1: Token Rotation

- [ ] Implement refresh token endpoint
- [ ] Add token family tracking
- [x] Database migration for refresh_tokens table

## Phase 2: Security Hardening

- [ ] Rate limiting per user/IP
- [ ] Token revocation on password change
      ...
```

**시각적 효과:**

- 좌측 패널: 3개 Plan 목록 (서로 다른 프로젝트 뱃지 색상)
- 우측 패널: 마크다운 렌더링 (헤딩, 체크리스트, 코드 블록)
- 메타데이터: 파일명, 크기, 수정일이 모두 표시

---

### 5.12 팀 설정 화면 데이터

| 항목         | 연출 값                                                           |
| ------------ | ----------------------------------------------------------------- |
| DB 상태 배너 | "Remote Database Connected — Ready for team collaboration" (녹색) |
| Join Code    | `CTX-2026-ABCD`                                                   |
| 프로젝트명   | ContextSync                                                       |
| Repo URL     | `github.com/OkyoKwon/contextSync`                                 |

**멤버 목록:**

| 아바타 | 이름        | 이메일                | 역할      |
| ------ | ----------- | --------------------- | --------- |
| 🔵 AK  | Alex Kim    | alex@contextsync.io   | **Owner** |
| 🟣 SC  | Sarah Chen  | sarah@contextsync.io  | Member    |
| 🟢 MP  | Marcus Park | marcus@contextsync.io | Member    |
| 🟡 ED  | Emily Davis | emily@contextsync.io  | Member    |
| 🔴 JL  | Jason Lee   | jason@contextsync.io  | Member    |
| 🩷 MT  | Mina Tanaka | mina@contextsync.io   | Member    |

**시각적 효과:**

- 6명 멤버 → 리스트가 충분히 채워짐
- 다양한 아바타 색상 → 시각적 구분
- Owner 뱃지 1개 + Member 5개 → 역할 구분 명확
- Join Code + Remote DB 연결 → 팀 기능의 완성도 시연

---

### 5.13 seed-marketing 수정 범위 요약

| 파일                      | 수정 내용                                              |
| ------------------------- | ------------------------------------------------------ |
| `seed-users.ts`           | Jason Lee, Mina Tanaka 2명 추가 + 아바타 URL 설정      |
| `seed-sessions.ts`        | 12 → 18 세션 확장 + 브랜치명/태그 다양화 + 메시지 보강 |
| `seed-conflicts.ts`       | 4 → 7 충돌 확장 + severity/status 균등 분포            |
| `seed-prd.ts`             | 7 → 10 분석 확장 + 16개 요구사항 + 카테고리 6종        |
| `seed-evaluation.ts`      | 1명 → 4명 평가 + 등급 다양화                           |
| `seed-activity.ts`        | 10 → 15 활동 로그 확장 + 6명 분산                      |
| **신규** `seed-plans.ts`  | Plan 3개 + 마크다운 콘텐츠                             |
| **신규** `seed-tokens.ts` | 일별 토큰 사용량 + 모델별 분류 데이터                  |
| `index.ts`                | 신규 seed 파일 오케스트레이션 추가                     |

---

### 5.14 촬영 시 화면별 데이터 체크리스트

스크린샷 촬영 전 각 화면에서 다음이 보이는지 확인:

| 스크린샷                   | 필수 확인 요소                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `dashboard-full.png`       | ✅ 4개 통계 카드 (숫자 0이 아님) ✅ Timeline 3~5행 (다양한 아바타) ✅ 세션 목록 좌측 패널 |
| `dashboard-stats.png`      | ✅ 토큰 총량 "2.47M" ✅ 모델 3종 테이블 ✅ 일별 차트 7일 (주말 골짜기) ✅ Pro 플랜 뱃지   |
| `session-conversation.png` | ✅ 한국어 프롬프트 ✅ 코드 블록 (구문 강조) ✅ 토큰 카운트 ✅ 모델명 표시                 |
| `session-detail.png`       | ✅ 브랜치명 ✅ 파일 경로 태그 5개+ ✅ 메타데이터 (사용자, 날짜, 소스)                     |
| `conflicts-list.png`       | ✅ critical 빨강 2개 ✅ warning 노랑 3개 ✅ info 파랑 2개 ✅ 다양한 상태 뱃지             |
| `conflict-detail.png`      | ✅ 세션 A↔B 비교 ✅ 겹치는 파일 2개+ ✅ 리뷰어 할당 상태                                  |
| `prd-analysis.png`         | ✅ 82% 녹색 달성률 ✅ +4% delta 화살표 ✅ 16개 요구사항 목록 ✅ 카테고리 뱃지 6색         |
| `prd-trend-chart.png`      | ✅ 10일 상승 곡선 (38→82%) ✅ 날짜 X축 라벨 ✅ 포인트 마커                                |
| `search-overlay.png`       | ✅ 검색어 입력 상태 ✅ 6개+ 결과 ✅ 하이라이트 텍스트 ✅ 결과 타입 아이콘                 |
| `settings-team.png`        | ✅ 녹색 DB 연결 배너 ✅ Join Code 표시 ✅ 6명 멤버 리스트 ✅ Owner 뱃지                   |
| `ai-evaluation.png`        | ✅ 4명 카드 그리드 ✅ 점수 바 색상 다양 ✅ Expert~Developing 등급 ✅ 5차원 바 차트        |
| `token-usage-chart.png`    | ✅ 일별 막대 차트 ✅ 모델별 색상 구분 ✅ 오늘 바 하이라이트                               |
| `plans-view.png`           | ✅ 좌측 3개 Plan 목록 ✅ 우측 마크다운 렌더링 ✅ 체크리스트 ✅ 코드 블록                  |
| `admin-panel.png`          | ✅ DB 상태 ✅ 마이그레이션 목록 ✅ 시스템 설정                                            |

---

## 6. 교차 검수 결과

> 기획 내용을 실제 코드베이스와 대조하여 발견한 불일치/오류/보완 사항.

### 6.1 수정 필요 — 데모 데이터 오류

#### (A) 충돌 상태값 불일치

| 항목            | 기획서 값                        | 실제 코드                              | 비고                                                                                                                                     |
| --------------- | -------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| conflict status | `open`                           | `detected`                             | DB 기본값 `'detected'` (migration 006). 현재 seed-marketing도 `'open'` 사용 중이라 **seed 자체가 잘못됨**                                |
| conflict_type   | `file_overlap`, `module_overlap` | `file`, `design`, `dependency`, `plan` | `ConflictType` 타입 정의(`packages/shared/src/types/conflict.ts:25`). 현재 seed도 `file_overlap` 사용 중 — **seed 자체가 타입과 불일치** |

**조치**: seed-marketing 충돌 데이터와 기획서 모두 수정 필요

- `open` → `detected`
- `file_overlap` → `file`
- `module_overlap` → `dependency` 또는 `design` (의미에 맞게)

#### (B) 활동 로그 액션 타입 불일치

| 항목                   | 기획서/현재 seed 값 | 실제 TypeScript 타입           |
| ---------------------- | ------------------- | ------------------------------ |
| `session.created`      | dot notation        | `session_created` (underscore) |
| `session.completed`    | dot notation        | `session_completed`            |
| `conflict.detected`    | dot notation        | `conflict_detected`            |
| `conflict.resolved`    | dot notation        | `conflict_resolved`            |
| `session.synced`       | dot notation        | **타입에 존재하지 않음**       |
| `prd.analyzed`         | dot notation        | **타입에 존재하지 않음**       |
| `evaluation.completed` | dot notation        | **타입에 존재하지 않음**       |
| `conflict.reviewing`   | dot notation        | **타입에 존재하지 않음**       |

**유효 액션 타입** (`packages/shared/src/types/activity.ts`):
`session_created` | `session_completed` | `conflict_detected` | `conflict_resolved` | `collaborator_added` | `collaborator_removed` | `collaborator_joined` | `directory_updated`

**조치**:

- activity_log 컬럼은 varchar (free-form)이라 DB 삽입은 되지만, 타입 안전성 위반
- 기획서의 활동 피드(5.9)를 유효 타입으로 수정하거나, 먼저 `ActivityAction` 타입을 확장하여 `prd_analyzed`, `evaluation_completed` 등 추가

#### (C) Plans 데이터 — 파일 기반이므로 seed 방식 변경 필요

**기획서**: `seed-plans.ts`로 DB에 Plan 삽입
**실제**: Plans는 로컬 파일 시스템(`~/.claude/plans/*.md`)에서 읽음. DB에 plans 테이블 없음.

**조치**:

- `seed-plans.ts` → 로컬 `~/.claude/plans/` 디렉토리에 마크다운 파일을 생성하는 스크립트로 변경
- 스크린샷 촬영 환경에서만 해당 파일 존재하면 됨 (seed:marketing 실행 시 파일 생성)

#### (D) 토큰 데이터 — 별도 seed 불필요

**기획서**: `seed-tokens.ts` 신규 생성
**실제**: 토큰 통계는 `messages.tokens_used` + `messages.model_used` 집계로 산출 (`token-usage.repository.ts`)

**조치**:

- `seed-tokens.ts` 삭제 — 별도 테이블이 없으므로 불필요
- 대신 `seed-sessions.ts`에서 메시지 데이터에 `tokens_used`와 `model_used` 값을 충분히 다양하게 설정
- 모델 3종(sonnet/opus/haiku) 분포 + 일별 토큰 총량이 기획(5.7)에 맞도록 메시지 토큰 값 조정

---

### 6.2 수정 필요 — 기획서 기술 오류

| 위치            | 오류                                  | 수정                                 |
| --------------- | ------------------------------------- | ------------------------------------ |
| 5.4 충돌 테이블 | status `open` 사용                    | → `detected`                         |
| 5.4 충돌 테이블 | type `file_overlap`, `module_overlap` | → `file`, `dependency` 등            |
| 5.9 활동 피드   | dot notation 액션명                   | → underscore notation 또는 타입 확장 |
| 5.13 수정 범위  | `seed-tokens.ts` 신규                 | → 삭제 (메시지 데이터로 대체)        |
| 5.13 수정 범위  | `seed-plans.ts` — DB 삽입             | → 로컬 파일 생성 방식으로 변경       |
| 4. Phase 1      | "시드 데이터로 자연스러운 화면 구성"  | → `pnpm seed:marketing` 명시         |

---

### 6.3 확인 완료 — 정합성 검증 통과 항목

| 검증 항목                                               | 결과     | 근거                               |
| ------------------------------------------------------- | -------- | ---------------------------------- |
| FeatureSection 스크린샷 배열 (8개, [4]=null)            | **정확** | `FeatureSection.tsx:30-39`         |
| FeatureShowcase 3개 피처 (session/conflicts/prd)        | **정확** | `FeatureShowcase.tsx:16-56`        |
| GettingStartedSection 4 steps, 3 screenshots            | **정확** | `GettingStartedSection.tsx:21-38`  |
| i18n 번역 키 7개 존재 (en/ko/ja)                        | **정확** | `en.ts:195-201`                    |
| 충돌 severity 3종 (info/warning/critical)               | **정확** | `conflict-severity.ts:2`           |
| 충돌 status 4종 (detected/reviewing/resolved/dismissed) | **정확** | `conflict-severity.ts:3`           |
| AI 평가 등급 5종 (novice~expert)                        | **정확** | `ai-evaluation.ts:3-9`             |
| 세션 소스 4종 (claude_code/claude_ai/api/manual)        | **정확** | `session-status.ts:1`              |
| seed-marketing 오케스트레이션 8파일                     | **정확** | `seed-marketing/index.ts:1-42`     |
| Sidebar 로고 hardcoded `/logo.png`                      | **확인** | `Sidebar.tsx:87` — assetUrl 미사용 |
| README 이미지 경로 4개                                  | **정확** | `README.md:19,41,47,53`            |

---

### 6.4 추가 발견 — 기획서에 누락된 사항

| 항목                           | 설명                                                                                                       | 권장 조치                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Sidebar 로고 경로              | `/logo.png` hardcoded — `assetUrl()` 미사용                                                                | Phase 4에서 `assetUrl('/logo.png')` 으로 통일         |
| 프로젝트 2개 기획              | Design System 프로젝트 추가했으나 seed-marketing에는 `seed-project.ts` + `seed-collaborators.ts` 별도 존재 | 2번째 프로젝트 삽입 로직 필요 (seed-project.ts 수정)  |
| `dismissed` 상태 충돌          | 기획서에 dismissed 충돌 없음 — 4종 status 중 1종 미노출                                                    | 7개 충돌 중 1개를 dismissed로 변경하여 모든 상태 표시 |
| `token-usage-chart.png` 사용처 | public에 복사한다고 했으나 어느 컴포넌트에서 참조할지 미정                                                 | FeatureSection 또는 README에 배치 위치 확정 필요      |

---

## 7. 이미지 사용처 매핑 (교체 시 참조)

```
dashboard-full.png
├── README.md (line 19)
├── LandingHero.tsx (line 60)
└── GettingStartedSection.tsx (line 30, STEP_CONFIGS[2])

session-conversation.png
├── README.md (line 41)
├── FeatureShowcase.tsx (line 27, HERO_FEATURES[0])
├── docs/FeatureSection.tsx (line 31, FEATURE_SCREENSHOTS[0])
└── docs/GettingStartedSection.tsx (line 25, STEP_CONFIGS[1])

conflicts-list.png
├── README.md (line 47)
├── FeatureShowcase.tsx (line 40, HERO_FEATURES[1])
└── docs/FeatureSection.tsx (line 32, FEATURE_SCREENSHOTS[1])

dashboard-stats.png
└── README.md (line 53)

prd-analysis.png
├── FeatureShowcase.tsx (line 53, HERO_FEATURES[2])
└── docs/FeatureSection.tsx (line 34, FEATURE_SCREENSHOTS[3])

search-overlay.png
└── docs/FeatureSection.tsx (line 36, FEATURE_SCREENSHOTS[5])

settings-team.png
├── docs/FeatureSection.tsx (line 37, FEATURE_SCREENSHOTS[6])
└── docs/GettingStartedSection.tsx (line 35, STEP_CONFIGS[3])

ai-evaluation.png
└── docs/FeatureSection.tsx (line 38, FEATURE_SCREENSHOTS[7])

session-detail.png     → public/screenshots/ (미사용)
conflict-detail.png    → public/screenshots/ (미사용)
prd-trend-chart.png    → public/screenshots/ (미사용)
token-usage-chart.png  → imageAsset/screenshots/ only (public 미복사)
plans-view.png         → imageAsset/optional/ (미사용)
admin-panel.png        → imageAsset/optional/ (미사용)
```

---

## 8. 체크리스트 (교차 검수 반영)

### 사전 수정 (교차 검수 발견 사항)

- [ ] `seed-conflicts.ts` — status `open` → `detected`, type `file_overlap` → `file`
- [ ] `seed-activity.ts` — dot notation → underscore notation (또는 ActivityAction 타입 확장)
- [ ] `seed-plans.ts` — DB 삽입이 아닌 `~/.claude/plans/` 파일 생성 방식으로 설계
- [ ] `seed-tokens.ts` 계획 삭제 — 메시지 tokens_used/model_used로 대체
- [ ] 기획서 5.4 충돌 테이블 — dismissed 상태 1개 추가 (모든 status 커버)
- [ ] 기획서 5.13 — seed-tokens.ts 항목 삭제, seed-plans.ts 방식 변경 반영

### 데모 데이터 구현

- [ ] `seed-users.ts` — Jason Lee, Mina Tanaka 추가 + 아바타 URL
- [ ] `seed-project.ts` — Design System 프로젝트 추가 + 콜라보레이터 설정
- [ ] `seed-sessions.ts` — 12 → 18 세션 + 브랜치/태그 다양화 + 메시지 보강 (토큰/모델 분포)
- [ ] `seed-conflicts.ts` — 4 → 8 충돌 (dismissed 포함) + severity/status 균등 분포
- [ ] `seed-prd.ts` — 7 → 10 분석 + 16개 요구사항
- [ ] `seed-evaluation.ts` — 1명 → 4명 평가
- [ ] `seed-activity.ts` — 10 → 15 로그 + 6명 분산
- [ ] `seed-plans.ts` (신규) — `~/.claude/plans/` 마크다운 3개 파일 생성
- [ ] `seed-marketing/index.ts` — 새 seed 파일 오케스트레이션 추가

### 스크린샷 촬영

- [ ] dashboard-full.png
- [ ] dashboard-stats.png
- [ ] session-conversation.png
- [ ] session-detail.png
- [ ] conflicts-list.png
- [ ] conflict-detail.png
- [ ] prd-analysis.png
- [ ] prd-trend-chart.png
- [ ] search-overlay.png
- [ ] settings-team.png
- [ ] ai-evaluation.png
- [ ] token-usage-chart.png
- [ ] plans-view.png
- [ ] admin-panel.png

### 파일 배포

- [ ] imageAsset/screenshots/ 원본 교체 (14장)
- [ ] apps/web/public/screenshots/ 배포본 동기화
- [ ] token-usage-chart.png public에 복사
- [ ] plans-view.png, admin-panel.png optional → screenshots 이동

### 코드 수정

- [ ] `FeatureSection.tsx` — Plans 스크린샷 연결 (`FEATURE_SCREENSHOTS[4]`)
- [ ] i18n 번역 파일 (en/ko/ja) — Plans 스크린샷 alt 텍스트 키 추가
- [ ] `Sidebar.tsx:87` — `/logo.png` → `assetUrl('/logo.png')` 통일

### 문서 업데이트

- [ ] README.md — Roadmap 상태 뱃지, 최근 기능 추가
- [ ] docs/setup-guide.md — 한국어 텍스트 영어 통일
- [ ] docs/architecture.md — 모듈/마이그레이션 최신화 확인
- [ ] docs/E2E_TC.md — 최근 TC 반영 확인

### 검증

- [ ] `pnpm seed:marketing` 실행 후 에러 없이 완료
- [ ] 랜딩 페이지 — 모든 스크린샷 정상 로드 확인
- [ ] Docs 페이지 — 모든 스크린샷 정상 로드 + Plans 스크린샷 표시
- [ ] README — GitHub에서 이미지 정상 표시 확인
- [ ] 라이트/다크 모드 전환 시 이미지 일관성 확인
- [ ] `pnpm typecheck` — 타입 에러 없음

---

## 9. 실행/구현 계획 (Step-by-Step)

> Phase 0 → 1 → 2 → 3 → 4 순서로 진행. 각 Phase 내 Step은 순차 실행.
> 예상 작업 단위를 세분화하여 각 Step이 독립적으로 검증 가능하도록 구성.

---

### Phase 0: 사전 정비 — 교차 검수 발견 사항 수정

> **목적**: seed 데이터의 타입 정합성 확보 + 기획서 오류 반영
> **선행 조건**: 없음
> **검증**: `pnpm typecheck` 통과

#### Step 0-1: ActivityAction 타입 확장

**파일**: `packages/shared/src/types/activity.ts`

```typescript
// 추가할 액션 타입
| 'session_synced'
| 'prd_analyzed'
| 'evaluation_completed'
```

- 기존 8종 → 11종으로 확장
- 이 타입들은 활동 피드에서 표시되는 실제 이벤트이므로 타입에 포함되어야 함

#### Step 0-2: 기존 seed-marketing 충돌 데이터 타입 수정

**파일**: `apps/api/src/database/seed-marketing/seed-conflicts.ts`

| 현재 값                           | 수정 값                       |
| --------------------------------- | ----------------------------- |
| `conflict_type: 'file_overlap'`   | `conflict_type: 'file'`       |
| `conflict_type: 'module_overlap'` | `conflict_type: 'dependency'` |
| `status: 'open'`                  | `status: 'detected'`          |

#### Step 0-3: 기존 seed-marketing 활동 로그 액션명 수정

**파일**: `apps/api/src/database/seed-marketing/seed-activity.ts`

| 현재 값               | 수정 값               |
| --------------------- | --------------------- |
| `'session.created'`   | `'session_created'`   |
| `'session.completed'` | `'session_completed'` |
| `'conflict.detected'` | `'conflict_detected'` |
| `'conflict.resolved'` | `'conflict_resolved'` |
| `'session.synced'`    | `'session_synced'`    |
| `'prd.analyzed'`      | `'prd_analyzed'`      |

#### Step 0-4: 검증

```bash
pnpm typecheck
pnpm seed:marketing   # 기존 데이터로 정상 동작 확인
```

---

### Phase 1: 데모 데이터 보강 — seed-marketing 확장

> **목적**: 스크린샷 촬영 시 모든 화면이 풍성하게 보이도록 데이터 볼륨 확대
> **선행 조건**: Phase 0 완료
> **검증**: `pnpm seed:marketing` 후 각 화면에서 데이터 노출 확인

#### Step 1-1: 사용자 2명 추가

**파일**: `apps/api/src/database/seed-marketing/seed-users.ts`

**변경 사항**:

- Jason Lee (`jason@contextsync.io`) 추가 — avatar_url 설정
- Mina Tanaka (`mina@contextsync.io`) 추가 — avatar_url 설정
- 기존 4명 사용자에도 avatar_url 설정 (현재 null이면)

**검증**: DB에서 users 테이블 6행 확인

#### Step 1-2: 프로젝트 추가 + 콜라보레이터 설정

**파일**: `apps/api/src/database/seed-marketing/seed-project.ts` (또는 별도 분리)

**변경 사항**:

- "Design System" 프로젝트 추가 (`database_mode: 'local'`)
- ContextSync 프로젝트에 Jason, Mina 콜라보레이터 추가
- Design System 프로젝트에 Mina(owner), Sarah, Emily 콜라보레이터 추가

**파일**: `apps/api/src/database/seed-marketing/seed-collaborators.ts` (기존 파일 수정)

#### Step 1-3: 세션 18개로 확장

**파일**: `apps/api/src/database/seed-marketing/seed-sessions.ts`

**변경 사항**:

- 기존 12 세션 유지 + 6 세션 추가 (기획서 5.2 #12~#18)
- 모든 세션에 `branch` 필드 추가
- 메시지 데이터 보강:
  - `model_used` 3종 분포: sonnet 65%, opus 22%, haiku 13%
  - `tokens_used` 값을 일별 합계가 기획서 5.7 차트와 일치하도록 조정
  - Session #5(PRD)에 기획서 5.3의 6개 메시지 상세 내용 반영
- 태그 다양화: 세션별 2~3개 태그

**파일 크기 예상**: 현재 ~300줄 → ~550줄

#### Step 1-4: 충돌 8개로 확장

**파일**: `apps/api/src/database/seed-marketing/seed-conflicts.ts`

**변경 사항**:

- 기존 4개 수정 (Step 0-2에서 타입 수정 완료) + 4개 추가
- 최종 분포:
  - severity: critical(2) / warning(3) / info(2) / _(1개는 아무거나)_
  - status: detected(2) / reviewing(2) / resolved(2) / **dismissed(1)** / _(1개 자유)_
- 기획서 5.4의 #5~#7 + dismissed 1개 추가

#### Step 1-5: PRD 분석 10회로 확장

**파일**: `apps/api/src/database/seed-marketing/seed-prd.ts`

**변경 사항**:

- 기존 7회 → 10회 (기획서 5.5 테이블)
- 요구사항 12개 → 16개 (6개 카테고리)
- 각 요구사항에 `confidence` 값 분포 (22%~97%)

#### Step 1-6: AI 평가 4명으로 확장

**파일**: `apps/api/src/database/seed-marketing/seed-evaluation.ts`

**변경 사항**:

- Alex(Expert) 기존 데이터 유지 + 점수 미세 조정
- Sarah(Advanced), Emily(Proficient), Jason(Developing) 3명 추가
- 각 평가에 5차원 상세 + strengths/weaknesses/suggestions
- evidence 데이터 평가별 1~2개

#### Step 1-7: 활동 로그 15개로 확장

**파일**: `apps/api/src/database/seed-marketing/seed-activity.ts`

**변경 사항**:

- 기존 10개 → 15개 (기획서 5.9 기반)
- 6명 사용자 고루 분포
- 새 액션 타입 반영: `session_synced`, `prd_analyzed`, `evaluation_completed`
- users/sessions 배열 인덱스를 6명/18세션 기준으로 업데이트

#### Step 1-8: Plans 로컬 파일 생성

**파일**: `apps/api/src/database/seed-marketing/seed-plans.ts` (신규)

**변경 사항**:

- `~/.claude/plans/` 디렉토리 생성 (없으면)
- 3개 마크다운 파일 작성:
  - `authentication-v2.md` (4.2 KB)
  - `conflict-detection-improvements.md` (3.8 KB)
  - `design-system-migration.md` (2.9 KB)
- 각 파일에 기획서 5.11의 마크다운 콘텐츠

**파일**: `apps/api/src/database/seed-marketing/index.ts`

- `seed-plans.js` import 및 실행 추가

#### Step 1-9: 검증

```bash
# DB 초기화 + 마케팅 시드 실행
pnpm seed:marketing

# 검증
pnpm dev
# → http://localhost:5173 접속
# → Alex Kim 로그인
# → 각 화면 데이터 확인 (체크리스트 5.14 참조)
```

---

### Phase 2: 스크린샷 촬영 및 에셋 교체

> **목적**: 보강된 데모 데이터로 14장 최신 스크린샷 촬영
> **선행 조건**: Phase 1 검증 완료
> **검증**: 모든 이미지가 사용처에서 정상 로드

#### Step 2-1: 촬영 환경 준비

```bash
pnpm seed:marketing    # 데모 데이터 로드
pnpm dev               # 서버 기동
```

- 브라우저: Chrome, 창 크기 1440×900 (Retina 2x → 실제 2880×1800)
- 테마: 다크 모드
- 로그인: Alex Kim

#### Step 2-2: 14장 촬영 (기획서 2.2 + 5.14 체크리스트 참조)

촬영 순서 (화면 이동 최소화):

| 순서 | 화면          | 파일명                     | 네비게이션                                  |
| ---- | ------------- | -------------------------- | ------------------------------------------- |
| 1    | 대시보드 전체 | `dashboard-full.png`       | `/project` (초기 화면)                      |
| 2    | 대시보드 통계 | `dashboard-stats.png`      | 같은 페이지 스크롤 다운                     |
| 3    | 세션 대화     | `session-conversation.png` | Session #5 (PRD) 클릭                       |
| 4    | 세션 상세     | `session-detail.png`       | Session #1 (JWT Auth) 클릭 — 파일 태그 많음 |
| 5    | 충돌 목록     | `conflicts-list.png`       | `/conflicts` 이동                           |
| 6    | 충돌 상세     | `conflict-detail.png`      | Critical 충돌 #2 클릭                       |
| 7    | PRD 분석      | `prd-analysis.png`         | `/prd-analysis` 이동                        |
| 8    | PRD 트렌드    | `prd-trend-chart.png`      | 같은 페이지 차트 영역                       |
| 9    | 검색 오버레이 | `search-overlay.png`       | Cmd+K → "authentication" 입력               |
| 10   | AI 평가       | `ai-evaluation.png`        | `/ai-evaluation` 이동                       |
| 11   | 토큰 차트     | `token-usage-chart.png`    | 대시보드 토큰 패널 확대                     |
| 12   | Plans 뷰      | `plans-view.png`           | `/plans` 이동                               |
| 13   | 팀 설정       | `settings-team.png`        | `/settings` → Team 탭                       |
| 14   | Admin 패널    | `admin-panel.png`          | `/admin` 이동                               |

#### Step 2-3: 에셋 파일 배포

```bash
# 원본 보관
cp -r <촬영폴더>/*.png imageAsset/screenshots/

# optional → screenshots 이동
mv imageAsset/optional/plans-view.png imageAsset/screenshots/
mv imageAsset/optional/admin-panel.png imageAsset/screenshots/

# public 배포
cp imageAsset/screenshots/*.png apps/web/public/screenshots/

# token-usage-chart.png 누락분 복사 확인
ls apps/web/public/screenshots/token-usage-chart.png
```

#### Step 2-4: 검증

```bash
pnpm dev
# 랜딩 페이지: dashboard-full, session-conversation, conflicts-list, prd-analysis 로드 확인
# Docs 페이지: 8개 feature 스크린샷 + Getting Started 3개 스크린샷 로드 확인
# 라이트 모드 전환 후 이미지 이상 없는지 확인
```

---

### Phase 3: 코드 수정 — 스크린샷 연결 + 문서 업데이트

> **목적**: 신규 스크린샷 코드 연결 + README/Docs 콘텐츠 최신화
> **선행 조건**: Phase 2 완료
> **검증**: 모든 페이지에서 이미지 정상 표시 + 빌드 성공

#### Step 3-1: FeatureSection Plans 스크린샷 연결

**파일**: `apps/web/src/components/docs/FeatureSection.tsx`

```typescript
// Line 35: null → plans-view.png
FEATURE_SCREENSHOTS[4] = assetUrl('/screenshots/plans-view.png');

// Line 46: null → alt key
FEATURE_SCREENSHOT_ALT_KEYS[4] = 'screenshot.alt.plansView';
```

**파일**: `apps/web/src/i18n/translations/en.ts`

```typescript
'screenshot.alt.plansView': 'Plans view showing markdown documents linked to projects'
```

**파일**: `apps/web/src/i18n/translations/ko.ts`

```typescript
'screenshot.alt.plansView': '프로젝트에 연결된 마크다운 계획 문서 뷰'
```

**파일**: `apps/web/src/i18n/translations/ja.ts`

```typescript
'screenshot.alt.plansView': 'プロジェクトにリンクされたマークダウン計画ドキュメントビュー'
```

#### Step 3-2: Sidebar 로고 경로 통일

**파일**: `apps/web/src/components/layout/Sidebar.tsx:87`

```typescript
// Before:
<img src="/logo.png" ...>
// After:
<img src={assetUrl('/logo.png')} ...>
```

- `assetUrl` import 추가

#### Step 3-3: README.md 업데이트

**파일**: `README.md`

1. **Roadmap 상태 뱃지**:

```markdown
- [ ] 📋 Session export (JSON, CSV)
- [ ] 🔄 GitHub integration (link sessions to PRs/issues)
- [ ] 📋 Real-time collaboration (WebSocket-based live sync)
      ...
```

2. **최근 기능 추가** ("More features" 테이블):

```markdown
| **Local Auto-Sync** | Automatic background sync of local Claude sessions to dashboard |
| **Dual-DB Routing** | Local + remote database for seamless team collaboration |
```

3. **Project Site 링크 확인**: GitHub Pages 동작 여부 체크

#### Step 3-4: docs/setup-guide.md 한국어 텍스트 수정

**파일**: `docs/setup-guide.md:193`

- 한국어 텍스트를 영어로 번역
- `pnpm bootstrap` 참조를 `bash scripts/setup.sh`로 수정

#### Step 3-5: 검증

```bash
pnpm typecheck        # 타입 에러 없음
pnpm build            # 빌드 성공
pnpm dev              # 각 페이지 확인
```

---

### Phase 4: 기타 문서 정비 + 최종 검증

> **목적**: 나머지 LOW 우선순위 문서 최신화 + 전체 QA
> **선행 조건**: Phase 3 완료

#### Step 4-1: docs/architecture.md 최신화 확인

- 모듈 목록 15개 → 현재 실제 모듈 수와 비교
- 마이그레이션 27개 → 현재 실제 마이그레이션 수와 비교
- 불일치 시 업데이트

#### Step 4-2: docs/design-system.md 컴포넌트 확인

- 컴포넌트 카탈로그 19개 → 현재 `apps/web/src/components/ui/` 실제 파일과 비교
- 신규 컴포넌트(BrowserFrame, ScreenshotImage 등) 누락 시 추가

#### Step 4-3: docs/E2E_TC.md 최근 TC 반영

- 최근 커밋 `390f5f5` (local session file sync E2E) 등의 테스트 케이스 반영 여부 확인
- 누락 시 해당 TC 추가

#### Step 4-4: 최종 검증 체크리스트

```bash
# 빌드 & 타입
pnpm typecheck
pnpm build
pnpm test

# 시드 데이터
pnpm seed:marketing   # 에러 없이 완료

# 시각 검증 (수동)
pnpm dev
```

| 검증 항목            | URL                | 확인 사항                             |
| -------------------- | ------------------ | ------------------------------------- |
| 랜딩 히어로          | `/`                | dashboard-full.png 로드, 3D 호버 정상 |
| 랜딩 Feature         | `/` → Features     | 3장 스크린샷 로드 + 텍스트 일치       |
| Docs Getting Started | `/docs`            | 3 steps 스크린샷 + 라이트박스 동작    |
| Docs Features        | `/docs` → Features | **8장 전부** 로드 (Plans 포함)        |
| README (GitHub)      | GitHub repo 페이지 | 4장 이미지 정상 표시                  |
| 다크/라이트 전환     | 전 페이지          | 이미지 대비/가독성 이상 없음          |

#### Step 4-5: 커밋 및 PR

```bash
git add imageAsset/ apps/web/public/screenshots/
git add apps/api/src/database/seed-marketing/
git add apps/web/src/components/docs/FeatureSection.tsx
git add apps/web/src/components/layout/Sidebar.tsx
git add apps/web/src/i18n/translations/
git add packages/shared/src/types/activity.ts
git add README.md docs/

git commit -m "docs: 스크린샷 전면 교체 + 데모 데이터 보강 + 문서 최신화"
```

---

## 10. 일정 및 의존성

```
Phase 0 (사전 정비)
  └─ Step 0-1~0-4: 타입 수정 + seed 타입 정합성
       │
Phase 1 (데모 데이터)
  ├─ Step 1-1 (users) ─┐
  ├─ Step 1-2 (project) ┤ ← 순차 (users → project → sessions)
  ├─ Step 1-3 (sessions)┘
  ├─ Step 1-4 (conflicts) ← sessions 완료 후
  ├─ Step 1-5 (prd) ← 독립
  ├─ Step 1-6 (evaluation) ← sessions 완료 후
  ├─ Step 1-7 (activity) ← users + sessions 완료 후
  ├─ Step 1-8 (plans) ← 독립 (파일 시스템)
  └─ Step 1-9 (검증)
       │
Phase 2 (스크린샷)
  ├─ Step 2-1 (환경 준비)
  ├─ Step 2-2 (촬영 14장) ← 수동 작업
  ├─ Step 2-3 (파일 배포)
  └─ Step 2-4 (검증)
       │
Phase 3 (코드 + 문서)
  ├─ Step 3-1 (FeatureSection) ─┐
  ├─ Step 3-2 (Sidebar) ────────┤ ← 병렬 가능
  ├─ Step 3-3 (README) ─────────┤
  ├─ Step 3-4 (setup-guide) ────┘
  └─ Step 3-5 (검증)
       │
Phase 4 (정비 + QA)
  ├─ Step 4-1~4-3 ← 병렬 가능
  ├─ Step 4-4 (최종 검증)
  └─ Step 4-5 (커밋)
```

**병렬 실행 가능 구간**:

- Phase 1: Step 1-4/1-5/1-8 독립 실행 가능
- Phase 3: Step 3-1~3-4 모두 병렬 가능
- Phase 4: Step 4-1~4-3 병렬 가능
