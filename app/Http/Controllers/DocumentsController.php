<?php
namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Category;
use App\Models\SubCategory;
use App\Models\Status;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log; // Import the Log facade
use Exception; // Import Exception class

class DocumentsController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('search');

        $documents = Document::with(['category', 'subcategory', 'status', 'baseTemplate']) // Added 'baseTemplate' relationship
            ->where('template', false) // Filter for documents only (not templates)
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
            'statuses' => Status::all(),
            'templates' => Document::where('template', true)->where('deleted', false)->get(['id', 'file_name']), // Add templates for selection
            'template' => false, // Pass template parameter for documents
            'webeditorUrl' => config('app.webeditor_url'), // Add webeditor URL from config
            'webeditorDocumentPath' => config('app.webeditor_document_path'), // Add document path from config
        ]);
    }

    public function store(Request $request)
    {    
        Log::info('Create request data:', $request->all()); // Log the request data
      
        $request->validate([
            'order_number' => 'required|string',
            'file_name' => 'required|string',
            'note' => 'nullable|string',
            'category_id' => 'required|integer',
            'sub_category_id' => 'required|integer',
            'status_id' => 'required|integer',
            'template' => 'nullable|boolean',
            'template_id' => 'nullable|integer|exists:documents,id',
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
            'created_by' => auth()->user()->name,
            'created_at' => now(),
            'modified_by' => auth()->user()->name,
            'modified_at' => now(),
        ]);

        Log::info('Document after creation:', $document->fresh()->toArray());

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
            $documentsPath = env('CONTENTCONNECT_STORAGE_DOCUMENTS');

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

            // Check if source file exists
            if (!file_exists($sourceFile)) {
                Log::warning('Template file not found: ' . $sourceFile);
                return;
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
        // Get the template filename without extension
        $templateBaseName = pathinfo($template->file_name, PATHINFO_FILENAME);
        
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
            'modified_by' => auth()->user()->name,
            'modified_at' => now(),
        ]);

        Log::info('Document after update:', $document->toArray());

        return redirect()->back()->with('success', 'Document updated successfully');
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

        return redirect()->route('documents.index')->with('success', 'Document deleted successfully');
    }
}

