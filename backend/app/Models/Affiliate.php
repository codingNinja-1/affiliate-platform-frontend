<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Affiliate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'referral_code',
        'bank_name',
        'account_name',
        'account_number',
        'bank_code',
        'balance',
        'total_earnings',
        'total_withdrawn',
        'total_clicks',
        'total_sales',
        'conversion_rate',
        'tier',
        'referred_by',
        'country_id',
        'settings',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'total_earnings' => 'decimal:2',
        'total_withdrawn' => 'decimal:2',
        'conversion_rate' => 'decimal:2',
        'settings' => 'array',
    ];

    protected $appends = ['pending_balance', 'referral_link'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($affiliate) {
            if (!$affiliate->referral_code) {
                $affiliate->referral_code = static::generateReferralCode();
            }
        });
    }

    public static function generateReferralCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (static::where('referral_code', $code)->exists());

        return $code;
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function clicks()
    {
        return $this->hasMany(AffiliateClick::class);
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class, 'user_id')
            ->where('user_type', 'affiliate');
    }

    public function withdrawals()
    {
        return $this->hasMany(Withdrawal::class, 'user_id', 'user_id')
            ->where('user_type', 'affiliate');
    }

    public function referrer()
    {
        return $this->belongsTo(Affiliate::class, 'referred_by');
    }

    public function referrals()
    {
        return $this->hasMany(Affiliate::class, 'referred_by');
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    // Accessors
    public function getPendingBalanceAttribute()
    {
        return $this->withdrawals()
            ->where('status', 'pending')
            ->sum('amount');
    }

    public function getReferralLinkAttribute(): string
    {
        return config('app.url') . '/ref/' . $this->referral_code;
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

    public function updateConversionRate(): void
    {
        if ($this->total_clicks > 0) {
            $rate = ($this->total_sales / $this->total_clicks) * 100;
            $this->update(['conversion_rate' => round($rate, 2)]);
        }
    }

    public function updateTier(): void
    {
        $sales = $this->total_sales;

        $tier = match(true) {
            $sales >= 1000 => 'platinum',
            $sales >= 500 => 'gold',
            $sales >= 100 => 'silver',
            default => 'bronze'
        };

        if ($this->tier !== $tier) {
            $this->update(['tier' => $tier]);
        }
    }
}
