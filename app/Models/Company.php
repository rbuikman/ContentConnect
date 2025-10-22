<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'name',
        'numberoflicences',
        'active',
    ];

    protected $casts = [
        'numberoflicences' => 'integer',
        'active' => 'boolean',
    ];

    /**
     * Get the users for the company.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
