import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff } from 'lucide-react';

/**
 * Component to manage push notification subscription
 */
export function PushNotificationManager() {
  const auth = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe } = usePushNotifications();
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Check if user has been shown the onboarding prompt
  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('push_notification_prompt_shown');
    if (!hasSeenPrompt && isSupported && !isLoading && !isSubscribed && token) {
      setIsOnboarding(true);
      localStorage.setItem('push_notification_prompt_shown', 'true');
    }
  }, [isSupported, isLoading, isSubscribed, token]);

  // Fetch VAPID public key from backend
  useEffect(() => {
    async function fetchVapidKey() {
      try {
        const response = await fetch('/api/push/vapid-key', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVapidPublicKey(data.public_key);
        }
      } catch (err) {
        console.error('Failed to fetch VAPID key:', err);
      }
    }

    if (token && isSupported) {
      fetchVapidKey();
    }
  }, [token, isSupported]);

  const handleSubscribe = async () => {
    if (!vapidPublicKey) {
      alert('Push notification setup is not available. Please try again later.');
      return;
    }

    const success = await subscribe(vapidPublicKey);
    if (success) {
      alert('Push notifications enabled!');
      setIsOnboarding(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (window.confirm('Are you sure you want to disable push notifications?')) {
      const success = await unsubscribe();
      if (success) {
        alert('Push notifications disabled');
      }
    }
  };

  if (!isSupported || !token) {
    // Push notifications not supported or user not authenticated
    return null;
  }

  if (isLoading) {
    return null;
  }

  // Onboarding prompt
  if (isOnboarding && vapidPublicKey) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Enable Notifications</h3>
            <p className="text-sm text-gray-600 mb-3">
              Get instant updates about your account, new messages, and important announcements.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSubscribe}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Enable
              </button>
              <button
                onClick={() => setIsOnboarding(false)}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsOnboarding(false)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Settings display
  if (!isOnboarding) {
    return (
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <>
            <Bell className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600">Notifications enabled</span>
            <button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Disable
            </button>
          </>
        ) : (
          <>
            <BellOff className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Notifications disabled</span>
            {vapidPublicKey && (
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Enable
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
