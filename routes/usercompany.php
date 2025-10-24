<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserCompanyController;

Route::middleware(['auth', 'can:superadmin'])->group(function () {
    Route::get('/usercompany/change', [UserCompanyController::class, 'showChangeCompanyForm'])->name('usercompany.change');
    Route::post('/usercompany/change', [UserCompanyController::class, 'changeCompany'])->name('usercompany.change.submit');
});
