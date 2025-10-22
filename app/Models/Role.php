<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    protected $fillable = [
        'company_id',
        'name',
        'guard_name'
    ];

    protected $casts = [
        'company_id' => 'integer',
    ];

    /**
     * Get the company that owns the role.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Scope to filter roles by company
     */
    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Scope to get global roles (no company)
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('company_id');
    }

    /**
     * Override Spatie's role creation to handle company-scoped uniqueness
     */
    public static function create(array $attributes = [])
    {
        $attributes['guard_name'] = $attributes['guard_name'] ?? config('auth.defaults.guard');

        // Check for company-scoped uniqueness instead of global uniqueness
        $existingRole = static::where('name', $attributes['name'])
            ->where('guard_name', $attributes['guard_name'])
            ->where('company_id', $attributes['company_id'] ?? null)
            ->first();

        if ($existingRole) {
            $companyScope = $attributes['company_id'] ? "company ID {$attributes['company_id']}" : "global scope";
            throw new \Spatie\Permission\Exceptions\RoleAlreadyExists(
                "A role `{$attributes['name']}` already exists for guard `{$attributes['guard_name']}` in {$companyScope}."
            );
        }

        return static::query()->create($attributes);
    }

    /**
     * Override Spatie's findOrCreate to handle company-scoped uniqueness
     */
    public static function findOrCreate(string $name, $guardName = null): self
    {
        $guardName = $guardName ?? config('auth.defaults.guard');
        
        // Get company_id from current user context if available
        $companyId = null;
        if (auth()->check() && !auth()->user()->hasRole('SuperAdmin')) {
            $companyId = auth()->user()->company_id;
        }

        $role = static::where('name', $name)
            ->where('guard_name', $guardName)
            ->where('company_id', $companyId)
            ->first();

        if (!$role) {
            $role = static::create([
                'name' => $name, 
                'guard_name' => $guardName,
                'company_id' => $companyId
            ]);
        }

        return $role;
    }
}