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
        $page = $request->get('page', 1);
        $perPage = 10;

        $query = Content::query()->orderBy('created_at', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $contents = $query->paginate($perPage, ['*'], 'page', $page);

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
        } else {
            $request->validate([
                'name' => 'required|string|max:255',
                'excel_file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB max
                'active' => 'boolean',
            ]);

            $filePath = null;
            if ($request->hasFile('excel_file')) {
                $file = $request->file('excel_file');
                $filename = time() . '_' . $file->getClientOriginalName();
                
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
            'excel_file_path' => $filePath,
            'is_network_path' => $isNetworkPath,
            'active' => $request->boolean('active', true), // Default to true
            'created_by' => Auth::user()->name,
            'modified_by' => Auth::user()->name,
        ]);

        return redirect()->route('contents.index')->with('success', 'Content created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Content $content)
    {
        $isNetworkPath = $request->boolean('is_network_path');
        
        $content->name = $request->name;
        $content->active = $request->boolean('active', $content->active); // Keep existing value if not provided
        $content->modified_by = Auth::user()->name;
        
        if ($isNetworkPath) {
            $request->validate([
                'name' => 'required|string|max:255',
                'network_path' => 'required|string|max:500',
            ]);
            
            // Delete old file if it was a local file
            if (!$content->is_network_path && $content->excel_file_path && file_exists($content->excel_file_path)) {
                unlink($content->excel_file_path);
            }
            
            $content->excel_file_path = $request->network_path;
            $content->is_network_path = true;
        } else {
            $request->validate([
                'name' => 'required|string|max:255',
                'excel_file' => 'nullable|file|mimes:xlsx,xls|max:10240', // 10MB max
                'active' => 'boolean',
            ]);

            // Handle file upload if provided
            if ($request->hasFile('excel_file')) {
                // Delete old file if exists and it's a local file
                if (!$content->is_network_path && $content->excel_file_path && file_exists($content->excel_file_path)) {
                    unlink($content->excel_file_path);
                }

                $file = $request->file('excel_file');
                $filename = time() . '_' . $file->getClientOriginalName();
                
                // Store in the configured content directory
                $contentStoragePath = env('CONTENTCONNECT_STORAGE_CONTENT');
                if (!file_exists($contentStoragePath)) {
                    mkdir($contentStoragePath, 0755, true);
                }
                
                $file->move($contentStoragePath, $filename);
                $content->excel_file_path = $contentStoragePath . '/' . $filename;
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
        // Delete the associated file only if it's a local file (not a network path)
        if (!$content->is_network_path && $content->excel_file_path && file_exists($content->excel_file_path)) {
            unlink($content->excel_file_path);
        }

        $content->delete();

        return redirect()->route('contents.index')->with('success', 'Content deleted successfully.');
    }

    /**
     * Download the Excel file
     */
    public function download(Content $content)
    {
        if (!$content->excel_file_path) {
            abort(404, 'No file path specified.');
        }
        
        if ($content->is_network_path) {
            // For network paths, redirect to the network location
            return redirect($content->excel_file_path);
        } else {
            // For local files, check if exists and download
            if (!file_exists($content->excel_file_path)) {
                abort(404, 'File not found.');
            }
            return response()->download($content->excel_file_path);
        }
    }
}
