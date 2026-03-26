import type React from 'react';
import type { EvaluationPerspective } from '@context-sync/shared';

interface ModelIconProps {
  perspective: EvaluationPerspective;
  className?: string;
  size?: number;
}

function ClaudeIcon({ size = 20 }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.31 2 8.93 21.19 7.35 17.1l4.52-10.22L16.31 2ZM20.26 12.42l-3.5 8.77-1.57-4.09 1.93-4.68 3.14 0ZM3.74 12.42l3.14 0 1.93 4.68-1.57 4.09-3.5-8.77Z"
        fill="#F97316"
      />
    </svg>
  );
}

function ChatGPTIcon({ size = 20 }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.28 9.37a6.2 6.2 0 0 0-.53-5.1 6.26 6.26 0 0 0-6.77-3.03A6.2 6.2 0 0 0 10.31.02a6.26 6.26 0 0 0-5.97 4.33 6.2 6.2 0 0 0-4.15 3.01 6.27 6.27 0 0 0 .77 7.34 6.2 6.2 0 0 0 .53 5.1 6.26 6.26 0 0 0 6.77 3.03 6.2 6.2 0 0 0 4.67 1.22 6.26 6.26 0 0 0 5.97-4.33 6.2 6.2 0 0 0 4.15-3.01 6.27 6.27 0 0 0-.77-7.34ZM14.93 21.5a4.69 4.69 0 0 1-3.01-1.09l.15-.08 5-2.88a.81.81 0 0 0 .41-.71v-7.04l2.11 1.22a.07.07 0 0 1 .04.06v5.83a4.71 4.71 0 0 1-4.7 4.7ZM3.96 17.63a4.68 4.68 0 0 1-.56-3.16l.15.09 5 2.89a.82.82 0 0 0 .82 0l6.1-3.53v2.44a.08.08 0 0 1-.03.07l-5.06 2.92a4.71 4.71 0 0 1-6.42-1.72ZM2.68 7.88A4.69 4.69 0 0 1 5.13 5.8l0 .17v5.77a.81.81 0 0 0 .41.71l6.1 3.52-2.12 1.22a.08.08 0 0 1-.07 0L4.39 14.3a4.71 4.71 0 0 1-1.71-6.42Zm17.06 3.97-6.1-3.53 2.11-1.22a.08.08 0 0 1 .07 0l5.06 2.92a4.7 4.7 0 0 1-.73 8.49v-5.95a.82.82 0 0 0-.41-.71Zm2.1-3.18-.15-.09-5-2.89a.82.82 0 0 0-.82 0l-6.1 3.53V6.78a.08.08 0 0 1 .03-.07l5.06-2.91a4.71 4.71 0 0 1 6.98 4.87ZM8.07 13.53l-2.12-1.22a.07.07 0 0 1-.04-.06V6.42a4.71 4.71 0 0 1 7.72-3.61l-.15.08-5 2.88a.81.81 0 0 0-.41.71v7.05Zm1.15-2.48L12 9.42l2.78 1.6v3.22L12 15.84l-2.78-1.6v-3.21Z"
        fill="#10B981"
      />
    </svg>
  );
}

function GeminiIcon({ size = 20 }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 24C12 18.84 10.56 15.96 8.28 13.72 6.04 11.44 3.16 10 0 10c3.16 0 6.04-1.44 8.28-3.72C10.56 4.04 12 1.16 12 0c0 1.16 1.44 4.04 3.72 6.28C17.96 8.56 20.84 10 24 10c-3.16 0-6.04 1.44-8.28 3.72C13.44 15.96 12 18.84 12 24Z"
        fill="#60A5FA"
      />
    </svg>
  );
}

const ICON_MAP: Record<EvaluationPerspective, (props: { size: number }) => React.ReactNode> = {
  claude: ClaudeIcon,
  chatgpt: ChatGPTIcon,
  gemini: GeminiIcon,
};

export function ModelIcon({ perspective, className, size = 20 }: ModelIconProps) {
  const Icon = ICON_MAP[perspective];
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <Icon size={size} />
    </span>
  );
}
