<?php

namespace Database\Seeders;

use App\Models\Language;
use Illuminate\Database\Seeder;

class LanguageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $languages = [
            ['name' => 'English', 'code' => 'EN'],
            ['name' => 'Dutch', 'code' => 'NL'],
            ['name' => 'French', 'code' => 'FR'],
            ['name' => 'German', 'code' => 'DE'],
            ['name' => 'Spanish', 'code' => 'ES'],
            ['name' => 'Italian', 'code' => 'IT'],
            ['name' => 'Portuguese', 'code' => 'PT'],
            ['name' => 'Russian', 'code' => 'RU'],
            ['name' => 'Chinese (Simplified)', 'code' => 'CN'],
            ['name' => 'Japanese', 'code' => 'JP'],
            ['name' => 'Korean', 'code' => 'KR'],
            ['name' => 'Arabic', 'code' => 'AR'],
            ['name' => 'Hindi', 'code' => 'HI'],
            ['name' => 'Turkish', 'code' => 'TR'],
            ['name' => 'Polish', 'code' => 'PL'],
            ['name' => 'Swedish', 'code' => 'SV'],
            ['name' => 'Norwegian', 'code' => 'NO'],
            ['name' => 'Danish', 'code' => 'DA'],
            ['name' => 'Finnish', 'code' => 'FI'],
            ['name' => 'Czech', 'code' => 'CS'],
        ];

        foreach ($languages as $language) {
            Language::updateOrCreate(
                ['code' => $language['code']],
                ['name' => $language['name']]
            );
        }

        $this->command->info('Languages seeded successfully. Total languages: ' . Language::count());
    }
}