<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketAttachmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_owner_can_upload_list_download_and_remove_a_private_attachment(): void
    {
        Storage::fake('local');
        Mail::fake();

        $adminRole = DB::table('roles')->insertGetId(['role' => 'Admin']);
        $employeeRole = DB::table('roles')->insertGetId(['role' => 'Employee']);
        $admin = $this->user($adminRole, 'attachment-admin');
        $owner = $this->user($employeeRole, 'attachment-owner');
        $otherEmployee = $this->user($employeeRole, 'attachment-other');
        $ticket = $this->ticket($owner);

        Sanctum::actingAs($owner);
        $uploadResponse = $this->post(
            "/api/tickets/{$ticket->id}/attachments",
            ['file' => UploadedFile::fake()->create('diagnostic report.pdf', 128, 'application/pdf')],
            ['Accept' => 'application/json'],
        )->assertCreated()->assertJsonPath('attachment.filename', 'diagnostic report.pdf');

        $attachmentId = $uploadResponse->json('attachment.id');
        $storedPath = DB::table('ticket_attachments')->where('id', $attachmentId)->value('filepath');
        Storage::disk('local')->assertExists($storedPath);

        $this->getJson("/api/tickets/{$ticket->id}/attachments")
            ->assertOk()
            ->assertJsonCount(1, 'attachments');
        $this->get("/api/attachments/{$attachmentId}/download", ['Accept' => 'application/json'])
            ->assertOk()
            ->assertHeader('content-disposition');

        Sanctum::actingAs($otherEmployee);
        $this->getJson("/api/tickets/{$ticket->id}/attachments")->assertForbidden();

        Sanctum::actingAs($owner);
        $this->deleteJson("/api/attachments/{$attachmentId}")->assertOk();
        $this->assertDatabaseMissing('ticket_attachments', ['id' => $attachmentId]);
        Storage::disk('local')->assertMissing($storedPath);

        $this->assertDatabaseHas('notifications', [
            'userid' => $admin->id,
            'ticketid' => $ticket->id,
            'type' => 'ticket_attachment',
        ]);
    }

    public function test_executable_attachment_is_rejected(): void
    {
        Storage::fake('local');
        Mail::fake();
        $employeeRole = DB::table('roles')->insertGetId(['role' => 'Employee']);
        $owner = $this->user($employeeRole, 'secure-owner');
        $ticket = $this->ticket($owner);

        Sanctum::actingAs($owner);
        $this->post(
            "/api/tickets/{$ticket->id}/attachments",
            ['file' => UploadedFile::fake()->create('payload.exe', 20, 'application/x-msdownload')],
            ['Accept' => 'application/json'],
        )->assertUnprocessable();

        $this->assertDatabaseCount('ticket_attachments', 0);
    }

    private function ticket(User $owner): Ticket
    {
        $status = DB::table('statuses')->insertGetId(['status' => 'Open']);
        $priority = DB::table('priorities')->insertGetId(['priority' => 'Medium']);
        $category = DB::table('categories')->insertGetId(['category' => 'Software']);

        return Ticket::create([
            'priorityid' => $priority,
            'statusid' => $status,
            'categoryid' => $category,
            'createdby' => $owner->id,
            'assignedto' => null,
            'returnedto' => null,
            'creation_date' => now(),
            'title' => 'Application diagnostics',
            'description' => 'Diagnostic files are required for investigation.',
        ]);
    }

    private function user(int $roleId, string $name): User
    {
        return User::create([
            'firstname' => ucfirst($name),
            'username' => $name,
            'email' => "{$name}@smartdesk.test",
            'password' => Hash::make('SecurePass1'),
            'roleid' => $roleId,
            'creationdate' => now(),
            'isbanned' => false,
        ]);
    }
}
