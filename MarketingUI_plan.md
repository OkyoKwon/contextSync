# MarketingUI Plan — ContextSync 시각 자산 & 배치 기획

## 목차

1. [캡쳐 대상 화면 목록](#1-캡쳐-대상-화면-목록)
2. [데모 데이터 기획](#2-데모-데이터-기획)
3. [이미지 파일 명세](#3-이미지-파일-명세)
4. [배치 계획: Landing Page](#4-배치-계획-landing-page)
5. [배치 계획: README.md](#5-배치-계획-readmemd)
6. [배치 계획: Docs Page](#6-배치-계획-docs-page)
7. [캡쳐 실행 방법](#7-캡쳐-실행-방법)

---

## 1. 캡쳐 대상 화면 목록

총 **12개 핵심 화면**을 캡쳐합니다. 각 화면은 특정 기능의 가치를 시각적으로 전달하는 역할을 합니다.

| #   | 화면                          | 파일명                     | 용도                       | 뷰포트          |
| --- | ----------------------------- | -------------------------- | -------------------------- | --------------- |
| 01  | **Dashboard (풀뷰)**          | `dashboard-full.png`       | 히어로 이미지, README 메인 | 1440×900        |
| 02  | **Dashboard 통계 카드**       | `dashboard-stats.png`      | 기능 소개 (Analytics)      | 1440×900 (크롭) |
| 03  | **Token Usage 차트**          | `token-usage-chart.png`    | 비용 분석 기능 강조        | 800×500 (크롭)  |
| 04  | **세션 목록 + 대화 뷰**       | `session-conversation.png` | 세션 아카이브 기능         | 1440×900        |
| 05  | **세션 상세 (메시지 스레드)** | `session-detail.png`       | 대화 검색/열람 기능        | 1440×900        |
| 06  | **충돌 감지 목록**            | `conflicts-list.png`       | 충돌 감지 기능             | 1440×900        |
| 07  | **충돌 상세 뷰**              | `conflict-detail.png`      | 충돌 심각도/파일 오버랩    | 1440×900        |
| 08  | **PRD 분석 대시보드**         | `prd-analysis.png`         | PRD 달성률 추적            | 1440×900        |
| 09  | **PRD 트렌드 차트**           | `prd-trend-chart.png`      | 트렌드 시각화              | 800×500 (크롭)  |
| 10  | **전체 텍스트 검색**          | `search-overlay.png`       | 검색 기능                  | 1440×900        |
| 11  | **Settings (팀 협업)**        | `settings-team.png`        | 팀 관리/초대 기능          | 1440×900        |
| 12  | **AI 평가 대시보드**          | `ai-evaluation.png`        | AI 활용도 평가             | 1440×900        |

### 추가 캡쳐 (선택)

| #   | 화면                      | 파일명                 | 용도                       |
| --- | ------------------------- | ---------------------- | -------------------------- |
| 13  | **Admin 페이지**          | `admin-panel.png`      | DB 헬스/마이그레이션 상태  |
| 14  | **Plans 페이지**          | `plans-view.png`       | 마크다운 플랜 뷰어         |
| 15  | **온보딩 위저드**         | `onboarding.png`       | 첫 사용 경험               |
| 16  | **모바일 뷰 (Dashboard)** | `mobile-dashboard.png` | 반응형 지원 강조 (390×844) |

---

## 2. 데모 데이터 기획

캡쳐 시 실제 서비스처럼 보이는 풍부한 데모 데이터가 필요합니다. 기존 `seed.ts`를 확장한 **마케팅용 시드 스크립트**를 작성합니다.

### 2.1 프로젝트

```
프로젝트명: "ContextSync"
설명: "AI session context management platform"
Repo URL: "https://github.com/contextsync/contextsync"
```

### 2.2 팀 멤버 (4명)

| 이름        | 이메일                | 역할   | 아바타    |
| ----------- | --------------------- | ------ | --------- |
| Alex Kim    | alex@contextsync.io   | Owner  | 이니셜 AK |
| Sarah Chen  | sarah@contextsync.io  | Admin  | 이니셜 SC |
| Marcus Park | marcus@contextsync.io | Member | 이니셜 MP |
| Emily Davis | emily@contextsync.io  | Member | 이니셜 ED |

### 2.3 세션 데이터 (12개)

풍부한 대화와 다양한 상태를 보여주기 위해 현실적인 세션을 구성합니다:

| #   | 작성자 | 제목                                       | 상태      | 브랜치              | 파일                                              | 태그                |
| --- | ------ | ------------------------------------------ | --------- | ------------------- | ------------------------------------------------- | ------------------- |
| 1   | Alex   | `feat: Implement JWT authentication flow`  | completed | feat/auth           | auth/login.ts, auth/middleware.ts, routes/auth.ts | auth, feature       |
| 2   | Sarah  | `feat: Add real-time conflict detection`   | completed | feat/conflicts      | conflicts/detector.ts, conflicts/resolver.ts      | conflicts, feature  |
| 3   | Marcus | `fix: Resolve database connection pooling` | completed | fix/db-pool         | database/client.ts, config/database.ts            | database, bugfix    |
| 4   | Emily  | `refactor: Extract validation utilities`   | completed | refactor/validation | utils/validate.ts, schemas/user.ts                | refactor, utils     |
| 5   | Alex   | `feat: PRD analysis with Claude API`       | completed | feat/prd            | prd/analyzer.ts, prd/dashboard.ts                 | prd, ai             |
| 6   | Sarah  | `feat: Full-text search with tsvector`     | completed | feat/search         | search/index.ts, database/migrations/012.ts       | search, feature     |
| 7   | Marcus | `feat: Team invitation & role management`  | active    | feat/team           | team/invite.ts, team/roles.ts                     | team, collaboration |
| 8   | Alex   | `refactor: Migrate to Fastify 5`           | completed | refactor/fastify5   | app.ts, plugins/_.ts, routes/_.ts                 | refactor, migration |
| 9   | Emily  | `fix: Session sync race condition`         | active    | fix/sync-race       | sync/manager.ts, sync/queue.ts                    | sync, bugfix        |
| 10  | Sarah  | `feat: Token usage analytics dashboard`    | completed | feat/analytics      | dashboard/charts.ts, dashboard/stats.ts           | analytics, feature  |
| 11  | Marcus | `docs: API endpoint documentation`         | completed | docs/api            | docs/openapi.yaml                                 | docs                |
| 12  | Alex   | `feat: AI evaluation scoring system`       | active    | feat/ai-eval        | evaluation/scorer.ts, evaluation/dimensions.ts    | ai, evaluation      |

### 2.4 메시지 데이터

각 세션에 **4~8개 메시지**를 포함시켜 현실적인 대화 흐름을 보여줍니다.

**세션 1 (JWT Auth) 예시 메시지:**

```
[human] JWT 인증 플로우를 구현해야 합니다. 로그인, 토큰 갱신, 미들웨어를 포함해주세요.
[assistant] (claude-sonnet-4) JWT 인증을 구현하겠습니다. 먼저 auth 모듈 구조를 설계합니다... [1,250 tokens]
[human] 리프레시 토큰도 필요합니다. Redis에 저장하는 방식으로 해주세요.
[assistant] (claude-sonnet-4) 리프레시 토큰 로테이션 전략을 추가합니다... [2,100 tokens]
[human] 테스트 코드도 작성해주세요.
[assistant] (claude-sonnet-4) Vitest로 단위 테스트와 통합 테스트를 작성합니다... [1,800 tokens]
```

### 2.5 충돌 데이터 (4개)

| Session A  | Session B   | 타입           | 심각도   | 오버랩 파일           | 상태      |
| ---------- | ----------- | -------------- | -------- | --------------------- | --------- |
| #1 (Alex)  | #3 (Marcus) | file_overlap   | warning  | config/database.ts    | reviewing |
| #2 (Sarah) | #7 (Marcus) | file_overlap   | critical | conflicts/detector.ts | open      |
| #5 (Alex)  | #10 (Sarah) | module_overlap | info     | dashboard/stats.ts    | resolved  |
| #8 (Alex)  | #4 (Emily)  | file_overlap   | warning  | utils/validate.ts     | open      |

### 2.6 토큰 사용량 (7일간)

일별 토큰 사용량을 **모델별로 분리**하여 차트가 풍부하게 보이도록 합니다:

| 날짜 | claude-opus-4 | claude-sonnet-4 | claude-haiku-4 | 총합    |
| ---- | ------------- | --------------- | -------------- | ------- |
| 3/16 | 15,000        | 45,000          | 12,000         | 72,000  |
| 3/17 | 8,000         | 62,000          | 18,000         | 88,000  |
| 3/18 | 22,000        | 38,000          | 8,000          | 68,000  |
| 3/19 | 12,000        | 55,000          | 25,000         | 92,000  |
| 3/20 | 18,000        | 48,000          | 15,000         | 81,000  |
| 3/21 | 25,000        | 72,000          | 20,000         | 117,000 |
| 3/22 | 10,000        | 35,000          | 8,000          | 53,000  |

### 2.7 PRD 분석 데이터

```
PRD 문서명: "ContextSync v2.0 Requirements"
전체 달성률: 78%
요구사항 12개 (9개 달성, 2개 진행중, 1개 미시작)
트렌드: 7일간 45% → 62% → 68% → 71% → 74% → 76% → 78%
```

### 2.8 AI 평가 데이터

```
전체 점수: 82/100 (Advanced)
차원별 점수:
  - Context Utilization: 88/100
  - Code Quality: 85/100
  - Task Completion: 90/100
  - Communication: 78/100
  - Error Handling: 72/100
  - Architecture: 80/100
```

### 2.9 액티비티 로그 (최근 10건)

```
[3/22 14:30] Alex — session.created — "feat: AI evaluation scoring system"
[3/22 13:15] Sarah — conflict.detected — "conflicts/detector.ts overlap"
[3/22 11:00] Marcus — session.synced — "feat: Team invitation & role management"
[3/22 09:45] Emily — session.created — "fix: Session sync race condition"
[3/21 17:30] Alex — prd.analyzed — "ContextSync v2.0 Requirements"
[3/21 16:00] Sarah — session.completed — "feat: Token usage analytics dashboard"
[3/21 14:20] Alex — conflict.resolved — "dashboard/stats.ts overlap"
[3/21 11:00] Marcus — session.completed — "docs: API endpoint documentation"
[3/20 16:45] Emily — session.completed — "refactor: Extract validation utilities"
[3/20 15:00] Alex — session.completed — "refactor: Migrate to Fastify 5"
```

### 2.10 Hot Files (인기 파일)

```
1. src/config/database.ts — 4 sessions
2. src/auth/middleware.ts — 3 sessions
3. src/utils/validate.ts — 3 sessions
4. src/conflicts/detector.ts — 2 sessions
5. src/dashboard/stats.ts — 2 sessions
```

---

## 3. 이미지 파일 명세

모든 이미지는 `imageAsset/` 폴더에 저장합니다.

```
imageAsset/
├── screenshots/
│   ├── dashboard-full.png          # 1440×900  — 메인 히어로 이미지
│   ├── dashboard-stats.png         # 크롭      — 통계 카드 영역
│   ├── token-usage-chart.png       # 800×500   — 토큰 사용 차트
│   ├── session-conversation.png    # 1440×900  — 세션 목록 + 대화
│   ├── session-detail.png          # 1440×900  — 세션 상세 메시지
│   ├── conflicts-list.png          # 1440×900  — 충돌 목록
│   ├── conflict-detail.png         # 1440×900  — 충돌 상세
│   ├── prd-analysis.png            # 1440×900  — PRD 대시보드
│   ├── prd-trend-chart.png         # 800×500   — PRD 트렌드
│   ├── search-overlay.png          # 1440×900  — 검색 오버레이
│   ├── settings-team.png           # 1440×900  — 팀 설정
│   └── ai-evaluation.png           # 1440×900  — AI 평가
├── optional/
│   ├── admin-panel.png
│   ├── plans-view.png
│   ├── onboarding.png
│   └── mobile-dashboard.png        # 390×844
└── composites/
    ├── hero-mockup.png             # 대시보드 + 브라우저 프레임 합성
    └── feature-grid.png            # 3개 핵심 기능 나란히 배치 합성
```

### 이미지 품질 기준

- **해상도:** @2x (Retina) — 실제 캡쳐는 2880×1800으로 하여 1440×900 @2x 제공
- **포맷:** PNG (스크린샷), WebP (웹 최적화 버전 별도 생성)
- **다크 테마:** 기본 다크 모드로 캡쳐 (프로젝트 기본값)
- **브라우저 크롬:** 제거 — 앱 콘텐츠만 캡쳐

---

## 4. 배치 계획: Landing Page

### 4.1 Hero 섹션 (`LandingHero.tsx`)

현재: ASCII 아트 + 텍스트만 존재
**추가:** CTA 버튼 아래에 **대시보드 풀뷰 스크린샷**을 브라우저 프레임 목업 안에 배치

```
┌─────────────────────────────────────────┐
│  CONTEXT_SYNC (ASCII)                   │
│  "The Hub for AI Session Context"       │
│  [Start] [GitHub] [Login]               │
│                                         │
│  ┌─── 브라우저 프레임 ──────────────┐    │
│  │  dashboard-full.png              │    │
│  │  (그림자 + 기울기 효과)           │    │
│  └──────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**사용 이미지:** `dashboard-full.png` (또는 `hero-mockup.png` 합성본)

### 4.2 Feature Showcase 섹션 (`FeatureShowcase.tsx`)

현재: 텍스트 카드만 존재
**추가:** 각 Feature 카드 옆에 해당 기능의 실제 화면 스크린샷 배치

```
Feature 01: Session Archive & Sync
├── 왼쪽: 기능 설명 텍스트
└── 오른쪽: session-conversation.png

Feature 02: Conflict Detection
├── 왼쪽: conflict-detail.png
└── 오른쪽: 기능 설명 텍스트 (좌우 반전 레이아웃)

Feature 03: PRD Analysis
├── 왼쪽: 기능 설명 텍스트
└── 오른쪽: prd-analysis.png
```

### 4.3 Sub Feature 섹션

현재 4개 서브 피쳐 카드에 이미지 없음
**추가:** 각 카드에 소형 스크린샷 또는 아이콘+스크린샷 조합

```
📊 Dashboard & Analytics  →  dashboard-stats.png (크롭)
🔍 Full-text Search       →  search-overlay.png (크롭)
👥 Team Collaboration     →  settings-team.png (크롭)
⚡ Local Session Sync     →  session-conversation.png (크롭, 싱크 배지 강조)
```

### 4.4 Problem Statement 섹션 (`ProblemStatement.tsx`)

현재: 터미널 텍스트 데모만 존재
**유지:** 터미널 데모가 이미 시각적으로 효과적 — 이미지 불필요

### 4.5 How It Works 섹션 (`HowItWorks.tsx`)

현재: 3단계 텍스트 + 아이콘
**추가:** 각 스텝 아래에 관련 화면 미니 스크린샷

```
Step 01: Import     →  session-conversation.png (싱크 과정 크롭)
Step 02: Analyze    →  conflicts-list.png + prd-trend-chart.png (나란히)
Step 03: Scale      →  settings-team.png (팀원 목록 크롭)
```

---

## 5. 배치 계획: README.md

### 5.1 헤더 영역 (로고 아래)

```markdown
# ContextSync

> AI session context management platform

![ContextSync Dashboard](imageAsset/screenshots/dashboard-full.png)
```

### 5.2 Key Features 섹션

각 기능 설명에 스크린샷 첨부:

```markdown
## Key Features

### Session Archive & Sync

Import and search across all Claude Code sessions.

![Session Archive](imageAsset/screenshots/session-conversation.png)

### Conflict Detection

Detect file conflicts before they become merge hell.

![Conflict Detection](imageAsset/screenshots/conflicts-list.png)

### PRD Analysis

AI-powered requirement fulfillment tracking.

![PRD Analysis](imageAsset/screenshots/prd-analysis.png)

### Dashboard & Analytics

Real-time token usage, session timeline, team activity.

![Dashboard Stats](imageAsset/screenshots/dashboard-stats.png)

### Full-Text Search

Search across thousands of sessions instantly.

![Search](imageAsset/screenshots/search-overlay.png)
```

### 5.3 Quick Start 섹션

온보딩 스크린샷은 선택적으로 포함:

```markdown
## Quick Start

...설치 명령어...

After setup, you'll see the dashboard:
![Onboarding](imageAsset/optional/onboarding.png)
```

---

## 6. 배치 계획: Docs Page

### 6.1 DocsHero 섹션 (`DocsHero.tsx`)

현재: 3개 하이라이트 카드 (아이콘 + 텍스트)
**추가:** 히어로 배경에 대시보드 스크린샷을 블러 처리하여 배치, 또는 카드 아래에 메인 대시보드 이미지

### 6.2 Getting Started 섹션 (`GettingStartedSection.tsx`)

현재 4단계에 일러스트레이션 (`DocsIllustrations.tsx`) 사용
**교체/보강:** 실제 화면 스크린샷으로 교체

```
Step 1: Create Project  →  onboarding.png (프로젝트 생성 화면)
Step 2: Sync Sessions   →  session-conversation.png (싱크 배지 강조)
Step 3: Dashboard        →  dashboard-full.png
Step 4: Invite Team      →  settings-team.png (초대 모달 강조)
```

### 6.3 Feature Section (`FeatureSection.tsx`)

현재: 7개 기능 아코디언 (텍스트만)
**추가:** 각 기능 펼침 시 관련 스크린샷 표시

| 기능               | 이미지                     |
| ------------------ | -------------------------- |
| Session Sync       | `session-conversation.png` |
| Conflict Detection | `conflict-detail.png`      |
| Dashboard          | `dashboard-full.png`       |
| PRD Analysis       | `prd-analysis.png`         |
| Plans              | `plans-view.png`           |
| Search             | `search-overlay.png`       |
| Team Collaboration | `settings-team.png`        |

### 6.4 FAQ 섹션

이미지 불필요 — 텍스트 Q&A 유지

---

## 7. 캡쳐 실행 방법

### 7.1 사전 준비

1. **마케팅용 시드 데이터 준비** — `apps/api/src/database/seed-marketing.ts` 생성
2. **DB 초기화 & 시드 실행**:
   ```bash
   pnpm --filter @context-sync/api migrate
   pnpm --filter @context-sync/api seed:marketing
   ```
3. **Dev 서버 시작**:
   ```bash
   pnpm dev
   ```

### 7.2 Playwright 캡쳐 스크립트

`scripts/capture-screenshots.ts` 를 생성하여 자동화합니다:

```typescript
// Playwright 기반 스크린샷 자동 캡쳐
// 1. 로그인
// 2. 각 페이지 네비게이션
// 3. 데모 데이터가 렌더링될 때까지 대기
// 4. 스크린샷 캡쳐 → imageAsset/screenshots/
```

**캡쳐 순서:**

```
1. 로그인 (alex@contextsync.io)
2. Dashboard → dashboard-full.png
3. Dashboard 통계 크롭 → dashboard-stats.png
4. Dashboard 토큰 차트 크롭 → token-usage-chart.png
5. Project 페이지 → session-conversation.png
6. 세션 상세 → session-detail.png
7. Conflicts 페이지 → conflicts-list.png
8. Conflict 상세 → conflict-detail.png
9. PRD Analysis → prd-analysis.png
10. PRD 트렌드 크롭 → prd-trend-chart.png
11. Cmd+K 검색 → search-overlay.png
12. Settings → settings-team.png
13. AI Evaluation → ai-evaluation.png
```

### 7.3 수동 보정

자동 캡쳐 후 필요 시:

- **크롭/리사이즈** — 불필요한 영역 제거
- **합성 이미지** — 브라우저 프레임 목업 씌우기 (`hero-mockup.png`)
- **WebP 변환** — 웹 최적화

---

## 구현 우선순위

### Phase 1: 필수 (Landing + README)

1. [ ] 마케팅 시드 스크립트 작성 (`seed-marketing.ts`)
2. [ ] Playwright 캡쳐 스크립트 작성 (`capture-screenshots.ts`)
3. [ ] 핵심 6개 캡쳐: dashboard-full, session-conversation, conflicts-list, prd-analysis, search-overlay, settings-team
4. [ ] Landing Page Hero에 대시보드 이미지 추가 (`LandingHero.tsx`)
5. [ ] Landing Feature Showcase에 이미지 추가 (`FeatureShowcase.tsx`)
6. [ ] README.md에 스크린샷 섹션 추가

### Phase 2: 보강 (Docs + 상세)

7. [ ] 나머지 6개 캡쳐: dashboard-stats, token-usage-chart, conflict-detail, prd-trend-chart, session-detail, ai-evaluation
8. [ ] Docs Getting Started에 실제 화면 교체
9. [ ] Docs Feature Section에 이미지 추가
10. [ ] How It Works에 미니 스크린샷 추가

### Phase 3: 선택 (추가)

11. [ ] Optional 캡쳐: admin-panel, plans-view, onboarding, mobile-dashboard
12. [ ] 합성 이미지 제작: hero-mockup, feature-grid
13. [ ] WebP 최적화 & lazy loading 적용

---

## 이미지 배치 요약 매트릭스

| 이미지               | Landing Hero | Landing Feature | Landing HowItWorks | Landing SubFeature | README | Docs Hero | Docs GetStarted | Docs Feature |
| -------------------- | :----------: | :-------------: | :----------------: | :----------------: | :----: | :-------: | :-------------: | :----------: |
| dashboard-full       |    **O**     |                 |                    |                    | **O**  |   **O**   |      **O**      |    **O**     |
| dashboard-stats      |              |                 |                    |       **O**        | **O**  |           |                 |              |
| token-usage-chart    |              |                 |                    |                    |        |           |                 |              |
| session-conversation |              |      **O**      |       **O**        |       **O**        | **O**  |           |      **O**      |    **O**     |
| session-detail       |              |                 |                    |                    |        |           |                 |              |
| conflicts-list       |              |                 |       **O**        |                    | **O**  |           |                 |              |
| conflict-detail      |              |      **O**      |                    |                    |        |           |                 |    **O**     |
| prd-analysis         |              |      **O**      |                    |                    | **O**  |           |                 |    **O**     |
| prd-trend-chart      |              |                 |       **O**        |                    |        |           |                 |              |
| search-overlay       |              |                 |                    |       **O**        | **O**  |           |                 |    **O**     |
| settings-team        |              |                 |       **O**        |       **O**        |        |           |      **O**      |    **O**     |
| ai-evaluation        |              |                 |                    |                    |        |           |                 |              |

**총 사용 횟수:** dashboard-full(5), session-conversation(5), settings-team(4), prd-analysis(3), conflicts-list(2), conflict-detail(2), search-overlay(3), dashboard-stats(2)
