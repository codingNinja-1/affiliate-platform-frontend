<?php

// app/Models/Vendor.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'business_name',
        'business_description',
        'business_address',
        'bank_name',
        'account_name',
        'account_number',
        'bank_code',
        'balance',
        'total_earnings',
        'total_withdrawn',
        'total_products',
        'total_sales',
        'country_id',
        'settings',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'total_earnings' => 'decimal:2',
        'total_withdrawn' => 'decimal:2',
        'settings' => 'array',
    ];

    protected $appends = ['pending_balance'];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class, 'user_id')
            ->where('user_type', 'vendor');
    }

    public function withdrawals()
    {
        return $this->hasMany(Withdrawal::class, 'user_id')
            ->where('user_type', 'vendor');
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    // Accessors
    public function getPendingBalanceAttribute()
    {
        return $this->commissions()
            ->where('status', 'pending')
            ->sum('amount');
    }

    // Methods
    public function updateBalance(float $amount, string $type = 'add'): void
    {
        if ($type === 'add') {
            $this->increment('balance', $amount);
            $this->increment('total_earnings', $amount);
        } else {
            $this->decrement('balance', $amount);
        }
    }

    public function canWithdraw(float $amount): bool
    {
        return $this->balance >= $amount && $amount > 0;
    }
}
