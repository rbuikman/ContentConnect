<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $role = Role::create(['name' => 'Admin']);
        $role = Role::create(['name' => 'Ontwerper']);
        $role = Role::create(['name' => 'Vervaardiger']);
        $role = Role::create(['name' => 'PictogrammenBeheerder']);
        $role = Role::create(['name' => 'LettertypeBeheerder']);
    }
}
