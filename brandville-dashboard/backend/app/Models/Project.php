<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'name', 'client_name', 'description',
        'start_date', 'due_date', 'status',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
        ];
    }
}
