<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    // Extend Spatie Role if you need custom behaviour later
    /**
     * Mass assignable attributes.
     * Kept for compatibility with the previous file content.
     *
     * @var array<int,string>
     */
    protected $fillable = ['name', 'guard_name'];
}
