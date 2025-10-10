<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DmsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
Route::get('/cache-clear', function() {
    Artisan::call('cache:clear');
    Artisan::call('route:clear');
    Artisan::call('config:clear');
    Artisan::call('view:clear');
});

Route::get('/', function () {
    return Inertia::render('Dms', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/main', [DmsController::class, 'index'])
    ->middleware(['auth'])
    ->name('main');

Route::get('/dms', [DmsController::class, 'index'])
    ->middleware(['auth'])
    ->name('dms');


/*
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');
*/
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::prefix('permissions')->group(function () {
        Route::get('/', [\App\Http\Controllers\PermissionsController::class, 'index'])->name('permissions.index');

        Route::post("/", [\App\Http\Controllers\PermissionsController::class, 'store']);

        Route::put("/{id}", [\App\Http\Controllers\PermissionsController::class, 'update']);

        Route::delete("/{id}", [\App\Http\Controllers\PermissionsController::class, 'destroy']);
    });

    Route::prefix('roles')->group(function () {
        Route::get('/', [\App\Http\Controllers\RolesController::class, 'index'])->name('roles.index');

        Route::get('/create', [\App\Http\Controllers\RolesController::class, 'create']);

        Route::get('/{id}', [\App\Http\Controllers\RolesController::class, 'edit']);

        Route::post("/", [\App\Http\Controllers\RolesController::class, 'store']);

        Route::put("/{id}", [\App\Http\Controllers\RolesController::class, 'update']);

        Route::delete("/{id}", [\App\Http\Controllers\RolesController::class, 'destroy']);
    });

    Route::prefix('users')->group(function () {
        Route::get('/', [\App\Http\Controllers\UsersController::class, 'index'])->name('users.index');

        Route::get('/create', [\App\Http\Controllers\UsersController::class, 'create']);

        Route::get('/{id}', [\App\Http\Controllers\UsersController::class, 'edit']);

        Route::post("/", [\App\Http\Controllers\UsersController::class, 'store']);

        Route::put("/{id}", [\App\Http\Controllers\UsersController::class, 'update']);

        Route::delete("/{id}", [\App\Http\Controllers\UsersController::class, 'destroy']);
    });

    Route::prefix('documents')->group(function () {
        Route::get('/', [\App\Http\Controllers\DocumentsController::class, 'index'])->name('documents.index');

        Route::get('/create', [\App\Http\Controllers\DocumentsController::class, 'create']);

        Route::get('/{id}', [\App\Http\Controllers\DocumentsController::class, 'edit']);

        Route::post("/", [\App\Http\Controllers\DocumentsController::class, 'store']);

        Route::put("/{id}", [\App\Http\Controllers\DocumentsController::class, 'update']);

        Route::delete("/{id}", [\App\Http\Controllers\DocumentsController::class, 'destroy']);
    });
});

require __DIR__.'/auth.php';
