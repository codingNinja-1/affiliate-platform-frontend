<?php

// app/Models/Transaction.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'transaction_ref',
        'product_id',
        'customer_id',
        'affiliate_id',
        'vendor_id',
        'amount',
        'commission_amount',
        'vendor_amount',
        'currency',
        'status',
        'payment_method',
        'payment_reference',
        'payment_meta',
        'paid_at',
        'settled_at',
        'customer_email',
        'customer_phone',
        'customer_meta',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'vendor_amount' => 'decimal:2',
        'payment_meta' => 'array',
        'customer_meta' => 'array',
        'paid_at' => 'datetime',
        'settled_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transaction) {
            if (!$transaction->uuid) {
                $transaction->uuid = (string) Str::uuid();
            }

            if (!$transaction->transaction_ref) {
                $transaction->transaction_ref = 'TXN-' . strtoupper(Str::random(12));
            }
        });
    }

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function affiliate()
    {
        return $this->belongsTo(Affiliate::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class);
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeSettled($query)
    {
        return $query->where('status', 'settled');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}

