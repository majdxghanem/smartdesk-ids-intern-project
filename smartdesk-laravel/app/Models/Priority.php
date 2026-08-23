<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Priority extends Model
{
    public $timestamps = false;
    protected $fillable = ['priority'];

    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'priorityid');
    }
}
