<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && (! $user->isActive() || $user->temporaryPasswordHasExpired())) {
            Auth::logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('login')
                ->withErrors([
                    'cpf' => $user->temporaryPasswordHasExpired()
                        ? 'A senha temporária expirou. Solicite uma nova ao administrador.'
                        : 'Esta conta está desativada.',
                ]);
        }

        return $next($request);
    }
}
