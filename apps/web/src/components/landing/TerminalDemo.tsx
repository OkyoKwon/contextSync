import { TerminalWindow } from './TerminalWindow';
import { useInView } from './use-in-view';

const DEMO_LINES = [
  { delay: 0, content: '$ contextsync sync --project team-alpha', style: 'text-zinc-200' },
  { delay: 1, content: '⠋ 로컬 세션 스캔 중...', style: 'text-zinc-500' },
  { delay: 2, content: '✓ 3개 새 세션 발견', style: 'text-emerald-400' },
  { delay: 3, content: '✓ 업로드 완료 — 1,247 메시지, 34 파일 변경', style: 'text-emerald-400' },
  { delay: 4, content: '', style: '' },
  { delay: 5, content: '┌─────────────────────────────────────────┐', style: 'text-zinc-500' },
  { delay: 5, content: '│  Dashboard Summary                      │', style: 'text-zinc-400' },
  { delay: 5, content: '├─────────────────────────────────────────┤', style: 'text-zinc-500' },
  { delay: 6, content: '│  Sessions today    12                   │', style: 'text-zinc-300' },
  { delay: 6, content: '│  Active members     4                   │', style: 'text-zinc-300' },
  { delay: 6, content: '│  Tokens used       847K                 │', style: 'text-zinc-300' },
  { delay: 7, content: '│  Conflicts found    2  ⚠                │', style: 'text-yellow-400' },
  { delay: 7, content: '└─────────────────────────────────────────┘', style: 'text-zinc-500' },
  { delay: 8, content: '', style: '' },
  { delay: 9, content: '$ contextsync conflicts --severity high', style: 'text-zinc-200' },
  { delay: 10, content: '⚠ src/auth/session.ts — dev-A, dev-B 동시 작업', style: 'text-red-400' },
  { delay: 11, content: '⚠ src/api/routes.ts — dev-A, dev-C 동시 작업', style: 'text-red-400' },
  { delay: 12, content: '→ 관련 팀원에게 알림을 전송했습니다.', style: 'text-emerald-400' },
];

export function TerminalDemo() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section
      ref={ref}
      className={`bg-page py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-12 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          // Terminal Demo
        </p>

        <TerminalWindow title="~/team-alpha — contextsync" className="mx-auto max-w-2xl">
          <div className="space-y-0.5">
            {DEMO_LINES.map((line, i) => {
              if (!line.content) {
                return <div key={i} className="h-3" />;
              }
              return (
                <div
                  key={i}
                  className={`${line.style} whitespace-pre ${
                    isVisible ? 'animate-[fadeIn_0.3s_ease-out_forwards]' : 'opacity-0'
                  }`}
                  style={{
                    animationDelay: isVisible ? `${line.delay * 0.3}s` : '0s',
                    opacity: isVisible ? undefined : 0,
                  }}
                >
                  {line.content}
                </div>
              );
            })}
          </div>
        </TerminalWindow>
      </div>
    </section>
  );
}
