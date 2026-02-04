<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InAppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class InAppNotificationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $notifications = InAppNotification::query()
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:120',
            'body' => 'required|string|max:1000',
            'level' => 'nullable|in:info,success,warning,error',
            'target_type' => 'nullable|in:all,role,user',
            'target_role' => 'nullable|in:admin,vendor,affiliate,customer',
            'target_user_id' => 'nullable|integer|exists:users,id',
            'is_active' => 'nullable|boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $targetType = $data['target_type'] ?? 'all';

        if ($targetType === 'role' && empty($data['target_role'])) {
            return response()->json([
                'success' => false,
                'message' => 'Target role is required when target_type is role.',
            ], 422);
        }

        if ($targetType === 'user' && empty($data['target_user_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Target user is required when target_type is user.',
            ], 422);
        }

        $notification = InAppNotification::create([
            'title' => $data['title'],
            'body' => $data['body'],
            'level' => $data['level'] ?? 'info',
            'target_type' => $targetType,
            'target_role' => $data['target_role'] ?? null,
            'target_user_id' => $data['target_user_id'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'created_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => $notification,
        ], 201);
    }
}
