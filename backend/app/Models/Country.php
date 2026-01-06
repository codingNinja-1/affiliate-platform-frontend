<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'code3',
        'phone_code',
        'currency',
        'currency_symbol',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function vendors()
    {
        return $this->hasMany(Vendor::class);
    }

    public function affiliates()
    {
        return $this->hasMany(Affiliate::class);
    }
}
