<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\User;
use Illuminate\Http\Request;

class DmsController extends Controller
{
    public function index()
    {
        // Example: fetch all users for a Mention component
        $users = User::all(['id', 'name']);

        // You can add more data here, e.g., permissions, roles, stats
        return Inertia::render('Dms', [
            'users' => $users,
            'flash' => session('flash')
        ]);
    }
}