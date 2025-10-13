<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Category;

class CategoriesController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        // Voeg search toe
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $categories = $query->paginate(0)->withQueryString();

        return Inertia::render(component: 'Categories/ListCategories', props: [
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|unique:categories,name'
        ]);

        $category = Category::create($validated);

        return redirect()->route('categories.index')->with('success', 'Category added successfully');
    }

    public function create()
    {
        $permissions = Permission::all();

        return Inertia::render('Categories/CreateCategoryModal', [
        ]);
    }

    public function edit($id)
    {
        $category = Category::with('permissions')->findOrFail($id);
        $permissions = Permission::all();

        return Inertia::render('Categories/EditCategoryModal', [
            'category' => $category,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|unique:categories,name,' . $id,
        ]);

        $category = Category::findOrFail($id);
        $category->name = $validated['name'];
        $category->save();

        return redirect()->route('categories.index')->with('success', 'Category updated successfully');
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return redirect()->route('categories.index')->with('success', 'Category deleted successfully');
    }

    public function manageCategoriesAndSubcategories()
    {
        return Inertia::render('ManageCategoriesAndSubcategories');
    }
}
