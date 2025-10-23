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
        // Get user first
        $user = auth()->user();
        
        // First, automatically update templates from storage
        try {
            $this->syncTemplatesFromStorage($user->company->name);
        } catch (\Exception $e) {
            Log::error('Error syncing templates from storage during index: ' . $e->getMessage());
            // Continue with loading the page even if sync fails
        }

        $query = $request->input('search');
    $categoryId = $request->input('category_id');
    $subCategoryId = $request->input('sub_category_id');
    $statusId = $request->input('status_id');
    $languageId = $request->input('language_id');
    $contentId = $request->input('content_id');
    $modifiedAt = $request->input('modified_at');

        $documents = Document::with(['category', 'subcategory', 'status', 'languages', 'contents'])
            ->where('template', true)
            ->where('deleted', false);

        $documents->forCompany($user->company_id);

        $documents = $documents
            ->when($query, function($q) use ($query) {
                $q->where(function($subQ) use ($query) {
                    $subQ->where('order_number', 'like', "%{$query}%")
                        ->orWhere('file_name', 'like', "%{$query}%")
                        ->orWhere('note', 'like', "%{$query}%");
                });
            })
            ->when($categoryId, function($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->when($subCategoryId, function($q) use ($subCategoryId) {
                $q->where('sub_category_id', $subCategoryId);
            })
            ->when($statusId, function($q) use ($statusId) {
                $q->where('status_id', $statusId);
            })
            ->when($languageId, function($q) use ($languageId) {
                $q->whereHas('languages', function($langQ) use ($languageId) {
                    $langQ->where('languages.id', $languageId);
                });
            })
            ->when($contentId, function($q) use ($contentId) {
                $q->whereHas('contents', function($contQ) use ($contentId) {
                    $contQ->where('contents.id', $contentId);
                });
            })
            ->when($modifiedAt, function($q) use ($modifiedAt) {
                $q->whereDate('modified_at', $modifiedAt);
            })
            ->orderBy('modified_at', 'desc')
            ->paginate(env('ITEMLIST_COUNT', 50))
            ->withQueryString();

        return Inertia::render('Documents/ListDocuments', [
            'documents' => $documents ?? [
                'data' => []
            ],
            'categories' => Category::forCompany($user->company_id)->active()->get(),
            'subcategories' => SubCategory::forCompany($user->company_id)->get(),
            'statuses' => Status::where('active', true)->forCompany($user->company_id)->get(),
            'languages' => Language::where('active', true)->forCompany($user->company_id)->get(),
            'contents' => \App\Models\Content::where('active', true)->forCompany($user->company_id)->get(),
            'templates' => Document::where('template', true)->where('deleted', false)->forCompany($user->company_id)->with(['languages', 'contents'])->get(['id', 'file_name', 'category_id', 'sub_category_id']),
            'template' => true, // Pass template parameter for templates
            'webeditorUrl' => config('app.webeditor_url'), // Add webeditor URL from config
            'webeditorDocumentPath' => str_replace('{company}', $user->company->name, config('app.webeditor_template_path')), // Add template path from config
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
            'order_number' => $request->order_number,
            'file_name' => $request->file_name,
            'note' => $request->note,
            'category_id' => $request->category_id,
            'sub_category_id' => $request->sub_category_id,
            'status_id' => $request->status_id,
            'template' => true, // Always set template to true for templates
            'company_id' => auth()->user()->company_id,
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

        // Check company authorization
        $user = auth()->user();
        if ($document->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to template from another company.');
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
        
        // Check company authorization
        $user = auth()->user();
        if ($document->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to template from another company.');
        }
        
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
            $user = auth()->user();
            $result = $this->syncTemplatesFromStorage($user->company->name);
            
            $message = "Templates updated. Created: {$result['created']}, Skipped: {$result['skipped']}, Deleted: {$result['deleted']}";
            Log::info($message);

            return redirect()->route('templates.index')->with('success', $message);

        } catch (\Exception $e) {
            Log::error('Error reading templates from storage: ' . $e->getMessage());
            return redirect()->route('templates.index')->with('error', 'Error reading templates from storage: ' . $e->getMessage());
        }
    }

    /**
     * Automatically update templates by scanning the storage folder
     * Only processes templates in Category/Subcategory folder structure
     * 
     * @param string $companyName The company name to replace in the path
     * @return array
     * @throws \Exception
     */
    private function syncTemplatesFromStorage(string $companyName): array
    {
        $templateFolder = env('CONTENTCONNECT_STORAGE_TEMPLATES');
        $templateFolder = str_replace('{company}', $companyName, $templateFolder);
        
        if (!$templateFolder || !is_dir($templateFolder)) {
            throw new \Exception('Template folder not found or not configured properly.');
        }

        $createdCount = 0;
        $skippedCount = 0;
        $deletedCount = 0;
        
        // Track all existing files in storage (with their full path structure)
        $existingFiles = [];
        $defaultCompanyId = auth()->user() ? auth()->user()->company_id : \App\Models\Company::first()->id;

        // Ensure we have a company to work with
        if (!$defaultCompanyId) {
            throw new \Exception('No company found in database for template processing.');
        }

        // For initial database seeding: ensure statuses and languages are assigned to the first company
        $this->ensureInitialDataAssignment($defaultCompanyId);

        // Get all subdirectories (categories) - skip root files and category-only files
        $categoryDirs = glob($templateFolder . '/*', GLOB_ONLYDIR);

        foreach ($categoryDirs as $categoryDir) {
            $categoryName = basename($categoryDir);
            
            // Find or create category in database
            $category = Category::where('name', $categoryName)
                ->where('company_id', $defaultCompanyId)
                ->first();
                
            if (!$category) {
                // Create new category
                $category = Category::create([
                    'name' => $categoryName,
                    'company_id' => $defaultCompanyId,
                    'active' => true,
                ]);
                Log::info("Created new category: {$categoryName}");
            }
            
            Log::info("Processing category: {$categoryName}");

            // Get all subdirectories within category (subcategories)
            $subcategoryDirs = glob($categoryDir . '/*', GLOB_ONLYDIR);

            foreach ($subcategoryDirs as $subcategoryDir) {
                $subcategoryName = basename($subcategoryDir);
                
                // Find or create subcategory in database
                $subcategory = SubCategory::where('name', $subcategoryName)
                    ->where('category_id', $category->id)
                    ->first();
                    
                if (!$subcategory) {
                    // Create new subcategory
                    $subcategory = SubCategory::create([
                        'name' => $subcategoryName,
                        'category_id' => $category->id,
                    ]);
                    Log::info("Created new subcategory: {$subcategoryName} under category: {$categoryName}");
                }
                
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

                    // Get default status - try company-specific first, then any active status
                    $defaultStatus = Status::where('company_id', $defaultCompanyId)
                        ->where('active', true)
                        ->first();
                    
                    if (!$defaultStatus) {
                        // Fallback: get any active status for the company
                        $defaultStatus = Status::where('company_id', $defaultCompanyId)->first();
                    }
                    
                    if (!$defaultStatus) {
                        // Fallback for initial seeding: get the first available status and assign it to the company
                        $defaultStatus = Status::where('active', true)->first();
                        if ($defaultStatus && !$defaultStatus->company_id) {
                            $defaultStatus->update(['company_id' => $defaultCompanyId]);
                        }
                    }
                    
                    if (!$defaultStatus) {
                        Log::error("No status found in database at all");
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
                        'company_id' => $defaultCompanyId,
                        'created_by' => auth()->user() ? auth()->user()->name : 'system',
                        'created_at' => now(),
                        'modified_by' => auth()->user() ? auth()->user()->name : 'system',
                        'modified_at' => now(),
                    ]);

                    $createdCount++;
                    Log::info("Created template: {$fileName} in {$categoryName}/{$subcategoryName}");
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

    /**
     * Ensure that statuses and languages are assigned to a company for initial database seeding
     * 
     * @param int $companyId The company ID to assign records to
     * @return void
     */
    private function ensureInitialDataAssignment(int $companyId): void
    {
        // Check if there are any statuses without company assignment and assign them to the first company
        $unassignedStatuses = Status::whereNull('company_id')->get();
        if ($unassignedStatuses->count() > 0) {
            foreach ($unassignedStatuses as $status) {
                $status->update(['company_id' => $companyId]);
            }
            Log::info("Assigned {$unassignedStatuses->count()} unassigned statuses to company {$companyId}");
        }

        // Check if there are any languages without company assignment and assign them to the first company
        $unassignedLanguages = Language::whereNull('company_id')->get();
        if ($unassignedLanguages->count() > 0) {
            foreach ($unassignedLanguages as $language) {
                $language->update(['company_id' => $companyId]);
            }
            Log::info("Assigned {$unassignedLanguages->count()} unassigned languages to company {$companyId}");
        }
    }
}