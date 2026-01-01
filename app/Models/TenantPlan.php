<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'plan_id',
        'limits_override',
        'started_at',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'limits_override' => 'array',
        'is_active' => 'boolean',
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Get effective limit (override or from plan).
     */
    public function getEffectiveLimit(string $key, $default = null)
    {
        return $this->limits_override[$key] 
            ?? $this->plan->getLimit($key, $default);
    }
}
