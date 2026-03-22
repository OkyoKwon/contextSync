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
