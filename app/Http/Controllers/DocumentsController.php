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
use Exception; // Import Exception class

class DocumentsController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('search');
        $orderNumber = $request->input('order_number');
        $fileName = $request->input('file_name');
        $note = $request->input('note');
        $categoryId = $request->input('category_id');
        $subCategoryId = $request->input('sub_category_id');
        $statusId = $request->input('status_id');
        $languageId = $request->input('language_id');
        $contentId = $request->input('content_id');
        $updatedAt = $request->input('updated_at');

        $documents = Document::with(['category', 'subcategory', 'status', 'baseTemplate', 'languages', 'contents'])
            ->where('template', false)
            ->where('deleted', false);

        $user = auth()->user();
        $documents->forCompany($user->company_id);

        $sortField = $request->input('sortField');
        $sortOrder = $request->input('sortOrder', 'desc');

        $documents = $documents
            ->when($query, function($q) use ($query) {
                $q->where(function($subQ) use ($query) {
                    $subQ->where('order_number', 'like', "%{$query}%")
                        ->orWhere('file_name', 'like', "%{$query}%")
                        ->orWhere('note', 'like', "%{$query}%");
                });
            })
            ->when($orderNumber, function($q) use ($orderNumber) {
                $q->where('order_number', 'like', "%{$orderNumber}%");
            })
            ->when($fileName, function($q) use ($fileName) {
                $q->where('file_name', 'like', "%{$fileName}%");
            })
            ->when($note, function($q) use ($note) {
                $q->where('note', 'like', "%{$note}%");
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
            ->when($updatedAt, function($q) use ($updatedAt) {
                $q->whereDate('updated_at', $updatedAt);
            })
            ->when($sortField, function($q) use ($sortField, $sortOrder) {
                // Only allow sorting on known fields
                $allowedSortFields = [
                    'order_number', 'file_name', 'note', 'category_id', 'sub_category_id', 'status_id', 'updated_at', 'created_at', 'id'
                ];
                if (in_array($sortField, $allowedSortFields)) {
                    $q->orderBy($sortField, $sortOrder === 'asc' ? 'asc' : 'desc');
                }
            }, function($q) {
                $q->orderBy('updated_at', 'desc');
            })
            ->paginate(perPage: env('ITEMLIST_COUNT', 50))
            ->withQueryString();

        Log::info('Documents Controller - Pagination Debug', [
            'total' => $documents->total(),
            'per_page' => $documents->perPage(),
            'current_page' => $documents->currentPage(),
            'count' => $documents->count(),
            'company_id' => $user->company_id,
            'query' => $query,
            'category_id' => $categoryId,
            'sub_category_id' => $subCategoryId,
            'status_id' => $statusId,
            'language_id' => $languageId,
            'content_id' => $contentId,
            'updated_at' => $updatedAt,
        ]);

        return Inertia::render('Documents/ListDocuments', [
            'documents' => $documents ?? [
                'data' => []
            ],
            'categories' => Category::forCompany($user->company_id)->active()->orderBy('sortorder')->get(),
            'subcategories' => SubCategory::forCompany($user->company_id)->get(),
            'statuses' => Status::where('active', true)->forCompany($user->company_id)->orderBy('sortorder')->get(),
            'languages' => Language::where('active', true)->forCompany($user->company_id)->orderBy('sortorder')->get(),
            'contents' => Content::where('active', true)->forCompany($user->company_id)->orderBy('name')->get(),
            'templates' => Document::where('template', true)->where('deleted', false)->forCompany($user->company_id)->orderBy('file_name')->with(['languages', 'contents'])->get(['id', 'file_name', 'category_id', 'sub_category_id']),
            'template' => false, // Pass template parameter for documents
            'webeditorUrl' => config('app.webeditor_url'), // Add webeditor URL from config
            'webeditorDocumentPath' => str_replace('{company}', $user->company->name, config('app.webeditor_document_path')), // Add document path from config
        ]);
    }

    public function store(Request $request)
    {    
        Log::info('Create request data:', $request->all()); // Log the request data
      
        // For documents (not templates), template_id is required
        $isTemplate = $request->boolean('template', false);
        
        $request->validate([
            'order_number' => 'required|string',
            'file_name' => 'required|string',
            'note' => 'nullable|string',
            'category_id' => 'nullable|integer',
            'sub_category_id' => 'nullable|integer',
            'status_id' => 'required|integer',
            'template' => 'nullable|boolean',
            'template_id' => $isTemplate ? 'nullable|integer|exists:documents,id' : 'required|integer|exists:documents,id',
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
            'template' => false, // Always set template to false for documents
            'template_id' => $request->template_id, // Reference to template if provided
            'company_id' => auth()->user()->company_id,
            'created_by' => auth()->user()->name,
            'created_at' => now(),
            'updated_by' => auth()->user()->name,
            'updated_at' => now(),
        ]);

        Log::info('Document after creation:', $document->fresh()->toArray());

        // Associate languages with the document
        if ($request->language_ids) {
            $document->languages()->sync($request->language_ids);
        }

        // Associate contents with the document
        if ($request->content_ids) {
            $document->contents()->sync($request->content_ids);
        }

        // Copy template file if template_id is provided
        if ($request->template_id) {
            $this->copyTemplateFile($document, $request->template_id);
        }

        return redirect()->route('documents.index')->with('success', 'Document created successfully');
    }

    /**
     * Copy template file to documents storage
     */
    private function copyTemplateFile($document, $templateId)
    {
        try {
            // Get the template document with relationships
            $template = Document::with(['category', 'subcategory'])->find($templateId);
            if (!$template || !$template->template) {
                Log::warning('Template not found or not a template: ' . $templateId);
                return;
            }

            // Get the document with relationships for destination folder structure
            $documentWithRelations = Document::with(['category', 'subcategory'])->find($document->id);

            // Get storage paths from environment
            $templatesPath = env('CONTENTCONNECT_STORAGE_TEMPLATES');
            $templatesPath = str_replace('{company}', $document->company->name, $templatesPath);
            $documentsPath = env('CONTENTCONNECT_STORAGE_DOCUMENTS');
            $documentsPath = str_replace('{company}', $document->company->name, $documentsPath);

            if (!$templatesPath || !$documentsPath) {
                Log::error('Storage paths not configured in environment');
                return;
            }

            // Construct template folder structure based on template's category and subcategory
            $templateFolderPath = '';
            if ($template->category) {
                $templateFolderPath .= $template->category->name;
                if ($template->subcategory) {
                    $templateFolderPath .= '/' . $template->subcategory->name;
                }
            }

            // Construct document folder structure based on document's category and subcategory
            $documentFolderPath = '';
            if ($documentWithRelations->category) {
                $documentFolderPath .= $documentWithRelations->category->name;
                if ($documentWithRelations->subcategory) {
                    $documentFolderPath .= '/' . $documentWithRelations->subcategory->name;
                }
            }

            // Construct source and destination paths
            $sourceFile = $templatesPath . ($templateFolderPath ? '/' . $templateFolderPath : '') . '/' . $template->file_name;
            $destinationFolder = $documentsPath . ($documentFolderPath ? '/' . $documentFolderPath : '');
            $destinationFile = $destinationFolder . '/' . $document->file_name . '.indd';

            // Check if source file exists, if not try with .indd extension
            if (!file_exists($sourceFile)) {
                // Try with .indd extension if the filename doesn't already have it
                if (!str_ends_with($template->file_name, '.indd')) {
                    $sourceFileWithExtension = $templatesPath . ($templateFolderPath ? '/' . $templateFolderPath : '') . '/' . $template->file_name . '.indd';
                    
                    if (file_exists($sourceFileWithExtension)) {
                        $sourceFile = $sourceFileWithExtension;
                    } else {
                        Log::warning('Template file not found: ' . $sourceFile);
                        return;
                    }
                } else {
                    Log::warning('Template file not found: ' . $sourceFile);
                    return;
                }
            }

            // Create destination directory if it doesn't exist
            if (!is_dir($destinationFolder)) {
                mkdir($destinationFolder, 0755, true);
            }

            // Copy the main file with the new document filename
            if (copy($sourceFile, $destinationFile)) {
                Log::info('Template file copied successfully: ' . $sourceFile . ' -> ' . $destinationFile);
            } else {
                Log::error('Failed to copy template file: ' . $sourceFile . ' -> ' . $destinationFile);
            }

            // Check for and copy corresponding files (.idml, .png, .pdf) if they exist
            $this->copyAdditionalFiles($template, $document, $templatesPath, $documentsPath, $templateFolderPath, $documentFolderPath);

        } catch (Exception $e) {
            Log::error('Error copying template file: ' . $e->getMessage());
        }
    }

    /**
     * Copy corresponding additional files (.idml, .png, .pdf) if they exist
     */
    private function copyAdditionalFiles($template, $document, $templatesPath, $documentsPath, $templateFolderPath, $documentFolderPath)
    {
        // Get the template filename - handle cases where it might not have extension
        $templateFileName = $template->file_name;
        
        // If the template filename doesn't have an extension, check if .indd version exists
        if (!str_contains($templateFileName, '.')) {
            $templateFileWithExt = $templatesPath . ($templateFolderPath ? '/' . $templateFolderPath : '') . '/' . $templateFileName . '.indd';
            if (file_exists($templateFileWithExt)) {
                $templateFileName = $templateFileName . '.indd';
            }
        }
        
        // Get the template filename without extension
        $templateBaseName = pathinfo($templateFileName, PATHINFO_FILENAME);
        
        // Define additional file extensions to copy
        $additionalExtensions = ['idml', 'png', 'pdf'];
        
        foreach ($additionalExtensions as $extension) {
            try {
                // Construct file paths
                $sourceFile = $templatesPath . ($templateFolderPath ? '/' . $templateFolderPath : '') . '/' . $templateBaseName . '.' . $extension;
                $destinationFolder = $documentsPath . ($documentFolderPath ? '/' . $documentFolderPath : '');
                $destinationFile = $destinationFolder . '/' . $document->file_name . '.' . $extension;

                // Check if source file exists
                if (file_exists($sourceFile)) {
                    // Copy the file
                    if (copy($sourceFile, $destinationFile)) {
                        Log::info('Template ' . strtoupper($extension) . ' file copied successfully: ' . $sourceFile . ' -> ' . $destinationFile);
                    } else {
                        Log::error('Failed to copy template ' . strtoupper($extension) . ' file: ' . $sourceFile . ' -> ' . $destinationFile);
                    }
                } else {
                    Log::info('No corresponding ' . strtoupper($extension) . ' file found for template: ' . $sourceFile);
                }

            } catch (Exception $e) {
                Log::error('Error copying template ' . strtoupper($extension) . ' file: ' . $e->getMessage());
            }
        }
    }

    public function update(Request $request)
    {
        Log::info('Update request data:', $request->all());

        $document = Document::find($request->id);

        if (!$document) {
            return redirect()->back()->withErrors(['error' => 'Document not found']);
        }

        // Check company authorization
        $user = auth()->user();
        if ($document->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to document from another company.');
        }

        Log::info('Document before update:', $document->toArray());

        $request->validate([
            'order_number' => 'required|string',
            'file_name' => 'required|string',
            'note' => 'nullable|string',
            'category_id' => 'nullable|integer',
            'sub_category_id' => 'nullable|integer',
            'status_id' => 'required|integer',
            'template' => 'nullable|boolean',
            'template_id' => 'nullable|integer|exists:documents,id',
            'language_ids' => 'nullable|array',
            'language_ids.*' => 'integer|exists:languages,id',
            'content_ids' => 'nullable|array',
            'content_ids.*' => 'integer|exists:contents,id',
        ]);

        $document->update([
            'order_number' => $request->order_number,
            'file_name' => $request->file_name,
            'note' => $request->note,
            'category_id' => $request->category_id,
            'sub_category_id' => $request->sub_category_id,
            'status_id' => $request->status_id,
            'template' => false, // Always keep template as false for documents
            'template_id' => $request->template_id, // Update template reference if provided
            'updated_by' => auth()->user()->name,
            'updated_at' => now(),
        ]);

        // Update language associations
        if ($request->has('language_ids')) {
            $document->languages()->sync($request->language_ids ?? []);
        }

        // Update content associations
        if ($request->has('content_ids')) {
            $document->contents()->sync($request->content_ids ?? []);
        }

        Log::info('Document after update:', $document->toArray());

        return redirect()->back()->with('success', 'Document updated successfully');
    }


    public function destroy($id)
    {
        $document = Document::where('deleted', false)->findOrFail($id);
        
        // Check company authorization
        $user = auth()->user();
        if ($document->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to document from another company.');
        }
        
        // Soft delete: set deleted flag and update metadata
        $document->update([
            'deleted' => true,
            'updated_by' => auth()->user()->name,
            'updated_at' => now(),
        ]);

        return redirect()->route('documents.index')->with('success', 'Document deleted successfully');
    }

    /**
     * Serve document thumbnail (PNG file)
     */
    public function thumbnail($id)
    {
        $document = Document::with(['category', 'subcategory'])->findOrFail($id);
        
        // Check company authorization
        $user = auth()->user();
        if ($document->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to document from another company.');
        }
        
        // Get documents storage path from environment
        $documentsPath = env('CONTENTCONNECT_STORAGE_DOCUMENTS');
        if ($document->template) {
            $documentsPath = env('CONTENTCONNECT_STORAGE_TEMPLATES');
        } else {
            // If it's a document, use documents storage path
            $documentsPath = env('CONTENTCONNECT_STORAGE_DOCUMENTS');
        }
        
        // Replace company placeholder
        $documentsPath = str_replace('{company}', $document->company->name, $documentsPath);
        
        if (!$documentsPath) {
            Log::error('Documents storage path not configured in environment');
            abort(404);
        }
        
        // Construct document folder structure based on category and subcategory
        $documentFolderPath = '';
        if ($document->category) {
            $documentFolderPath .= $document->category->name;
            if ($document->subcategory) {
                $documentFolderPath .= '/' . $document->subcategory->name;
            }
        }
        
        // Construct thumbnail file path
        $thumbnailPath = $documentsPath . ($documentFolderPath ? '/' . $documentFolderPath : '') . '/' . $document->file_name . '.png';
        
        // Check if thumbnail exists
        if (!file_exists($thumbnailPath)) {
            // Return a default "no thumbnail" image or 404
            abort(404);
        }
        
        // Serve the image
        return response()->file($thumbnailPath, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=31536000', // Cache for 1 year
        ]);
    }

    /**
     * Download the document file
     */
    public function download($id)
    {
        $document = Document::findOrFail($id);
        
        // Check company authorization
        $user = request()->user();
        if (!$user->hasPermissionTo('superadmin') && $document->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to document from another company.');
        }

        // Get documents storage path from environment
        $documentsPath = env('CONTENTCONNECT_STORAGE_DOCUMENTS');
        if ($document->template) {
            $documentsPath = env('CONTENTCONNECT_STORAGE_TEMPLATES');
        } else {
            // If it's a document, use documents storage path
            $documentsPath = env('CONTENTCONNECT_STORAGE_DOCUMENTS');
        }
        
        // Replace company placeholder
        $documentsPath = str_replace('{company}', $document->company->name, $documentsPath);
        
        if (!$documentsPath) {
            Log::error('Documents storage path not configured in environment');
            abort(404);
        }
        
        // Construct document folder structure based on category and subcategory
        $documentFolderPath = '';
        if ($document->category) {
            $documentFolderPath .= $document->category->name;
            if ($document->subcategory) {
                $documentFolderPath .= '/' . $document->subcategory->name;
            }
        }

        // Find the actual file with extension
        $baseFileName = $document->file_name;
        $fullPath = $documentsPath . '/' . $documentFolderPath;
        
        // Determine file extensions based on template mode
        if ($document->template) {
            // For templates, look for .indd or .indt files
            $possibleFiles = [
                $fullPath . '/' . $baseFileName . '.indd',
                $fullPath . '/' . $baseFileName . '.indt'
            ];
            $fileTypeDescription = '(indd|indt)';
        } else {
            // For documents, look for .pdf files
            $possibleFiles = [
                $fullPath . '/' . $baseFileName . '.pdf'
            ];
            $fileTypeDescription = '(pdf)';
        }
        
        $filePath = null;
        foreach ($possibleFiles as $possibleFile) {
            if (file_exists($possibleFile)) {
                $filePath = $possibleFile;
                break;
            }
        }
        
        if (!$filePath) {
            Log::error("Document file not found: {$fullPath}/{$baseFileName}.{$fileTypeDescription}");
            abort(404, 'Document file not found.');
        }
        
        // Use the safe file download helper with enhanced error handling
        return $this->safeFileDownload($filePath, basename($filePath));
    }
}

