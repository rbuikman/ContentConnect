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
        $templatesPermissions = [
            'templates-index',
            'templates-create',
            'templates-edit',
            'templates-delete',
        ];

        foreach ($templatesPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $templatesPermissions = [
            'templates-index',
            'templates-create',
            'templates-edit',
            'templates-delete',
        ];

        foreach ($templatesPermissions as $permission) {
            Permission::where('name', $permission)->delete();
        }
    }
};
