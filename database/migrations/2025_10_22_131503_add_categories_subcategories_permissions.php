<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permissions = [
            'categories-index',
            'categories-create',
            'categories-edit',
            'categories-delete',
            'subcategories-index',
            'subcategories-create',
            'subcategories-edit',
            'subcategories-delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permissions = [
            'categories-index',
            'categories-create',
            'categories-edit',
            'categories-delete',
            'subcategories-index',
            'subcategories-create',
            'subcategories-edit',
            'subcategories-delete',
        ];

        foreach ($permissions as $permission) {
            Permission::where('name', $permission)->delete();
        }
    }
};
