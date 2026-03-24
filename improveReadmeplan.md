# README.md 전면 개선 기획

> **작성일:** 2026-03-24
> **대상 파일:** `/README.md` (342줄)
> **목적:** 오픈소스 프로젝트의 첫인상이자 진입점인 README를 GitHub 방문자 관점에서 전면 재설계

---

## 1. 현황 문제점 분석

### 1.1 구조 & 흐름

| 문제                       | 상세                                                                                                                                             | 심각도 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| **Hero 영역 약함**         | 배지 → 1줄 설명 → 2줄 설명 → 스크린샷 순서인데, "이게 뭔데 왜 써야 하지?"에 대한 답이 즉시 오지 않음. 문제 정의가 설명 문장 안에 묻혀 있음       | HIGH   |
| **Feature 섹션이 나열형**  | 8개 기능이 동일한 포맷(제목 + 1줄 설명 + 스크린샷)으로 플랫하게 나열. 핵심 vs 부가 기능 구분 없이 동일 비중                                      | HIGH   |
| **Getting Started가 복잡** | Quick Setup → Manual(Personal/Team Host/Team Member) → 환경변수 → Deployment Modes로 정보가 분산. 첫 방문자가 "일단 돌려보기"까지 인지 부하 높음 | HIGH   |
| **TOC가 과도**             | 11개 항목 TOC는 README가 길다는 신호. 핵심 정보가 스크롤 아래로 밀림                                                                             | MEDIUM |
| **중복 정보**              | Deployment Modes 테이블과 Getting Started의 details 블록이 거의 같은 내용 반복                                                                   | MEDIUM |

### 1.2 콘텐츠 품질

| 문제                                  | 상세                                                                                                                                 | 심각도 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| **한영 혼재**                         | `corepack이 없으면...`, `node -v 로 v22 이상인지 확인하세요` 등 한국어 코멘트가 영문 README에 섞여 있음. 국제 오픈소스 기준 비일관적 | HIGH   |
| **가치 제안(Value Proposition) 부재** | "왜 이 도구가 필요한가"를 한눈에 보여주는 비교표나 Before/After가 없음. PRD에 있는 문제 정의가 README에 제대로 반영 안 됨            | HIGH   |
| **Demo/Live 링크 부족**               | Project Site 링크만 있고, GIF 데모나 Quick Demo 영상 없음. 스크린샷만으로는 동작 이해 어려움                                         | MEDIUM |
| **스크린샷 과다**                     | 8개 기능 × 1장 = 8장 스크린샷. 스크롤 길이만 늘리고 정보 밀도 낮음                                                                   | MEDIUM |
| **Acknowledgements 불필요하게 김**    | 사용한 프레임워크 6개를 각각 링크+설명으로 나열. Tech Stack 테이블과 중복                                                            | LOW    |

### 1.3 대상 독자 설계 미흡

| 문제                       | 상세                                                                                               | 심각도 |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| **페르소나 미분리**        | "처음 발견한 사람", "써보려는 사람", "기여하려는 사람" 세 독자의 니즈가 구분 없이 섞임             | HIGH   |
| **Solo vs Team 경로 혼재** | Solo 사용과 Team 사용의 진입 경로가 같은 섹션에 details로 숨겨져 있어, 각각에 최적화된 온보딩 불가 | MEDIUM |
| **기여자 가이드 빈약**     | "See CONTRIBUTING.md" 한 줄. 개발 환경 셋업, 아키텍처 포인터, 핵심 컨벤션 요약 없음                | MEDIUM |

### 1.4 SEO & 발견성

| 문제                                 | 상세                                                                                               | 심각도 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- | ------ |
| **GitHub Topics/Description 미연동** | README 첫 줄이 GitHub repo description과 잘 매칭되는지 불명확                                      | LOW    |
| **검색 키워드 부족**                 | "Claude Code", "AI session management", "team context" 같은 검색 키워드가 자연스럽게 포함되지 않음 | MEDIUM |

---

## 2. 교차검수 결과

코드베이스 전체를 검증하여 기획안의 정확성과 실현가능성을 확인함.

### 2.1 기능 서술 정확도

README에 기술된 8개 기능을 소스 코드와 대조 검증:

| 기능                       | 검증 결과    | 수정 필요 사항                                                                                                                 |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Session Archive & Sync** | ✅ 정확      | `local-session.service.ts`에서 `~/.claude/projects/` 스캔, 10분 활성 임계값 확인                                               |
| **Conflict Detection**     | ✅ 정확      | 3단계 severity (info/warning/critical), 리뷰 워크플로 구현 확인                                                                |
| **Dashboard & Analytics**  | ⚠️ 부분 수정 | "weekly trends" 표현 과장 — 실제는 7일 집계 데이터. `DailyUsageChart`, `TokenUsagePanel` 존재하나 multi-week trend 분석은 없음 |
| **PRD Analysis**           | ✅ 정확      | Claude API 연동, requirement 상태 추적 (achieved/partial/not_started) 확인                                                     |
| **Plans**                  | ✅ 정확      | `~/.claude/plans/` 디렉토리 스캔, 프로젝트 매핑 확인                                                                           |
| **Full-text Search**       | ✅ 정확      | tsvector + GIN 인덱스, `ts_rank()`, `ts_headline()` 구현 확인                                                                  |
| **AI Evaluation**          | ✅ 정확      | 5차원 평가 (prompt_quality 등), proficiency tier 매핑 확인                                                                     |
| **Team Collaboration**     | ✅ 정확      | Owner/Member RBAC, `project_collaborators` 테이블 확인                                                                         |

**조치:** Dashboard 설명에서 "weekly trends" → "daily usage charts and 7-day activity stats"로 수정

### 2.2 Getting Started 정확도

| 항목                         | 검증 결과    | 수정 필요 사항                                                                                                                  |
| ---------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **pnpm 스크립트**            | ✅ 모두 존재 | `dev`, `build`, `test`, `test:coverage`, `typecheck`, `lint`, `clean`, `bootstrap`, `setup:team` — root `package.json`에서 확인 |
| **pnpm bootstrap**           | ✅ 정확      | `bash scripts/setup.sh --defaults` → Docker up → migration → seed 순서 확인                                                     |
| **환경변수**                 | ✅ 정확      | `.env.example`과 `config/env.ts` Zod 스키마 일치 확인. DATABASE_URL만 필수, 나머지 기본값 있음                                  |
| **Team Host docker profile** | ✅ 존재      | `docker-compose.yml`에 `profiles: ['team-host']` 확인                                                                           |
| **SSL 인증서 경로**          | ❌ 오류 발견 | README L164: `certs/` → 실제: `docker/ssl/` (docker-compose.yml volumes 확인)                                                   |
| **seed 스크립트**            | ✅ 정확      | `apps/api/package.json`에 `"seed": "tsx ... seed.ts"` 존재                                                                      |

**조치:** SSL 인증서 경로 `certs/` → `docker/ssl/`로 수정 필요 (현재 README 버그)

### 2.3 에셋 현황

| 항목                    | 현황                 | 비고                                                       |
| ----------------------- | -------------------- | ---------------------------------------------------------- |
| **스크린샷**            | 11개 PNG, 46KB~323KB | 전체 ~2.5MB                                                |
| **GIF/영상 데모**       | 없음                 | 신규 제작 필요                                             |
| **Project Site**        | GitHub Pages 배포 중 | `deploy-landing.yml` 워크플로, LandingPage + DocsPage 존재 |
| **docs/setup-guide.md** | 존재하지 않음        | 신규 생성 필요                                             |

### 2.4 CONTRIBUTING.md 현황

130줄, 이미 충분히 상세함:

- Prerequisites, Quick Setup (`pnpm bootstrap`)
- 4-file module pattern 설명
- Code Style (immutability, pure functions, file naming)
- Branch naming, Conventional Commits
- Testing (80% coverage)
- PR process

**결론:** CONTRIBUTING.md는 이미 잘 작성되어 있으므로, README Contributing 섹션에서는 핵심 3줄 요약 + 링크로 충분. 중복 작성 불필요.

### 2.5 기존 기획안 수정 사항

교차검수 결과 기존 기획안에서 수정이 필요한 부분:

| 기존 기획                                       | 수정 내용                                | 이유                                                    |
| ----------------------------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| 4.6 Team Host → `docs/team-host-setup.md` 링크  | → `docs/setup-guide.md`에 통합           | 별도 파일보다 하나의 셋업 가이드에 모드별 섹션으로 관리 |
| 4.7 Contributing 확장 (dev setup 코드블록 포함) | → 3줄 요약 + CONTRIBUTING.md 링크만      | CONTRIBUTING.md가 이미 130줄로 상세함. 중복 방지        |
| 4.4 환경변수 → `docs/configuration.md` 분리     | → `docs/setup-guide.md` 내 섹션으로 통합 | 파일 수 최소화                                          |
| 4.3 Feature 핵심 3개 선정                       | Dashboard 설명 문구 수정 필요            | "weekly trends" 과장 표현 교정                          |

---

## 3. 개선 목표

1. **3초 안에 "이게 뭔지" 파악** — Hero 영역에서 문제→해결책→데모를 즉시 전달
2. **30초 안에 "써볼까" 결정** — 핵심 기능 하이라이트 + Quick Start 최소 경로
3. **3분 안에 로컬 실행** — 복사-붙여넣기 가능한 원커맨드 셋업
4. **기여자 온보딩 시간 단축** — 아키텍처 요약 + 개발 환경 빠른 포인터

---

## 4. 개선된 구조 설계

```
README.md (목표: ~250줄, 현재 342줄)
│
├─ Hero Block                              ← ~25줄
│   ├─ 프로젝트명 + 배지 (중앙 정렬)
│   ├─ 태그라인: "Stop losing AI development context."
│   ├─ 부제: 핵심 기능 3개 키워드 나열
│   ├─ CTA 링크: Quick Start · Project Site · Docs
│   └─ 메인 스크린샷 1장 (dashboard-full.png, 323KB)
│
├─ Why ContextSync?                        ← ~15줄 (신설)
│   └─ Before/After 테이블 3행 (PRD 문제 정의 반영)
│
├─ Key Features                            ← ~45줄 (현재 ~50줄 + 8장 이미지)
│   ├─ 핵심 3개: Session Sync, Conflict Detection, Dashboard
│   │   → 각 1줄 설명 + 스크린샷 1장씩 (3장)
│   └─ 나머지 5개: details 접이식 테이블
│       → PRD Analysis, Plans, Full-text Search, AI Evaluation, Team Collaboration
│
├─ Quick Start                             ← ~20줄 (현재 ~100줄)
│   ├─ Prerequisites 1줄 (Node.js 22+, pnpm, Docker)
│   ├─ 4줄 코드블록 (clone → bootstrap → dev)
│   ├─ 결과 URL (localhost:5173, 3001)
│   └─ "자세한 설정 → docs/setup-guide.md" 링크
│
├─ Deployment Modes                        ← ~10줄 (현재 ~20줄, 중복 제거)
│   └─ 3-row 테이블 (Personal | Team Host | Team Member)
│
├─ Tech Stack                              ← ~10줄 (현행 유지)
│   └─ Layer × Stack 테이블
│
├─ Project Structure                       ← ~15줄 (현행 유지, API Modules details 포함)
│   ├─ 3-level 트리
│   └─ details: API Modules 목록
│
├─ Scripts                                 ← ~10줄 (현행 유지)
│   └─ 코드블록
│
├─ Contributing                            ← ~10줄 (현재 3줄 → 확장)
│   ├─ 핵심 컨벤션 3개 bullet
│   └─ CONTRIBUTING.md + good first issue 링크
│
├─ Roadmap                                 ← ~10줄 (현행 유지)
│
└─ Footer                                  ← ~15줄
    ├─ Community (Issues + Discussions)
    ├─ Acknowledgements (1줄)
    ├─ Security → SECURITY.md
    └─ License: MIT

총 ~185줄 예상 (목표 250줄 이내 달성)
```

---

## 5. 구체적 구현 계획

### Phase 1: `docs/setup-guide.md` 생성 (README에서 분리될 콘텐츠의 수용처)

README 경량화 전에 먼저 상세 셋업 문서를 만들어, 분리되는 내용의 목적지를 확보.

**파일:** `docs/setup-guide.md`

**구조:**

```markdown
# Setup Guide

## Prerequisites

### macOS (Homebrew + nvm)

→ 현재 README L99~L125 내용 이동 (영문화)

### Other platforms

→ Node.js 22 + pnpm + Docker 일반 설치 안내

## Setup Modes

### Personal Mode (default)

→ 현재 README L146~L157 내용 이동

### Team Host Mode

→ 현재 README L159~L172 내용 이동
→ SSL 인증서 경로 수정: certs/ → docker/ssl/

### Team Member Mode

→ 현재 README L174~L185 내용 이동

## Environment Variables

→ 현재 README L191~L212 환경변수 테이블 전체 이동

## Troubleshooting

→ Docker 미실행, port 충돌, nvm 미설정 등 FAQ
```

**소스:** 현재 README L92~L212 (약 120줄) → 이 파일로 이동
**한영 혼재 수정 포함:** 이동하면서 모든 한국어 코멘트 영문화

### Phase 2: README.md Hero 영역 리디자인

**현재 (L1~L18):**

```markdown
# ContextSync

[배지 5개, 각각 별도 줄]
[Project Site 링크]
한 줄 설명
두 줄 설명 (문제 정의 포함)

<p align="center"><img .../></p>
```

**변경 후:**

```html
<div align="center">
  <h1>ContextSync</h1>

  <p><strong>Stop losing AI development context.</strong></p>

  <p>
    Session archive · Conflict detection · Team dashboard<br />
    for <a href="https://docs.anthropic.com/en/docs/claude-code">Claude Code</a> teams and solo
    developers.
  </p>

  [![CI](...)][ci] [![License: MIT](...)][license] [![TypeScript](...)][ts] [![Node.js](...)][node]

  <a href="#quick-start">Quick Start</a> ·
  <a href="https://okyokwon.github.io/contextSync/">Project Site</a> ·
  <a href="docs/architecture.md">Documentation</a>

  <br />

  <img
    src="apps/web/public/screenshots/dashboard-full.png"
    alt="ContextSync Dashboard"
    width="800"
  />
</div>
```

**변경 사항:**

- 중앙 정렬 (`<div align="center">`)
- 태그라인 강화: "Stop losing AI development context."
- 배지 4개로 축소 (pnpm 배지 제거 — 기여자 대상이라 Hero에 불필요)
- CTA 3개: Quick Start, Project Site, Documentation
- TOC 제거 (섹션 수가 줄어 불필요)
- `---` 구분선 제거 (중앙 정렬 블록이 자체 구분 역할)

### Phase 3: "Why ContextSync?" 섹션 신설

**삽입 위치:** Hero 바로 아래

```markdown
## Why ContextSync?

| Problem                | Without ContextSync                             | With ContextSync                                     |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| **Lost context**       | Claude sessions scattered across local machines | Centralized archive with full-text search            |
| **Work conflicts**     | Discover file clashes at merge time             | Real-time conflict detection by severity             |
| **Invisible progress** | "What did the team build today?"                | Dashboard with daily usage charts and activity stats |
```

**근거:** PRD §1.2 문제 정의 3가지 (컨텍스트 유실, 작업 충돌, 진행 상황 불투명)를 영문 Before/After 형식으로 변환. "weekly trends" → "daily usage charts and activity stats"로 코드베이스 실제와 일치시킴.

### Phase 4: Feature 섹션 경량화

**현재 (L37~L86):** 8개 기능 × (h3 + 설명 + `<img>`) = ~50줄 + 이미지 8장

**변경 후:**

핵심 3개만 스크린샷 포함:

```markdown
## Key Features

### Session Archive & Sync

Scans local Claude Code sessions (`~/.claude/projects/`) and syncs to the web dashboard. Active sessions grouped by project.

<img src="apps/web/public/screenshots/session-conversation.png" alt="Session conversation" width="720" />

### Conflict Detection

Detects simultaneous file modifications across team members. Classifies by severity (info → warning → critical) with review workflow.

<img src="apps/web/public/screenshots/conflicts-list.png" alt="Conflict detection" width="720" />

### Dashboard & Analytics

Daily usage charts and 7-day activity stats — session counts, token usage, hot files, and team member activity at a glance.

<img src="apps/web/public/screenshots/dashboard-stats.png" alt="Dashboard analytics" width="720" />

<details>
<summary><strong>More features</strong></summary>

| Feature                | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| **PRD Analysis**       | Upload PRDs and track requirement fulfillment with Claude-powered analysis |
| **Plans**              | Structured markdown plans linked to projects from `~/.claude/plans/`       |
| **Full-text Search**   | PostgreSQL tsvector search across sessions, messages, file paths, and tags |
| **AI Evaluation**      | Multi-dimensional scoring of AI utilization with proficiency tiers         |
| **Team Collaboration** | Role-based access (Owner / Member) with project sharing                    |

</details>
```

**변경 사항:**

- 이미지 8장 → 3장 (스크롤 ~40% 감소)
- Dashboard 설명 수정: "weekly trends" → "Daily usage charts and 7-day activity stats"
- 나머지 5개 기능은 details 접이식 테이블
- 각 기능 설명에 코드베이스 검증 결과 반영 (severity 3단계 명시, `~/.claude/plans/` 경로 명시 등)

### Phase 5: Quick Start 단순화

**현재 (L89~L212):** Prerequisites + macOS 설치 + Quick Setup + Manual Setup 3모드 + 환경변수 = ~120줄

**변경 후:**

````markdown
## Quick Start

> **Prerequisites:** Node.js 22+, pnpm (`corepack enable`), Docker

```bash
git clone https://github.com/OkyoKwon/contextSync.git && cd contextSync
corepack enable
pnpm bootstrap    # Docker up → DB migration → seed data
pnpm dev          # API :3001, Web :5173
```
````

Open [http://localhost:5173](http://localhost:5173) and enter your name to get started.

> Joining an existing team? Run `pnpm setup:team` instead — no Docker required.
>
> For manual setup, macOS prerequisites, and environment variables, see the **[Setup Guide](docs/setup-guide.md)**.

````

**변경 사항:**
- 120줄 → ~15줄
- macOS 설치 가이드 → `docs/setup-guide.md` (Phase 1에서 생성)
- Manual Setup 3개 모드 → Deployment Modes 테이블 + setup-guide.md 링크
- 환경변수 details → setup-guide.md로 이동
- 한국어 코멘트 전량 제거
- `pnpm bootstrap` 동작 설명 인라인 코멘트로 추가 (`# Docker up → DB migration → seed data`)
- Team Member 경로를 blockquote로 간결하게 안내

### Phase 6: Deployment Modes 통합

**현재:** Getting Started의 details 3개 (L145~L185) + 별도 테이블 (L216~L223) = 중복

**변경 후:**

```markdown
## Deployment Modes

| Mode | Setup Command | Docker | Use Case |
|------|---------------|--------|----------|
| **Personal** | `pnpm bootstrap && pnpm dev` | Yes | Solo dev, local DB |
| **Team Host** | [Setup guide →](docs/setup-guide.md#team-host-mode) | Yes | Admin hosting shared DB (local + remote) |
| **Team Member** | `pnpm setup:team && pnpm dev` | No | Join existing team project |
````

**변경 사항:**

- 중복 제거 (details 3개 + 테이블 → 테이블 1개)
- Team Host 셋업 링크를 setup-guide.md의 앵커로 연결
- "Use Case" 컬럼으로 각 모드의 목적 한눈에 파악

### Phase 7: Contributing 확장

**현재 (L303~L309):** 3줄 (CONTRIBUTING.md 링크 + good first issue + Code of Conduct)

**변경 후:**

```markdown
## Contributing

Key conventions — [full guide in CONTRIBUTING.md](CONTRIBUTING.md):

- **Module pattern:** `routes → service → repository → schema` ([4-file structure](CONTRIBUTING.md#backend-module-pattern))
- **Immutability:** always return new objects, never mutate existing ones
- **Testing:** 80% coverage required — `pnpm test:coverage`

Looking for a place to start? Check out [**good first issues**](https://github.com/OkyoKwon/contextSync/labels/good%20first%20issue).
Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.
```

**변경 사항:**

- dev setup 코드블록 미포함 (CONTRIBUTING.md L13~L25에 이미 동일 내용 존재, 중복 방지)
- 핵심 컨벤션 3개만 bullet으로 요약 (module pattern, immutability, testing)
- 각 bullet에 CONTRIBUTING.md 앵커 링크 포함

### Phase 8: Footer 정리

**현재:** Community + Acknowledgements(6줄) + Security + License = ~30줄

**변경 후:**

```markdown
## Community

- [GitHub Issues](https://github.com/OkyoKwon/contextSync/issues) — Bug reports & feature requests
- [GitHub Discussions](https://github.com/OkyoKwon/contextSync/discussions) — Questions & ideas

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for reporting instructions.

---

Built with [Fastify](https://fastify.dev/) · [React](https://react.dev/) · [Kysely](https://kysely.dev/) · [Vite](https://vite.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [Turborepo](https://turbo.build/)

[MIT License](LICENSE)
```

**변경 사항:**

- Acknowledgements 6줄 → 1줄 인라인 (Tech Stack 테이블과 중복 제거)
- 구분선 최소화
- License 한 줄로 축약

---

## 6. 파일 변경 목록

| 파일                  | 동작        | 줄 수 변화               |
| --------------------- | ----------- | ------------------------ |
| `README.md`           | 전면 재작성 | 342줄 → ~185줄           |
| `docs/setup-guide.md` | 신규 생성   | ~120줄 (README에서 이전) |

**변경하지 않는 파일:**

- `CONTRIBUTING.md` — 이미 충분히 상세 (130줄)
- `CODE_OF_CONDUCT.md` — 변경 불필요
- `docs/architecture.md` — 변경 불필요 (README에서 링크만 추가)
- 스크린샷 파일들 — 삭제하지 않음 (Project Site/docs에서 계속 사용)

---

## 7. 실행 순서 및 의존관계

```
Phase 1: docs/setup-guide.md 생성
    ↓ (README에서 링크할 목적지 확보)
Phase 2: Hero 영역 리디자인
Phase 3: "Why ContextSync?" 신설        ← Phase 2~4는 독립적, 병렬 가능
Phase 4: Feature 섹션 경량화
    ↓ (구조 확정 후)
Phase 5: Quick Start 단순화 (→ setup-guide.md 링크)
Phase 6: Deployment Modes 통합
Phase 7: Contributing 확장
Phase 8: Footer 정리
    ↓
최종 검수: 줄 수, 한국어 잔존, 링크 유효성, 이미지 경로
```

**예상 작업 단위:**

- Phase 1: `docs/setup-guide.md` 신규 작성
- Phase 2~8: `README.md` 전면 재작성 (한 번에 Write하는 것이 효율적)
- 최종 검수: 링크/이미지 확인

---

## 8. 검증 필요 사항 (발견된 버그)

구현 시 반드시 수정해야 할 기존 README 오류:

| 항목            | 현재 (오류)       | 수정                                          | 근거                                                                   |
| --------------- | ----------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| SSL 인증서 경로 | `certs/` 디렉토리 | `docker/ssl/`                                 | `docker-compose.yml` volumes: `./docker/ssl:/ssl`                      |
| Dashboard 설명  | "weekly trends"   | "daily usage charts and 7-day activity stats" | `DailyUsageChart.tsx`, `TokenUsagePanel.tsx` — multi-week trend 미구현 |

---

## 9. 성공 기준

- [ ] README 총 길이 250줄 이하 (목표 ~185줄)
- [ ] 한국어 텍스트 0개
- [ ] 스크린샷 4장 이하 (Hero 1장 + Feature 3장)
- [ ] "git clone → pnpm dev" 까지 스크롤 없이 도달 가능 (Hero → Why → Features → Quick Start 순서)
- [ ] 모바일 GitHub에서 첫 화면에 프로젝트 설명 + CTA 보임
- [ ] 기존 README 버그 2건 수정 (SSL 경로, Dashboard 설명)
- [ ] `docs/setup-guide.md` 생성 완료, README에서 링크 유효
- [ ] CONTRIBUTING.md와 내용 중복 없음
