<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NormalizeLoginCpf
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->routeIs('login.store') && is_string($request->input('cpf'))) {
            $request->merge(['cpf' => str_replace(['.', '-'], '', $request->input('cpf'))]);
        }

        return $next($request);
    }
}
