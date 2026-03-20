import { useInView } from './use-in-view';

const STATS = [
  { value: '100+', label: '팀' },
  { value: '10,000+', label: '세션 아카이브' },
  { value: '5,000+', label: '충돌 사전 방지' },
  { value: '87%+', label: '평균 달성률' },
] as const;

const TESTIMONIALS = [
  {
    quote: '"Claude Code 세션이 날아가는 게 제일 무서웠는데, 이제 팀 전체 히스토리가 검색 가능해졌어요."',
    author: '— 프론트엔드 리드, 스타트업 A',
  },
  {
    quote: '"같은 파일 동시 작업하다 머지 지옥 빠지는 일이 확 줄었습니다. 충돌 감지가 핵심이에요."',
    author: '— CTO, 스타트업 B',
  },
] as const;

export function SocialProof() {
  const { ref, isVisible } = useInView();

  return (
    <section
      ref={ref}
      className={`bg-surface-sunken py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-12 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          // By the Numbers
        </p>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-mono text-2xl font-bold text-text-primary md:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 font-mono text-xs text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.author}
              className="border-l-2 border-text-muted pl-4"
            >
              <p className="font-mono text-sm leading-relaxed text-text-secondary">
                {t.quote}
              </p>
              <footer className="mt-3 font-mono text-xs text-text-muted">
                {t.author}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
