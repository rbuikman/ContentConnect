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
        Schema::table('document_content', function (Blueprint $table) {
            $table->foreignId('document_id')->constrained()->onDelete('cascade');
            $table->foreignId('content_id')->constrained()->onDelete('cascade');
            
            // Ensure unique combinations
            $table->unique(['document_id', 'content_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_content', function (Blueprint $table) {
            $table->dropForeign(['document_id']);
            $table->dropForeign(['content_id']);
            $table->dropUnique(['document_id', 'content_id']);
            $table->dropColumn(['document_id', 'content_id']);
        });
    }
};
