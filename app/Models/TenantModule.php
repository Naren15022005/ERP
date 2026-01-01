<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantModule extends Model
{
    use HasFactory;

    protected $table = 'tenant_modules';

    protected $fillable = [
        'tenant_id',
        'module_key',
        'enabled',
        'config',
        'display_order',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'config' => 'array',
    ];

    public $timestamps = true;

    // Optionally add relationship to Tenant if Tenant model exists
    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
