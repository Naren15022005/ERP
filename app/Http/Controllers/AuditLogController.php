<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }
    public function index(Request $request)
    {
        if (! $request->user() || ! $request->user()->can('view audit logs')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = Activity::query()->with(['causer', 'subject']);

        if ($request->filled('from') || $request->filled('to')) {
            $from = $request->input('from');
            $to = $request->input('to');

            if ($from && $to) {
                $query->whereBetween('created_at', [$from, $to]);
            } elseif ($from) {
                $query->where('created_at', '>=', $from);
            } elseif ($to) {
                $query->where('created_at', '<=', $to);
            }
        }

        if ($request->filled('user_id')) {
            $query->where('causer_id', $request->input('user_id'));
        }

        if ($request->filled('event')) {
            $query->where('description', $request->input('event'));
        }

        if ($request->filled('model')) {
            $query->where('subject_type', $request->input('model'));
        }

        $perPage = (int) $request->input('per_page', 25);

        $results = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($results);
    }
}
