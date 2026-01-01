<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\AssignRolesRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct()
    {
        // All routes require authentication
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {
        if (! $request->user()->can('manage users')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->user()->tenant_id;
        $users = User::where('tenant_id', $tenantId)->paginate(15);

        return response()->json($users);
    }

    public function store(StoreUserRequest $request)
    {
        if (! $request->user()->can('manage users')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();
        $data['tenant_id'] = $request->user()->tenant_id;
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        if (isset($data['roles']) && method_exists($user, 'assignRole')) {
            $user->syncRoles($data['roles']);
        }

        return response()->json($user, 201);
    }

    public function show(Request $request, User $user)
    {
        if (! $request->user()->can('manage users')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($user);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        if (! $request->user()->can('manage users')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $data = $request->validated();
        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user);
    }

    public function destroy(Request $request, User $user)
    {
        if (! $request->user()->can('manage users')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $user->delete();

        return response()->json(null, 204);
    }

    public function assignRoles(AssignRolesRequest $request, User $user)
    {
        if (! $request->user()->can('manage users')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $roles = $request->input('roles', []);
        if (method_exists($user, 'assignRole')) {
            $user->syncRoles($roles);
        }

        return response()->json(['roles' => $user->roles]);
    }
}
