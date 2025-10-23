<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

abstract class Controller
{
    /**
     * Safely download a file with proper permission checks and error handling
     * 
     * @param string $filePath The full path to the file
     * @param string|null $downloadName Optional custom download name
     * @return BinaryFileResponse
     */
    protected function safeFileDownload(string $filePath, ?string $downloadName = null): BinaryFileResponse
    {
        // Check if file exists
        if (!file_exists($filePath)) {
            Log::error("Download attempted on non-existent file", [
                'filePath' => $filePath,
                'userId' => auth()->id(),
            ]);
            abort(404, 'File not found.');
        }
        
        // Check if file is readable
        if (!is_readable($filePath)) {
            Log::error("Download attempted on unreadable file", [
                'filePath' => $filePath,
                'fileExists' => file_exists($filePath),
                'isFile' => is_file($filePath),
                'isReadable' => is_readable($filePath),
                'filePerms' => file_exists($filePath) ? substr(sprintf('%o', fileperms($filePath)), -4) : 'N/A',
                'userId' => auth()->id(),
            ]);
            abort(403, 'File is not accessible due to permission restrictions.');
        }
        
        // Use provided name or default to basename
        $fileName = $downloadName ?: basename($filePath);
        
        Log::info("File download initiated", [
            'filePath' => $filePath,
            'downloadName' => $fileName,
            'userId' => auth()->id(),
        ]);
        
        return response()->download($filePath, $fileName);
    }
}
