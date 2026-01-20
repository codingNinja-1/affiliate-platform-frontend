<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'user_type',
        'first_name',
        'last_name',
        'email',
        'phone',
        'password',
        'avatar',
        'status',
        'two_factor_secret',
        'two_factor_enabled',
        'email_verified_at',
        'last_login_at',
        'last_login_ip',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'two_factor_enabled' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (!$user->uuid) {
                $user->uuid = (string) Str::uuid();
            }

            if (!$user->user_id) {
                $user->user_id = static::generateUserId($user->user_type);
            }
        });
    }

    public static function generateUserId(string $type): string
    {
        $prefix = match($type) {
            'admin' => 'ADM',
            'vendor' => 'VEN',
            'affiliate' => 'AFF',
            'customer' => 'CUS',
            default => 'USR'
        };

        $number = mt_rand(100000, 999999);
        return "{$prefix}-{$number}";
    }

    // Relationships
    public function vendor()
    {
        return $this->hasOne(Vendor::class);
    }

    public function affiliate()
    {
        return $this->hasOne(Affiliate::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'customer_id');
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class);
    }

    public function withdrawals()
    {
        return $this->hasMany(Withdrawal::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('user_type', $type);
    }

    // Accessors
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getIsAdminAttribute(): bool
    {
        return $this->user_type === 'admin';
    }

    public function getIsVendorAttribute(): bool
    {
        return $this->user_type === 'vendor';
    }

    public function getIsAffiliateAttribute(): bool
    {
        return $this->user_type === 'affiliate';
    }

    public function getIsCustomerAttribute(): bool
    {
        return $this->user_type === 'customer';
    }

    // Send the password reset notification
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
