<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MonthlyReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_receives_complete_monthly_analytics_payload(): void
    {
        $adminRole = DB::table('roles')->insertGetId(['role' => 'Admin']);
        $employeeRole = DB::table('roles')->insertGetId(['role' => 'Employee']);
        $admin = $this->user($adminRole, 'report-admin');
        $employee = $this->user($employeeRole, 'report-employee');
        $closedStatus = DB::table('statuses')->insertGetId(['status' => 'Closed']);
        $priority = DB::table('priorities')->insertGetId(['priority' => 'Critical']);
        $category = DB::table('categories')->insertGetId(['category' => 'Security']);
        $created = Carbon::parse('2026-08-04 09:00:00');

        Ticket::create(['priorityid' => $priority, 'statusid' => $closedStatus, 'categoryid' => $category, 'createdby' => $employee->id, 'assignedto' => null, 'returnedto' => null, 'creation_date' => $created, 'update_date' => $created->copy()->addHours(5), 'closed_date' => $created->copy()->addHours(5), 'title' => 'Suspicious sign-in', 'description' => 'A risky sign-in was detected.']);

        Sanctum::actingAs($admin);
        $this->getJson('/api/reports/monthly?month=2026-08')
            ->assertOk()
            ->assertJsonPath('metrics.created', 1)
            ->assertJsonPath('metrics.close_rate', 100)
            ->assertJsonPath('breakdowns.category.0.label', 'Security')
            ->assertJsonCount(5, 'important_points')
            ->assertJsonCount(1, 'tickets');
    }

    private function user(int $roleId, string $name): User
    {
        return User::create(['firstname' => ucfirst($name), 'username' => $name, 'email' => "{$name}@smartdesk.test", 'password' => Hash::make('SecurePass1'), 'roleid' => $roleId, 'creationdate' => now(), 'isbanned' => false]);
    }
}
