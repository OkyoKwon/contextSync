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

export function DashboardIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="h-full w-full">
      {/* Dashboard frame */}
      <rect
        x="25"
        y="25"
        width="150"
        height="90"
        rx="8"
        className="fill-surface stroke-border-default"
        strokeWidth="1.5"
      />
      {/* Title bar */}
      <rect x="25" y="25" width="150" height="16" rx="8" className="fill-blue-500/10" />
      <circle cx="35" cy="33" r="2" className="fill-red-400" opacity="0.6" />
      <circle cx="42" cy="33" r="2" className="fill-yellow-400" opacity="0.6" />
      <circle cx="49" cy="33" r="2" className="fill-green-400" opacity="0.6" />

      {/* Stat cards */}
      <rect
        x="33"
        y="48"
        width="32"
        height="18"
        rx="3"
        className="fill-blue-500/10 stroke-blue-400/30"
        strokeWidth="0.8"
      />
      <rect
        x="70"
        y="48"
        width="32"
        height="18"
        rx="3"
        className="fill-green-500/10 stroke-green-400/30"
        strokeWidth="0.8"
      />
      <rect
        x="107"
        y="48"
        width="32"
        height="18"
        rx="3"
        className="fill-yellow-500/10 stroke-yellow-400/30"
        strokeWidth="0.8"
      />
      <rect
        x="144"
        y="48"
        width="24"
        height="18"
        rx="3"
        className="fill-red-500/10 stroke-red-400/30"
        strokeWidth="0.8"
      />

      {/* Chart area */}
      <rect
        x="33"
        y="72"
        width="62"
        height="36"
        rx="3"
        className="fill-blue-500/5 stroke-border-default"
        strokeWidth="0.8"
      />
      <polyline
        points="40,100 50,92 60,96 70,85 80,88 88,80"
        className="stroke-blue-400"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* List area */}
      <rect
        x="100"
        y="72"
        width="68"
        height="36"
        rx="3"
        className="fill-surface stroke-border-default"
        strokeWidth="0.8"
      />
      <rect
        x="106"
        y="78"
        width="40"
        height="3"
        rx="1"
        className="fill-text-tertiary"
        opacity="0.3"
      />
      <rect
        x="106"
        y="85"
        width="50"
        height="3"
        rx="1"
        className="fill-text-tertiary"
        opacity="0.2"
      />
      <rect
        x="106"
        y="92"
        width="35"
        height="3"
        rx="1"
        className="fill-text-tertiary"
        opacity="0.2"
      />
      <rect
        x="106"
        y="99"
        width="45"
        height="3"
        rx="1"
        className="fill-text-tertiary"
        opacity="0.15"
      />
    </svg>
  );
}

export function InviteTeamIllustration() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="h-full w-full">
      {/* Center user */}
      <circle
        cx="100"
        cy="55"
        r="16"
        className="fill-blue-500/15 stroke-blue-400"
        strokeWidth="1.5"
      />
      <circle cx="100" cy="50" r="5" className="fill-blue-400/60" />
      <path
        d="M91 62 Q95 57 100 57 Q105 57 109 62"
        className="stroke-blue-400/60"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Left user */}
      <circle
        cx="50"
        cy="90"
        r="13"
        className="fill-green-500/10 stroke-green-400/50"
        strokeWidth="1.2"
      />
      <circle cx="50" cy="86" r="4" className="fill-green-400/50" />
      <path
        d="M43 96 Q46 92 50 92 Q54 92 57 96"
        className="stroke-green-400/50"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Right user */}
      <circle
        cx="150"
        cy="90"
        r="13"
        className="fill-yellow-500/10 stroke-yellow-400/50"
        strokeWidth="1.2"
      />
      <circle cx="150" cy="86" r="4" className="fill-yellow-400/50" />
      <path
        d="M143 96 Q146 92 150 92 Q154 92 157 96"
        className="stroke-yellow-400/50"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Connecting lines */}
      <line
        x1="85"
        y1="65"
        x2="60"
        y2="80"
        className="stroke-text-tertiary"
        strokeWidth="1"
        opacity="0.3"
        strokeDasharray="3 3"
      />
      <line
        x1="115"
        y1="65"
        x2="140"
        y2="80"
        className="stroke-text-tertiary"
        strokeWidth="1"
        opacity="0.3"
        strokeDasharray="3 3"
      />

      {/* Role badges */}
      <rect
        x="80"
        y="75"
        width="40"
        height="14"
        rx="7"
        className="fill-blue-500/20 stroke-blue-400/40"
        strokeWidth="0.8"
      />
      <text x="100" y="85" textAnchor="middle" className="fill-blue-400 text-[7px] font-mono">
        Owner
      </text>

      <rect
        x="30"
        y="107"
        width="40"
        height="14"
        rx="7"
        className="fill-green-500/20 stroke-green-400/40"
        strokeWidth="0.8"
      />
      <text x="50" y="117" textAnchor="middle" className="fill-green-400 text-[7px] font-mono">
        Admin
      </text>

      <rect
        x="130"
        y="107"
        width="40"
        height="14"
        rx="7"
        className="fill-yellow-500/20 stroke-yellow-400/40"
        strokeWidth="0.8"
      />
      <text x="150" y="117" textAnchor="middle" className="fill-yellow-400 text-[7px] font-mono">
        Member
      </text>
    </svg>
  );
}
