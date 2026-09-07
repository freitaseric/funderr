<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/', '/home');

Route::view('/home', 'home')->middleware('auth')->name('home');

Route::get('/alterar-senha', function () {
    if (! auth()->user()->must_change_password) {
        return redirect()->route('home');
    }

    return view('auth.change-password');
})->middleware('auth')->name('password.change');
