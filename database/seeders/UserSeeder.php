<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $user = User::create([
        	'name' => 'Rene Buikman', 
        	'email' => 'rene@valke.net',
        	'password' => bcrypt('abcdefgh')
        ]);

        $permissions = Permission::pluck('id','id')->all();
        
        $adminRole = Role::firstOrCreate(['name' => 'admin']);

        $adminRole->syncPermissions($permissions);

        $user->assignRole([$adminRole->id]);
    }
}
