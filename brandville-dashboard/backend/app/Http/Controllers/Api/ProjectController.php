<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'client_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'due_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['not_started', 'in_progress', 'completed'])],
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $query = Project::query();

        if ($request->filled('search')) {
            $term = trim((string) $request->query('search'));
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('client_name', 'like', "%{$term}%");
            });
        }

        if ($request->filled('status') && in_array($request->query('status'), [
            'not_started', 'in_progress', 'completed',
        ], true)) {
            $query->where('status', $request->query('status'));
        }

        $projects = $query->orderByDesc('created_at')->get();

        return response()->json(['data' => $projects, 'total' => $projects->count()]);
    }

    public function store(Request $request): JsonResponse
    {
        $project = Project::create($request->validate($this->rules()));

        return response()->json([
            'message' => 'Project created successfully.',
            'data' => $project,
        ], 201);
    }

    public function show(Project $project): JsonResponse
    {
        return response()->json(['data' => $project]);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $project->update($request->validate($this->rules()));

        return response()->json([
            'message' => 'Project updated successfully.',
            'data' => $project->fresh(),
        ]);
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json(['message' => 'Project deleted successfully.']);
    }
}
