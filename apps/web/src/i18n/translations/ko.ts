import type { TranslationKeys } from '../types';

export const ko: TranslationKeys = {
  // Nav
  'nav.login': 'GitHub Login',

  // Hero
  'hero.title': 'AI 세션 컨텍스트의 중심',
  'hero.subtitle': '팀의 Claude Code 세션을 아카이브 · 동기화 · 검색 · 충돌 감지',
  'hero.cta.github': 'Continue with GitHub',
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
  'problem.conclusion': '팀이 AI와 함께 일할 때, ',
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
  'howItWorks.step.2.title': 'Collaborate',
  'howItWorks.step.2.description':
    '팀원들과 세션을 공유하고, 충돌을 사전 방지하며, 지식을 축적합니다.',

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

  // Footer
  'footer.cta.title': '팀의 AI 워크플로우를 동기화하세요',
  'footer.cta.subtitle': '무료로 시작하세요. 설치 없이 GitHub 계정만으로 바로 사용 가능합니다.',
  'footer.cta.button': 'Continue with GitHub',
  'footer.link.docs': 'Docs',
  'footer.link.github': 'GitHub',
  'footer.link.contact': 'Contact',
};
