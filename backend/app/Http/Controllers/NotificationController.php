<?php

namespace App\Http\Controllers;

use App\Models\InAppNotification;
use App\Models\NotificationRead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $now = now();

        $notifications = InAppNotification::query()
            ->where('is_active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', $now);
            })
            ->where(function ($query) use ($user) {
                $query->where('target_type', 'all')
                    ->orWhere(function ($sub) use ($user) {
                        $sub->where('target_type', 'role')
                            ->where('target_role', $user->user_type);
                    })
                    ->orWhere(function ($sub) use ($user) {
                        $sub->where('target_type', 'user')
                            ->where('target_user_id', $user->id);
                    });
            })
            ->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    public function markRead(Request $request, InAppNotification $notification)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$this->isEligible($notification, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not available.',
            ], 404);
        }

        NotificationRead::updateOrCreate(
            ['notification_id' => $notification->id, 'user_id' => $user->id],
            ['read_at' => now()]
        );

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    private function isEligible(InAppNotification $notification, $user): bool
    {
        $now = now();

        if (!$notification->is_active) {
            return false;
        }

        if ($notification->starts_at && $notification->starts_at->isAfter($now)) {
            return false;
        }

        if ($notification->ends_at && $notification->ends_at->isBefore($now)) {
            return false;
        }

        return match ($notification->target_type) {
            'all' => true,
            'role' => $notification->target_role === $user->user_type,
            'user' => (int) $notification->target_user_id === (int) $user->id,
            default => false,
        };
    }
}
