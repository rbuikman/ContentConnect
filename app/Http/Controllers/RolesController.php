<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use App\Models\Role;
use App\Models\Company;

class RolesController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::with(['permissions', 'company'])->withCount('users');

        // Filter by company for non-SuperAdmin users
        //if (!auth()->user()->hasRole('SuperAdmin')) {
            $query->forCompany(auth()->user()->company_id);
        //}

        // Voeg search toe
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query
            ->orderBy('name')
            ->paginate(perPage: env('ITEMLIST_COUNT', 50))->withQueryString();

        // Haal alle permissions voor modals
        $permissions = Permission::all();
        
        // Get companies for SuperAdmin users
        $companies = [];
        if (auth()->user()->hasRole('SuperAdmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render('Roles/ListRoles', [
            'roles' => $roles,
            'permissions' => $permissions,
            'companies' => $companies,
        ]);
    }

    public function store(Request $request)
    {
        // Build validation rules with company scoping
        $rules = ['name' => 'required|min:3'];
        
        // Add uniqueness validation scoped by company
        if (!auth()->user()->hasRole('SuperAdmin')) {
            $companyId = auth()->user()->company_id;
            $rules['name'] .= '|unique:roles,name,NULL,id,company_id,' . $companyId;
        } else {
            // For SuperAdmin, allow selecting company or creating global roles
            $rules['company_id'] = 'nullable|exists:companies,id';
            $companyId = $request->input('company_id');
            if ($companyId) {
                $rules['name'] .= '|unique:roles,name,NULL,id,company_id,' . $companyId;
            } else {
                // Check uniqueness among global roles (company_id is null)
                $rules['name'] .= '|unique:roles,name,NULL,id,company_id,NULL';
            }
        }
        
        $validated = $request->validate($rules);

        // Automatically assign the role to the user's company (unless SuperAdmin)
        if (!auth()->user()->hasRole('SuperAdmin')) {
            $validated['company_id'] = auth()->user()->company_id;
        } else {
            // SuperAdmin can select company or leave null for global role
            $validated['company_id'] = $request->input('company_id');
        }

        $role = Role::create($validated);

        if ($request->permissions) {
            $permissions = Permission::whereIn("id", $request->permissions)->pluck('name');
            $role->syncPermissions($permissions);
        }

        return redirect()->route('roles.index')->with('success', 'Role added successfully');
    }

    public function create()
    {
        $permissions = Permission::all();
        
        // Get companies for SuperAdmin users
        $companies = [];
        if (auth()->user()->hasRole('SuperAdmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render('Roles/CreateRoleModal', [
            'permissions' => $permissions,
            'companies' => $companies
        ]);
    }

    public function edit($id)
    {
        $query = Role::with('permissions');
        
        // Filter by company for non-SuperAdmin users
        if (!auth()->user()->hasRole('SuperAdmin')) {
            $query->forCompany(auth()->user()->company_id);
        }
        
        $role = $query->findOrFail($id);
        $permissions = Permission::all();
        
        // Get companies for SuperAdmin users
        $companies = [];
        if (auth()->user()->hasRole('SuperAdmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render('Roles/EditRoleModal', [
            'role' => $role,
            'permissions' => $permissions,
            'companies' => $companies
        ]);
    }

    public function update(Request $request, $id)
    {
        // Get the role first to check current company assignment
        $query = Role::query();
        
        // Filter by company for non-SuperAdmin users
        if (!auth()->user()->hasRole('SuperAdmin')) {
            $query->forCompany(auth()->user()->company_id);
        }
        
        $role = $query->findOrFail($id);
        
        // Build validation rules with company scoping
        $rules = ['name' => 'required|min:3'];
        
        // Add uniqueness validation scoped by company
        if (!auth()->user()->hasRole('SuperAdmin')) {
            $companyId = auth()->user()->company_id;
            $rules['name'] .= '|unique:roles,name,' . $id . ',id,company_id,' . $companyId;
        } else {
            // For SuperAdmin, allow selecting company or updating global roles
            $rules['company_id'] = 'nullable|exists:companies,id';
            $companyId = $request->input('company_id', $role->company_id);
            if ($companyId) {
                $rules['name'] .= '|unique:roles,name,' . $id . ',id,company_id,' . $companyId;
            } else {
                // Check uniqueness among global roles (company_id is null)
                $rules['name'] .= '|unique:roles,name,' . $id . ',id,company_id,NULL';
            }
        }
        
        $validated = $request->validate($rules);

        $role->name = $validated['name'];
        
        // Only SuperAdmin can change company assignment
        if (auth()->user()->hasRole('SuperAdmin') && isset($validated['company_id'])) {
            $role->company_id = $validated['company_id'];
        }
        
        $role->save();

        $permissions = $request->permissions
            ? Permission::whereIn('id', $request->permissions)->pluck('name')
            : [];
        $role->syncPermissions($permissions);

        return redirect()->route('roles.index')->with('success', 'Role updated successfully');
    }

    public function destroy($id)
    {
        $query = Role::query();
        
        // Filter by company for non-SuperAdmin users
        if (!auth()->user()->hasRole('SuperAdmin')) {
            $query->forCompany(auth()->user()->company_id);
        }
        
        $role = $query->findOrFail($id);
        
        // Check if role has users assigned to it
        $usersCount = $role->users()->count();
        if ($usersCount > 0) {
            return redirect()->route('roles.index')->with('error', 
                "Cannot delete role '{$role->name}' because it is assigned to {$usersCount} user(s). Please reassign the users to different roles first."
            );
        }
        
        $role->delete();

        return redirect()->route('roles.index')->with('success', 'Role deleted successfully');
    }
}
