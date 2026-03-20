const FEATURES = [
  {
    title: 'Session Archive',
    description:
      'Claude AI 세션을 팀 단위로 자동 수집·검색. 대화 히스토리를 지식 자산으로 보존',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v16H4z" />
        <path d="M4 9h16" />
        <path d="M9 4v5" />
        <path d="M8 14h4" />
        <path d="M8 17h2" />
      </svg>
    ),
  },
  {
    title: 'Conflict Detection',
    description:
      '같은 파일/모듈을 동시에 작업 중인 팀원을 감지하고, 머지 전 충돌 사전 경고',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  {
    title: 'Team Dashboard',
    description:
      '팀 전체의 AI 작업 현황을 실시간 타임라인과 통계로 한눈에 파악',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 4-6" />
      </svg>
    ),
  },
  {
    title: 'One-click Sync',
    description:
      '로컬 Claude Code 세션을 원클릭으로 팀에 공유. 프로젝트별 자동 그룹핑',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12l8-8 8 8" />
        <path d="M12 4v16" />
        <path d="M4 20h16" />
      </svg>
    ),
  },
] as const;

interface FeatureCardProps {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-[#1C1C1C] p-6">
      <div className="mb-3 text-[#A1A1AA]">{icon}</div>
      <h3 className="mb-2 font-mono text-sm font-medium text-[#FAFAFA]">
        {title}
      </h3>
      <p className="font-mono text-xs leading-relaxed text-[#A1A1AA]">
        {description}
      </p>
    </div>
  );
}

export function FeatureCards() {
  return (
    <section id="features" className="border-t border-zinc-800 bg-[#111111]">
      <div className="mx-auto w-full max-w-2xl px-6 py-24">
        <p className="mb-10 text-center font-mono text-xs uppercase tracking-widest text-[#A1A1AA]">
          What ContextSync does
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>      </div>
    </section>
  );
}
