<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Content extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'file_path',
        'mime_type',
        'original_filename',
        'file_size',
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

    /**
     * Get the company that owns the content.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Scope to filter content by company
     */
    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Check if the content is an Excel file
     */
    public function isExcelFile(): bool
    {
        return in_array($this->mime_type, [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]);
    }

    /**
     * Check if the content is an image file
     */
    public function isImageFile(): bool
    {
        return str_starts_with($this->mime_type ?? '', 'image/');
    }

    /**
     * Get the file type category
     */
    public function getFileTypeAttribute(): string
    {
        if ($this->isExcelFile()) {
            return 'excel';
        } elseif ($this->isImageFile()) {
            return 'image';
        }
        
        return 'other';
    }

    /**
     * Get human-readable file size
     */
    public function getFormattedFileSizeAttribute(): ?string
    {
        if (!$this->file_size) {
            return null;
        }

        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
