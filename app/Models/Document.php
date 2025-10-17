<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Document extends Model
{
    use HasFactory;

    protected $table = 'documents';

    protected $fillable = [
        'order_number',
        'file_name',
        'note',
        'category_id',
        'sub_category_id',
        'status_id',
        'template',
        'template_id',
        'deleted',
        'created_by',
        'created_at',
        'modified_by',
        'modified_at'
    ];

    protected $casts = [
        'template' => 'boolean',
        'deleted' => 'boolean',
    ];

    public $timestamps = false;

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function subCategory()
    {
        return $this->belongsTo(SubCategory::class, 'sub_category_id');
    }
    public function status()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    // Template relationship - a document can be based on a template
    public function baseTemplate()
    {
        return $this->belongsTo(Document::class, 'template_id');
    }

    // Reverse relationship - a template can have many documents based on it
    public function basedDocuments()
    {
        return $this->hasMany(Document::class, 'template_id')->where('template', false);
    }

    // Scope for templates only
    public function scopeTemplates($query)
    {
        return $query->where('template', true);
    }

    // Scope for documents only (non-templates)
    public function scopeDocuments($query)
    {
        return $query->where('template', false);
    }

    // Scope for non-deleted records
    public function scopeNotDeleted($query)
    {
        return $query->where('deleted', false);
    }

    // Scope for deleted records
    public function scopeOnlyDeleted($query)
    {
        return $query->where('deleted', true);
    }
}
