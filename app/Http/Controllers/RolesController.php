<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::with('permissions');

        // Voeg search toe
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query->paginate(0)->withQueryString();

        // Haal alle permissions voor modals
        $permissions = Permission::all();

        return Inertia::render('Roles/ListRoles', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|unique:roles,name'
        ]);

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

        return Inertia::render('Roles/CreateRoleModal', [
            'permissions' => $permissions
        ]);
    }

    public function edit($id)
    {
        $role = Role::with('permissions')->findOrFail($id);
        $permissions = Permission::all();

        return Inertia::render('Roles/EditRoleModal', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|unique:roles,name,' . $id,
        ]);

        $role = Role::findOrFail($id);
        $role->name = $validated['name'];
        $role->save();

        $permissions = $request->permissions
            ? Permission::whereIn('id', $request->permissions)->pluck('name')
            : [];
        $role->syncPermissions($permissions);

        return redirect()->route('roles.index')->with('success', 'Role updated successfully');
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();

        return redirect()->route('roles.index')->with('success', 'Role deleted successfully');
    }
}
