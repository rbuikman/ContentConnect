<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SubCategoriesController;
use App\Http\Controllers\CompanyController;
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
        Route::get('/', [\App\Http\Controllers\RolesController::class, 'index'])->name('roles.index')->middleware('permission:role-index');

        Route::get('/create', [\App\Http\Controllers\RolesController::class, 'create'])->middleware('permission:role-create');

        Route::get('/{id}', [\App\Http\Controllers\RolesController::class, 'edit'])->middleware('permission:role-edit');

        Route::post("/", [\App\Http\Controllers\RolesController::class, 'store'])->middleware('permission:role-create');

        Route::put("/{id}", [\App\Http\Controllers\RolesController::class, 'update'])->middleware('permission:role-edit');

        Route::delete("/{id}", [\App\Http\Controllers\RolesController::class, 'destroy'])->name('roles.destroy')->middleware('permission:role-delete');
    });

    Route::prefix('users')->group(function () {
        Route::get('/', [\App\Http\Controllers\UsersController::class, 'index'])->name('users.index')->middleware('permission:user-index');

        Route::get('/create', [\App\Http\Controllers\UsersController::class, 'create'])->middleware('permission:user-create');

        Route::get('/{id}', [\App\Http\Controllers\UsersController::class, 'edit'])->middleware('permission:user-edit');

        Route::post("/", [\App\Http\Controllers\UsersController::class, 'store'])->middleware('permission:user-create');

        Route::put("/{id}", [\App\Http\Controllers\UsersController::class, 'update'])->middleware('permission:user-edit');

        Route::delete("/{id}", [\App\Http\Controllers\UsersController::class, 'destroy'])->middleware('permission:user-delete');
    });

    Route::prefix('documents')->group(function () {
            Route::get('/', [\App\Http\Controllers\DocumentsController::class, 'index'])->name('documents.index')->middleware('permission:document-index');

            Route::get('/create', [\App\Http\Controllers\DocumentsController::class, 'create'])->middleware('permission:document-create');
            
            Route::get('/thumbnail/{id}', [\App\Http\Controllers\DocumentsController::class, 'thumbnail'])->name('documents.thumbnail')->middleware('permission:document-index');

            Route::get('/download/{id}', [\App\Http\Controllers\DocumentsController::class, 'download'])->name('documents.download')->middleware('permission:document-index');

            Route::get('/{id}', [\App\Http\Controllers\DocumentsController::class, 'edit'])->middleware('permission:document-edit');

            Route::post("/", [\App\Http\Controllers\DocumentsController::class, 'store'])->middleware('permission:document-create');

            Route::put("/{id}", [\App\Http\Controllers\DocumentsController::class, 'update'])->middleware('permission:document-edit');

            Route::delete("/{id}", [\App\Http\Controllers\DocumentsController::class, 'destroy'])->middleware('permission:document-delete');
    });

    Route::prefix('contents')->group(function () {
            Route::get('/', [\App\Http\Controllers\ContentsController::class, 'index'])->name('contents.index')->middleware('permission:content-index');
            Route::post('/', [\App\Http\Controllers\ContentsController::class, 'store'])->name('contents.store')->middleware('permission:content-create');
            Route::put('/{content}', [\App\Http\Controllers\ContentsController::class, 'update'])->name('contents.update')->middleware('permission:content-edit');
            Route::delete('/{content}', [\App\Http\Controllers\ContentsController::class, 'destroy'])->name('contents.destroy')->middleware('permission:content-delete');
            Route::get('/preview/{content}', [\App\Http\Controllers\ContentsController::class, 'preview'])->name('contents.preview')->middleware('permission:content-index');
            Route::get('/download/{content}', [\App\Http\Controllers\ContentsController::class, 'download'])->name('contents.download')->middleware('permission:content-index');
    });

    Route::prefix('templates')->group(function () {
            Route::get('/', [\App\Http\Controllers\TemplatesController::class, 'index'])->name('templates.index')->middleware('permission:templates-index');

            Route::post('/read-from-storage', [\App\Http\Controllers\TemplatesController::class, 'readTemplatesFromStorage'])->name('templates.readFromStorage')->middleware('permission:templates-index');

            Route::get('/create', [\App\Http\Controllers\TemplatesController::class, 'create'])->middleware('permission:templates-create');

            Route::get('/download/{id}', [\App\Http\Controllers\DocumentsController::class, 'download'])->name('templates.download')->middleware('permission:templates-index');

            Route::get('/{id}', [\App\Http\Controllers\TemplatesController::class, 'edit'])->middleware('permission:templates-edit');

            Route::post("/", [\App\Http\Controllers\TemplatesController::class, 'store'])->middleware('permission:templates-create');

            Route::put("/{id}", [\App\Http\Controllers\TemplatesController::class, 'update'])->middleware('permission:templates-edit');

            Route::delete("/{id}", [\App\Http\Controllers\TemplatesController::class, 'destroy'])->middleware('permission:templates-delete');
    });

    Route::prefix('categories')->group(function () {
        Route::get('/', [\App\Http\Controllers\CategoriesController::class, 'index'])->name('categories.index')->middleware('permission:category-index');

            Route::get('/create', [\App\Http\Controllers\CategoriesController::class, 'create'])->middleware('permission:category-create');

            Route::get('/{id}', [\App\Http\Controllers\CategoriesController::class, 'edit'])->middleware('permission:category-edit');

            Route::post("/", [\App\Http\Controllers\CategoriesController::class, 'store'])->middleware('permission:category-create');

            Route::put("/{id}", [\App\Http\Controllers\CategoriesController::class, 'update'])->middleware('permission:category-edit');

            Route::delete("/{id}", [\App\Http\Controllers\CategoriesController::class, 'destroy'])->middleware('permission:category-delete');
    });

    Route::prefix('subcategories')->group(function () {
        Route::get('/', [\App\Http\Controllers\SubCategoriesController::class, 'index'])->name('subcategories.index')->middleware('permission:subcategory-index');

            Route::get('/create', [\App\Http\Controllers\SubCategoriesController::class, 'create'])->middleware('permission:subcategory-create');

            Route::get('/{id}', [\App\Http\Controllers\SubCategoriesController::class, 'edit'])->middleware('permission:subcategory-edit');

            Route::post("/", [\App\Http\Controllers\SubCategoriesController::class, 'store'])->middleware('permission:subcategory-create');

            Route::put("/{id}", [\App\Http\Controllers\SubCategoriesController::class, 'update'])->middleware('permission:subcategory-edit');

            Route::delete("/{id}", [\App\Http\Controllers\SubCategoriesController::class, 'destroy'])->middleware('permission:subcategory-delete');
    });

    Route::prefix('statuses')->group(function () {
        Route::get('/', [\App\Http\Controllers\StatusController::class, 'index'])->name('statuses.index')->middleware('permission:status-index');

            Route::get('/create', [\App\Http\Controllers\StatusController::class, 'create'])->middleware('permission:status-create');

            Route::get('/{id}', [\App\Http\Controllers\StatusController::class, 'edit'])->middleware('permission:status-edit');

            Route::post("/", [\App\Http\Controllers\StatusController::class, 'store'])->middleware('permission:status-create');

            Route::put("/{id}", [\App\Http\Controllers\StatusController::class, 'update'])->middleware('permission:status-edit');

            Route::delete("/{id}", [\App\Http\Controllers\StatusController::class, 'destroy'])->middleware('permission:status-delete');
    });

    Route::prefix('languages')->group(function () {
        Route::get('/', [\App\Http\Controllers\LanguageController::class, 'index'])->name('languages.index')->middleware('permission:language-index');

            Route::get('/create', [\App\Http\Controllers\LanguageController::class, 'create'])->middleware('permission:language-create');

            Route::get('/{id}', [\App\Http\Controllers\LanguageController::class, 'edit'])->middleware('permission:language-edit');

            Route::post("/", [\App\Http\Controllers\LanguageController::class, 'store'])->middleware('permission:language-create');

            Route::put("/{id}", [\App\Http\Controllers\LanguageController::class, 'update'])->middleware('permission:language-edit');

            Route::delete("/{id}", [\App\Http\Controllers\LanguageController::class, 'destroy'])->middleware('permission:language-delete');
    });

    Route::prefix('companies')->group(function () {
        Route::get('/', [CompanyController::class, 'index'])->name('companies.index')->middleware('permission:company-index');

        Route::get('/create', [CompanyController::class, 'create'])->name('companies.create')->middleware('permission:company-create');

        Route::get('/{company}', [CompanyController::class, 'show'])->name('companies.show')->middleware('permission:company-index');

        Route::get('/{company}/edit', [CompanyController::class, 'edit'])->name('companies.edit')->middleware('permission:company-edit');

        Route::post("/", [CompanyController::class, 'store'])->name('companies.store')->middleware('permission:company-create');

        Route::put("/{company}", [CompanyController::class, 'update'])->name('companies.update')->middleware('permission:company-edit');

        Route::delete("/{company}", [CompanyController::class, 'destroy'])->name('companies.destroy')->middleware('permission:company-delete');
    });
});

require __DIR__.'/auth.php';
