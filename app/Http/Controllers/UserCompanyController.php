<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Company;
use Illuminate\Support\Facades\Auth;

class UserCompanyController extends Controller
{
    // Show the form to change the current user's company
    public function showChangeCompanyForm(Request $request)
    {
        $user = $request->user();
        $companies = Company::where('active', true)->get();
        return Inertia::render('UserCompany/ChangeCompany', [
            'companies' => $companies,
            'currentCompanyId' => $user->company_id,
        ]);
    }

    // Handle the company change
    public function changeCompany(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'company_id' => 'required|exists:companies,id',
        ]);
        $user->company_id = $request->input('company_id');
        $user->save();
    }
}
