<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\SubCategory;
use App\Models\Category;

class SubCategoriesController extends Controller
{
    public function index(Request $request)
    {
        $query = SubCategory::query();

        // Voeg search toe
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $subcategories = $query->paginate(0)->withQueryString();

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
        $subCategory = SubCategory::with('categories')->findOrFail($id);

        return Inertia::render('SubCategories/EditSubCategoryModal', [
            'subCategory' => $subCategory,
            'categories' => Category::all()
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|unique:sub_categories,name,' . $id,
        ]);

        $subCategory = SubCategory::findOrFail($id);
        $subCategory->name = $validated['name'];
        $subCategory->save();

        return redirect()->route('subcategories.index')->with('success', 'SubCategory updated successfully');
    }

    public function destroy($id)
    {
        $subCategory = SubCategory::findOrFail($id);
        $subCategory->delete();

        return redirect()->route('subcategories.index')->with('success', 'SubCategory deleted successfully');
    }

    public function manageCategoriesAndSubcategories()
    {
        return Inertia::render('ManageCategoriesAndSubcategories');
    }
}
