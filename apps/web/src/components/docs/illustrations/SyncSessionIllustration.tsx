export function SyncSessionIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="h-full w-full">
      {/* Terminal window */}
      <rect
        x="20"
        y="30"
        width="65"
        height="80"
        rx="6"
        className="fill-surface stroke-border-default"
        strokeWidth="1.5"
      />
      <rect x="20" y="30" width="65" height="14" rx="6" className="fill-blue-500/10" />
      <circle cx="30" cy="37" r="2" className="fill-red-400" opacity="0.6" />
      <circle cx="37" cy="37" r="2" className="fill-yellow-400" opacity="0.6" />
      <circle cx="44" cy="37" r="2" className="fill-green-400" opacity="0.6" />
      <rect
        x="27"
        y="52"
        width="30"
        height="3"
        rx="1"
        className="fill-text-tertiary"
        opacity="0.3"
      />
      <rect
        x="27"
        y="60"
        width="40"
        height="3"
        rx="1"
        className="fill-text-tertiary"
        opacity="0.3"
      />
      <rect
        x="27"
        y="68"
        width="25"
        height="3"
        rx="1"
        className="fill-text-tertiary"
        opacity="0.3"
      />

      {/* Sync arrows */}
      <path
        d="M95 60 L115 60"
        className="stroke-blue-400"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd="url(#arrowRight)"
      />
      <path
        d="M115 80 L95 80"
        className="stroke-blue-400"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd="url(#arrowLeft)"
      />
      <defs>
        <marker id="arrowRight" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0 0 L8 3 L0 6" className="fill-blue-400" />
        </marker>
        <marker id="arrowLeft" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto">
          <path d="M8 0 L0 3 L8 6" className="fill-blue-400" />
        </marker>
      </defs>

      {/* Cloud */}
      <rect
        x="120"
        y="30"
        width="65"
        height="80"
        rx="6"
        className="fill-surface stroke-border-default"
        strokeWidth="1.5"
      />
      <path
        d="M140 75 Q135 75 133 72 Q131 69 133 66 Q135 62 140 63 Q142 57 148 57 Q154 57 157 61 Q160 59 163 61 Q167 63 165 67 Q168 69 167 72 Q166 75 162 75 Z"
        className="fill-blue-500/15 stroke-blue-400"
        strokeWidth="1.2"
      />
      <path
        d="M145 80 L145 87 M152 80 L152 90 M159 80 L159 85"
        className="stroke-blue-400/50"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
