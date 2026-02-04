<?php

namespace App\Http\Controllers\Admin;

use App\Models\InAppNotification;
use App\Services\WebPushService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class PushNotificationController extends Controller
{
    /**
     * Send web push notification to users
     * POST /api/admin/push/send
     */
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => 'required|in:all,role,user',
            'target_role' => 'required_if:target_type,role|in:admin,vendor,affiliate,customer',
            'target_user_id' => 'required_if:target_type,user|exists:users,id',
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:1000',
            'icon' => 'nullable|url',
            'badge' => 'nullable|url',
            'tag' => 'nullable|string|max:100',
        ]);

        $payload = [
            'title' => $validated['title'],
            'body' => $validated['body'],
            'icon' => $validated['icon'] ?? null,
            'badge' => $validated['badge'] ?? null,
            'tag' => $validated['tag'] ?? 'notification',
            'timestamp' => now()->timestamp,
        ];

        // Send push notification based on target type
        $sentCount = 0;
        switch ($validated['target_type']) {
            case 'all':
                $sentCount = WebPushService::sendToAll($payload);
                break;
            case 'role':
                $sentCount = WebPushService::sendToRole($validated['target_role'], $payload);
                break;
            case 'user':
                $sentCount = WebPushService::sendToUser($validated['target_user_id'], $payload);
                break;
        }

        // Also create an in-app notification if desired
        if ($request->input('also_create_in_app', true)) {
            InAppNotification::create([
                'title' => $validated['title'],
                'body' => $validated['body'],
                'level' => 'info',
                'target_type' => $validated['target_type'],
                'target_role' => $validated['target_role'] ?? null,
                'target_user_id' => $validated['target_user_id'] ?? null,
                'is_active' => true,
                'created_by' => auth()->id(),
            ]);
        }

        return response()->json([
            'message' => 'Push notification sent',
            'sent_count' => $sentCount,
            'target_type' => $validated['target_type'],
        ], 200);
    }
}
