import type { TranslationKeys } from '../types';

export const ko: TranslationKeys = {
  // App
  'app.loading': '준비 중...',

  // Nav
  'nav.login': '로그인',

  // Hero
  'hero.title': 'AI 세션 컨텍스트의 중심',
  'hero.subtitle': 'Claude Code 세션을 관리하세요 — 혼자서도, 팀과 함께도',
  'hero.cta.login': '시작하기',
  'hero.cta.features': 'Features 살펴보기',

  // Problem Statement
  'problem.sectionLabel': '// Why ContextSync',
  'problem.solo.label': 'Solo Developer',
  'problem.solo.prompt1': 'claude "지난주 결제 모듈 이어서 작업해줘"',
  'problem.solo.output1': '→ 세션 컨텍스트를 찾을 수 없습니다... 처음부터 시작',
  'problem.solo.output2': '→ 어떤 파일을 수정했지? 접근 방식은?',
  'problem.solo.prompt2': 'contextsync restore --last "payment module"',
  'problem.solo.output3': '✓ 세션 복원 완료 — 47개 메시지, 12개 파일, 전체 컨텍스트 로드',
  'problem.team.label': 'Team Collaboration',
  'problem.team.prompt1': 'claude "auth 모듈 리팩토링해줘"',
  'problem.team.output1': '→ src/auth/middleware.ts 수정 중...',
  'problem.team.output2': '→ src/auth/session.ts 수정 중...',
  'problem.team.prompt2': 'claude "세션 관리 로직 개선해줘"',
  'problem.team.output3': '→ src/auth/session.ts 수정 중...',
  'problem.team.output4': '→ src/auth/token.ts 수정 중...',
  'problem.team.conflict': '⚠ CONFLICT: src/auth/session.ts — 2명이 동시 작업 중',
  'problem.team.resolved': '✓ 충돌 사전 감지 완료 — dev-A, dev-B에게 알림 전송',
  'problem.conclusion': '개인의 컨텍스트 복원부터 팀 충돌 방지까지, ',
  'problem.conclusionHighlight': 'ContextSync가 모든 세션을 연결합니다',
  'problem.conclusionEnd': '',

  // Features
  'features.sectionLabel': '// Features',
  'features.hero.0.title': 'Session Archive & Sync',
  'features.hero.0.description': '세션을 팀의 지식 자산으로',
  'features.hero.0.detail.0': 'Claude Code (CLI) 세션 자동 수집 및 아카이브',
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

  // How It Works
  'howItWorks.sectionLabel': '// How It Works',
  'howItWorks.step.0.title': 'Import',
  'howItWorks.step.0.description':
    '로컬 Claude Code (CLI) 세션을 프로젝트에 동기화하거나, 다른 AI 도구의 세션 파일을 직접 업로드합니다.',
  'howItWorks.step.1.title': 'Analyze',
  'howItWorks.step.1.description':
    '충돌 감지, PRD 달성률 분석, 토큰 사용량 추적을 자동으로 수행합니다.',
  'howItWorks.step.2.title': 'Scale',
  'howItWorks.step.2.description':
    '혼자 시작하고, 준비되면 팀을 초대하세요. 역할 기반 접근 제어와 충돌 감지가 내장되어 있습니다.',

  // Social Proof
  'social.sectionLabel': '// Platform Overview',
  'social.stat.0.label': 'API 모듈',
  'social.stat.1.label': '배포 모드',
  'social.stat.2.label': '심각도 레벨',
  'social.stat.3.label': '핵심 기능',
  'social.testimonial.0.quote':
    '"Claude Code 세션이 날아가는 게 제일 무서웠는데, 이제 팀 전체 히스토리가 검색 가능해졌어요."',
  'social.testimonial.0.author': '— 프론트엔드 리드, 스타트업 A',
  'social.testimonial.1.quote':
    '"같은 파일 동시 작업하다 머지 지옥 빠지는 일이 확 줄었습니다. 충돌 감지가 핵심이에요."',
  'social.testimonial.1.author': '— CTO, 스타트업 B',

  // Docs
  'docs.hero.title': 'ContextSync 활용법을 알아보세요',
  'docs.hero.subtitle': '팀의 Claude Code 세션을 아카이브 · 동기화 · 검색 · 충돌 감지',
  'docs.hero.highlight.0.title': 'Session Sync',
  'docs.hero.highlight.0.desc': 'Claude Code (CLI) 세션을 자동으로 가져오고 아카이브',
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
    '로컬 .claude/ 디렉토리에서 Claude Code (CLI) 세션을 스캔합니다. 다른 AI 도구는 수동 파일 임포트도 지원합니다.',
  'docs.features.0.detail':
    '세션 동기화는 로컬 Claude Code (CLI) 세션 파일을 읽어 대화와 파일 변경사항을 추출하고 프로젝트에 업로드합니다. 수동 스캔을 트리거하거나 자동 감지를 사용할 수 있습니다. 다른 도구(claude.ai 웹, Cursor, Windsurf 등)는 Import 버튼으로 세션 파일을 직접 업로드할 수 있습니다. 각 동기화는 상태(대기, 동기화 중, 완료, 실패)를 표시합니다.',
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
  'docs.features.7.title': 'AI Evaluation',
  'docs.features.7.summary': '팀원의 AI 활용도를 세션 단위로 분석하고 다차원 평가로 점수화합니다.',
  'docs.features.7.detail':
    'AI 평가는 각 팀원의 Claude Code 세션을 분석하여 코드 품질, 대화 깊이, 도구 사용 패턴, 작업 완료율 등 여러 차원에서 활용도 점수를 산출합니다. 각 점수에는 상세한 근거와 추론이 포함되어 팀이 AI 지원을 얼마나 효과적으로 활용하는지 파악하고 개선 영역을 식별하는 데 도움을 줍니다.',
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
    'Claude Code (CLI)는 프로젝트 루트의 .claude/ 디렉토리에 세션 데이터를 저장합니다. 세션 스캔을 트리거하면 이 디렉토리에서 읽습니다. 다른 AI 도구(claude.ai 웹, Cursor, Windsurf 등)의 세션은 Import 버튼으로 수동 업로드할 수 있습니다.',

  // Upgrade
  'upgrade.modal.title': '계정 설정',
  'upgrade.modal.description': '팀 기능을 사용하려면 이름과 이메일을 입력하세요',
  'upgrade.modal.submit': '계정 설정 완료',
  'upgrade.banner': '팀 기능을 사용하려면 계정을 설정하세요',
  'upgrade.settings.title': '이메일 연결',
  'upgrade.settings.description':
    '이메일을 연결하면 팀 기능을 사용하고 다른 기기에서도 접근할 수 있습니다.',
  'upgrade.settings.benefit.invite': '팀 초대 받기',
  'upgrade.settings.benefit.notification': '알림 수신',
  'upgrade.settings.benefit.multiDevice': '다른 기기에서 접근',
  'upgrade.settings.cta': '이메일 연결',

  // User Dropdown
  'user.localUser': '로컬 사용자',
  'user.linkEmail': '이메일 연결',

  // App Entry
  'app.connectionError': '서버에 연결할 수 없습니다',
  'app.retry': '재시도',

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

  // Screenshot Alt
  'screenshot.alt.dashboard': 'ContextSync 대시보드 개요',
  'screenshot.alt.sessionConversation': '세션 대화 뷰',
  'screenshot.alt.conflictsList': '충돌 감지 목록',
  'screenshot.alt.prdAnalysis': 'PRD 분석 결과',
  'screenshot.alt.searchOverlay': '전문 검색 오버레이',
  'screenshot.alt.settingsTeam': '팀 설정 및 멤버 관리',
  'screenshot.alt.aiEvaluation': 'AI 평가 점수',

  // Open Source
  'openSource.sectionLabel': '// Open Source',
  'openSource.title': 'MIT 라이선스 & 커뮤니티 주도',
  'openSource.subtitle': '오픈 소스로 개발됩니다. Fork하고, 확장하고, 나만의 것으로 만드세요.',
  'openSource.license.title': 'MIT License',
  'openSource.license.description': '자유롭게 사용, 수정, 배포하세요. 벤더 종속 없이, 조건 없이.',
  'openSource.community.title': '커뮤니티 우선',
  'openSource.community.description':
    '개발자가, 개발자를 위해 만듭니다. 모든 기능은 실제 사용 경험에서 나옵니다.',
  'openSource.contributors.title': '열린 기여',
  'openSource.contributors.description':
    'PR을 환영합니다. 기여 가이드를 확인하고 몇 분 안에 시작하세요.',
  'openSource.cta.star': 'Star on GitHub',
  'openSource.cta.contributing': '기여 가이드',
  'openSource.cta.issues': '이슈 제출',

  // Hero (additional CTA)
  'hero.cta.getStarted': '시작하기',

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
