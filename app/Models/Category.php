<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'company_id', 'active', 'sortorder'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function subcategories()
    {
        return $this->hasMany(SubCategory::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Get the company that owns the category.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Scope to filter categories by company
     */
    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Scope to filter active categories
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
