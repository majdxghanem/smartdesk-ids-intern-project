<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(
            Category::orderBy('id')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['category' => ['required', 'string', 'max:100', 'unique:categories,category']]);
        return response()->json(['message' => 'Category created successfully.', 'category' => Category::create(['category' => trim($validated['category'])])], 201);
    }

    public function update(Request $request, int $id)
    {
        $category = Category::findOrFail($id);
        $validated = $request->validate(['category' => ['required', 'string', 'max:100', 'unique:categories,category,'.$id]]);
        $category->update(['category' => trim($validated['category'])]);
        return response()->json(['message' => 'Category updated successfully.', 'category' => $category]);
    }

    public function destroy(int $id)
    {
        $category = Category::findOrFail($id);
        if ($category->tickets()->withTrashed()->exists()) {
            return response()->json(['message' => 'This category is used by tickets and cannot be removed. Rename it instead.'], 409);
        }
        $category->delete();
        return response()->json(['message' => 'Category removed successfully.']);
    }
}
