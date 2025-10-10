<?php
namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Category;
use App\Models\SubCategory;
use App\Models\Status;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log; // Import the Log facade

class DocumentsController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('search');

        $documents = Document::with(['category', 'subcategory'])
            ->when($query, function($q) use ($query) {
                $q->where('order_number', 'like', "%{$query}%")
                ->orWhere('file_name', 'like', "%{$query}%");
            })
            ->paginate(0)
            ->withQueryString(); // houdt de search parameter bij in paginatie

        return Inertia::render('Documents/ListDocuments', [
            'documents' => $documents ?? [
                'data' => []
            ],
            'categories' => Category::all(),
            'subcategories' => SubCategory::all(),
            'statuses' => Status::all(),
        ]);
    }

    public function store(Request $request)
    {    
        Log::info('Create request data:', $request->all()); // Log the request data
      
        $request->validate([
            'order_number' => 'required|string',
            'file_name' => 'required|string',
            'note' => 'nullable|string',
            'category_id' => 'nullable|integer',
            'sub_category_id' => 'nullable|integer',
            'status_id' => 'required|integer',
        ]);
 
        $document = Document::create([
            ...$request->all(),
            'created_by' => auth()->user()->name,
            'created_at' => now(),
            'modified_by' => auth()->user()->name,
            'modified_at' => now(),
        ]);

        Log::info('Document after creation:', $document->fresh()->toArray());

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
        ]);

        $document->update([
            'order_number' => $request->order_number,
            'file_name' => $request->file_name,
            'note' => $request->note,
            'category_id' => $request->category_id,
            'sub_category_id' => $request->sub_category_id,
            'status_id' => $request->status_id,
            'modified_by' => auth()->user()->name,
            'modified_at' => now(),
        ]);

        Log::info('Document after update:', $document->toArray());

        return redirect()->back()->with('success', 'Document updated successfully');
    }

    public function destroy(Document $document)
    {
        $document->delete();
    }
}

