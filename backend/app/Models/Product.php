<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'product_id',
        'vendor_id',
        'name',
        'slug',
        'description',
        'full_description',
        'price',
        'commission_rate',
        'commission_amount',
        'currency',
        'type',
        'sales_page_url',
        'delivery_link',
        'buy_now_config',
        'access_url',
        'support_url',
        'promo_materials_url',
        'images',
        'categories',
        'tags',
        'stock_quantity',
        'stock_status',
        'approval_status',
        'rejection_reason',
        'approved_at',
        'approved_by',
        'total_sales',
        'total_revenue',
        'total_affiliates',
        'is_featured',
        'is_active',
        'meta',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'total_revenue' => 'decimal:2',
        'images' => 'array',
        'categories' => 'array',
        'tags' => 'array',
        'meta' => 'array',
        'buy_now_config' => 'array',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'approved_at' => 'datetime',
    ];

    protected $appends = ['image'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (!$product->uuid) {
                $product->uuid = (string) Str::uuid();
            }

            if (!$product->product_id) {
                $product->product_id = 'PRD-' . mt_rand(100000, 999999);
            }

            if (!$product->slug) {
                $baseSlug = Str::slug($product->name);
                $slug = $baseSlug;
                $count = 1;

                // Ensure slug is unique
                while (static::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $count;
                    $count++;
                }

                $product->slug = $slug;
            }

            // Calculate commission amount
            if ($product->price && $product->commission_rate) {
                $product->commission_amount = ($product->price * $product->commission_rate) / 100;
            }
        });

        static::updating(function ($product) {
            if ($product->isDirty(['price', 'commission_rate'])) {
                $product->commission_amount = ($product->price * $product->commission_rate) / 100;
            }
        });
    }

    // Relationships
    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class);
    }

    public function clicks()
    {
        return $this->hasMany(AffiliateClick::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    // Accessors
    public function getImageAttribute()
    {
        return $this->images ? $this->images[0] : null;
    }

    // Methods
    public function approve(int $approvedBy): void
    {
        $this->update([
            'approval_status' => 'approved',
            'is_active' => true,
            'approved_at' => now(),
            'approved_by' => $approvedBy,
            'rejection_reason' => null,
        ]);
    }

    public function reject(string $reason): void
    {
        $this->update([
            'approval_status' => 'rejected',
            'is_active' => false,
            'rejection_reason' => $reason,
            'approved_at' => null,
            'approved_by' => null,
        ]);
    }

    public function getAffiliateLink(string $referralCode): string
    {
        return $this->sales_page_url . '?ref=' . $referralCode;
    }
}
