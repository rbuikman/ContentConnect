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
        $newPermissions = [
            'status-index',
            'status-create',
            'status-edit',
            'status-delete',
            'language-index',
            'language-create',
            'language-edit',
            'language-delete',
            'companies-index',
            'companies-create',
            'companies-edit',
            'companies-delete',
        ];

        foreach ($newPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $newPermissions = [
            'status-index',
            'status-create',
            'status-edit',
            'status-delete',
            'language-index',
            'language-create',
            'language-edit',
            'language-delete',
            'companies-index',
            'companies-create',
            'companies-edit',
            'companies-delete',
        ];

        foreach ($newPermissions as $permission) {
            Permission::where('name', $permission)->delete();
        }
    }
};
