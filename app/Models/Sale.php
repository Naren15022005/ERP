<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\TenantScoped;
use App\Traits\Auditable;
use App\Enums\SaleStatus;

class Sale extends Model
{
    use HasFactory, SoftDeletes, TenantScoped, Auditable;

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'user_id',
        'invoice_number',
        'subtotal',
        'tax',
        'discount',
        'total',
        'status',
        'notes',
        'sale_date',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'sale_date' => 'datetime',
        'status' => SaleStatus::class,
    ];

    /**
     * Check if sale can be edited (draft or confirmed only).
     */
    public function isEditable(): bool
    {
        return $this->status->isEditable();
    }

    /**
     * Check if sale can transition to new status.
     */
    public function canTransitionTo(SaleStatus $newStatus): bool
    {
        return $this->status->canTransitionTo($newStatus);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
