<?php

namespace App\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public function __construct($message = "Insufficient stock for one or more items", $code = 422)
    {
        parent::__construct($message, $code);
    }
}
