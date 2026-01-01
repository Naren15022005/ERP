<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Upload a product image and return a public URL.
     */
    public function image(Request $request)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId) abort(403);

        $request->validate([
            'image' => 'required|image|max:5120', // max 5MB
        ]);

        $file = $request->file('image');
        $path = $file->store("products/{$tenantId}", 'public');

        // Try to produce a robust public URL. Prefer the configured disk URL,
        // but fall back to the `asset('storage/...')` helper which derives host
        // from the current request when APP_URL is not set correctly.
        $diskUrl = Storage::disk('public')->url($path);
        $assetUrl = asset('storage/' . $path);

        // If diskUrl appears to be a relative path or empty, prefer assetUrl.
        $url = $diskUrl;
        if (! $url || str_starts_with($url, '/')) {
            $url = $assetUrl;
        }

        return response()->json(['url' => $url, 'path' => $path, 'disk_url' => $diskUrl, 'asset_url' => $assetUrl]);
    }
}
