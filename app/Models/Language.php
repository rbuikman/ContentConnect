<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function documents()
    {
        return $this->belongsToMany(Document::class, 'document_language');
    }
}
