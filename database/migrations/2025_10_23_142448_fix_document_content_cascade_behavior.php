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
            // Drop existing foreign keys
            $table->dropForeign(['document_id']);
            $table->dropForeign(['content_id']);
            
            // Recreate foreign keys with proper cascade behavior
            // Documents can cascade delete (when document is deleted, remove pivot entries)
            $table->foreign('document_id')->references('id')->on('documents')->onDelete('cascade');
            
            // Contents should restrict delete (prevent content deletion when referenced by documents)  
            $table->foreign('content_id')->references('id')->on('contents')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_content', function (Blueprint $table) {
            // Drop the modified foreign keys
            $table->dropForeign(['document_id']);
            $table->dropForeign(['content_id']);
            
            // Restore original cascade behavior
            $table->foreign('document_id')->references('id')->on('documents')->onDelete('cascade');
            $table->foreign('content_id')->references('id')->on('contents')->onDelete('cascade');
        });
    }
};
