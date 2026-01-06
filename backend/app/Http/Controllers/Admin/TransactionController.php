<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class TransactionController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => []]);
    }
}
