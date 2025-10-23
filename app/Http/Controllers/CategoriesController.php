<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Category;
use App\Models\Company;
use Spatie\Permission\Models\Permission;

class CategoriesController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Category::with('company');

        // Non-SuperAdmin users can only see categories from their company
        if (!$user->hasPermissionTo('superadmin')) {
            $query->forCompany($user->company_id);
        }

        // Voeg search toe
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $categories = $query->paginate(env('ITEMLIST_COUNT', 50))->withQueryString();

        $companies = [];
        if ($user->hasPermissionTo('superadmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render(component: 'Categories/ListCategories', props: [
            'categories' => $categories,
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
            $rules['name'] = 'required|min:3|unique:categories,name,NULL,id,company_id,' . $companyId;
        } else {
            // For regular users, scope by their company
            $companyId = $user->company_id;
            $rules['name'] = 'required|min:3|unique:categories,name,NULL,id,company_id,' . $companyId;
        }

        $validated = $request->validate($rules);

        $validated['active'] = $request->boolean('active', true); // Default to true
        
        // Auto-assign company for non-SuperAdmin users
        if (!$user->hasPermissionTo('superadmin')) {
            $validated['company_id'] = $user->company_id;
        }
        
        $category = Category::create($validated);

        return redirect()->route('categories.index')->with('success', 'Category added successfully');
    }

    public function create()
    {
        $user = auth()->user();
        $companies = [];
        
        if ($user->hasPermissionTo('superadmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render('Categories/CreateCategoryModal', [
            'companies' => $companies,
        ]);
    }

    public function edit($id)
    {
        $user = auth()->user();
        $category = Category::with('company')->findOrFail($id);
        
        // Check company authorization
        if (!$user->hasPermissionTo('superadmin') && $category->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to category from another company.');
        }

        $companies = [];
        if ($user->hasPermissionTo('superadmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render('Categories/EditCategoryModal', [
            'category' => $category,
            'companies' => $companies,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $category = Category::findOrFail($id);
        
        // Check company authorization
        if (!$user->hasPermissionTo('superadmin') && $category->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to category from another company.');
        }

        // Build validation rules with company scoping
        $rules = [
            'active' => 'boolean'
        ];
        
        // Add uniqueness validation scoped by company
        if ($user->hasPermissionTo('superadmin')) {
            $rules['company_id'] = 'required|exists:companies,id';
            // For SuperAdmin, we need to scope by the selected company
            $companyId = $request->input('company_id');
            $rules['name'] = 'required|min:3|unique:categories,name,' . $id . ',id,company_id,' . $companyId;
        } else {
            // For regular users, scope by their company
            $companyId = $user->company_id;
            $rules['name'] = 'required|min:3|unique:categories,name,' . $id . ',id,company_id,' . $companyId;
        }

        $validated = $request->validate($rules);
        
        $validated['active'] = $request->boolean('active', $category->active); // Preserve current value if not provided
        
        // Auto-assign company for non-SuperAdmin users
        if (!$user->hasPermissionTo('superadmin')) {
            $validated['company_id'] = $user->company_id;
        }
        
        $category->update($validated);

        return redirect()->route('categories.index')->with('success', 'Category updated successfully');
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        // Check company authorization
        $user = request()->user();
        if (!$user->hasPermissionTo('superadmin') && $category->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to category from another company.');
        }
        
        $category->delete();

        return redirect()->route('categories.index')->with('success', 'Category deleted successfully');
    }

    public function manageCategoriesAndSubcategories()
    {
        return Inertia::render('ManageCategoriesAndSubcategories');
    }
}
