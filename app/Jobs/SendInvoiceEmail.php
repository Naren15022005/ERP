<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Mail;
use App\Mail\InvoiceMail;

class SendInvoiceEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $invoiceId;
    protected $to;

    public function __construct($invoiceId, $to = null)
    {
        $this->invoiceId = $invoiceId;
        $this->to = $to;
    }

    public function handle()
    {
        $sale = Sale::with(['customer','items'])->find($this->invoiceId);
        if (! $sale) return;

        // Build simple HTML like controller
        $itemsHtml = '';
        foreach ($sale->items ?? [] as $it) {
            $itemsHtml .= "<tr><td>{$it->description}</td><td style='text-align:right;'>{$it->quantity}</td><td style='text-align:right;'>{$it->price}</td><td style='text-align:right;'>{$it->total}</td></tr>";
        }
        $html = "<!doctype html><html><head><meta charset='utf-8'><style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}th,td{padding:6px;border:1px solid #ddd}</style></head><body>".
            "<h2>Factura: {$sale->invoice_number}</h2>".
            "<p><strong>Cliente:</strong> ".htmlspecialchars($sale->customer->name ?? '')."</p>".
            "<p><strong>Fecha:</strong> {$sale->created_at}</p>".
            "<table><thead><tr><th>Descripción</th><th style='text-align:right;'>Cant</th><th style='text-align:right;'>Precio</th><th style='text-align:right;'>Total</th></tr></thead><tbody>".
            $itemsHtml.
            "</tbody></table>".
            "<p style='text-align:right;'><strong>Subtotal:</strong> {$sale->subtotal}</p>".
            "<p style='text-align:right;'><strong>Total:</strong> {$sale->total}</p>".
            "</body></html>";

        $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait')->output();

        $to = $this->to ?: ($sale->customer->email ?? null);
        if (! $to) return;

        Mail::to($to)->send(new InvoiceMail($sale, $pdf));
    }

    public function getInvoiceId()
    {
        return $this->invoiceId;
    }
}
