<?php

namespace App\Http\Controllers;

use App\Http\Requests\Setting\UpdateSettingRequest;
use App\Http\Requests\Setting\UploadLogoRequest;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function show(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $settings = Setting::where('tenant_id', $tenantId)->get()->pluck('value', 'key');

        return response()->json($settings);
    }

    public function update(UpdateSettingRequest $request)
    {
        $tenantId = $request->user()->tenant_id;
        $data = $request->validated();

        foreach ($data as $key => $value) {
            Setting::updateOrCreate([
                'tenant_id' => $tenantId,
                'key' => $key,
            ], [
                'value' => $value,
            ]);
        }

        $settings = Setting::where('tenant_id', $tenantId)->get()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function uploadLogo(UploadLogoRequest $request)
    {
        $tenantId = $request->user()->tenant_id;
        $file = $request->file('logo');

        $path = $file->storePubliclyAs("logos/{$tenantId}", uniqid('logo_') . '.' . $file->getClientOriginalExtension(), ['disk' => 'public']);

        Setting::updateOrCreate([
            'tenant_id' => $tenantId,
            'key' => 'company.logo',
        ], [
            'value' => ['path' => $path, 'url' => Storage::disk('public')->url($path)],
        ]);

        return response()->json(['path' => $path, 'url' => Storage::disk('public')->url($path)], 201);
    }
}
