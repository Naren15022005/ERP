<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\TenantScoped;

class StockMovement extends Model
{
    use HasFactory, TenantScoped;

    protected $table = 'stock_movements';

    protected $fillable = [
        'tenant_id', 'product_id', 'warehouse_id', 'movement_type', 'quantity', 'before_qty', 'after_qty', 'reference_type', 'reference_id', 'description', 'created_by'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the reference model (Sale, Purchase, Return, etc.)
     */
    public function reference()
    {
        return $this->morphTo();
    }
}
