import React from "react";

export const Logo = ({ className = "w-8 h-8", withText = false }) => {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="whGradComponent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="nodeGradComponent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Background Squircle */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="24"
          fill="#090d16"
          stroke="url(#whGradComponent)"
          strokeWidth="3.5"
        />

        {/* Signal Waves */}
        <path
          d="M 22 35 A 18 18 0 0 1 22 65"
          stroke="url(#nodeGradComponent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 15 26 A 30 30 0 0 1 15 74"
          stroke="url(#nodeGradComponent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* Branching Routes */}
        <path
          d="M 44 50 L 62 34 L 72 34"
          stroke="url(#whGradComponent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 44 50 L 62 66 L 72 66"
          stroke="url(#whGradComponent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Central Core */}
        <circle cx="44" cy="50" r="10" fill="#0f172a" stroke="url(#nodeGradComponent)" strokeWidth="3.5" />
        <circle cx="44" cy="50" r="4.5" fill="#38bdf8" />

        {/* Destination Nodes */}
        <circle cx="74" cy="34" r="6" fill="#06b6d4" />
        <circle cx="74" cy="66" r="6" fill="#10b981" />
      </svg>

      {withText && (
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base text-slate-100 tracking-tight">webhook-service</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono border border-brand-500/20">
              v3.0
            </span>
          </div>
          <p className="text-xs text-slate-400">Inspector & Simulador Multi-Sessão</p>
        </div>
      )}
    </div>
  );
};
