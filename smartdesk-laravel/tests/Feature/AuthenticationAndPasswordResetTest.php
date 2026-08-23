<?php

namespace Tests\Feature;

use App\Mail\PasswordResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthenticationAndPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_login_and_banned_user_cannot(): void
    {
        $roleId = DB::table('roles')->insertGetId(['role' => 'Employee']);
        $active = $this->createUser($roleId, 'active@smartdesk.test');
        $banned = $this->createUser($roleId, 'banned@smartdesk.test', true);

        $this->postJson('/api/login', ['email' => $active->email, 'password' => 'SecurePass1'])
            ->assertOk()
            ->assertJsonPath('user.role', 'Employee')
            ->assertJsonStructure(['token']);

        $this->postJson('/api/login', ['email' => $banned->email, 'password' => 'SecurePass1'])
            ->assertForbidden();
    }

    public function test_password_reset_code_is_emailed_expires_and_can_only_be_used_once(): void
    {
        Mail::fake();
        $roleId = DB::table('roles')->insertGetId(['role' => 'Employee']);
        $user = $this->createUser($roleId, 'reset@smartdesk.test');
        $plainCode = null;

        $this->postJson('/api/forgot-password/request-code', ['email' => $user->email])
            ->assertOk();

        Mail::assertSent(PasswordResetCodeMail::class, function (PasswordResetCodeMail $mail) use (&$plainCode) {
            $plainCode = $mail->code;
            return true;
        });

        $reset = PasswordResetCode::firstOrFail();
        $this->assertNotSame($plainCode, $reset->code_hash);
        $this->assertTrue(Hash::check($plainCode, $reset->code_hash));

        $payload = [
            'email' => $user->email,
            'code' => $plainCode,
            'password' => 'NewSecurePass2',
            'password_confirmation' => 'NewSecurePass2',
        ];
        $this->postJson('/api/forgot-password/reset', $payload)->assertOk();
        $this->assertTrue(Hash::check('NewSecurePass2', $user->fresh()->password));
        $this->postJson('/api/forgot-password/reset', $payload)->assertUnprocessable();
    }

    private function createUser(int $roleId, string $email, bool $banned = false): User
    {
        return User::create([
            'firstname' => 'Test',
            'username' => str_replace(['@', '.'], '-', $email),
            'email' => $email,
            'password' => Hash::make('SecurePass1'),
            'roleid' => $roleId,
            'creationdate' => now(),
            'isbanned' => $banned,
        ]);
    }
}
