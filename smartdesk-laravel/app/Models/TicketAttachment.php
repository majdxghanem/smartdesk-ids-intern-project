<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketAttachment extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'ticketid',
        'userid',
        'filename',
        'filepath',
        'filesize',
        'date',
    ];

    protected function casts(): array
    {
        return ['date' => 'datetime'];
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticketid')->withTrashed();
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'userid');
    }
}
