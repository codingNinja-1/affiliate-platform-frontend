'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof Link>;

export default function NoPrefetchLink({ prefetch = false, ...props }: LinkProps) {
  return <Link prefetch={prefetch} {...props} />;
}

