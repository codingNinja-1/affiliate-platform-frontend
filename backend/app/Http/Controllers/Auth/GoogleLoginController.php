<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class GoogleLoginController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'credential' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credential = $request->input('credential');
        $clientId = env('GOOGLE_CLIENT_ID');

        if (!$clientId) {
            return response()->json([
                'success' => false,
                'message' => 'Google sign-in is not configured.',
            ], 500);
        }

        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $credential,
        ]);

        if (!$response->ok()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Google credential.',
            ], 401);
        }

        $payload = $response->json();

        if (($payload['aud'] ?? null) !== $clientId) {
            return response()->json([
                'success' => false,
                'message' => 'Google credential audience mismatch.',
            ], 401);
        }

        if (($payload['email_verified'] ?? 'false') !== 'true') {
            return response()->json([
                'success' => false,
                'message' => 'Google account email is not verified.',
            ], 403);
        }

        $email = $payload['email'] ?? null;
        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Google account email not available.',
            ], 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found for this Google email.',
            ], 404);
        }

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

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        $token = $user->createToken('auth_token_' . time())->plainTextToken;

        $userData = [
            'id' => $user->id,
            'user_id' => $user->user_id,
            'user_type' => $user->user_type,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'status' => $user->status,
            'two_factor_enabled' => $user->two_factor_enabled,
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
}
