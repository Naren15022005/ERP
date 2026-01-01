<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Alert;

class AlertsController extends Controller
{
    // List alerts for the current tenant (paginated)
    public function index(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id ?? null;

        $query = Alert::query()->orderBy('created_at', 'desc');
        if ($tenantId) $query->where('tenant_id', $tenantId);

        $perPage = (int) $request->get('per_page', 20);
        $alerts = $query->paginate($perPage);

        return response()->json($alerts);
    }

    // Return only the unread alerts count (tenant-scoped)
    public function count(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id ?? null;

        $query = Alert::query()->where('read', false);
        if ($tenantId) $query->where('tenant_id', $tenantId);

        $count = $query->count();

        return response()->json(['count' => $count]);
    }

    // Mark an alert as read
    public function markRead(Request $request, Alert $alert)
    {
        $user = $request->user();
        if ($user->tenant_id && $alert->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $alert->read = true;
        $alert->save();

        return response()->json($alert);
    }
}
