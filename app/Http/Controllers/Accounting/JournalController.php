<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class JournalController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        // Journal endpoints typically require accounting permissions
        // Specific policy can be implemented; for now require 'reports.view'
    }
    public function index()
    {
        return response()->json(['message' => 'journal entries index']);
    }
}
