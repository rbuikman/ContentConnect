<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Status;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $status = Status::create(['name' => 'Design']);
        $status = Status::create(['name' => 'Review']);
        $status = Status::create(['name' => 'Ready for Production']);
    }
}
