<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\SubCategory;
use App\Models\Category;

class SubCategoriesController extends Controller
{
    public function index(Request $request)
    {
        $query = SubCategory::query();

        // Apply company scoping through category relationship
        $user = auth()->user();
        //if (!$user->hasPermissionTo('superadmin')) {
            $query->forCompany($user->company_id);
        //}

        // Voeg search toe
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $subcategories = $query
            ->orderBy('name')
            ->paginate(env('ITEMLIST_COUNT', 50))->withQueryString();

        return Inertia::render('SubCategories/ListSubCategories', [
            'subcategories' => $subcategories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|unique:sub_categories,name'
        ]);

        $subCategory = SubCategory::create($validated);

        return redirect()->route('subcategories.index')->with('success', 'SubCategory added successfully');
    }

    public function create()
    {
        return Inertia::render('SubCategories/CreateSubCategoryModal');
    }

    public function edit($id)
    {
        $subCategory = SubCategory::with('category')->findOrFail($id);
        
        // Check company authorization through category
        $user = auth()->user();
        if (!$user->hasPermissionTo('superadmin') && $subCategory->category->company_id !== $user->company_id) {
            abort(403, 'Unauthorized access to subcategory from another company.');
        }

        return Inertia::render('SubCategories/EditSubCategoryModal', [
            'subCategory' => $subCategory,
            'categories' => $user->hasPermissionTo('superadmin') ? Category::active()->get() : Category::forCompany($user->company_id)->active()->get()
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|unique:sub_categories,name,' . $id,
        ]);

        $subCategory = SubCategory::findOrFail($id);
        
        // Check authorization through category's company
        $user = Auth::user();
        if (!$user->hasPermissionTo('superadmin') && $subCategory->category->company_id !== $user->company_id) {
            abort(403, 'Unauthorized');
        }
        
        $subCategory->name = $validated['name'];
        $subCategory->save();

        return redirect()->route('subcategories.index')->with('success', 'SubCategory updated successfully');
    }

    public function destroy($id)
    {
        $subCategory = SubCategory::findOrFail($id);
        
        // Check authorization through category's company
        $user = Auth::user();
        if (!$user->hasPermissionTo('superadmin') && $subCategory->category->company_id !== $user->company_id) {
            abort(403, 'Unauthorized');
        }
        
        $subCategory->delete();

        return redirect()->route('subcategories.index')->with('success', 'SubCategory deleted successfully');
    }

    public function manageCategoriesAndSubcategories()
    {
        return Inertia::render('ManageCategoriesAndSubcategories');
    }
}
