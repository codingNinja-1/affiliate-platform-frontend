<?php

namespace App\Http\Controllers;

use App\Models\NotificationSubscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class PushSubscriptionController extends Controller
{
    /**
     * Subscribe user to browser push notifications
     * POST /api/push/subscribe
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'endpoint' => 'required|string|url',
            'p256dh' => 'required|string',
            'auth' => 'required|string',
            'user_agent' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth()->user();
        $endpoint = $request->input('endpoint');

        // Check if subscription already exists
        $subscription = NotificationSubscription::where('user_id', $user->id)
            ->where('endpoint', $endpoint)
            ->first();

        if ($subscription) {
            // Reactivate if it was disabled
            $subscription->update([
                'is_active' => true,
                'subscribed_at' => now(),
                'unsubscribed_at' => null,
                'user_agent' => $request->input('user_agent'),
            ]);
        } else {
            // Create new subscription
            $subscription = NotificationSubscription::create([
                'user_id' => $user->id,
                'endpoint' => $endpoint,
                'p256dh' => $request->input('p256dh'),
                'auth' => $request->input('auth'),
                'user_agent' => $request->input('user_agent'),
                'subscribed_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Push notification subscription successful',
            'subscription' => [
                'id' => $subscription->id,
                'endpoint' => $subscription->endpoint,
                'is_active' => $subscription->is_active,
            ],
        ], 201);
    }

    /**
     * Unsubscribe user from browser push notifications
     * DELETE /api/push/subscribe
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'endpoint' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth()->user();
        $endpoint = $request->input('endpoint');

        $subscription = NotificationSubscription::where('user_id', $user->id)
            ->where('endpoint', $endpoint)
            ->first();

        if (!$subscription) {
            return response()->json(['message' => 'Subscription not found'], 404);
        }

        // Soft-disable (don't delete, for audit trail)
        $subscription->update([
            'is_active' => false,
            'unsubscribed_at' => now(),
        ]);

        return response()->json(['message' => 'Push notification unsubscription successful']);
    }

    /**
     * Get user's push subscription status
     * GET /api/push/subscribe
     */
    public function status(Request $request): JsonResponse
    {
        $user = auth()->user();
        $subscriptions = NotificationSubscription::where('user_id', $user->id)
            ->where('is_active', true)
            ->get(['id', 'endpoint', 'user_agent', 'subscribed_at', 'last_used_at']);

        return response()->json([
            'has_subscriptions' => count($subscriptions) > 0,
            'count' => count($subscriptions),
            'subscriptions' => $subscriptions,
        ]);
    }

    /**
     * Get all push subscriptions (admin only)
     * GET /api/admin/push/subscriptions
     */
    public function allSubscriptions(): JsonResponse
    {
        $subscriptions = NotificationSubscription::with('user:id,email,name')
            ->where('is_active', true)
            ->paginate(50);

        return response()->json($subscriptions);
    }

    /**
     * Delete a push subscription (admin only)
     * DELETE /api/admin/push/subscriptions/{id}
     */
    public function deleteSubscription($id): JsonResponse
    {
        $subscription = NotificationSubscription::find($id);

        if (!$subscription) {
            return response()->json(['message' => 'Subscription not found'], 404);
        }

        $subscription->update(['is_active' => false, 'unsubscribed_at' => now()]);

        return response()->json(['message' => 'Subscription disabled']);
    }
}
