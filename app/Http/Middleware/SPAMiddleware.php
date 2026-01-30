<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SPAMiddleware
{
    /**
     * Handle an incoming request.
     * Check if the request is an ajax request
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->ajax()) {
            return redirect("/");
        }

        return $next($request);
    }
}
