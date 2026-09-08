<?php

use App\Http\Controllers\Admin\CreditLineController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\BeneficiaryController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\ProposalController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/home');

Route::view('/home', 'home')
    ->middleware('auth')
    ->name('home');

Route::get('/alterar-senha', function () {
    if (! auth()->user()->must_change_password) {
        return redirect()->route('home');
    }

    return view('auth.change-password');
})
    ->middleware('auth')
    ->name('password.change');

Route::middleware([
    'auth',
    'role:administrador',
])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get(
            '/usuarios',
            [UserController::class, 'index']
        )->name('users.index');

        Route::get(
            '/usuarios/novo',
            [UserController::class, 'create']
        )->name('users.create');

        Route::post(
            '/usuarios',
            [UserController::class, 'store']
        )->middleware('throttle:sensitive-write')->name('users.store');

        Route::patch(
            '/usuarios/{user}/desativar',
            [UserController::class, 'disable']
        )->middleware('throttle:sensitive-write')->name('users.disable');

        Route::patch(
            '/usuarios/{user}/reativar',
            [UserController::class, 'enable']
        )->middleware('throttle:sensitive-write')->name('users.enable');

        Route::patch(
            '/usuarios/{user}/redefinir-senha',
            [UserController::class, 'resetPassword']
        )->middleware('throttle:sensitive-write')->name('users.reset-password');

        Route::get('/linhas-de-credito', [CreditLineController::class, 'index'])->name('credit-lines.index');
        Route::get('/linhas-de-credito/nova', [CreditLineController::class, 'create'])->name('credit-lines.create');
        Route::get('/linhas-de-credito/{creditLine}/editar', [CreditLineController::class, 'edit'])->name('credit-lines.edit');
    });

Route::middleware(['auth', 'role:tecnico', 'throttle:sensitive-read'])->group(function () {
    Route::get('/beneficiarios/novo', [BeneficiaryController::class, 'create'])->name('beneficiaries.create');
    Route::get('/beneficiarios/{beneficiary}/editar', [BeneficiaryController::class, 'edit'])->name('beneficiaries.edit');
    Route::get('/propriedades/nova', [PropertyController::class, 'create'])->name('properties.create');
    Route::get('/propriedades/{property}/editar', [PropertyController::class, 'edit'])->name('properties.edit');
});

Route::middleware(['auth', 'role:tecnico,nucleo', 'throttle:sensitive-read'])->group(function () {
    Route::get('/beneficiarios', [BeneficiaryController::class, 'index'])->name('beneficiaries.index');
    Route::get('/beneficiarios/{beneficiary}', [BeneficiaryController::class, 'show'])->name('beneficiaries.show');
    Route::get('/propriedades', [PropertyController::class, 'index'])->name('properties.index');
    Route::get('/propriedades/{property}', [PropertyController::class, 'show'])->name('properties.show');
});

Route::middleware(['auth', 'throttle:sensitive-read'])->prefix('propostas')->name('proposals.')->group(function () {
    Route::get('/', [ProposalController::class, 'index'])->name('index');
    Route::get('/nova', [ProposalController::class, 'create'])->name('create');
    Route::get('/{proposal}/etapas/{step}', [ProposalController::class, 'edit'])->name('edit');
    Route::get('/{proposal}/imprimir/{document}', [ProposalController::class, 'print'])->name('print');
});
