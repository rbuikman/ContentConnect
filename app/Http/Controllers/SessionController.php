<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SessionController extends Controller
{
    public function index()
    {
        $sessions = DB::table('sessions')
            ->orderByDesc('last_activity')
            ->get();

        // Optionally, decode user_id from payload if stored
        return Inertia::render('Sessions/ListSessions', [
            'sessions' => $sessions,
        ]);
    }
}
