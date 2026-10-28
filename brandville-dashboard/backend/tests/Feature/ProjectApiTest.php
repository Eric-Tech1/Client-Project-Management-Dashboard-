<?php

namespace Tests\Feature;

use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Client Website Redesign',
            'client_name' => 'Acme Ltd',
            'description' => 'Refresh company website',
            'start_date' => '2026-10-27',
            'due_date' => '2026-11-30',
            'status' => 'in_progress',
        ], $overrides);
    }

    public function test_project_can_be_created_viewed_updated_and_deleted(): void
    {
        $this->postJson('/api/projects', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.name', 'Client Website Redesign');

        $project = Project::firstOrFail();

        $this->getJson("/api/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.client_name', 'Acme Ltd');

        $this->putJson("/api/projects/{$project->id}", $this->payload([
            'status' => 'completed',
        ]))->assertOk()->assertJsonPath('data.status', 'completed');

        $this->deleteJson("/api/projects/{$project->id}")
            ->assertOk();

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_search_and_status_filter_work(): void
    {
        Project::create($this->payload());
        Project::create($this->payload([
            'name' => 'Mobile App',
            'client_name' => 'Beta Ltd',
            'status' => 'completed',
        ]));

        $this->getJson('/api/projects?search=Acme')
            ->assertOk()->assertJsonCount(1, 'data');

        $this->getJson('/api/projects?status=completed')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_invalid_due_date_is_rejected(): void
    {
        $this->postJson('/api/projects', $this->payload([
            'due_date' => '2026-10-01',
        ]))->assertUnprocessable()->assertJsonValidationErrors('due_date');
    }

    public function test_dashboard_counts_update_from_database(): void
    {
        Project::create($this->payload(['status' => 'not_started']));
        Project::create($this->payload(['name' => 'Second', 'status' => 'completed']));

        $this->getJson('/api/dashboard')->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonPath('not_started', 1)
            ->assertJsonPath('completed', 1);
    }
}
