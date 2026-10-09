<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminPassword = config('smartdesk.seed.admin_password');
        $demoPassword = config('smartdesk.seed.demo_password');

        if (! is_string($adminPassword) || strlen($adminPassword) < 8) {
            throw new InvalidArgumentException(
                'Set SMARTDESK_ADMIN_PASSWORD to a unique password of at least 8 characters before seeding.'
            );
        }

        if ($demoPassword !== null && (! is_string($demoPassword) || strlen($demoPassword) < 8)) {
            throw new InvalidArgumentException(
                'SMARTDESK_DEMO_PASSWORD must be blank or contain at least 8 characters.'
            );
        }

        $demoPasswordHash = Hash::make($demoPassword ?: Str::random(40));
        $adminPasswordHash = Hash::make($adminPassword);

        User::insert([

           

            [
                'firstname' => 'John',
                'username' => 'john',
                'email' => 'john@smartdesk.com',
                'password' => $demoPasswordHash,
                'roleid' => 2,
                'creationdate' => now(),
                'isbanned' => 0,
                'banreason' => null,
            ],

            [
                'firstname' => 'Sarah',
                'username' => 'sarah',
                'email' => 'sarah@smartdesk.com',
                'password' => $demoPasswordHash,
                'roleid' => 2,
                'creationdate' => now(),
                'isbanned' => 0,
                'banreason' => null,
            ],

            [
                'firstname' => 'Ali',
                'username' => 'ali',
                'email' => 'ali@smartdesk.com',
                'password' => $demoPasswordHash,
                'roleid' => 3,
                'creationdate' => now(),
                'isbanned' => 0,
                'banreason' => null,
            ],

            [
                'firstname' => 'Maya',
                'username' => 'maya',
                'email' => 'maya@smartdesk.com',
                'password' => $demoPasswordHash,
                'roleid' => 3,
                'creationdate' => now(),
                'isbanned' => 0,
                'banreason' => null,
            ],

            [
                'firstname' => 'Rami',
                'username' => 'rami',
                'email' => 'rami@smartdesk.com',
                'password' => $demoPasswordHash,
                'roleid' => 3,
                'creationdate' => now(),
                'isbanned' => 1,
                'banreason' => 'Repeated policy violations',
            ],

            [
                'firstname' => 'David',
                'username' => 'david',
                'email' => 'david@smartdesk.com',
                'password' => $demoPasswordHash,
                'roleid' => 4,
                'creationdate' => now(),
                'isbanned' => 0,
                'banreason' => null,
            ],

            [
                'firstname' => 'Nour',
                'username' => 'nour',
                'email' => 'nour@smartdesk.com',
                'password' => $demoPasswordHash,
                'roleid' => 4,
                'creationdate' => now(),
                'isbanned' => 0,
                'banreason' => null,
            ],

            [
                'firstname' => 'Administrator',
                'username' => 'admin',
                'email' => 'admin@smartdesk.local',
                'password' => $adminPasswordHash,
                'roleid' => 1,
                'creationdate' => now(),
                'isbanned' => 0,
                'banreason' => null,
            ],

        ]);
    }
}
