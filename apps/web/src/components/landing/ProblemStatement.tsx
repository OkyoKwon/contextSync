import { TerminalWindow } from './TerminalWindow';
import { useInView } from './use-in-view';

const TERMINAL_LINES = [
  { type: 'prompt', user: 'dev-A', text: 'claude "auth 모듈 리팩토링해줘"' },
  { type: 'output', text: '→ src/auth/middleware.ts 수정 중...' },
  { type: 'output', text: '→ src/auth/session.ts 수정 중...' },
  { type: 'spacer' },
  { type: 'prompt', user: 'dev-B', text: 'claude "세션 관리 로직 개선해줘"' },
  { type: 'output', text: '→ src/auth/session.ts 수정 중...' },
  { type: 'output', text: '→ src/auth/token.ts 수정 중...' },
  { type: 'spacer' },
  { type: 'conflict', text: '⚠ CONFLICT: src/auth/session.ts — 2명이 동시 작업 중' },
  { type: 'spacer' },
  { type: 'solution', text: '$ contextsync detect --project team-alpha' },
  { type: 'solution', text: '✓ 충돌 사전 감지 완료 — dev-A, dev-B에게 알림 전송' },
] as const;

export function ProblemStatement() {
  const { ref, isVisible } = useInView();

  return (
    <section
      id="problem"
      ref={ref}
      className={`bg-surface-sunken py-20 md:py-28 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-12 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          // Why ContextSync
        </p>

        <TerminalWindow title="~/team-project" className="mx-auto max-w-2xl">
          <div className="space-y-1">
            {TERMINAL_LINES.map((line, i) => {
              if (line.type === 'spacer') {
                return <div key={i} className="h-3" />;
              }
              if (line.type === 'prompt') {
                return (
                  <div key={i}>
                    <span className="text-green-400">{line.user}@project</span>
                    <span className="text-zinc-500">:~$ </span>
                    <span className="text-zinc-200">{line.text}</span>
                  </div>
                );
              }
              if (line.type === 'conflict') {
                return (
                  <div key={i} className="text-red-400 font-medium">
                    {line.text}
                  </div>
                );
              }
              if (line.type === 'solution') {
                return (
                  <div key={i} className="text-emerald-400">
                    {line.text}
                  </div>
                );
              }
              return (
                <div key={i} className="text-zinc-500">
                  {line.text}
                </div>
              );
            })}
          </div>
        </TerminalWindow>

        <p className="mt-12 text-center font-mono text-sm text-text-tertiary">
          팀이 AI와 함께 일할 때, <span className="text-text-primary font-medium">컨텍스트 동기화는 필수</span>입니다
        </p>
      </div>
    </section>
  );
}
