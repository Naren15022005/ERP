<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\TenantScoped;

class DailyClose extends Model
{
    use HasFactory, SoftDeletes, TenantScoped;

    protected $fillable = [
        'tenant_id', 'date', 'total_sales', 'cash_total', 'card_total', 'transactions_count', 'created_by'
    ];

    protected $casts = [
        'date' => 'date',
        'total_sales' => 'decimal:2',
        'cash_total' => 'decimal:2',
        'card_total' => 'decimal:2',
    ];

    public function sales()
    {
        return $this->belongsToMany(Sale::class, 'daily_close_sales', 'daily_close_id', 'sale_id');
    }
}
