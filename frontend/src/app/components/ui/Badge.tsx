"use client";

import React from "react";

type Tone = "success" | "warning" | "danger" | "muted";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: React.ReactNode;
}

const tones: Record<Tone, string> = {
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
  muted: "badge badge-muted",
};

export function Badge({ tone = "muted", children, className = "", ...props }: BadgeProps) {
  return (
    <span className={`${tones[tone]} ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Badge;
