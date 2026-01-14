'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PurchaseFailedPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'no_reference':
        return 'No payment reference was provided.';
      case 'verification_failed':
        return 'Payment verification failed. Please contact support if you were charged.';
      case 'verification_error':
        return 'An error occurred while verifying your payment. Please contact support.';
      case 'server_error':
        return 'A server error occurred. Please try again or contact support.';
      default:
        return 'Your payment could not be processed. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          {getErrorMessage()}
        </p>

        {/* Error Code */}
        {error && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Error Code</p>
            <p className="font-mono text-sm text-red-600 uppercase">{error}</p>
          </div>
        )}

        {/* Support Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> If you were charged but the purchase failed, please contact our support team with your transaction details.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Try Again
          </button>
          <Link
            href="/links"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Back to Products
          </Link>
          <Link
            href="/dashboard"
            className="block w-full text-gray-600 hover:text-gray-900 font-medium py-3 transition duration-200"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Support Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Need help?</p>
          <a
            href="mailto:support@affiliatehub.com"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
