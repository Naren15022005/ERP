<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\Stock;
use App\Events\SaleCreated;
use App\Exceptions\InsufficientStockException;

class SaleService
{
    // Create sale from request data (array) and user
    public function createFromRequest(array $data, $user)
    {
        $idempotencyKey = $data['idempotency_key'] ?? null;

        if ($idempotencyKey) {
            $cacheKey = 'idemp:sale:' . $idempotencyKey;
            if ($existing = Cache::get($cacheKey)) {
                return Sale::find($existing);
            }
        }

        return DB::transaction(function () use ($data, $user, $idempotencyKey) {
            // Validate stock
            foreach ($data['items'] as $item) {
                $productId = $item['product_id'];
                $required = (int) $item['quantity'];
                $available = (int) Stock::where('product_id', $productId)->sum('quantity');
                if ($available < $required) {
                    throw new InsufficientStockException("Product {$productId} has insufficient stock");
                }
            }

            // Calculate subtotal and tax if not provided
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $price = $item['price'] ?? 0;
                $qty = $item['quantity'] ?? 0;
                $discount = $item['discount'] ?? 0;
                $subtotal += ($price * $qty) - $discount;
            }

            $taxRate = $data['tax_rate'] ?? config('app.default_tax', 0);
            $tax = round($subtotal * $taxRate, 2);
            $total = round($subtotal + $tax - ($data['discount_total'] ?? 0), 2);

            $invoiceNumber = $this->generateInvoiceNumber();

            $sale = Sale::create([
                'tenant_id' => $user->tenant_id ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => $user->id,
                'invoice_number' => $invoiceNumber,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $data['discount_total'] ?? 0,
                'total' => $total,
                'status' => 'completed',
            ]);

            // Create items
            foreach ($data['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $item['discount'] ?? 0,
                    'subtotal' => ($item['price'] * $item['quantity']) - ($item['discount'] ?? 0),
                ]);

                // Adjust stock: reduce from the first warehouse rows until covered
                $remaining = (int) $item['quantity'];
                $stocks = Stock::where('product_id', $item['product_id'])->orderBy('id')->lockForUpdate()->get();
                foreach ($stocks as $stock) {
                    if ($remaining <= 0) break;
                    $take = min($remaining, (int) $stock->quantity);
                    if ($take > 0) {
                        $stock->quantity = $stock->quantity - $take;
                        $stock->save();
                        $remaining -= $take;
                    }
                }
            }

            // Register payment
            if (isset($data['payment_method'])) {
                Payment::create([
                    'sale_id' => $sale->id,
                    'method' => $data['payment_method'],
                    'amount' => $total,
                    'reference' => $data['payment_reference'] ?? null,
                ]);
            }

            // Store idempotency mapping
            if ($idempotencyKey) {
                $cacheKey = 'idemp:sale:' . $idempotencyKey;
                Cache::put($cacheKey, $sale->id, 300); // 5 minutes
            }

            // Dispatch event for further processing (pdf, email, stock listeners)
            event(new SaleCreated($sale));

            return $sale;
        });
    }

    protected function generateInvoiceNumber()
    {
        return date('YmdHis') . '-' . Str::upper(Str::random(6));
    }
}

