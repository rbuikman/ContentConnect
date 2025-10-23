<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Language;
use App\Models\Company;

class LanguageController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Language::with('company');

        // Non-SuperAdmin users can only see languages from their company
        if (!$user->hasPermissionTo('superadmin')) {
            $query->where('company_id', $user->company_id);
        }

        // Add search functionality
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
        }

        $languages = $query
            ->orderBy('sortorder')
            ->paginate(env('ITEMLIST_COUNT', 50))->withQueryString();

        // Get companies for SuperAdmin users
        $companies = [];
        if ($user->hasPermissionTo('superadmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render(component: 'Languages/ListLanguages', props: [
            'languages' => $languages,
            'filters' => $request->only(['search']),
            'companies' => $companies,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        // Build validation rules with company scoping
        $rules = [
            'active' => 'boolean'
        ];
        
        // Add uniqueness validation scoped by company
        if ($user->hasPermissionTo('superadmin')) {
            $rules['company_id'] = 'required|exists:companies,id';
            // For SuperAdmin, we need to scope by the selected company
            $companyId = $request->input('company_id');
            $rules['name'] = 'required|min:2|unique:languages,name,NULL,id,company_id,' . $companyId;
            $rules['code'] = 'required|min:2|max:10|unique:languages,code,NULL,id,company_id,' . $companyId;
        } else {
            // For regular users, scope by their company
            $companyId = $user->company_id;
            $rules['name'] = 'required|min:2|unique:languages,name,NULL,id,company_id,' . $companyId;
            $rules['code'] = 'required|min:2|max:10|unique:languages,code,NULL,id,company_id,' . $companyId;
        }

        $validated = $request->validate($rules);

        $validated['active'] = $request->boolean('active', true); // Default to true
        $validated['sortorder'] = $request->input('sortorder', 0); // Save sortorder

        // Auto-assign company for non-SuperAdmin users
        if (!$user->hasPermissionTo('superadmin')) {
            $validated['company_id'] = $user->company_id;
        }

        $language = Language::create($validated);

        return redirect()->route('languages.index')->with('success', 'Language added successfully');
    }

    public function create()
    {
        return Inertia::render('Languages/CreateLanguageModal');
    }

    public function edit($id)
    {
        $user = auth()->user();
        $language = Language::with('company')->findOrFail($id);
        
        // Non-SuperAdmin users can only edit languages from their company
        if (!$user->hasPermissionTo('superadmin') && $language->company_id !== $user->company_id) {
            abort(403, 'Unauthorized action.');
        }

        $companies = [];
        if ($user->hasPermissionTo('superadmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render('Languages/EditLanguageModal', [
            'language' => $language,
            'companies' => $companies,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $language = Language::findOrFail($id);
        
        // Non-SuperAdmin users can only update languages from their company
        if (!$user->hasPermissionTo('superadmin') && $language->company_id !== $user->company_id) {
            abort(403, 'Unauthorized action.');
        }

        // Build validation rules with company scoping
        $rules = [
            'active' => 'boolean'
        ];
        
        // Add uniqueness validation scoped by company
        if ($user->hasPermissionTo('superadmin')) {
            $rules['company_id'] = 'required|exists:companies,id';
            // For SuperAdmin, we need to scope by the selected company
            $companyId = $request->input('company_id', $language->company_id);
            $rules['name'] = 'required|min:2|unique:languages,name,' . $id . ',id,company_id,' . $companyId;
            $rules['code'] = 'required|min:2|max:10|unique:languages,code,' . $id . ',id,company_id,' . $companyId;
        } else {
            // For regular users, scope by their company
            $companyId = $user->company_id;
            $rules['name'] = 'required|min:2|unique:languages,name,' . $id . ',id,company_id,' . $companyId;
            $rules['code'] = 'required|min:2|max:10|unique:languages,code,' . $id . ',id,company_id,' . $companyId;
        }

        $validated = $request->validate($rules);

        $language->name = $validated['name'];
        $language->code = $validated['code'];
        $language->active = $request->boolean('active', $language->active); // Keep existing value if not provided
        $language->sortorder = $request->input('sortorder', $language->sortorder); // Save sortorder

        // Only SuperAdmin users can change company
        if ($user->hasPermissionTo('superadmin') && isset($validated['company_id'])) {
            $language->company_id = $validated['company_id'];
        }
        
        $language->save();

        return redirect()->route('languages.index')->with('success', 'Language updated successfully');
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $language = Language::findOrFail($id);
        
        // Non-SuperAdmin users can only delete languages from their company
        if (!$user->hasPermissionTo('superadmin') && $language->company_id !== $user->company_id) {
            abort(403, 'Unauthorized action.');
        }
        
        $language->delete();

        return redirect()->route('languages.index')->with('success', 'Language deleted successfully');
    }
}