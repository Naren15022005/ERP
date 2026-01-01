<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyCloseSale extends Model
{
    use HasFactory;

    protected $table = 'daily_close_sales';

    protected $fillable = ['daily_close_id', 'sale_id'];
}
