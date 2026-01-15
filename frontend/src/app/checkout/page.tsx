import { Suspense } from 'react';
import CheckoutContent from './CheckoutContent';

export const metadata = {
  title: 'Checkout - Stakecut Affiliate Platform',
  description: 'Complete your purchase securely',
};

function CheckoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading checkout...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
