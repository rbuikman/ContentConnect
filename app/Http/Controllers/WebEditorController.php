<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;

class WebEditorController extends Controller
{
    public function index(Request $request)
    {
        $documentId = $request->query('id');
        $document = Document::find($documentId);
        if (!$document || $document->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized');
        }
        // Only return the preview route for the first page (pageIndex=0)
        $imageUrls = [$document ? route('documents.preview', ['id' => $document->id, 'page' => 0]) : null];
        return Inertia::render('Documents/WebEditor', [
            'documentId' => $documentId,
            'fileName' => $document ? $document->file_name : null,
            'imageUrls' => array_filter($imageUrls),
        ]);
    }
}