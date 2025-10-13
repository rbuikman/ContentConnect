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
        'created_by',
        'created_at',
        'modified_by',
        'modified_at'
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
}
