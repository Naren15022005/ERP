<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = ['tenant_id','supplier_id','order_number','status','total','user_id'];
}
