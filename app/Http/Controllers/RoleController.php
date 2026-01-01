<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {
        if (! $request->user()->can('manage users')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json(Role::all());
    }

    public function assign(Request $request, User $user)
    {
        if (! $request->user()->can('manage users')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        if ($user->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $roles = $request->input('roles', []);
        $user->syncRoles($roles);
        return response()->json(['roles' => $user->roles]);
    }
}
