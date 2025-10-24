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
        // Drop the existing contents table if it exists
        Schema::dropIfExists('contents');
        
        // Create the contents table with correct structure
        Schema::create('contents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('excel_file_path')->nullable(); // Can be local file path or network path
            $table->boolean('is_network_path')->default(false); // Flag to indicate if it's a network path
            $table->string('created_by');
            $table->string('updated_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contents');
    }
};
