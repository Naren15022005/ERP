<?php

namespace App\Events;

use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;

class ProductStockLow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $product;

    public function __construct($product)
    {
        $this->product = $product;
    }
}
