<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubCategory;
use Spatie\Permission\Models\Role;

class SubCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $subCategory = SubCategory::create(['name' => 'SubCategory 1', 'category_id' => 1]);
        $subCategory = SubCategory::create(['name' => 'SubCategory 2', 'category_id' => 1]);
        $subCategory = SubCategory::create(['name' => 'SubCategory 3', 'category_id' => 1]);
    }
}
