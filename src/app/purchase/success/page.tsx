import { Suspense } from 'react';
import SuccessContent from '../SuccessContent';

export const metadata = {
  title: 'Payment Successful - Stakecut Affiliate Platform',
  description: 'Your payment has been processed successfully',
};

function SuccessLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function PurchaseSuccessPage() {

  return (
    <Suspense fallback={<SuccessLoading />}>
      <SuccessContent />
    </Suspense>
  );
}
