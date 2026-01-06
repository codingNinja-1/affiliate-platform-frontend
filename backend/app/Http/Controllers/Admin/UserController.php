<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:active,pending,suspended,rejected,inactive',
        ]);

        $user = User::findOrFail($id);
        $user->status = $request->status;
        $user->save();

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function destroy($id)
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }
}
