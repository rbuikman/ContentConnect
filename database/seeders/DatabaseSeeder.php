<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,    // Must run first - roles depend on permissions
            RoleSeeder::class,          // Must run after PermissionSeeder
            CompanySeeder::class,       // Must run before UserSeeder and StatusSeeder
            UserSeeder::class,          // Must run after CompanySeeder and RoleSeeder
            StatusSeeder::class,        // Must run after CompanySeeder
            LanguageSeeder::class,      // Can run anytime
        ]);
    }
}
