<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use SoftDeletes;

    protected $table = 'tickets';

    public $timestamps = false;

    protected $fillable = [
        'priorityid',
        'statusid',
        'categoryid',
        'createdby',
        'assignedto',
        'returnedto',
        'creation_date',
        'update_date',
        'closed_date',
        'title',
        'description'
    ];

    protected function casts(): array
    {
        return [
            'creation_date' => 'datetime',
            'update_date' => 'datetime',
            'closed_date' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'createdby');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assignedto');
    }

    public function returnedTo()
    {
        return $this->belongsTo(User::class, 'returnedto');
    }

    public function priority()
    {
        return $this->belongsTo(Priority::class, 'priorityid');
    }

    public function status()
    {
        return $this->belongsTo(Status::class, 'statusid');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'categoryid');
    }

    public function comments()
    {
        return $this->hasMany(TicketComment::class, 'ticketid')
            ->orderBy('date')
            ->orderBy('id');
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class, 'ticketid')
            ->orderByDesc('date');
    }
}
