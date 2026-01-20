<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'to_email',
        'subject',
        'template_key',
        'status',
        'error_message',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public static function log(string $toEmail, ?string $subject, ?string $templateKey = null, string $status = 'sent', ?array $meta = null, ?string $errorMessage = null): void
    {
        try {
            self::create([
                'to_email' => $toEmail,
                'subject' => $subject,
                'template_key' => $templateKey,
                'status' => $status,
                'error_message' => $errorMessage,
                'meta' => $meta,
            ]);
        } catch (\Exception $e) {
            // Swallow logging errors to avoid impacting main flow
        }
    }
}
