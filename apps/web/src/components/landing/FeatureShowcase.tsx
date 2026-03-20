import { useInView } from './use-in-view';

interface HeroFeature {
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly details: readonly string[];
}

interface SubFeature {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

const HERO_FEATURES: readonly HeroFeature[] = [
  {
    label: '01',
    title: 'Session Archive & Sync',
    description: '세션을 팀의 지식 자산으로',
    details: [
      'Claude Code 세션 자동 수집 및 아카이브',
      '프로젝트별 세션 그룹핑 및 타임라인',
      '메시지 단위 전문 검색 (Full-text search)',
      '토큰 사용량 및 비용 분석 대시보드',
    ],
  },
  {
    label: '02',
    title: 'Conflict Detection',
    description: '머지 전에 충돌을 감지',
    details: [
      '같은 파일을 동시 작업 중인 팀원 실시간 감지',
      '충돌 심각도 자동 분류 (Critical / High / Medium / Low)',
      '파일별 · 모듈별 충돌 히트맵',
      '팀원에게 즉시 알림 전송',
    ],
  },
  {
    label: '03',
    title: 'PRD Analysis',
    description: 'AI가 분석하는 요구사항 달성률',
    details: [
      'PRD 문서 업로드 및 자동 요구사항 추출',
      '세션 대화 기반 달성률 자동 계산',
      '요구사항별 상세 상태 추적',
      '변화율 트렌드 차트 및 리포트',
    ],
  },
];

const SUB_FEATURES: readonly SubFeature[] = [
  {
    title: 'Dashboard & Analytics',
    description: '팀 전체의 AI 작업 현황을 실시간 타임라인과 통계로 한눈에 파악',
    icon: '📊',
  },
  {
    title: 'Full-text Search',
    description: '수천 개의 세션에서 필요한 대화를 즉시 검색. 메시지 · 파일 · 코드 단위 필터링',
    icon: '🔍',
  },
  {
    title: 'Team Collaboration',
    description: '역할 기반 접근 제어 (Owner / Admin / Member). 팀원 초대 및 프로젝트 공유',
    icon: '👥',
  },
  {
    title: 'Local Session Sync',
    description: '로컬 Claude Code 세션을 원클릭으로 팀에 공유. 자동 프로젝트 매칭',
    icon: '⚡',
  },
];

function HeroFeatureCard({ feature, index }: { readonly feature: HeroFeature; readonly index: number }) {
  const { ref, isVisible } = useInView();
  const isReversed = index % 2 === 1;

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-8 md:flex-row md:items-center ${isReversed ? 'md:flex-row-reverse' : ''} transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-default font-mono text-xs text-text-muted">
            {feature.label}
          </span>
          <h3 className="font-mono text-base font-medium text-text-primary">{feature.title}</h3>
        </div>
        <p className="font-mono text-sm text-text-secondary">{feature.description}</p>
      </div>
      <div className="flex-1 rounded-lg border-l-2 border-text-muted bg-surface p-6">
        <ul className="space-y-2">
          {feature.details.map((detail) => (
            <li key={detail} className="flex items-start gap-2 font-mono text-xs text-text-tertiary">
              <span className="mt-0.5 text-text-muted">›</span>
              {detail}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SubFeatureCard({ feature }: { readonly feature: SubFeature }) {
  return (
    <div className="rounded-lg border border-border-default bg-surface p-6 transition-colors hover:border-text-muted">
      <div className="mb-3 text-lg">{feature.icon}</div>
      <h4 className="mb-2 font-mono text-sm font-medium text-text-primary">{feature.title}</h4>
      <p className="font-mono text-xs leading-relaxed text-text-tertiary">{feature.description}</p>
    </div>
  );
}

export function FeatureShowcase() {
  const { ref, isVisible } = useInView();

  return (
    <section id="features" className="bg-page py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-16 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          // Features
        </p>

        <div className="space-y-16">
          {HERO_FEATURES.map((feature, i) => (
            <HeroFeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>

        <div
          ref={ref}
          className={`mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {SUB_FEATURES.map((feature) => (
            <SubFeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
