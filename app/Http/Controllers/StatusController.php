<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Status;

class StatusController extends Controller
{
    public function index(Request $request)
    {
        $query = Status::query();

        // Add search functionality
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $statuses = $query->paginate(0)->withQueryString();

        return Inertia::render(component: 'Statuses/ListStatuses', props: [
            'statuses' => $statuses,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|unique:statuses,name'
        ]);

        $status = Status::create($validated);

        return redirect()->route('statuses.index')->with('success', 'Status added successfully');
    }

    public function create()
    {
        return Inertia::render('Statuses/CreateStatusModal');
    }

    public function edit($id)
    {
        $status = Status::findOrFail($id);

        return Inertia::render('Statuses/EditStatusModal', [
            'status' => $status,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|min:3|unique:statuses,name,' . $id,
        ]);

        $status = Status::findOrFail($id);
        $status->name = $validated['name'];
        $status->save();

        return redirect()->route('statuses.index')->with('success', 'Status updated successfully');
    }

    public function destroy($id)
    {
        $status = Status::findOrFail($id);
        $status->delete();

        return redirect()->route('statuses.index')->with('success', 'Status deleted successfully');
    }
}