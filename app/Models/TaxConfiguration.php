<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxConfiguration extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'store_id',
        'tax_code',
        'tax_name',
        'rate',
        'tax_type',
        'is_compound',
        'compound_tax_codes',
        'is_active',
        'effective_from',
        'effective_to',
        'applicable_categories',
        'exempt_categories',
        'applicable_products',
        'exempt_products',
        'applicable_locations',
        'is_default',
        'reporting_category',
        'description',
        'metadata',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'is_compound' => 'boolean',
        'compound_tax_codes' => 'array',
        'is_active' => 'boolean',
        'effective_from' => 'date',
        'effective_to' => 'date',
        'applicable_categories' => 'array',
        'exempt_categories' => 'array',
        'applicable_products' => 'array',
        'exempt_products' => 'array',
        'applicable_locations' => 'array',
        'is_default' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * Scope a query to only include tax configurations for a specific store.
     */
    public function scopeByStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    /**
     * Scope a query to only include active tax configurations.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include tax configurations effective on a specific date.
     */
    public function scopeEffectiveOn($query, $date)
    {
        return $query->where('effective_from', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $date);
            });
    }

    /**
     * Scope a query to only include tax configurations for a specific type.
     */
    public function scopeByType($query, $taxType)
    {
        return $query->where('tax_type', $taxType);
    }

    /**
     * Scope a query to only include default tax configurations.
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Get the store that owns the tax configuration.
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Get applicable categories for this tax.
     */
    public function applicableCategories()
    {
        return $this->belongsToMany(Category::class, 'tax_category_applicability');
    }

    /**
     * Get exempt categories for this tax.
     */
    public function exemptCategories()
    {
        return $this->belongsToMany(Category::class, 'tax_category_exemptions');
    }

    /**
     * Get applicable products for this tax.
     */
    public function applicableProducts()
    {
        return $this->belongsToMany(Product::class, 'tax_product_applicability');
    }

    /**
     * Get exempt products for this tax.
     */
    public function exemptProducts()
    {
        return $this->belongsToMany(Product::class, 'tax_product_exemptions');
    }

    /**
     * Check if this tax is applicable to a product.
     */
    public function isApplicableToProduct($productId, $categoryId = null, $locationCode = null)
    {
        // Check if product is explicitly exempt
        if ($this->exempt_products && in_array($productId, $this->exempt_products)) {
            return false;
        }

        // Check if category is exempt
        if ($categoryId && $this->exempt_categories && in_array($categoryId, $this->exempt_categories)) {
            return false;
        }

        // Check if location is applicable
        if ($locationCode && $this->applicable_locations && !in_array($locationCode, $this->applicable_locations)) {
            return false;
        }

        // Check if product is explicitly applicable
        if ($this->applicable_products && in_array($productId, $this->applicable_products)) {
            return true;
        }

        // Check if category is applicable
        if ($categoryId && $this->applicable_categories && in_array($categoryId, $this->applicable_categories)) {
            return true;
        }

        // If no specific rules, it's applicable
        if (!$this->applicable_products && !$this->applicable_categories) {
            return true;
        }

        return false;
    }

    /**
     * Calculate tax amount for a given base amount.
     */
    public function calculateTax($baseAmount, $compoundBase = null)
    {
        if ($this->is_compound && $compoundBase) {
            return ($baseAmount + $compoundBase) * $this->rate;
        }

        return $baseAmount * $this->rate;
    }

    /**
     * Get formatted rate as percentage.
     */
    public function getFormattedRateAttribute()
    {
        return number_format($this->rate * 100, 2) . '%';
    }

    /**
     * Get effective period description.
     */
    public function getEffectivePeriodAttribute()
    {
        if ($this->effective_to) {
            return $this->effective_from->format('M j, Y') . ' to ' . $this->effective_to->format('M j, Y');
        }

        return 'From ' . $this->effective_from->format('M j, Y');
    }

    /**
     * Get compound tax codes as a comma-separated string.
     */
    public function getCompoundTaxCodesStringAttribute()
    {
        if (!$this->compound_tax_codes) {
            return 'None';
        }

        return implode(', ', $this->compound_tax_codes);
    }

    /**
     * Check if this tax is currently effective.
     */
    public function isCurrentlyEffective()
    {
        $now = now();
        
        return $this->effective_from <= $now && 
               (!$this->effective_to || $this->effective_to >= $now);
    }

    /**
     * Create a new tax configuration with validation.
     */
    public static function createWithValidation(array $attributes)
    {
        // Validate effective dates
        if (isset($attributes['effective_to']) && isset($attributes['effective_from'])) {
            if ($attributes['effective_to'] <= $attributes['effective_from']) {
                throw new \InvalidArgumentException('Effective to date must be after effective from date.');
            }
        }

        // Validate rate
        if (isset($attributes['rate'])) {
            if ($attributes['rate'] < 0 || $attributes['rate'] > 1) {
                throw new \InvalidArgumentException('Tax rate must be between 0 and 1 (0% to 100%).');
            }
        }

        return static::create($attributes);
    }

    /**
     * Update tax configuration with validation.
     */
    public function updateWithValidation(array $attributes)
    {
        // Validate effective dates
        if (isset($attributes['effective_to']) && isset($attributes['effective_from'])) {
            if ($attributes['effective_to'] <= $attributes['effective_from']) {
                throw new \InvalidArgumentException('Effective to date must be after effective from date.');
            }
        }

        // Validate rate
        if (isset($attributes['rate'])) {
            if ($attributes['rate'] < 0 || $attributes['rate'] > 1) {
                throw new \InvalidArgumentException('Tax rate must be between 0 and 1 (0% to 100%).');
            }
        }

        return $this->update($attributes);
    }
}