<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_can_be_created_assigned_returned_and_notified_without_losing_ownership_semantics(): void
    {
        Mail::fake();
        $roles = $this->roles();
        $admin = $this->user($roles['Admin'], 'admin');
        $employee = $this->user($roles['Employee'], 'employee');
        $agent = $this->user($roles['IT Support Agent'], 'agent');
        $openId = DB::table('statuses')->insertGetId(['status' => 'Open']);
        DB::table('statuses')->insert(['status' => 'In Progress']);
        DB::table('statuses')->insert(['status' => 'Returned']);
        DB::table('statuses')->insert(['status' => 'Closed']);
        $priorityId = DB::table('priorities')->insertGetId(['priority' => 'High']);
        $categoryId = DB::table('categories')->insertGetId(['category' => 'Network']);

        Sanctum::actingAs($employee);
        $ticketId = $this->postJson('/api/tickets', [
            'title' => 'Corporate VPN unavailable',
            'description' => 'The VPN client cannot establish a secure connection.',
            'priorityid' => $priorityId,
            'categoryid' => $categoryId,
        ])->assertCreated()->json('ticket.id');
        $this->assertDatabaseHas('tickets', ['id' => $ticketId, 'statusid' => $openId, 'assignedto' => null]);
        $this->assertTrue(Notification::where('userid', $admin->id)->where('ticketid', $ticketId)->exists());

        Sanctum::actingAs($admin);
        $this->putJson("/api/tickets/{$ticketId}/assign", ['assignedto' => $agent->id])->assertOk();
        $this->assertDatabaseHas('tickets', ['id' => $ticketId, 'assignedto' => $agent->id, 'returnedto' => null]);

        Sanctum::actingAs($agent);
        $this->putJson("/api/tickets/{$ticketId}/return")->assertOk();
        $this->assertDatabaseHas('tickets', ['id' => $ticketId, 'assignedto' => null, 'returnedto' => $admin->id]);
    }

    public function test_admin_archives_and_restores_ticket_with_audit_data_intact(): void
    {
        Mail::fake();
        $roles = $this->roles();
        $admin = $this->user($roles['Admin'], 'admin-archive');
        $employee = $this->user($roles['Employee'], 'employee-archive');
        $statusId = DB::table('statuses')->insertGetId(['status' => 'Open']);
        $priorityId = DB::table('priorities')->insertGetId(['priority' => 'Low']);
        $categoryId = DB::table('categories')->insertGetId(['category' => 'Hardware']);
        $ticket = Ticket::create(['priorityid' => $priorityId, 'statusid' => $statusId, 'categoryid' => $categoryId, 'createdby' => $employee->id, 'assignedto' => null, 'returnedto' => null, 'creation_date' => now(), 'title' => 'Mouse replacement', 'description' => 'Mouse is no longer working.']);

        Sanctum::actingAs($admin);
        $this->deleteJson("/api/tickets/{$ticket->id}")->assertOk();
        $this->assertSoftDeleted('tickets', ['id' => $ticket->id]);
        $this->putJson("/api/tickets/{$ticket->id}/restore")->assertOk();
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'deleted_at' => null]);
    }

    private function roles(): array
    {
        return collect(['Admin', 'Manager', 'Employee', 'IT Support Agent'])
            ->mapWithKeys(fn (string $role) => [$role => DB::table('roles')->insertGetId(['role' => $role])])
            ->all();
    }

    private function user(int $roleId, string $name): User
    {
        return User::create(['firstname' => ucfirst($name), 'username' => $name, 'email' => "{$name}@smartdesk.test", 'password' => Hash::make('SecurePass1'), 'roleid' => $roleId, 'creationdate' => now(), 'isbanned' => false]);
    }
}
