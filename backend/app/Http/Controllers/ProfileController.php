<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\OtpService;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'user_type' => $user->user_type,
                'status' => $user->status,
                'avatar' => $user->avatar ?? null,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function update(Request $request, OtpService $otpService)
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:25',
            'otp_code' => 'required|string',
        ]);

        $otpCheck = $otpService->verifyForUser($user, 'profile_update', $validated['otp_code']);
        if (!$otpCheck['success']) {
            return response()->json([
                'success' => false,
                'message' => $otpCheck['message'],
            ], 403);
        }

        if (array_key_exists('first_name', $validated)) {
            $user->first_name = $validated['first_name'];
        }

        if (array_key_exists('last_name', $validated)) {
            $user->last_name = $validated['last_name'];
        }

        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }

        $fullName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));

        $user->save();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $fullName ?: $user->email,
                'email' => $user->email,
                'phone' => $user->phone,
                'user_type' => $user->user_type,
                'status' => $user->status,
                'avatar' => $user->avatar ?? null,
                'created_at' => $user->created_at,
            ],
        ]);
    }
}
