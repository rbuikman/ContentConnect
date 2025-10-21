<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Content extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'excel_file_path',
        'is_network_path',
        'active',
        'created_by',
        'modified_by',
    ];

    protected $casts = [
        'is_network_path' => 'boolean',
        'active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function documents()
    {
        return $this->belongsToMany(Document::class, 'document_content');
    }
}
