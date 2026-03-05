<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory;

    protected $table = 'organizations';

    protected $fillable = [
        'name',
        'email',
        'password',
        'category_id',
        'location',
        'description',
        'verified_status',
    ];

    protected $hidden = ['password'];
    public const UPDATED_AT = null;
}
