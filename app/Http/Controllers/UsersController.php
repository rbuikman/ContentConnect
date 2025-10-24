<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Hash;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('search');
        $currentUser = auth()->user();

        $usersQuery = User::with(['roles', 'company'])
            ->when($query, function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%");
            });

        // Non-SuperAdmin users should not see users with SuperAdmin permission
        if (!$currentUser->hasPermissionTo('superadmin')) {
            $usersQuery->whereDoesntHave('roles', function($roleQuery) {
                $roleQuery->whereHas('permissions', function($permissionQuery) {
                    $permissionQuery->where('name', 'superadmin');
                });
            });
        }

        // all users should only see users from their own company
        $usersQuery->where('company_id', $currentUser->company_id);

        $users = $usersQuery
            ->orderBy('name')
            ->paginate(perPage: env('ITEMLIST_COUNT', 50))->withQueryString(); // houdt de search parameter bij in paginatie

        // Filter roles based on user permissions for role dropdown
        if ($currentUser->hasPermissionTo('superadmin')) {
            $roles = Role::with('permissions')->get();
        } else {
            $roles = Role::with('permissions')->whereDoesntHave('permissions', function($query) {
                $query->where('name', 'superadmin');
            })->get();
        }

        // Group roles by company_id (null for global roles)
        $groupedRoles = [];
        foreach ($roles as $role) {
            $companyId = $role->company_id ?? 'global';
            if (!isset($groupedRoles[$companyId])) {
                $groupedRoles[$companyId] = [];
            }
            $groupedRoles[$companyId][] = [
                'id' => $role->id,
                'name' => $role->name,
                'company_id' => $role->company_id,
            ];
        }

        // Filter companies based on user permissions
        if ($currentUser->hasPermissionTo('superadmin')) {
            $companies = Company::where('active', true)->get();
        } else {
            $companies = Company::where('id', $currentUser->company_id)->where('active', true)->get();
        }

        return Inertia::render('Users/ListUsers', [
            'users' => $users,
            'roles' => $roles,
            'rolesByCompany' => $groupedRoles,
            'companies' => $companies,
            'filters' => ['search' => $query],
        ]);
    }

    public function create()
    {
        $currentUser = auth()->user();
        $roles = Role::with('permissions')->get();

        // Filter out SuperAdmin role for non-SuperAdmin users
        if (!$currentUser->hasPermissionTo('superadmin')) {
            $roles = $roles->filter(function($role) {
                return !$role->permissions->contains('name', 'superadmin');
            });
        }

        $companies = Company::all();

        // Group roles by company_id (null for global roles)
        $groupedRoles = [];
        foreach ($roles as $role) {
            $companyId = $role->company_id ?? 'global';
            if (!isset($groupedRoles[$companyId])) {
                $groupedRoles[$companyId] = [];
            }
            $groupedRoles[$companyId][] = [
                'id' => $role->id,
                'name' => $role->name,
                'company_id' => $role->company_id,
            ];
        }
dd($groupedRoles);
        return Inertia::render('Users/CreateUserModal', [
            'rolesByCompany' => $groupedRoles,
            'companies' => $companies
        ]);

    }

    public function edit($id)
    {
        $currentUser = auth()->user();
        $user = User::with(['roles', 'company'])->findOrFail($id);
        
        // Non-SuperAdmin users cannot edit users with SuperAdmin permission
        if (!$currentUser->hasPermissionTo('superadmin') && $user->hasPermissionTo('superadmin')) {
            abort(403, 'Unauthorized action.');
        }
        
        $roles = Role::all();
        
        // Filter out SuperAdmin role for non-SuperAdmin users
        if (!$currentUser->hasPermissionTo('superadmin')) {
            $roles = $roles->filter(function($role) {
                return !$role->hasPermissionTo('superadmin');
            });
        }
        
        $companies = Company::all();

        return Inertia::render('Users/EditUserModal', [
            'user' => $user,
            'roles' => $roles->values(),
            'companies' => $companies
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|min:3',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'company_id' => 'required|exists:companies,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'company_id' => $validated['company_id'] ?? null,
        ]);

        if ($request->roles) {
            $user->syncRoles($request->roles);
        }

        return redirect()->route('users.index')->with('success', 'User created successfully');
    }



    public function update(Request $request, $id)
    {
        $currentUser = auth()->user();
        $user = User::findOrFail($id);
        
        // Non-SuperAdmin users cannot update users with SuperAdmin permission
        if (!$currentUser->hasPermissionTo('superadmin') && $user->hasPermissionTo('superadmin')) {
            abort(403, 'Unauthorized action.');
        }
        
        $validated = $request->validate([
            'name' => 'required|min:3',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:6|confirmed',
            'company_id' => 'required|exists:companies,id',
        ]);
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->company_id = $validated['company_id'] ?? null;

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        if ($request->roles) {
            $user->syncRoles($request->roles);
        }

        return redirect()->route('users.index')->with('success', 'User updated successfully');
    }

    public function destroy($id)
    {
        $currentUser = auth()->user();
        $user = User::findOrFail($id);
        
        // Non-SuperAdmin users cannot delete users with SuperAdmin permission
        if (!$currentUser->hasPermissionTo('superadmin') && $user->hasPermissionTo('superadmin')) {
            abort(403, 'Unauthorized action.');
        }
        
        $user->delete();

        return redirect()->route('users.index')->with('success', 'User deleted successfully');
    }
}
