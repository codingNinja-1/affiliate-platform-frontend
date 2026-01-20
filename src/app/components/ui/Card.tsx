"use client";

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ header, footer, children, className = "", ...props }: CardProps) {
  return (
    <div className={`card ${className}`} {...props}>
      {header && <div className="border-b border-[--color-border] p-4 text-sm text-[--color-muted-foreground]">{header}</div>}
      <div className="p-6">{children}</div>
      {footer && <div className="border-t border-[--color-border] p-4 text-sm text-[--color-muted-foreground]">{footer}</div>}
    </div>
  );
}

export default Card;
