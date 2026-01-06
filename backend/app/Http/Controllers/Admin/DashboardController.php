<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'message' => 'Admin dashboard placeholder',
        ]);
    }
}
