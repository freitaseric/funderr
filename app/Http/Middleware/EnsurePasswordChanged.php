<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (
            $request->user()?->must_change_password
            && ! $request->routeIs(
                'password.change',
                'user-password.update',
                'logout',
            )
        ) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Altere sua senha antes de continuar.',
                ], 403);
            }

            return redirect()->route('password.change');
        }

        return $next($request);
    }
}
