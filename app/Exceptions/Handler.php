<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;
use Illuminate\Support\Facades\Log;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Only return JSON errors for API requests
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle API exceptions with standardized JSON response.
     */
    protected function handleApiException($request, Throwable $e): JsonResponse
    {
        $statusCode = 500;
        $message = 'Internal server error';
        $errors = null;

        // ModelNotFoundException (404)
        if ($e instanceof ModelNotFoundException) {
            $statusCode = 404;
            $message = 'Resource not found';
            
            Log::warning('Resource not found', [
                'url' => $request->fullUrl(),
                'user_id' => $request->user()?->id,
                'tenant_id' => $request->user()?->tenant_id,
                'model' => $e->getModel(),
            ]);
        }
        
        // NotFoundHttpException (404)
        elseif ($e instanceof NotFoundHttpException) {
            $statusCode = 404;
            $message = 'Endpoint not found';
        }

        // AuthorizationException (403)
        elseif ($e instanceof AuthorizationException) {
            $statusCode = 403;
            $message = $e->getMessage() ?: 'This action is unauthorized';
            
            Log::warning('Unauthorized action attempted', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'user_id' => $request->user()?->id,
                'tenant_id' => $request->user()?->tenant_id,
                'ip' => $request->ip(),
                'message' => $e->getMessage(),
            ]);
        }

        // AuthenticationException (401)
        elseif ($e instanceof AuthenticationException) {
            $statusCode = 401;
            $message = 'Unauthenticated';
        }

        // ValidationException (422)
        elseif ($e instanceof ValidationException) {
            $statusCode = 422;
            $message = 'Validation failed';
            $errors = $e->errors();
        }

        // HttpException (catch generic HTTP exceptions)
        elseif ($e instanceof HttpException) {
            $statusCode = $e->getStatusCode();
            $message = $e->getMessage() ?: 'HTTP error occurred';
        }

        // Generic exceptions (500)
        else {
            $statusCode = 500;
            $message = config('app.debug') 
                ? $e->getMessage() 
                : 'Internal server error';

            // Log the full exception in production
            if (!config('app.debug')) {
                Log::error('Internal server error', [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'user_id' => $request->user()?->id,
                    'tenant_id' => $request->user()?->tenant_id,
                ]);
            }
        }

        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        // Include trace only in debug mode
        if (config('app.debug') && $statusCode === 500) {
            $response['trace'] = $e->getTrace();
            $response['file'] = $e->getFile();
            $response['line'] = $e->getLine();
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Convert an authentication exception into a response.
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        return $request->expectsJson()
            ? response()->json(['success' => false, 'message' => 'Unauthenticated'], 401)
            : redirect()->guest(route('login'));
    }
}
