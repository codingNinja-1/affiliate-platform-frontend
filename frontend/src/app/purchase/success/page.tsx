'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
        // Fire conversion tracking pixel
        const trackConversion = async () => {
          try {
            // Send pixel event to backend
            const pixelImg = new Image();
            pixelImg.src = `${window.location.origin}/api/pixel/conversion?ref=${reference}`;
            pixelImg.onload = () => console.log('Conversion pixel tracked');
            pixelImg.onerror = () => console.log('Conversion pixel failed');
          } catch (err) {
            console.error('Pixel tracking error:', err);
          }
        };
        trackConversion();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your payment has been processed successfully.
        </p>

        {/* Transaction Reference */}
        {reference && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Transaction Reference</p>
            <p className="text-sm font-mono font-bold text-gray-900 break-all">
              {reference}
            </p>
          </div>
        )}

        {/* Confirmation Email Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            A confirmation email has been sent to your email address with the purchase details.
          </p>
        </div>

        {/* Auto-redirect Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Redirecting to dashboard in <span className="font-bold">{countdown}</span> seconds...
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/links"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            View Affiliate Links
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Thank you for your purchase! If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
