<?php

namespace App\Http\Controllers;

use App\Models\Content;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ContentsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->get('search');

        $query = Content::query()->orderBy('updated_at', 'desc');

        // Apply company scoping - always filter by user's company
        $user = Auth::user();
        $query->forCompany($user->company_id);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $contents = $query->paginate(env('ITEMLIST_COUNT', 50));

        return Inertia::render('Contents/ListContents', [
            'contents' => $contents,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $isNetworkPath = $request->boolean('is_network_path');
        
        if ($isNetworkPath) {
            $request->validate([
                'name' => 'required|string|max:255',
                'network_path' => 'required|string|max:500',
                'active' => 'boolean',
            ]);
            
            $filePath = $request->network_path;
            $mimeType = null; // Network paths don't have MIME type detection
            $originalFilename = basename($request->network_path);
            $fileSize = null;
        } else {
            $request->validate([
                'name' => 'required|string|max:255',
                'excel_file' => 'required|file|mimes:xlsx,xls,jpg,jpeg,png,gif,bmp,webp,svg|max:10240', // 10MB max - Excel and image files
                'active' => 'boolean',
            ]);

            $filePath = null;
            $mimeType = null;
            $originalFilename = null;
            $fileSize = null;
            
            if ($request->hasFile('excel_file')) {
                $file = $request->file('excel_file');
                $filename = time() . '_' . $file->getClientOriginalName();
                
                // Capture file metadata
                $mimeType = $file->getMimeType();
                $originalFilename = $file->getClientOriginalName();
                $fileSize = $file->getSize();
                
                // Store in the configured content directory
                $contentStoragePath = env('CONTENTCONNECT_STORAGE_CONTENT');
                if (!file_exists($contentStoragePath)) {
                    mkdir($contentStoragePath, 0755, true);
                }
                
                $file->move($contentStoragePath, $filename);
                $filePath = $contentStoragePath . '/' . $filename;
            }
        }

        Content::create([
            'name' => $request->name,
            'file_path' => $filePath,
            'mime_type' => $mimeType,
            'original_filename' => $originalFilename,
            'file_size' => $fileSize,
            'is_network_path' => $isNetworkPath,
            'active' => $request->boolean('active', true), // Default to true
            'company_id' => Auth::user()->company_id,
            'created_by' => Auth::user()->name,
            'updated_by' => Auth::user()->name,
        ]);

        return redirect()->route('contents.index')->with('success', 'Content created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Content $content)
    {
        // Check company authorization
        $user = Auth::user();
        if ($content->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to content from another company.');
        }

        $isNetworkPath = $request->boolean('is_network_path');
        
        $content->name = $request->name;
        $content->active = $request->boolean('active', $content->active); // Keep existing value if not provided
        $content->updated_by = Auth::user()->name;
        
        if ($isNetworkPath) {
            $request->validate([
                'name' => 'required|string|max:255',
                'network_path' => 'required|string|max:500',
            ]);
            
            // Delete old file if it was a local file
            if (!$content->is_network_path && $content->file_path && file_exists($content->file_path)) {
                unlink($content->file_path);
            }
            
            $content->file_path = $request->network_path;
            $content->mime_type = null; // Network paths don't have MIME type detection
            $content->original_filename = null;
            $content->file_size = null;
            $content->is_network_path = true;
        } else {
            $request->validate([
                'name' => 'required|string|max:255',
                'excel_file' => 'nullable|file|mimes:xlsx,xls,jpg,jpeg,png,gif,bmp,webp,svg|max:10240', // 10MB max - Excel and image files
                'active' => 'boolean',
            ]);

            // Handle file upload if provided
            if ($request->hasFile('excel_file')) {
                // Delete old file if exists and it's a local file
                if (!$content->is_network_path && $content->file_path && file_exists($content->file_path)) {
                    unlink($content->file_path);
                }

                $file = $request->file('excel_file');
                $filename = time() . '_' . $file->getClientOriginalName();
                
                // Store in the configured content directory
                $contentStoragePath = env('CONTENTCONNECT_STORAGE_CONTENT');
                if (!file_exists($contentStoragePath)) {
                    mkdir($contentStoragePath, 0755, true);
                }
                
                $file->move($contentStoragePath, $filename);
                $content->file_path = $contentStoragePath . '/' . $filename;
                $content->mime_type = $file->getMimeType();
                $content->original_filename = $file->getClientOriginalName();
                $content->file_size = $file->getSize();
                $content->is_network_path = false;
            }
        }

        $content->save();

        return redirect()->route('contents.index')->with('success', 'Content updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Content $content)
    {
        // Ensure the content belongs to the current user's company
        if ($content->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if the content is referenced by any documents
        if ($content->documents()->exists()) {
            $documentCount = $content->documents()->count();
            return response()->json([
                'error' => "Cannot delete content. It is currently referenced by {$documentCount} document(s). Please remove these references first."
            ], 422);
        }

        try {
            // Get the file path before deleting the record
            $filePath = $content->file_path;
            
            // Delete the content record
            $content->delete();
            
            // If it's a local file path, delete the actual file
            if ($filePath && strpos($filePath, '\\\\') !== 0) {
                $fullPath = storage_path('app/' . $filePath);
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
            }
            
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            \Log::error('Error deleting content: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete content'], 500);
        }
    }

    /**
     * Preview/view the file inline (for images)
     */
    public function preview(Content $content)
    {
        // Check company authorization
        $user = Auth::user();
        if ($content->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to content from another company.');
        }

        if (!$content->file_path) {
            abort(404, 'No file path specified.');
        }
        
        if ($content->is_network_path) {
            // For network paths, redirect to the network location
            return redirect($content->file_path);
        } else {
            // For local files, check if exists and serve inline
            $fullPath = storage_path('app/' . $content->file_path);
            if (!file_exists($fullPath)) {
                abort(404, 'File not found.');
            }
            
            // Get the file mime type
            $mimeType = $content->mime_type ?: mime_content_type($fullPath);
            
            // Serve the file inline
            return response()->file($fullPath, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline'
            ]);
        }
    }

    /**
     * Download the  file
     */
    public function download(Content $content)
    {
        // Check company authorization
        $user = Auth::user();
        if ($content->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to content from another company.');
        }

        if (!$content->file_path) {
            abort(404, 'No file path specified.');
        }
        
        if ($content->is_network_path) {
            // For network paths, redirect to the network location
            return redirect($content->file_path);
        } else {
            // For local files, check if exists and download
            if (!file_exists($content->file_path)) {
                abort(404, 'File not found.');
            }
            return response()->download($content->file_path);
        }
    }
}
