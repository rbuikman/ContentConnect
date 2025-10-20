<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DmsController;
use App\Http\Controllers\SubCategoriesController;
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
    return redirect()->route('documents.index');
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

        Route::delete("/{id}", [\App\Http\Controllers\RolesController::class, 'destroy'])->name('roles.destroy');
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

    Route::prefix('templates')->group(function () {
            Route::get('/', [\App\Http\Controllers\TemplatesController::class, 'index'])->name('templates.index');

            Route::post('/read-from-storage', [\App\Http\Controllers\TemplatesController::class, 'readTemplatesFromStorage'])->name('templates.readFromStorage');

            Route::get('/create', [\App\Http\Controllers\TemplatesController::class, 'create']);

            Route::get('/{id}', [\App\Http\Controllers\TemplatesController::class, 'edit']);

            Route::post("/", [\App\Http\Controllers\TemplatesController::class, 'store']);

            Route::put("/{id}", [\App\Http\Controllers\TemplatesController::class, 'update']);

            Route::delete("/{id}", [\App\Http\Controllers\TemplatesController::class, 'destroy']);
    });

    Route::prefix('categories')->group(function () {
        Route::get('/', [\App\Http\Controllers\CategoriesController::class, 'index'])->name('categories.index');

            Route::get('/create', [\App\Http\Controllers\CategoriesController::class, 'create']);

            Route::get('/{id}', [\App\Http\Controllers\CategoriesController::class, 'edit']);

            Route::post("/", [\App\Http\Controllers\CategoriesController::class, 'store']);

            Route::put("/{id}", [\App\Http\Controllers\CategoriesController::class, 'update']);

            Route::delete("/{id}", [\App\Http\Controllers\CategoriesController::class, 'destroy']);
    });

    Route::prefix('subcategories')->group(function () {
        Route::get('/', [\App\Http\Controllers\SubCategoriesController::class, 'index'])->name('subcategories.index');

            Route::get('/create', [\App\Http\Controllers\SubCategoriesController::class, 'create']);

            Route::get('/{id}', [\App\Http\Controllers\SubCategoriesController::class, 'edit']);

            Route::post("/", [\App\Http\Controllers\SubCategoriesController::class, 'store']);

            Route::put("/{id}", [\App\Http\Controllers\SubCategoriesController::class, 'update']);

            Route::delete("/{id}", [\App\Http\Controllers\SubCategoriesController::class, 'destroy']);
    });

    Route::prefix('statuses')->group(function () {
        Route::get('/', [\App\Http\Controllers\StatusController::class, 'index'])->name('statuses.index');

            Route::get('/create', [\App\Http\Controllers\StatusController::class, 'create']);

            Route::get('/{id}', [\App\Http\Controllers\StatusController::class, 'edit']);

            Route::post("/", [\App\Http\Controllers\StatusController::class, 'store']);

            Route::put("/{id}", [\App\Http\Controllers\StatusController::class, 'update']);

            Route::delete("/{id}", [\App\Http\Controllers\StatusController::class, 'destroy']);
    });
});

require __DIR__.'/auth.php';
