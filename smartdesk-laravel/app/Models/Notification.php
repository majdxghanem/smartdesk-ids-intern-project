<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'userid',
        'ticketid',
        'type',
        'message',
        'action_url',
        'date',
        'read_at',
        'email_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'read_at' => 'datetime',
            'email_sent_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'userid');
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticketid')->withTrashed();
    }
}
