<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncLog extends Model
{
    protected $fillable = [
        'external_connection_id',
        'tenant_id',
        'sync_type',
        'entity_type',
        'direction',
        'status',
        'records_processed',
        'records_success',
        'records_failed',
        'summary',
        'error_message',
        'error_details',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'summary' => 'array',
        'error_details' => 'array',
        'records_processed' => 'integer',
        'records_success' => 'integer',
        'records_failed' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function connection(): BelongsTo
    {
        return $this->belongsTo(ExternalConnection::class, 'external_connection_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // Helper methods
    public function markStarted(): void
    {
        $this->update([
            'status' => 'processing',
            'started_at' => now(),
        ]);
    }

    public function markSuccess(int $processed, int $success, int $failed, array $summary = []): void
    {
        $this->update([
            'status' => $failed > 0 ? 'partial' : 'success',
            'records_processed' => $processed,
            'records_success' => $success,
            'records_failed' => $failed,
            'summary' => $summary,
            'completed_at' => now(),
        ]);
    }

    public function markFailed(string $errorMessage, array $errorDetails = []): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
            'error_details' => $errorDetails,
            'completed_at' => now(),
        ]);
    }

    public function getDurationAttribute(): ?int
    {
        if (!$this->started_at || !$this->completed_at) {
            return null;
        }
        return $this->started_at->diffInSeconds($this->completed_at);
    }

    // Scopes
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeSuccess($query)
    {
        return $query->where('status', 'success');
    }

    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }
}
