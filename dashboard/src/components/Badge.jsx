import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    blue: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    red: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border font-mono tracking-tight",
          variants[variant] || variants.default,
          className
        )
      )}
    >
      {children}
    </span>
  );
};

export const MethodBadge = ({ method, className = "" }) => {
  const m = (method || "GET").toUpperCase();
  let variant = "default";

  switch (m) {
    case "POST":
      variant = "blue";
      break;
    case "GET":
      variant = "emerald";
      break;
    case "PUT":
      variant = "amber";
      break;
    case "PATCH":
      variant = "purple";
      break;
    case "DELETE":
      variant = "rose";
      break;
    default:
      variant = "default";
  }

  return (
    <Badge variant={variant} className={twMerge("font-bold text-[11px] px-1.5 py-0.5", className)}>
      {m}
    </Badge>
  );
};

export const StatusBadge = ({ status, className = "" }) => {
  const s = Number(status) || 200;
  let variant = "emerald";

  if (s >= 500) variant = "rose";
  else if (s >= 400) variant = "amber";
  else if (s >= 300) variant = "cyan";
  else if (s >= 200) variant = "emerald";

  return (
    <Badge variant={variant} className={twMerge("text-[11px] font-mono", className)}>
      {s}
    </Badge>
  );
};
