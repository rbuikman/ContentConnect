<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'sortorder')) {
                $table->integer('sortorder')->default(0)->after('name');
            }
        });
        Schema::table('statuses', function (Blueprint $table) {
            if (!Schema::hasColumn('statuses', 'sortorder')) {
                $table->integer('sortorder')->default(0)->after('name');
            }
        });
        Schema::table('languages', function (Blueprint $table) {
            if (!Schema::hasColumn('languages', 'sortorder')) {
                $table->integer('sortorder')->default(0)->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'sortorder')) {
                $table->dropColumn('sortorder');
            }
        });
        Schema::table('statuses', function (Blueprint $table) {
            if (Schema::hasColumn('statuses', 'sortorder')) {
                $table->dropColumn('sortorder');
            }
        });
        Schema::table('languages', function (Blueprint $table) {
            if (Schema::hasColumn('languages', 'sortorder')) {
                $table->dropColumn('sortorder');
            }
        });
    }
};
