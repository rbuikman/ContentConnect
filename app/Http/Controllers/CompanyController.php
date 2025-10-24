<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Exception;

class CompanyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = $request->input('search');

        $companies = Company::query()
            ->when($query, function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->orderBy('name', 'asc')
            ->paginate(env('ITEMLIST_COUNT', 50))
            ->withQueryString();

        return Inertia::render('Companies/ListCompanies', [
            'companies' => $companies,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Companies/CreateCompany');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:companies',
                'numberoflicences' => 'required|integer|min:1',
            ]);

            $company = Company::create($validated);

            // Create Admin role for this company with all permissions except superadmin and company permissions
            $adminRole = \App\Models\Role::create([
                'name' => 'Admin',
                'company_id' => $company->id,
                'guard_name' => config('auth.defaults.guard'),
            ]);

            // Get all permissions except superadmin and company permissions
            $excluded = ['superadmin'];
            $excludedCompany = ['company-index', 'company-create', 'company-edit', 'company-delete', 'company-update', 'company-destroy', 'companies.index', 'companies.create', 'companies.edit', 'companies.update', 'companies.destroy'];
            $permissions = \Spatie\Permission\Models\Permission::whereNotIn('name', array_merge($excluded, $excludedCompany))->pluck('name')->toArray();
            $adminRole->syncPermissions($permissions);

            Log::info('Company created:', ['company' => $company]);
            Log::info('Admin role created for company:', ['role' => $adminRole, 'permissions' => $permissions]);

            return redirect()->route('companies.index')
                ->with('success', 'Company created successfully.');
        } catch (Exception $e) {
            Log::error('Error creating company:', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to create company.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Company $company)
    {
        return Inertia::render('Companies/ShowCompany', [
            'company' => $company,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Company $company)
    {
        return Inertia::render('Companies/EditCompany', [
            'company' => $company,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Company $company)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:companies,name,' . $company->id,
                'numberoflicences' => 'required|integer|min:1',
            ]);

            $company->update($validated);

            Log::info('Company updated:', ['company' => $company]);

            return redirect()->route('companies.index')
                ->with('success', 'Company updated successfully.');
        } catch (Exception $e) {
            Log::error('Error updating company:', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to update company.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Company $company)
    {
        try {
            $company->delete();

            Log::info('Company deleted:', ['company_id' => $company->id]);

            return redirect()->route('companies.index')
                ->with('success', 'Company deleted successfully.');
        } catch (Exception $e) {
            Log::error('Error deleting company:', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to delete company.']);
        }
    }
}
