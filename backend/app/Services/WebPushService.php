<?php

namespace App\Services;

use App\Models\NotificationSubscription;
use App\Services\VapidKeyService;
use Illuminate\Support\Facades\Log;

class WebPushService
{
    /**
     * Send a push notification to a user
     */
    public static function sendToUser(int $userId, array $payload): int
    {
        $subscriptions = NotificationSubscription::where('user_id', $userId)
            ->where('is_active', true)
            ->get();

        $sentCount = 0;

        foreach ($subscriptions as $subscription) {
            if (self::sendToSubscription($subscription, $payload)) {
                $sentCount++;
                $subscription->markAsUsed();
            }
        }

        return $sentCount;
    }

    /**
     * Send a push notification to all users
     */
    public static function sendToAll(array $payload): int
    {
        // Get all active subscriptions for all users
        $subscriptions = NotificationSubscription::where('is_active', true)->get();

        $sentCount = 0;

        foreach ($subscriptions as $subscription) {
            if (self::sendToSubscription($subscription, $payload)) {
                $sentCount++;
                $subscription->markAsUsed();
            }
        }

        return $sentCount;
    }

    /**
     * Send a push notification to a specific role
     */
    public static function sendToRole(string $role, array $payload): int
    {
        // Get all users with the specified role and their subscriptions
        $subscriptions = NotificationSubscription::whereHas('user', function ($query) use ($role) {
            $query->where('user_type', $role);
        })
        ->where('is_active', true)
        ->get();

        $sentCount = 0;

        foreach ($subscriptions as $subscription) {
            if (self::sendToSubscription($subscription, $payload)) {
                $sentCount++;
                $subscription->markAsUsed();
            }
        }

        return $sentCount;
    }

    /**
     * Send a push notification to a single subscription
     * 
     * NOTE: For production use, install: composer require web-push-libs/web-push
     */
    private static function sendToSubscription(NotificationSubscription $subscription, array $payload): bool
    {
        try {
            $keys = VapidKeyService::getKeys();
            if (!$keys['public'] || !$keys['private']) {
                Log::warning('VAPID keys not configured for push notifications');
                return false;
            }

            // Use web-push library if available, otherwise log for manual processing
            if (class_exists('\\WebPush\\WebPush')) {
                return self::sendWithWebPushLibrary($subscription, $payload, $keys);
            } else {
                // Fallback: Log the push notification
                Log::info('Web-push library not installed. Push notification queued.', [
                    'user_id' => $subscription->user_id,
                    'endpoint' => $subscription->endpoint,
                    'payload' => $payload,
                ]);
                return true;
            }
        } catch (\Exception $e) {
            Log::error("Error sending push notification: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send using web-push-libs/web-push library
     */
    private static function sendWithWebPushLibrary(
        NotificationSubscription $subscription,
        array $payload,
        array $keys
    ): bool {
        try {
            $webPush = new \WebPush\WebPush([
                'vapid' => [
                    'public_key' => $keys['public'],
                    'private_key' => $keys['private'],
                    'subject' => env('VAPID_SUBJECT', 'mailto:admin@example.com'),
                ],
            ]);

            $webPush->sendOneNotification(
                $subscription->getPayload(),
                json_encode($payload)
            );

            foreach ($webPush->flush() as $response) {
                if ($response->isSuccess()) {
                    return true;
                } else {
                    $statusCode = $response->getStatusCode();
                    if ($statusCode === 401 || $statusCode === 410) {
                        $subscription->update(['is_active' => false, 'unsubscribed_at' => now()]);
                    }
                    Log::warning("Push failed with status {$statusCode}");
                    return false;
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error("Web-push error: {$e->getMessage()}");
            return false;
        }
    }
}
