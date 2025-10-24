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
            ->leftJoin('users', 'sessions.user_id', '=', 'users.id')
            ->leftJoin('companies', 'users.company_id', '=', 'companies.id')
            ->orderByDesc('sessions.last_activity')
            ->select('sessions.*', 'users.name as user_name', 'companies.name as company_name')
            ->get();

        return Inertia::render('Sessions/ListSessions', [
            'sessions' => $sessions,
        ]);
    }
}
