import { Suspense } from 'react';
import FailedContent from '../FailedContent';

export const metadata = {
  title: 'Payment Failed - Stakecut Affiliate Platform',
  description: 'Your payment could not be processed',
};

function FailedLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function PurchaseFailedPage() {
  return (
    <Suspense fallback={<FailedLoading />}>
      <FailedContent />
    </Suspense>
  );
}