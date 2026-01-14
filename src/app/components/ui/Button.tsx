"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const variantClasses: Record<Variant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  outline: "btn btn-outline",
  danger: "btn bg-[--color-danger] text-white hover:bg-[color-mix(in oklab, var(--color-danger), black 10%)]",
};

export function Button({ variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${isLoading ? "opacity-75" : ""} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
      <span>{isLoading ? "Loading..." : children}</span>
      {rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
    </button>
  );
}

export default Button;
