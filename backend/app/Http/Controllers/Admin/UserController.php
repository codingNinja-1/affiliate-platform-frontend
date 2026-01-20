<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\UserApprovedNotification;
use App\Notifications\UserDeniedNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $userType = $request->query('type');
        $status = $request->query('status');
        $search = $request->query('search');
        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 50);

        $query = User::query();

        if ($userType) {
            $query->where('user_type', $userType);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $targetUser = User::findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $targetUser,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $targetUser = User::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:active,inactive,pending,suspended',
            'user_type' => 'sometimes|in:customer,vendor,affiliate,admin',
        ]);

        $oldStatus = $targetUser->status;
        $targetUser->update($validated);
        $newStatus = $targetUser->status;

        // Send notifications on status change
        Log::info('User status change check', [
            'userId' => $targetUser->id,
            'oldStatus' => $oldStatus,
            'newStatus' => $newStatus,
            'changed' => $oldStatus !== $newStatus,
        ]);

        if ($oldStatus !== $newStatus) {
            if ($newStatus === 'active') {
                Log::info('Sending UserApprovedNotification', ['userId' => $targetUser->id]);
                $targetUser->notify(new UserApprovedNotification($targetUser));
            } elseif ($newStatus === 'suspended') {
                Log::info('Sending UserDeniedNotification', ['userId' => $targetUser->id]);
               $targetUser->notify(new UserDeniedNotification($targetUser));
            }
        }

        return response()->json([
            'success' => true,
            'data' => $targetUser,
            'message' => 'User updated successfully.',
        ]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function destroy($id)
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }
}
