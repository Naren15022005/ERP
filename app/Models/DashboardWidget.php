<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DashboardWidget extends Model
{
    protected $fillable = [
        'key',
        'name',
        'module',
        'description',
        'component',
        'min_plan',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    // Relación con tenants
    public function tenantWidgets(): HasMany
    {
        return $this->hasMany(TenantDashboardWidget::class, 'widget_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeForPlan($query, string $plan)
    {
        $planHierarchy = ['free' => 1, 'basic' => 2, 'pro' => 3];
        $userPlanLevel = $planHierarchy[$plan] ?? 1;

        return $query->whereIn('min_plan', array_keys(array_filter(
            $planHierarchy,
            fn($level) => $level <= $userPlanLevel
        )));
    }
}
