<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'config',
        'is_active',
    ];

    protected $casts = [
        'config' => 'array',
        'is_active' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function settings()
    {
        return $this->hasMany(Setting::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    /**
     * Get the tenant's subscription plan level
     * 
     * @return string 'free', 'basic', or 'pro'
     */
    public function getPlanLevel(): string
    {
        // Check if tenant has an active plan in tenant_plans table
        $activePlan = $this->hasOne(TenantPlan::class)->where('is_active', true)->first();
        
        if ($activePlan && $activePlan->plan) {
            return $activePlan->plan->slug ?? 'free';
        }

        // Default to free plan
        return 'free';
    }
}
