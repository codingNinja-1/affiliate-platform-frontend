<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CurrencyController extends Controller
{
    public function index()
    {
        // Return only active currency rates, wrapped in 'data' for frontend compatibility
        $rates = DB::table('currency_rates')->where('is_active', 1)->get();
        return response()->json(['data' => $rates]);
    }
}
