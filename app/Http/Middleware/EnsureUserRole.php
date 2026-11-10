<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()?->hasAnyRole($roles)) {
            if ($request->expectsJson()) {
                abort(403);
            }

            return redirect('/');
        }

        return $next($request);
    }
}
