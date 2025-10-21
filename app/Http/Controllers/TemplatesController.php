<?php
namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Category;
use App\Models\SubCategory;
use App\Models\Status;
use App\Models\Language;
use App\Models\Content;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log; // Import the Log facade

class TemplatesController extends Controller
{
    public function index(Request $request)
    {
        // First, automatically update templates from storage
        try {
            $this->syncTemplatesFromStorage();
        } catch (\Exception $e) {
            Log::error('Error syncing templates from storage during index: ' . $e->getMessage());
            // Continue with loading the page even if sync fails
        }

        $query = $request->input('search');

        $documents = Document::with(['category', 'subcategory', 'status', 'languages', 'contents']) // Added 'contents' relationship
            ->where('template', true) // Filter for templates only
            ->where('deleted', false) // Filter out deleted records
            ->when($query, function($q) use ($query) {
                $q->where('order_number', 'like', "%{$query}%")
                ->orWhere('file_name', 'like', "%{$query}%");
            })
            ->orderBy('modified_at', 'desc') // Sort by modified_at descending
            ->paginate(1000)
            ->withQueryString(); // houdt de search parameter bij in paginatie

        return Inertia::render('Documents/ListDocuments', [
            'documents' => $documents ?? [
                'data' => []
            ],
            'categories' => Category::all(),
            'subcategories' => SubCategory::all(),
            'statuses' => Status::where('active', true)->get(), // Add only active statuses to props
            'languages' => Language::where('active', true)->get(), // Add only active languages to props
            'contents' => \App\Models\Content::where('active', true)->get(['id', 'name', 'excel_file_path', 'is_network_path']), // Add only active contents for selection
            'templates' => Document::where('template', true)->where('deleted', false)->with('languages')->get(['id', 'file_name', 'category_id', 'sub_category_id']), // Add templates for selection with relationships
            'template' => true, // Pass template parameter for templates
            'webeditorUrl' => config('app.webeditor_url'), // Add webeditor URL from config
            'webeditorDocumentPath' => config('app.webeditor_template_path'), // Add template path from config
        ]);
    }

    public function store(Request $request)
    {    
        Log::info('Create template request data:', $request->all()); // Log the request data
      
        $request->validate([
            'order_number' => 'nullable|string', // Make nullable for templates
            'file_name' => 'required|string',
            'note' => 'nullable|string',
            'category_id' => 'required|integer',
            'sub_category_id' => 'required|integer',
            'status_id' => 'required|integer',
            'language_ids' => 'nullable|array',
            'language_ids.*' => 'integer|exists:languages,id',
            'content_ids' => 'nullable|array',
            'content_ids.*' => 'integer|exists:contents,id',
        ]);
 
        $document = Document::create([
            ...$request->all(),
            'template' => true, // Always set template to true for templates
            'created_by' => auth()->user()->name,
            'created_at' => now(),
            'modified_by' => auth()->user()->name,
            'modified_at' => now(),
        ]);

        Log::info('Template after creation:', $document->fresh()->toArray());

        // Associate languages with the template
        if ($request->language_ids) {
            $document->languages()->sync($request->language_ids);
        }

        // Associate contents with the template
        if ($request->content_ids) {
            $document->contents()->sync($request->content_ids);
        }

        return redirect()->route('templates.index')->with('success', 'Template created successfully');
    }

    public function update(Request $request)
    {
        Log::info('Update template request data:', $request->all());
        Log::info('Status data specifically:', ['status' => $request->status, 'status_id' => $request->status_id]);

        $document = Document::find($request->id);

        if (!$document) {
            return redirect()->back()->withErrors(['error' => 'Template not found']);
        }

        Log::info('Template before update:', $document->toArray());

        $request->validate([
            'order_number' => 'nullable|string', // Make nullable for templates
            'file_name' => 'required|string',
            'note' => 'nullable|string',
            'category_id' => 'nullable|integer',
            'sub_category_id' => 'nullable|integer',
            'status_id' => 'required|integer',
            'language_ids' => 'nullable|array',
            'language_ids.*' => 'integer|exists:languages,id',
            'content_ids' => 'nullable|array',
            'content_ids.*' => 'integer|exists:contents,id',
        ]);

        $document->update([
            'order_number' => $request->order_number ?? '', // Default to empty string if null
            'file_name' => $request->file_name,
            'note' => $request->note,
            'category_id' => $request->category_id,
            'sub_category_id' => $request->sub_category_id,
            'status_id' => $request->status_id,
            'template' => true, // Always keep template as true for templates
            'modified_by' => auth()->user()->name,
            'modified_at' => now(),
        ]);

        // Update language associations
        if ($request->has('language_ids')) {
            $document->languages()->sync($request->language_ids ?? []);
        }

        // Update content associations
        if ($request->has('content_ids')) {
            $document->contents()->sync($request->content_ids ?? []);
        }

        Log::info('Template after update:', $document->toArray());

        return redirect()->back()->with('success', 'Template updated successfully');
    }

    public function destroy($id)
    {
        $document = Document::where('deleted', false)->findOrFail($id);
        
        // Soft delete: set deleted flag and update metadata
        $document->update([
            'deleted' => true,
            'modified_by' => auth()->user()->name,
            'modified_at' => now(),
        ]);

        return redirect()->route('templates.index')->with('success', 'Template deleted successfully');
    }

    public function readTemplatesFromStorage(Request $request)
    {
        try {
            $result = $this->syncTemplatesFromStorage();
            
            $message = "Templates updated. Created: {$result['created']}, Skipped: {$result['skipped']}, Deleted: {$result['deleted']}";
            Log::info($message);

            return redirect()->route('templates.index')->with('success', $message);

        } catch (\Exception $e) {
            Log::error('Error reading templates from storage: ' . $e->getMessage());
            return redirect()->route('templates.index')->with('error', 'Error reading templates from storage: ' . $e->getMessage());
        }
    }

    /**
     * Sync templates from storage directory to database
     * @return array Returns array with 'created', 'skipped', and 'deleted' counts
     * @throws \Exception
     */
    private function syncTemplatesFromStorage(): array
    {
        $templateFolder = env('CONTENTCONNECT_STORAGE_TEMPLATES');
        
        if (!$templateFolder || !is_dir($templateFolder)) {
            throw new \Exception('Template folder not found or not configured properly.');
        }

        $createdCount = 0;
        $skippedCount = 0;
        $deletedCount = 0;
        
        // Track all existing files in storage (with their full path structure)
        $existingFiles = [];

        // Create or get default category and subcategory
        $defaultCategory = Category::firstOrCreate(['name' => 'default']);
        $defaultSubcategory = SubCategory::firstOrCreate([
            'name' => 'default',
            'category_id' => $defaultCategory->id
        ]);

        // First, check for files directly in the root template folder
        $rootFiles = glob($templateFolder . '/*');
        $rootFiles = array_filter($rootFiles, 'is_file'); // Only files, not directories
        
        // Filter to only include .indd and .indt files
        $rootFiles = array_filter($rootFiles, function($file) {
            $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            return in_array($extension, ['indd', 'indt']);
        });

        // Process root files with default category/subcategory
        foreach ($rootFiles as $rootFile) {
            $fileName = pathinfo(basename($rootFile), PATHINFO_FILENAME);
            
            // Track this file as existing in storage
            $existingFiles[] = [
                'file_name' => $fileName,
                'category_id' => $defaultCategory->id,
                'sub_category_id' => $defaultSubcategory->id
            ];
            
            // Check if template already exists
            $existingTemplate = Document::where('file_name', $fileName)
                ->where('category_id', $defaultCategory->id)
                ->where('sub_category_id', $defaultSubcategory->id)
                ->where('template', true)
                ->where('deleted', false)
                ->first();

            if ($existingTemplate) {
                $skippedCount++;
                Log::info("Skipped existing template: {$fileName}");
                continue;
            }

            // Get default status
            $defaultStatus = Status::first();
            if (!$defaultStatus) {
                Log::error("No status found in database");
                continue;
            }

            // Create new template document with default category/subcategory
            Document::create([
                'order_number' => '',
                'file_name' => $fileName,
                'note' => "",
                'category_id' => $defaultCategory->id,
                'sub_category_id' => $defaultSubcategory->id,
                'status_id' => $defaultStatus->id,
                'template' => true,
                'created_by' => auth()->user() ? auth()->user()->name : 'system',
                'created_at' => now(),
                'modified_by' => auth()->user() ? auth()->user()->name : 'system',
                'modified_at' => now(),
            ]);

            $createdCount++;
            Log::info("Created template with default category: {$fileName}");
        }

        // Get all subdirectories (categories)
        $categoryDirs = glob($templateFolder . '/*', GLOB_ONLYDIR);

        foreach ($categoryDirs as $categoryDir) {
            $categoryName = basename($categoryDir);
            
            // Create or get category
            $category = Category::firstOrCreate(['name' => $categoryName]);
            Log::info("Processing category: {$categoryName}");

            // Check for files directly in category folder (no subcategory)
            $categoryFiles = glob($categoryDir . '/*');
            $categoryFiles = array_filter($categoryFiles, 'is_file');
            
            // Filter to only include .indd and .indt files
            $categoryFiles = array_filter($categoryFiles, function($file) {
                $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                return in_array($extension, ['indd', 'indt']);
            });

            // Process files in category folder with default subcategory
            foreach ($categoryFiles as $categoryFile) {
                $fileName = pathinfo(basename($categoryFile), PATHINFO_FILENAME);

                
                // Use default subcategory for this category
                $categoryDefaultSubcategory = SubCategory::firstOrCreate([
                    'name' => 'default',
                    'category_id' => $category->id
                ]);
                
                // Track this file as existing in storage
                $existingFiles[] = [
                    'file_name' => $fileName,
                    'category_id' => $category->id,
                    'sub_category_id' => $categoryDefaultSubcategory->id
                ];
                
                // Check if template already exists
                $existingTemplate = Document::where('file_name', $fileName)
                    ->where('category_id', $category->id)
                    ->where('sub_category_id', $categoryDefaultSubcategory->id)
                    ->where('template', true)
                    ->where('deleted', false)
                    ->first();

                if ($existingTemplate) {
                    $skippedCount++;
                    Log::info("Skipped existing template: {$fileName}");
                    continue;
                }

                // Get default status
                $defaultStatus = Status::first();
                if (!$defaultStatus) {
                    Log::error("No status found in database");
                    continue;
                }

                // Create new template document with default subcategory
                Document::create([
                    'order_number' => '',
                    'file_name' => $fileName,
                    'note' => "",
                    'category_id' => $category->id,
                    'sub_category_id' => $categoryDefaultSubcategory->id,
                    'status_id' => $defaultStatus->id,
                    'template' => true,
                    'created_by' => auth()->user() ? auth()->user()->name : 'system',
                    'created_at' => now(),
                    'modified_by' => auth()->user() ? auth()->user()->name : 'system',
                    'modified_at' => now(),
                ]);

                $createdCount++;
                Log::info("Created template with default subcategory: {$fileName}");
            }

            // Get all subdirectories within category (subcategories)
            $subcategoryDirs = glob($categoryDir . '/*', GLOB_ONLYDIR);

            foreach ($subcategoryDirs as $subcategoryDir) {
                $subcategoryName = basename($subcategoryDir);
                
                // Create or get subcategory
                $subcategory = SubCategory::firstOrCreate([
                    'name' => $subcategoryName,
                    'category_id' => $category->id
                ]);
                Log::info("Processing subcategory: {$subcategoryName}");

                // Get all files in subcategory directory
                $files = glob($subcategoryDir . '/*');
                $files = array_filter($files, 'is_file'); // Only files, not directories
                
                // Filter to only include .indd and .indt files
                $files = array_filter($files, function($file) {
                    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                    return in_array($extension, ['indd', 'indt']);
                });

                foreach ($files as $subcategoryFile) {
                    $fileName = pathinfo(basename($subcategoryFile), PATHINFO_FILENAME);
                    
                    // Track this file as existing in storage
                    $existingFiles[] = [
                        'file_name' => $fileName,
                        'category_id' => $category->id,
                        'sub_category_id' => $subcategory->id
                    ];
                    
                    // Check if template already exists
                    $existingTemplate = Document::where('file_name', $fileName)
                        ->where('category_id', $category->id)
                        ->where('sub_category_id', $subcategory->id)
                        ->where('template', true)
                        ->where('deleted', false)
                        ->first();

                    if ($existingTemplate) {
                        $skippedCount++;
                        Log::info("Skipped existing template: {$fileName}");
                        continue;
                    }

                    // Get default status (assuming there's a default status)
                    $defaultStatus = Status::first();
                    if (!$defaultStatus) {
                        Log::error("No status found in database");
                        continue;
                    }

                    // Create new template document
                    Document::create([
                        'order_number' => '',
                        'file_name' => $fileName,
                        'note' => "",
                        'category_id' => $category->id,
                        'sub_category_id' => $subcategory->id,
                        'status_id' => $defaultStatus->id,
                        'template' => true,
                        'created_by' => auth()->user() ? auth()->user()->name : 'system',
                        'created_at' => now(),
                        'modified_by' => auth()->user() ? auth()->user()->name : 'system',
                        'modified_at' => now(),
                    ]);

                    $createdCount++;
                    Log::info("Created template: {$fileName}");
                }
            }
        }

        // Now check for templates in database that no longer exist in storage
        $allDbTemplates = Document::where('template', true)
            ->where('deleted', false)
            ->get(['id', 'file_name', 'category_id', 'sub_category_id']);

        foreach ($allDbTemplates as $dbTemplate) {
            $fileExists = false;
            
            // Check if this template exists in our collected files from storage
            foreach ($existingFiles as $existingFile) {
                if ($existingFile['file_name'] === $dbTemplate->file_name &&
                    $existingFile['category_id'] == $dbTemplate->category_id &&
                    $existingFile['sub_category_id'] == $dbTemplate->sub_category_id) {
                    $fileExists = true;
                    break;
                }
            }
            
            // If template doesn't exist in storage, mark as deleted
            if (!$fileExists) {
                $dbTemplate->update([
                    'deleted' => true,
                    'modified_by' => auth()->user() ? auth()->user()->name : 'system',
                    'modified_at' => now(),
                ]);
                
                $deletedCount++;
                Log::info("Marked template as deleted (no longer in storage): {$dbTemplate->file_name}");
            }
        }

        return [
            'created' => $createdCount,
            'skipped' => $skippedCount,
            'deleted' => $deletedCount
        ];
    }
}