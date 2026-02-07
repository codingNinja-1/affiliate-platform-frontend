'use client';

import { useEffect } from 'react';

type OtpModalProps = {
  open: boolean;
  title: string;
  description?: string;
  code: string;
  onCodeChange: (value: string) => void;
  onVerify: () => void;
  onResend?: () => void;
  onClose: () => void;
  isLoading?: boolean;
  error?: string;
};

export default function OtpModal({
  open,
  title,
  description,
  code,
  onCodeChange,
  onVerify,
  onResend,
  onClose,
  isLoading,
  error,
}: OtpModalProps) {
  useEffect(() => {
    if (!open) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            X
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Verification code</label>
          <input
            value={code}
            onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoFocus
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-lg tracking-[0.4em] text-center text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="000000"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onVerify}
            disabled={isLoading || code.length < 6}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>

          {onResend && (
            <button
              type="button"
              onClick={onResend}
              disabled={isLoading}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
