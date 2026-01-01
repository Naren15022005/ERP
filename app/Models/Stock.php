<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\TenantScoped;

class Stock extends Model
{
    use HasFactory, TenantScoped;

    protected $table = 'stock';

    protected $fillable = [
        'tenant_id', 'product_id', 'warehouse_id', 'quantity', 'reserved', 'meta'
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'reserved' => 'decimal:4',
        'meta' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}

