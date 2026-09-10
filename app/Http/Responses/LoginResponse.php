<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        if ($request instanceof Request && $request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        $intended = (string) $request->session()->pull('url.intended', '');
        $intendedPath = parse_url($intended, PHP_URL_PATH);

        $query = parse_url($intended, PHP_URL_QUERY);
        $target = $intendedPath && $intendedPath !== '/login'
            ? $intendedPath.($query ? '?'.$query : '')
            : route('home');

        return redirect()->to($target);
    }
}
