<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateClick extends Model
{
    use HasFactory;

    protected $fillable = [
        'affiliate_id',
        'product_id',
        'ip_address',
        'user_agent',
        'referrer',
        'device_type',
        'browser',
        'os',
        'country',
        'city',
        'converted',
        'transaction_id',
    ];

    protected $casts = [
        'converted' => 'boolean',
    ];

    // Relationships
    public function affiliate()
    {
        return $this->belongsTo(Affiliate::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
