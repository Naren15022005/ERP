<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\TenantScoped;
use App\Traits\Auditable;

class Customer extends Model
{
    use HasFactory, SoftDeletes, TenantScoped, Auditable;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'phone',
        'tax_id',
        'address',
        'city',
        'state',
        'country',
        'zip_code',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
