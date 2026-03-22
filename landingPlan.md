# ContextSync Landing Page Redesign Plan

## Current State Analysis

### Problem Summary

현재 랜딩 페이지는 **11개 섹션**으로 구성되어 있으며, 정보 과부하와 구조적 중복이 핵심 문제다.

### Identified Issues

#### 1. 정보 과부하 (Critical)

- 11개 섹션은 오픈소스 프로젝트 랜딩으로 과도함
- 스크롤 깊이가 지나치게 깊어 이탈률 증가 예상
- 핵심 메시지가 분산되어 "이게 뭔지" 파악하기 어려움

#### 2. 콘텐츠 중복 (Critical)

- **QuickStart**, **HowItWorks**, **TerminalDemo** 3개 섹션 모두 터미널/커맨드 기반 콘텐츠 → 하나로 통합 필요
- ProblemStatement와 FeatureShowcase가 각각 독립 섹션이지만 "왜 쓰는가 → 무엇을 하는가"로 자연스럽게 연결 가능

#### 3. Hero 영역 약점 (High)

- ASCII art 타이틀은 개성 있으나 가독성 낮음 (특히 모바일)
- 서브타이틀 "The Hub for AI Session Context"가 구체적 가치를 전달하지 못함
- CTA가 "View on GitHub" 하나뿐 — 즉시 체험 경로 부재

#### 4. 시각적 위계 부족 (High)

- 모든 섹션이 비슷한 어두운 톤으로 구분감 없음
- 스크린샷이 작아서 제품의 실제 모습을 파악하기 어려움
- 섹션 간 시각적 리듬(밝음-어두움 교대)이 약함

#### 5. 사회적 증거 부재 (Medium)

- GitHub Stars 카운트 미노출
- 사용 사례나 커뮤니티 활동 지표 없음

#### 6. 불필요한 섹션 (Medium)

- **TechStack**: 기술 스택 나열은 README/docs에 적합, 랜딩에서는 가치 전달 안 됨
- **TerminalDemo**: 애니메이션 터미널 출력은 맥락 없이 따라가기 어려움
- **DeployModes**: "Personal / Team / Hosted" 구분이 첫 방문자에게 혼란

#### 7. 오픈소스 프로젝트 특성 미반영 (Medium)

- Contributing 섹션이 페이지 하단에 묻혀 있음
- 라이선스, 기여 가이드, 이슈 링크가 분산됨
- "왜 이 프로젝트에 기여해야 하는가"에 대한 동기부여 부족

---

## Redesign Plan

### Design Principles

1. **5초 룰**: 방문 후 5초 내에 "이게 뭔지, 왜 쓰는지" 파악 가능해야 함
2. **섹션 최소화**: 11개 → 7개로 축소, 각 섹션에 명확한 역할 부여
3. **QuickStart 중심**: 오픈소스 프로젝트 → "지금 바로 실행"이 핵심 전환 포인트
4. **시각적 리듬**: 밝은/어둔 배경 교대로 섹션 구분감 강화

### New Section Structure (7 Sections)

```
1. Hero              — 첫인상: 무엇인지 + 왜 필요한지 + CTA
2. Problem → Solution — 문제 공감 → 해결책 제시 (기존 ProblemStatement 개선)
3. Features          — 핵심 기능 3개 (기존 FeatureShowcase 압축)
4. QuickStart        — 3 commands to get started (핵심 전환 포인트)
5. How It Works      — 워크플로우 3단계 (기존 HowItWorks 유지, 간소화)
6. Open Source       — Contributing + License + GitHub Stars (기존 Contributing 강화)
7. Footer            — 최종 CTA + 링크
```

### Removed/Merged Sections

| 기존 섹션        | 처리              | 사유                                               |
| ---------------- | ----------------- | -------------------------------------------------- |
| TerminalDemo     | **삭제**          | QuickStart와 중복, 맥락 없는 애니메이션은 비효과적 |
| TechStack        | **삭제**          | README/docs 영역, 랜딩 가치 없음                   |
| DeployModes      | **삭제**          | 첫 방문자에게 불필요한 복잡도, docs로 이동         |
| ProblemStatement | **개선하여 유지** | Problem → Solution 형태로 재구성                   |
| FeatureShowcase  | **압축**          | 6개 서브피처 제거, 3개 핵심 기능만 유지            |
| Contributing     | **강화**          | Open Source 섹션으로 확대                          |

---

### Section Details

#### Section 1: Hero

**목적**: 5초 내 제품 이해 + 행동 유도

**구성 요소**:

- 로고 + 내비게이션 (GitHub, Docs, Star count badge)
- **헤드라인**: 명확한 가치 제안 (예: "AI 개발 세션의 컨텍스트를 저장하고, 공유하고, 충돌을 해결하세요")
- **서브라인**: 한 줄 설명 (예: "Manage sessions, PRDs, and plans across your AI-assisted development workflow")
- **CTA 2개**: `Get Started` (QuickStart로 스크롤) + `View on GitHub` (외부 링크)
- **Hero Image**: 대시보드 스크린샷 (현재보다 크게, 그림자/글로우 효과)
- GitHub Stars badge 실시간 표시

**개선 포인트**:

- ASCII art → 깔끔한 로고 타이포 (모바일 가독성 확보)
- 서브타이틀을 구체적 가치로 교체
- CTA를 2개로 확대 (체험 경로 + GitHub)

---

#### Section 2: Problem → Solution

**목적**: 공감 유도 → 해결책 자연스럽게 연결

**구성 요소**:

- **상단**: "Without ContextSync" — 문제 상황 터미널 (간략화)
  - 세션 컨텍스트 유실
  - 팀원 간 충돌
  - 수동 관리의 비효율
- **하단**: "With ContextSync" — 해결 후 터미널
  - 자동 컨텍스트 보존
  - 충돌 감지 및 해결
  - 원클릭 동기화
- 현재 ProblemStatement의 터미널 라인을 **3-4줄로 압축** (현재 너무 길어서 읽히지 않음)

**레이아웃**: 2컬럼 (데스크톱) → 세로 스택 (모바일)

---

#### Section 3: Features

**목적**: 핵심 기능 3개를 빠르게 전달

**구성 요소**:

- 3개 Feature Card (기존 hero features 유지, 서브피처 6개 제거)
  1. **Session Timeline & Sync** — 세션 기록 관리 + 스크린샷
  2. **Conflict Detection** — 충돌 자동 감지 + 스크린샷
  3. **PRD Analysis** — AI 기반 요구사항 분석 + 스크린샷
- 각 카드: 아이콘 + 제목 + 2줄 설명 + 스크린샷

**레이아웃**:

- 데스크톱: 교대 배치 (이미지 좌-우-좌) — 기존 유지하되 스크린샷 크기 증가
- 모바일: 세로 스택

**개선 포인트**:

- 서브피처 6개 그리드 제거 → 페이지 길이 대폭 축소
- 스크린샷 크기 키워서 실제 제품 모습 명확히 전달

---

#### Section 4: QuickStart (Required)

**목적**: "지금 바로 실행할 수 있다"는 확신 → 전환의 핵심

**구성 요소**:

- 섹션 타이틀: "Get Started in 30 Seconds"
- **터미널 윈도우** (기존 QuickStart 기반):
  ```bash
  $ git clone https://github.com/okyokwon/contextSync.git
  $ cd contextSync && pnpm setup
  $ pnpm dev
  # API running at http://localhost:3001
  # Web running at http://localhost:5173
  ```
- **Copy 버튼**: 전체 명령어 클립보드 복사
- **하단 안내**: Prerequisites (Node.js 18+, pnpm, Docker) 간략 표기
- **환경 탭** (선택): `Self-hosted` / `Docker` 탭으로 설치 방법 분기

**개선 포인트**:

- 기존 QuickStart의 출력 라인 정리 (성공 표시 등 불필요한 라인 축소)
- Prerequisites 명시로 "시작 전 필요한 것" 명확화
- 섹션 배경을 약간 밝게 처리하여 시선 집중

---

#### Section 5: How It Works

**목적**: 사용 흐름을 3단계로 시각화

**구성 요소**:

- 3단계 흐름 (기존 유지, 간소화):
  1. **Create a Project** — 프로젝트 생성
  2. **Log Sessions** — AI 세션 기록
  3. **Detect & Resolve** — 충돌 감지 및 해결
- 각 단계: 번호 + 아이콘 + 제목 + 1줄 설명
- 단계 간 연결선 (데스크톱만)

**개선 포인트**:

- 스크린샷 제거 (Features에서 이미 보여줌) → 아이콘 + 텍스트로 경량화
- 전체적으로 compact하게 유지

---

#### Section 6: Open Source

**목적**: 오픈소스 커뮤니티 참여 유도

**구성 요소**:

- 섹션 타이틀: "Built in the Open"
- **3컬럼 카드**:
  1. **MIT Licensed** — 자유롭게 사용, 수정, 배포
  2. **Community Driven** — Issues, Discussions, PRs 환영
  3. **Contributor Friendly** — Contributing guide, good first issues
- **CTA 행**:
  - `Star on GitHub` 버튼 (stars count 표시)
  - `Read Contributing Guide` 링크
  - `Browse Open Issues` 링크
- **기여자 아바타** (선택): GitHub API로 top contributors 표시

**개선 포인트**:

- 기존 Contributing 섹션 대비 3배 확대
- 오픈소스 프로젝트로서의 정체성 강화
- Stars count를 시각적으로 강조

---

#### Section 7: Footer

**목적**: 최종 CTA + 프로젝트 링크

**구성 요소**:

- 마지막 CTA: "Start syncing your AI workflow" + Get Started 버튼
- 링크 행: Docs / GitHub / Contributing / License / Contact
- Copyright

**개선 포인트**:

- 기존 대비 변경 최소 (현재도 적절)

---

### Visual Design Improvements

#### 배경 리듬 (섹션별 교대)

```
Hero              → 기본 배경 (bg-page)
Problem/Solution  → 어두운 배경 (bg-surface-sunken)
Features          → 기본 배경 (bg-page)
QuickStart        → 강조 배경 (미묘한 gradient 또는 border accent)
How It Works      → 어두운 배경 (bg-surface-sunken)
Open Source       → 기본 배경 (bg-page)
Footer            → 가장 어두운 배경
```

#### 타이포그래피

- Hero 헤드라인: `text-4xl md:text-6xl font-bold` (현재보다 크게)
- 섹션 타이틀: `text-3xl md:text-4xl font-bold` 통일
- 본문: `text-lg text-text-muted` 통일

#### 애니메이션

- 기존 `useInView` fade-in 유지
- TerminalDemo의 staggered 애니메이션 삭제 (해당 섹션 삭제)
- Hero 스크린샷 3D 효과 유지

---

### Implementation Checklist

- [ ] Hero 섹션: ASCII art 교체, CTA 2개, Stars badge 추가
- [ ] ProblemStatement → Problem/Solution 재구성 (터미널 라인 압축)
- [ ] FeatureShowcase: 서브피처 6개 그리드 제거, 스크린샷 확대
- [ ] QuickStart: Prerequisites 추가, 출력 라인 정리
- [ ] HowItWorks: 스크린샷 제거, 텍스트 + 아이콘으로 경량화
- [ ] TerminalDemo 섹션 제거
- [ ] TechStack 섹션 제거
- [ ] DeployModes 섹션 제거
- [ ] Contributing → Open Source 섹션으로 확대 재구성
- [ ] Footer: 최종 CTA 텍스트 개선
- [ ] LandingPage.tsx에서 섹션 순서 재배치
- [ ] 섹션별 배경색 교대 적용
- [ ] 모바일 반응형 검증

### Before vs After

| 항목                  | Before       | After                      |
| --------------------- | ------------ | -------------------------- |
| 섹션 수               | 11개         | 7개                        |
| 스크롤 깊이           | 과도         | 적정                       |
| 터미널 콘텐츠         | 3곳 중복     | QuickStart 1곳 집중        |
| 핵심 메시지 도달 시간 | 불명확       | 5초 내                     |
| 오픈소스 강조         | 하단에 묻힘  | 전용 섹션 확대             |
| CTA                   | 1개 (GitHub) | 2개 (Get Started + GitHub) |
