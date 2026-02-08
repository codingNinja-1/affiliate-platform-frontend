<?php

namespace App\Services;

use App\Models\OtpCode;
use Illuminate\Support\Facades\DB;

class OtpService
{
    private int $ttlMinutes = 5;
    private int $maxAttempts = 5;

    public function createForUser($user, string $purpose): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($user, $purpose, $code) {
            OtpCode::where('user_id', $user->id)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            OtpCode::create([
                'user_id' => $user->id,
                'purpose' => $purpose,
                'code_hash' => $this->hashCode($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes($this->ttlMinutes),
                'consumed_at' => null,
            ]);
        });

        return $code;
    }

    public function verifyForUser($user, string $purpose, string $code): array
    {
        $record = OtpCode::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->orderByDesc('created_at')
            ->first();

        if (!$record) {
            return ['success' => false, 'message' => 'OTP not found. Please request a new code.'];
        }

        if ($record->expires_at && $record->expires_at->isPast()) {
            $record->update(['consumed_at' => now()]);
            return ['success' => false, 'message' => 'OTP has expired. Please request a new code.'];
        }

        if ($record->attempts >= $this->maxAttempts) {
            $record->update(['consumed_at' => now()]);
            return ['success' => false, 'message' => 'OTP attempts exceeded. Please request a new code.'];
        }

        if (!hash_equals($record->code_hash, $this->hashCode($code))) {
            $record->increment('attempts');
            $record->refresh();
            if ($record->attempts >= $this->maxAttempts) {
                $record->update(['consumed_at' => now()]);
            }
            return ['success' => false, 'message' => 'Invalid OTP code.'];
        }

        $record->update(['consumed_at' => now()]);

        return ['success' => true];
    }

    public function getExpiryMinutes(): int
    {
        return $this->ttlMinutes;
    }

    private function hashCode(string $code): string
    {
        $key = config('app.key') ?: 'otp';
        return hash_hmac('sha256', $code, $key);
    }
}
