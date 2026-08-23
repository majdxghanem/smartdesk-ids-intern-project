<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Status;
use App\Models\Ticket;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        $openStatusId = Status::where('status', 'Open')->value('id');
        $inProgressStatusId = Status::where('status', 'In Progress')->value('id');

        if (!$openStatusId || !$inProgressStatusId) {
            throw new \RuntimeException(
                'Open and In Progress statuses must be seeded before tickets.'
            );
        }

        $tickets = [

            [
                'priorityid'=>3,
                'statusid'=>1,
                'categoryid'=>3,
                'createdby'=>4,
                'assignedto'=>null,
                'creation_date'=>now(),
                'update_date'=>null,
                'closed_date'=>null,
                'title'=>'Cannot connect to VPN',
                'description'=>'VPN connection fails with authentication error.'
            ],

            [
                'priorityid'=>2,
                'statusid'=>2,
                'categoryid'=>4,
                'createdby'=>5,
                'assignedto'=>2,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>null,
                'title'=>'Outlook not syncing',
                'description'=>'Emails stopped syncing since yesterday.'
            ],

            [
                'priorityid'=>4,
                'statusid'=>2,
                'categoryid'=>1,
                'createdby'=>6,
                'assignedto'=>3,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>null,
                'title'=>'Blue screen after Windows update',
                'description'=>'Laptop crashes immediately after startup.'
            ],

            [
                'priorityid'=>2,
                'statusid'=>1,
                'categoryid'=>6,
                'createdby'=>4,
                'assignedto'=>null,
                'creation_date'=>now(),
                'update_date'=>null,
                'closed_date'=>null,
                'title'=>'Printer offline',
                'description'=>'Office printer cannot be reached.'
            ],

            [
                'priorityid'=>3,
                'statusid'=>3,
                'categoryid'=>3,
                'createdby'=>5,
                'assignedto'=>2,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>null,
                'title'=>'WiFi disconnects frequently',
                'description'=>'Wireless network disconnects every few minutes.'
            ],

            [
                'priorityid'=>1,
                'statusid'=>4,
                'categoryid'=>5,
                'createdby'=>6,
                'assignedto'=>3,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>now(),
                'title'=>'Forgot password',
                'description'=>'Unable to login to company account.'
            ],

            [
                'priorityid'=>3,
                'statusid'=>1,
                'categoryid'=>3,
                'createdby'=>4,
                'assignedto'=>null,
                'creation_date'=>now(),
                'update_date'=>null,
                'closed_date'=>null,
                'title'=>'Shared folder inaccessible',
                'description'=>'Cannot access shared department folder.'
            ],

            [
                'priorityid'=>4,
                'statusid'=>2,
                'categoryid'=>1,
                'createdby'=>5,
                'assignedto'=>2,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>null,
                'title'=>'Laptop overheating',
                'description'=>'Laptop becomes extremely hot after 10 minutes.'
            ],

            [
                'priorityid'=>2,
                'statusid'=>1,
                'categoryid'=>2,
                'createdby'=>6,
                'assignedto'=>null,
                'creation_date'=>now(),
                'update_date'=>null,
                'closed_date'=>null,
                'title'=>'Teams microphone not working',
                'description'=>'Microphone is not detected during meetings.'
            ],

            [
                'priorityid'=>2,
                'statusid'=>3,
                'categoryid'=>4,
                'createdby'=>4,
                'assignedto'=>3,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>null,
                'title'=>'Spam emails received',
                'description'=>'Receiving hundreds of spam emails.'
            ],

            [
                'priorityid'=>3,
                'statusid'=>2,
                'categoryid'=>5,
                'createdby'=>5,
                'assignedto'=>2,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>null,
                'title'=>'Active Directory account locked',
                'description'=>'User account locked after failed logins.'
            ],

            [
                'priorityid'=>2,
                'statusid'=>1,
                'categoryid'=>3,
                'createdby'=>6,
                'assignedto'=>null,
                'creation_date'=>now(),
                'update_date'=>null,
                'closed_date'=>null,
                'title'=>'Network drive unavailable',
                'description'=>'Mapped drive cannot be opened.'
            ],

            [
                'priorityid'=>1,
                'statusid'=>4,
                'categoryid'=>1,
                'createdby'=>4,
                'assignedto'=>3,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>now(),
                'title'=>'Monitor flickering',
                'description'=>'Second monitor randomly flickers.'
            ],

            [
                'priorityid'=>3,
                'statusid'=>2,
                'categoryid'=>2,
                'createdby'=>5,
                'assignedto'=>2,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>null,
                'title'=>'Windows update failed',
                'description'=>'Latest Windows update cannot be installed.'
            ],

            [
                'priorityid'=>2,
                'statusid'=>1,
                'categoryid'=>1,
                'createdby'=>6,
                'assignedto'=>null,
                'creation_date'=>now(),
                'update_date'=>null,
                'closed_date'=>null,
                'title'=>'USB devices not recognized',
                'description'=>'Computer does not detect USB flash drives.'
            ],

            [
                'priorityid'=>1,
                'statusid'=>3,
                'categoryid'=>2,
                'createdby'=>4,
                'assignedto'=>3,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>null,
                'title'=>'Software installation request',
                'description'=>'Need Visual Studio installed.'
            ],

            [
                'priorityid'=>3,
                'statusid'=>1,
                'categoryid'=>3,
                'createdby'=>5,
                'assignedto'=>null,
                'creation_date'=>now(),
                'update_date'=>null,
                'closed_date'=>null,
                'title'=>'Internet is very slow',
                'description'=>'Browsing and downloads are extremely slow.'
            ],

            [
                'priorityid'=>2,
                'statusid'=>2,
                'categoryid'=>6,
                'createdby'=>6,
                'assignedto'=>2,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>null,
                'title'=>'Scanner not detected',
                'description'=>'Office scanner cannot be found.'
            ],

            [
                'priorityid'=>4,
                'statusid'=>1,
                'categoryid'=>5,
                'createdby'=>4,
                'assignedto'=>null,
                'creation_date'=>now(),
                'update_date'=>null,
                'closed_date'=>null,
                'title'=>'MFA authentication issue',
                'description'=>'Two-factor authentication codes are not received.'
            ],

            [
                'priorityid'=>2,
                'statusid'=>4,
                'categoryid'=>5,
                'createdby'=>5,
                'assignedto'=>3,
                'creation_date'=>now(),
                'update_date'=>now(),
                'closed_date'=>now(),
                'title'=>'New employee account setup',
                'description'=>'Create an account for a new employee.'
            ]

        ];

        foreach ($tickets as &$ticket) {
            // Legacy fixture value 3 referred to an employee, not an agent.
            if ($ticket['assignedto'] === 3) {
                $ticket['assignedto'] = 1;
            }

            $isAssigned = $ticket['assignedto'] !== null;

            $ticket['statusid'] = $isAssigned
                ? $inProgressStatusId
                : $openStatusId;
            $ticket['update_date'] = $isAssigned ? now() : null;
            $ticket['closed_date'] = null;
        }

        unset($ticket);

        foreach ($tickets as $ticketData) {
            Ticket::updateOrCreate(
                ['title' => $ticketData['title']],
                $ticketData
            );
        }
    }
}
