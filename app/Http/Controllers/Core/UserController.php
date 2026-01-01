<?php

namespace App\Http\Controllers\Core;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User as UserModel;


class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(UserModel::class, 'user');
    }
    public function index()
    {
        return response()->json(['message' => 'users index']);
    }
}
