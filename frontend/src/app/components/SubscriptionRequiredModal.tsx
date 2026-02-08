'use client';

import Link from '@/app/components/NoPrefetchLink';

type SubscriptionRequiredModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function SubscriptionRequiredModal({
  open,
  onClose,
  title = 'Subscription required',
  description = 'You need an active subscription to access this feature.',
  actionHref = '/subscriptions',
  actionLabel = 'Go to subscription',
}: SubscriptionRequiredModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Not now
          </button>
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
