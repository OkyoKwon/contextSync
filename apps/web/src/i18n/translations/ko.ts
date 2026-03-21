import type { TranslationKeys } from '../types';

export const ko: TranslationKeys = {
  // Nav
  'nav.login': '로그인',

  // Hero
  'hero.title': 'AI 세션 컨텍스트의 중심',
  'hero.subtitle': 'Claude Code 세션을 관리하세요 — 혼자서도, 팀과 함께도',
  'hero.cta.login': '시작하기',
  'hero.cta.features': 'Features 살펴보기',

  // Problem Statement
  'problem.sectionLabel': '// Why ContextSync',
  'problem.terminal.prompt1': 'claude "auth 모듈 리팩토링해줘"',
  'problem.terminal.output1': '→ src/auth/middleware.ts 수정 중...',
  'problem.terminal.output2': '→ src/auth/session.ts 수정 중...',
  'problem.terminal.prompt2': 'claude "세션 관리 로직 개선해줘"',
  'problem.terminal.output3': '→ src/auth/session.ts 수정 중...',
  'problem.terminal.output4': '→ src/auth/token.ts 수정 중...',
  'problem.terminal.conflict': '⚠ CONFLICT: src/auth/session.ts — 2명이 동시 작업 중',
  'problem.terminal.resolved': '✓ 충돌 사전 감지 완료 — dev-A, dev-B에게 알림 전송',
  'problem.conclusion': '혼자든 팀이든, ',
  'problem.conclusionHighlight': '컨텍스트 동기화는 필수',
  'problem.conclusionEnd': '입니다',

  // Features
  'features.sectionLabel': '// Features',
  'features.hero.0.title': 'Session Archive & Sync',
  'features.hero.0.description': '세션을 팀의 지식 자산으로',
  'features.hero.0.detail.0': 'Claude Code 세션 자동 수집 및 아카이브',
  'features.hero.0.detail.1': '프로젝트별 세션 그룹핑 및 타임라인',
  'features.hero.0.detail.2': '메시지 단위 전문 검색 (Full-text search)',
  'features.hero.0.detail.3': '토큰 사용량 및 비용 분석 대시보드',
  'features.hero.1.title': 'Conflict Detection',
  'features.hero.1.description': '머지 전에 충돌을 감지',
  'features.hero.1.detail.0': '같은 파일을 동시 작업 중인 팀원 실시간 감지',
  'features.hero.1.detail.1': '충돌 심각도 자동 분류 (Critical / High / Medium / Low)',
  'features.hero.1.detail.2': '파일별 · 모듈별 충돌 히트맵',
  'features.hero.1.detail.3': '팀원에게 즉시 알림 전송',
  'features.hero.2.title': 'PRD Analysis',
  'features.hero.2.description': 'AI가 분석하는 요구사항 달성률',
  'features.hero.2.detail.0': 'PRD 문서 업로드 및 자동 요구사항 추출',
  'features.hero.2.detail.1': '세션 대화 기반 달성률 자동 계산',
  'features.hero.2.detail.2': '요구사항별 상세 상태 추적',
  'features.hero.2.detail.3': '변화율 트렌드 차트 및 리포트',
  'features.sub.0.title': 'Dashboard & Analytics',
  'features.sub.0.description': '팀 전체의 AI 작업 현황을 실시간 타임라인과 통계로 한눈에 파악',
  'features.sub.1.title': 'Full-text Search',
  'features.sub.1.description':
    '수천 개의 세션에서 필요한 대화를 즉시 검색. 메시지 · 파일 · 코드 단위 필터링',
  'features.sub.2.title': 'Team Collaboration',
  'features.sub.2.description':
    '역할 기반 접근 제어 (Owner / Admin / Member). 팀원 초대 및 프로젝트 공유',
  'features.sub.3.title': 'Local Session Sync',
  'features.sub.3.description': '로컬 Claude Code 세션을 원클릭으로 팀에 공유. 자동 프로젝트 매칭',

  // How It Works
  'howItWorks.sectionLabel': '// How It Works',
  'howItWorks.step.0.title': 'Import',
  'howItWorks.step.0.description':
    '로컬 Claude Code 세션을 프로젝트에 동기화합니다. 자동 프로젝트 매칭으로 원클릭 업로드.',
  'howItWorks.step.1.title': 'Analyze',
  'howItWorks.step.1.description':
    '충돌 감지, PRD 달성률 분석, 토큰 사용량 추적을 자동으로 수행합니다.',
  'howItWorks.step.2.title': 'Scale',
  'howItWorks.step.2.description':
    '혼자 시작하고, 준비되면 팀을 초대하세요. 역할 기반 접근 제어와 충돌 감지가 내장되어 있습니다.',

  // Social Proof
  'social.sectionLabel': '// By the Numbers',
  'social.stat.0.label': '팀',
  'social.stat.1.label': '세션 아카이브',
  'social.stat.2.label': '충돌 사전 방지',
  'social.stat.3.label': '평균 달성률',
  'social.testimonial.0.quote':
    '"Claude Code 세션이 날아가는 게 제일 무서웠는데, 이제 팀 전체 히스토리가 검색 가능해졌어요."',
  'social.testimonial.0.author': '— 프론트엔드 리드, 스타트업 A',
  'social.testimonial.1.quote':
    '"같은 파일 동시 작업하다 머지 지옥 빠지는 일이 확 줄었습니다. 충돌 감지가 핵심이에요."',
  'social.testimonial.1.author': '— CTO, 스타트업 B',

  // Terminal Demo
  'demo.sectionLabel': '// Terminal Demo',
  'demo.scanning': '⠋ 로컬 세션 스캔 중...',
  'demo.found': '✓ 3개 새 세션 발견',
  'demo.uploaded': '✓ 업로드 완료 — 1,247 메시지, 34 파일 변경',
  'demo.conflict1': '⚠ src/auth/session.ts — dev-A, dev-B 동시 작업',
  'demo.conflict2': '⚠ src/api/routes.ts — dev-A, dev-C 동시 작업',
  'demo.notified': '→ 관련 팀원에게 알림을 전송했습니다.',

  // Docs
  'docs.hero.title': 'ContextSync 활용법을 알아보세요',
  'docs.hero.subtitle': '팀의 Claude Code 세션을 아카이브 · 동기화 · 검색 · 충돌 감지',
  'docs.hero.highlight.0.title': 'Session Sync',
  'docs.hero.highlight.0.desc': 'Claude Code 세션을 자동으로 가져오고 아카이브',
  'docs.hero.highlight.1.title': 'Conflict Detection',
  'docs.hero.highlight.1.desc': '머지 지옥이 되기 전에 파일 충돌을 감지',
  'docs.hero.highlight.2.title': 'Full-Text Search',
  'docs.hero.highlight.2.desc': '모든 세션, 메시지, 코드 변경사항을 검색',
  'docs.hero.cta': '시작하기',
  'docs.toc.title': '목차',
  'docs.toc.gettingStarted': '시작하기',
  'docs.toc.features': '기능',
  'docs.toc.faq': 'FAQ',
  'docs.gettingStarted.title': '시작하기',
  'docs.gettingStarted.step.0.title': '프로젝트 생성',
  'docs.gettingStarted.step.0.desc':
    '이름을 입력하고 로컬 작업 디렉토리를 연결하세요. 프로젝트는 모든 세션, 충돌, 분석을 한 곳에 그룹화합니다.',
  'docs.gettingStarted.step.1.title': '첫 세션 동기화',
  'docs.gettingStarted.step.1.desc':
    '로컬 Claude Code 세션을 스캔하고 가져오세요. .claude/ 디렉토리에서 대화, 파일 변경, 토큰 사용량을 읽어 업로드합니다.',
  'docs.gettingStarted.step.2.title': '대시보드 탐색',
  'docs.gettingStarted.step.2.desc':
    '세션 통계, 타임라인, 토큰 사용량 차트, 핫 파일을 확인하세요. 대시보드에서 팀의 AI 활동을 실시간으로 파악할 수 있습니다.',
  'docs.gettingStarted.step.3.title': '팀 초대',
  'docs.gettingStarted.step.3.desc':
    'Owner, Admin, Member 역할로 협업자를 추가하세요. 각 역할은 프로젝트와 세션 관리에 대해 다른 권한을 가집니다.',
  'docs.features.title': '기능',
  'docs.features.learnMore': '자세히 보기',
  'docs.features.0.title': 'Session Sync',
  'docs.features.0.summary':
    '로컬 .claude/ 디렉토리에서 세션을 스캔합니다. 자동/수동 가져오기와 동기화 상태 추적을 지원합니다.',
  'docs.features.0.detail':
    '세션 동기화는 로컬 Claude Code 세션 파일을 읽어 대화와 파일 변경사항을 추출하고 프로젝트에 업로드합니다. 수동 스캔을 트리거하거나 자동 감지를 사용할 수 있습니다. 각 동기화는 상태(대기, 동기화 중, 완료, 실패)를 표시합니다.',
  'docs.features.1.title': 'Conflict Detection',
  'docs.features.1.summary':
    '여러 팀원이 같은 파일을 편집할 때 자동 감지합니다. 심각도 배지(info, warning, critical)와 상태 흐름 추적.',
  'docs.features.1.detail':
    '두 명 이상의 팀원이 겹치는 세션에서 같은 파일을 수정하면 잠재적 충돌을 표시합니다. 심각도별로 자동 분류되며 — info는 저위험, warning은 중간 겹침, critical은 같은 코드 블록 직접 편집입니다. 구조화된 워크플로우(감지됨 → 검토 중 → 해결됨)를 통해 충돌을 관리합니다.',
  'docs.features.2.title': 'Dashboard',
  'docs.features.2.summary':
    '오늘/주간 세션 수, 활성 충돌, 토큰 사용량 차트, 핫 파일 목록을 한눈에.',
  'docs.features.2.detail':
    '대시보드는 팀의 커맨드 센터입니다. 오늘의 세션 수, 주간 트렌드, 활성 충돌 알림, 모델별 토큰 사용량, 가장 자주 수정되는 "핫 파일" 목록을 보여줍니다. 병목을 발견하고 팀의 AI 사용 패턴을 이해하는 데 활용하세요.',
  'docs.features.3.title': 'PRD Analysis',
  'docs.features.3.summary':
    'PRD 문서를 업로드하면 Claude가 세션 전반에 걸쳐 요구사항 달성률을 분석합니다.',
  'docs.features.3.detail':
    'PRD를 업로드하면 Claude API로 분석을 보냅니다. 개별 요구사항을 추출하고 세션이 각 요구사항을 얼마나 충족하는지 추적합니다. 요구사항별 달성률과 전체 점수를 제공하여 누락되는 항목이 없도록 합니다.',
  'docs.features.4.title': 'Plans',
  'docs.features.4.summary': '프로젝트 연결이 가능한 마크다운 플랜을 생성하고 확인하세요.',
  'docs.features.4.detail':
    '플랜은 구현 전략, 아키텍처 결정, 작업 분류를 설명하는 마크다운 문서입니다. 각 플랜은 프로젝트에 연결할 수 있어 세션의 계획 맥락을 쉽게 찾을 수 있습니다. 코드 블록, 목록, 제목을 포함한 전체 마크다운 렌더링을 지원합니다.',
  'docs.features.5.title': 'Search',
  'docs.features.5.summary':
    '모든 세션과 메시지에 대한 전문 검색. 어떤 대화든 코드 변경이든 즉시 검색.',
  'docs.features.5.detail':
    'PostgreSQL 전문 검색을 사용하며 세션과 메시지에 tsvector 인덱스를 적용합니다. 키워드, 파일 경로, 코드 스니펫으로 전체 세션 히스토리를 검색할 수 있습니다. 결과는 관련도순으로 정렬되고 세션별로 그룹화됩니다.',
  'docs.features.6.title': 'Team Collaboration',
  'docs.features.6.summary':
    'Owner, Admin, Member 역할 기반 접근 제어. 협업자를 초대하고 권한을 관리하세요.',
  'docs.features.6.detail':
    '프로젝트는 세 가지 역할을 지원합니다: Owner(삭제 포함 전체 권한), Admin(멤버와 세션 관리), Member(세션 조회와 동기화). GitHub 사용자명으로 팀원을 초대하고 설정에서 역할을 관리하세요.',
  'docs.faq.title': '자주 묻는 질문',
  'docs.faq.0.q': '세션 동기화는 어떤 데이터를 수집하나요?',
  'docs.faq.0.a':
    '로컬 .claude/ 디렉토리에서 대화 메시지, 파일 변경 메타데이터(경로와 변경 유형), 토큰 사용량, 세션 타임스탬프를 수집합니다. 실제 소스 코드는 업로드하지 않습니다.',
  'docs.faq.1.q': '감지된 충돌을 어떻게 해결하나요?',
  'docs.faq.1.a':
    'Conflicts 페이지에서 충돌을 클릭하여 상세 정보를 확인한 후, "Start Review"를 클릭하여 검토 상태로 이동합니다. 팀원과 조율 후 "Resolve"를 클릭하여 해결 완료로 표시합니다.',
  'docs.faq.2.q': 'PRD 분석에 Anthropic API 키가 필요한가요?',
  'docs.faq.2.a':
    '네. PRD 분석은 Claude API를 사용합니다. 서버에 ANTHROPIC_API_KEY 환경 변수를 설정하세요. 없으면 PRD 분석 기능을 사용할 수 없습니다.',
  'docs.faq.3.q': '팀 역할의 차이점은 무엇인가요?',
  'docs.faq.3.a':
    'Owner: 삭제와 역할 관리를 포함한 전체 프로젝트 제어. Admin: 멤버, 세션, 충돌 관리. Member: 데이터 조회와 자신의 세션 동기화. 모든 역할에서 검색과 세션 탐색이 가능합니다.',
  'docs.faq.4.q': '무엇을 검색할 수 있나요?',
  'docs.faq.4.a':
    '세션 제목, 대화 메시지, 파일 경로를 검색할 수 있습니다. PostgreSQL 전문 검색 인덱스를 사용하므로 자연어 쿼리와 부분 매칭을 지원합니다.',
  'docs.faq.5.q': '로컬 세션은 어디에 저장되나요?',
  'docs.faq.5.a':
    'Claude Code는 프로젝트 루트의 .claude/ 디렉토리에 세션 데이터를 저장합니다. 세션 스캔을 트리거하면 이 디렉토리에서 읽습니다. 명시적으로 동기화하기 전까지 데이터는 로컬에 남아있습니다.',

  // Deploy Modes
  'deployModes.sectionLabel': '// Deploy Your Way',
  'deployModes.title': '하나의 도구, 세 가지 모드',
  'deployModes.subtitle': '개인 아카이브부터 팀 동기화까지 — 맞는 설정을 선택하세요',
  'deployModes.0.title': 'Personal',
  'deployModes.0.description': '솔로 개발자, 로컬 환경',
  'deployModes.0.detail.0': '로컬 Docker PostgreSQL — 설정 불필요',
  'deployModes.0.detail.1': '개인 세션 아카이브 및 검색',
  'deployModes.0.detail.2': '토큰 사용량 추적 및 비용 분석',
  'deployModes.1.title': 'Team Host',
  'deployModes.1.description': '팀을 위한 공유 DB를 호스팅하는 관리자',
  'deployModes.1.detail.0': '팀 역할이 포함된 SSL 지원 PostgreSQL',
  'deployModes.1.detail.1': '중앙 집중식 마이그레이션 및 접근 제어',
  'deployModes.1.detail.2': '대화형 설정 마법사 포함',
  'deployModes.2.title': 'Team Member',
  'deployModes.2.description': '팀에 연결 — Docker 불필요',
  'deployModes.2.detail.0': '원격 DB를 가리키고 pnpm dev 실행',
  'deployModes.2.detail.1': '충돌 감지 및 알림 완전 지원',
  'deployModes.2.detail.2': '공유 세션, 검색, 대시보드',

  // Login
  'login.backToHome': '\u2190 홈으로',

  // Nav (additional)
  'nav.docs': '문서',
  'nav.github': 'GitHub',

  // Hero (additional)
  'hero.cta.viewOnGithub': 'View on GitHub',

  // Quick Start
  'quickstart.sectionLabel': '// Quick Start',
  'quickstart.title': '3개 명령어로 시작',
  'quickstart.prerequisites': '필수 조건: Node.js 22 \u00b7 pnpm 9+ \u00b7 Docker',
  'quickstart.copied': '복사됨!',

  // Tech Stack
  'techstack.sectionLabel': '// Built With',
  'techstack.frontend': 'Frontend',
  'techstack.backend': 'Backend',
  'techstack.database': 'Database',
  'techstack.tooling': 'Tooling',

  // Contributing
  'contributing.sectionLabel': '// Open Source',
  'contributing.title': 'MIT 라이선스 & 기여 환영',
  'contributing.subtitle': 'Star, fork, 또는 이슈를 열어주세요 — 모든 기여를 환영합니다.',
  'contributing.guide': '기여 가이드 읽기',
  'contributing.issues': '이슈 제출',

  // Footer
  'footer.cta.title': 'AI 워크플로우를 동기화하세요',
  'footer.cta.subtitle': '무료로 시작하세요. Docker로 로컬 실행하거나 팀 DB에 연결하세요.',
  'footer.cta.button': '시작하기',
  'footer.link.docs': 'Docs',
  'footer.link.github': 'GitHub',
  'footer.link.contact': 'Contact',
  'footer.link.contributing': 'Contributing',
  'footer.link.license': 'MIT License',
};
