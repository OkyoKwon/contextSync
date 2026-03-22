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
