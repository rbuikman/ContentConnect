<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Status;
use App\Models\Company;

class StatusController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Status::with('company');

        // Non-SuperAdmin users can only see statuses from their company
        if (!$user->hasPermissionTo('superadmin')) {
            $query->where('company_id', $user->company_id);
        }

        // Add search functionality
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $statuses = $query
            ->orderBy('sortorder')
            ->paginate(env('ITEMLIST_COUNT', 50))->withQueryString();

        // Get companies for SuperAdmin users
        $companies = [];
        if ($user->hasPermissionTo('superadmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render(component: 'Statuses/ListStatuses', props: [
            'statuses' => $statuses,
            'filters' => $request->only(['search']),
            'companies' => $companies,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $rules = [
            'name' => 'required|min:3|unique:statuses,name',
            'active' => 'boolean'
        ];

        // Add company_id validation for SuperAdmin users
        if ($user->hasPermissionTo('superadmin')) {
            $rules['company_id'] = 'required|exists:companies,id';
        }

    $validated = $request->validate($rules);

    $validated['active'] = $request->boolean('active', true); // Default to true
    $validated['sortorder'] = $request->input('sortorder', 0); // Save sortorder
        
        // Auto-assign company for non-SuperAdmin users
        if (!$user->hasPermissionTo('superadmin')) {
            $validated['company_id'] = $user->company_id;
        }

        $status = Status::create($validated);

        return redirect()->route('statuses.index')->with('success', 'Status added successfully');
    }

    public function create()
    {
        $user = auth()->user();
        $companies = [];
        
        // Get companies for SuperAdmin users
        if ($user->hasPermissionTo('superadmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render('Statuses/CreateStatusModal', [
            'companies' => $companies,
        ]);
    }

    public function edit($id)
    {
        $user = auth()->user();
        $status = Status::with('company')->findOrFail($id);
        
        // Non-SuperAdmin users can only edit statuses from their company
        if (!$user->hasPermissionTo('superadmin') && $status->company_id !== $user->company_id) {
            abort(403, 'Unauthorized action.');
        }

        $companies = [];
        if ($user->hasPermissionTo('superadmin')) {
            $companies = Company::where('active', true)->get();
        }

        return Inertia::render('Statuses/EditStatusModal', [
            'status' => $status,
            'companies' => $companies,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $status = Status::findOrFail($id);
        
        // Non-SuperAdmin users can only update statuses from their company
        if (!$user->hasPermissionTo('superadmin') && $status->company_id !== $user->company_id) {
            abort(403, 'Unauthorized action.');
        }

        $rules = [
            'name' => 'required|min:3|unique:statuses,name,' . $id,
            'active' => 'boolean'
        ];

        // Add company_id validation for SuperAdmin users
        if ($user->hasPermissionTo('superadmin')) {
            $rules['company_id'] = 'required|exists:companies,id';
        }

        $validated = $request->validate($rules);

        $status->name = $validated['name'];
        $status->active = $request->boolean('active', $status->active); // Keep existing value if not provided
        $status->sortorder = $request->input('sortorder', $status->sortorder); // Save sortorder

        // Only SuperAdmin users can change company
        if ($user->hasPermissionTo('superadmin') && isset($validated['company_id'])) {
            $status->company_id = $validated['company_id'];
        }
        
        $status->save();

        return redirect()->route('statuses.index')->with('success', 'Status updated successfully');
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $status = Status::findOrFail($id);
        
        // Non-SuperAdmin users can only delete statuses from their company
        if (!$user->hasPermissionTo('superadmin') && $status->company_id !== $user->company_id) {
            abort(403, 'Unauthorized action.');
        }
        
        $status->delete();

        return redirect()->route('statuses.index')->with('success', 'Status deleted successfully');
    }
}