import { Suspense } from 'react';
import ResetPasswordContent from './ResetPasswordContent';

export const metadata = {
  title: 'Reset Password - Stakecut Affiliate Platform',
  description: 'Reset your account password',
};

function ResetPasswordLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {

  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
