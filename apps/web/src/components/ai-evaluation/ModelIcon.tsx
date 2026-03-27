import type { EvaluationPerspective } from '@context-sync/shared';

interface ModelIconProps {
  perspective: EvaluationPerspective;
  className?: string;
  size?: number;
}

const ICON_SRC: Partial<Record<EvaluationPerspective, string>> = {
  claude: '/icons/claude.png',
  chatgpt: '/icons/chatgpt.png',
  gemini: '/icons/gemini.webp',
};

const ICON_STYLE: Partial<Record<EvaluationPerspective, string>> = {
  claude: 'rounded-md',
  chatgpt: 'dark:invert',
  gemini: '',
};

export function ModelIcon({ perspective, className, size = 20 }: ModelIconProps) {
  const src = ICON_SRC[perspective];

  // 4D Framework uses a text badge instead of an image
  if (!src) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          fontSize: size * 0.5,
          fontWeight: 700,
          borderRadius: 4,
          background: 'rgba(168, 85, 247, 0.2)',
          color: 'rgb(168, 85, 247)',
        }}
      >
        4D
      </span>
    );
  }

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <img
        src={src}
        alt={perspective}
        width={size}
        height={size}
        className={`object-contain ${ICON_STYLE[perspective] ?? ''}`}
      />
    </span>
  );
}
