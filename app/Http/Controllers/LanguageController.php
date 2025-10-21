<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Language;

class LanguageController extends Controller
{
    public function index(Request $request)
    {
        $query = Language::query();

        // Add search functionality
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
        }

        $languages = $query->paginate(0)->withQueryString();

        return Inertia::render(component: 'Languages/ListLanguages', props: [
            'languages' => $languages,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|min:2|unique:languages,name',
            'code' => 'required|min:2|max:10|unique:languages,code',
            'active' => 'boolean'
        ]);

        $validated['active'] = $request->boolean('active', true); // Default to true
        $language = Language::create($validated);

        return redirect()->route('languages.index')->with('success', 'Language added successfully');
    }

    public function create()
    {
        return Inertia::render('Languages/CreateLanguageModal');
    }

    public function edit($id)
    {
        $language = Language::findOrFail($id);

        return Inertia::render('Languages/EditLanguageModal', [
            'language' => $language,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|min:2|unique:languages,name,' . $id,
            'code' => 'required|min:2|max:10|unique:languages,code,' . $id,
            'active' => 'boolean'
        ]);

        $language = Language::findOrFail($id);
        $language->name = $validated['name'];
        $language->code = $validated['code'];
        $language->active = $request->boolean('active', $language->active); // Keep existing value if not provided
        $language->save();

        return redirect()->route('languages.index')->with('success', 'Language updated successfully');
    }

    public function destroy($id)
    {
        $language = Language::findOrFail($id);
        $language->delete();

        return redirect()->route('languages.index')->with('success', 'Language deleted successfully');
    }
}