<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Check if user is active
        if ($user->status !== 'active') {
            $message = match($user->status) {
                'pending' => 'Please verify your email address',
                'inactive' => 'Your account is inactive',
                'suspended' => 'Your account has been suspended',
                default => 'Unable to login'
            };

            return response()->json([
                'success' => false,
                'message' => $message
            ], 403);
        }

        // Update last login
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Create token
        $tokenName = 'auth_token_' . time();
        $token = $user->createToken($tokenName)->plainTextToken;

        // Load relationships based on user type
        $userData = [
            'id' => $user->id,
            'user_id' => $user->user_id,
            'user_type' => $user->user_type,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'status' => $user->status,
            'two_factor_enabled' => $user->two_factor_enabled,
            'created_at' => $user->created_at,
        ];

        if ($user->user_type === 'vendor') {
            $userData['vendor'] = $user->vendor;
        } elseif ($user->user_type === 'affiliate') {
            $userData['affiliate'] = $user->affiliate;
        }

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $userData,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]
        ]);
    }

    public function logout(Request $request)
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    public function logoutAll(Request $request)
    {
        // Revoke all tokens
        $request->user()->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out from all devices'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        $userData = [
            'id' => $user->id,
            'user_id' => $user->user_id,
            'user_type' => $user->user_type,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'status' => $user->status,
            'two_factor_enabled' => $user->two_factor_enabled,
            'email_verified_at' => $user->email_verified_at,
            'last_login_at' => $user->last_login_at,
            'created_at' => $user->created_at,
        ];

        if ($user->user_type === 'vendor') {
            $userData['vendor'] = $user->vendor;
        } elseif ($user->user_type === 'affiliate') {
            $userData['affiliate'] = $user->affiliate;
        }

        return response()->json([
            'success' => true,
            'data' => $userData
        ]);
    }

    public function refreshToken(Request $request)
    {
        $user = $request->user();

        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        // Create new token
        $token = $user->createToken('auth_token_' . time())->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]
        ]);
    }
};
