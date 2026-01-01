<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ExternalEntityMapping extends Model
{
    protected $fillable = [
        'external_connection_id',
        'tenant_id',
        'entity_type',
        'external_id',
        'local_entity_type',
        'local_entity_id',
        'external_data',
        'last_synced_at',
        'content_hash',
    ];

    protected $casts = [
        'external_data' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function connection(): BelongsTo
    {
        return $this->belongsTo(ExternalConnection::class, 'external_connection_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function localEntity(): MorphTo
    {
        return $this->morphTo();
    }

    // Helper methods
    public function hasChanged(array $newData): bool
    {
        $newHash = $this->generateHash($newData);
        return $this->content_hash !== $newHash;
    }

    public function updateHash(array $data): void
    {
        $this->update([
            'content_hash' => $this->generateHash($data),
            'last_synced_at' => now(),
        ]);
    }

    protected function generateHash(array $data): string
    {
        return hash('sha256', json_encode($data));
    }

    // Scopes
    public function scopeForEntity($query, string $type, string $externalId)
    {
        return $query->where('entity_type', $type)
            ->where('external_id', $externalId);
    }

    public function scopeStale($query, int $hours = 24)
    {
        return $query->where('last_synced_at', '<', now()->subHours($hours));
    }
}
