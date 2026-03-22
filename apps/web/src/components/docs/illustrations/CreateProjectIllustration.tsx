export function CreateProjectIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="h-full w-full">
      {/* Folder body */}
      <rect
        x="40"
        y="45"
        width="120"
        height="80"
        rx="8"
        className="fill-blue-500/10 stroke-blue-400/50"
        strokeWidth="1.5"
      />
      {/* Folder tab */}
      <path
        d="M40 53 L40 40 Q40 35 45 35 L85 35 Q90 35 92 40 L98 50 L40 50 Z"
        className="fill-blue-500/10 stroke-blue-400/50"
        strokeWidth="1.5"
      />
      {/* Plus icon */}
      <circle
        cx="100"
        cy="85"
        r="18"
        className="fill-blue-500/20 stroke-blue-400"
        strokeWidth="1.5"
      />
      <path
        d="M100 76 L100 94 M91 85 L109 85"
        className="stroke-blue-400"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Small dots */}
      <circle cx="60" cy="65" r="3" className="fill-text-tertiary" opacity="0.3" />
      <circle cx="72" cy="65" r="3" className="fill-text-tertiary" opacity="0.3" />
      <circle cx="84" cy="65" r="3" className="fill-text-tertiary" opacity="0.3" />
    </svg>
  );
}
