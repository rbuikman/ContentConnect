<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $category = Category::create(['name' => 'Category 1']);
        $category = Category::create(['name' => 'Category 2']);
        $category = Category::create(['name' => 'Category 3']);
    }
}
