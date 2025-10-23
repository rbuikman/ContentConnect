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
        Schema::table('contents', function (Blueprint $table) {
            // Rename the column to be more generic
            $table->renameColumn('excel_file_path', 'file_path');
            
            // Add new columns for better file management
            $table->string('mime_type')->nullable()->after('file_path');
            $table->string('original_filename')->nullable()->after('mime_type');
            $table->unsignedBigInteger('file_size')->nullable()->after('original_filename'); // in bytes
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contents', function (Blueprint $table) {
            // Remove the new columns
            $table->dropColumn(['mime_type', 'original_filename', 'file_size']);
            
            // Rename back to original name
            $table->renameColumn('file_path', 'excel_file_path');
        });
    }
};