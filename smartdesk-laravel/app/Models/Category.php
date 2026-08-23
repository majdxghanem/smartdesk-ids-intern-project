<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    public $timestamps = false;
    protected $fillable = ['category'];

    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'categoryid');
    }
}
