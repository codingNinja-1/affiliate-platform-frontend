<?php
// app/Http/Controllers/Auth/RegisterController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Affiliate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        // Prevent registering a new account while authenticated
        if ($request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Please log out before creating a new account',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_type' => 'required|in:vendor,affiliate,customer',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'password' => ['required', 'confirmed', Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()
            ],

            // Vendor specific
            'business_name' => 'required_if:user_type,vendor|nullable|string|max:255',
            'business_description' => 'nullable|string',

            // Banking information (optional during registration)
            'bank_name' => 'nullable|string|max:255',
            'account_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:20',

            // Referral code for affiliates
            'referral_code' => 'nullable|exists:affiliates,referral_code',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create user
            $user = User::create([
                'user_type' => $request->user_type,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'status' => 'pending', // Requires email verification
            ]);

            // Create role-specific record
            if ($request->user_type === 'vendor') {
                Vendor::create([
                    'user_id' => $user->id,
                    'business_name' => $request->business_name,
                    'business_description' => $request->business_description,
                    'bank_name' => $request->bank_name,
                    'account_name' => $request->account_name,
                    'account_number' => $request->account_number,
                ]);
            } elseif ($request->user_type === 'affiliate') {
                $referredBy = null;
                if ($request->referral_code) {
                    $referrer = Affiliate::where('referral_code', $request->referral_code)->first();
                    $referredBy = $referrer?->id;
                }

                Affiliate::create([
                    'user_id' => $user->id,
                    'bank_name' => $request->bank_name,
                    'account_name' => $request->account_name,
                    'account_number' => $request->account_number,
                    'referred_by' => $referredBy,
                ]);
            }

            // Send verification email (you'll implement this)
            // Mail::to($user->email)->send(new VerifyEmail($user));

            DB::commit();

            // Reload relations for response
            $user->load(['vendor', 'affiliate']);

            // Build consistent user payload and include referral_code when applicable
            $userData = [
                'id' => $user->id,
                'user_id' => $user->user_id,
                'user_type' => $user->user_type,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'referral_code' => $user->affiliate->referral_code ?? null,
            ];

            if ($user->user_type === 'vendor') {
                $userData['vendor'] = $user->vendor;
            } elseif ($user->user_type === 'affiliate') {
                $userData['affiliate'] = $user->affiliate;
            }

            // Do not auto-login newly registered accounts (await approval/verification)
            $token = null;

            return response()->json([
                'success' => true,
                'message' => 'Registration submitted. Await admin approval or email verification.',
                'data' => [
                    'user' => $userData,
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Implement email verification logic here
        // This would typically involve checking a token in the database
        // and marking the user's email as verified

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully'
        ]);
    }
};
