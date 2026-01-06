<?php

// app/Models/Withdrawal.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Withdrawal extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'withdrawal_ref',
        'user_id',
        'user_type',
        'amount',
        'currency',
        'payment_method',
        'bank_name',
        'account_name',
        'account_number',
        'bank_code',
        'status',
        'rejection_reason',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
        'paid_at',
        'payment_reference',
        'payment_meta',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_meta' => 'array',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($withdrawal) {
            if (!$withdrawal->uuid) {
                $withdrawal->uuid = (string) Str::uuid();
            }

            if (!$withdrawal->withdrawal_ref) {
                $withdrawal->withdrawal_ref = 'WDR-' . strtoupper(Str::random(10));
            }
        });
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }
};
