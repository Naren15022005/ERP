<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;

class ExternalConnection extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'platform_type',
        'connection_name',
        'api_url',
        'credentials',
        'config',
        'is_active',
        'last_sync_at',
        'sync_direction',
        'sync_interval_minutes',
        'sync_entities',
    ];

    protected $casts = [
        'config' => 'array',
        'sync_entities' => 'array',
        'is_active' => 'boolean',
        'last_sync_at' => 'datetime',
        'sync_interval_minutes' => 'integer',
    ];

    protected $hidden = [
        'credentials', // Nunca exponer credenciales en JSON
    ];

    // Relaciones
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(SyncLog::class);
    }

    public function mappings(): HasMany
    {
        return $this->hasMany(ExternalEntityMapping::class);
    }

    // Accessors & Mutators para credenciales encriptadas
    public function setCredentialsAttribute($value): void
    {
        if (is_array($value)) {
            $value = json_encode($value);
        }
        $this->attributes['credentials'] = Crypt::encryptString($value);
    }

    public function getCredentialsAttribute($value): array
    {
        try {
            $decrypted = Crypt::decryptString($value);
            return json_decode($decrypted, true) ?? [];
        } catch (\Exception $e) {
            return [];
        }
    }

    // Helper methods
    public function needsSync(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if (!$this->last_sync_at) {
            return true;
        }

        $minutesSinceLastSync = now()->diffInMinutes($this->last_sync_at);
        return $minutesSinceLastSync >= $this->sync_interval_minutes;
    }

    public function markSynced(): void
    {
        $this->update(['last_sync_at' => now()]);
    }

    public function testConnection(): bool
    {
        try {
            $driver = $this->getDriver();
            return $driver->testConnection();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getDriver(): \App\Services\Integrations\Contracts\IntegrationDriverInterface
    {
        return app(\App\Services\Integrations\IntegrationDriverFactory::class)
            ->make($this);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeNeedingSync($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('last_sync_at')
                    ->orWhereRaw('last_sync_at < NOW() - INTERVAL sync_interval_minutes MINUTE');
            });
    }
}
