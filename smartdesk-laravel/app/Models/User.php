<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'users';

    public $timestamps = false;

    protected $fillable = [
        'email',
        'firstname',
        'username',
        'password',
        'roleid',
        'creationdate',
        'isbanned',
        'banreason'
    ];

    protected $hidden = [
        'password'
    ];

    protected function casts(): array
    {
        return [
            'isbanned' => 'boolean',
            'creationdate' => 'datetime',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'roleid');
    }

    public function ticketComments()
    {
        return $this->hasMany(TicketComment::class, 'userid');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'userid');
    }
}
