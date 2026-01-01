<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sale;
use Illuminate\Support\Facades\Response;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Jobs\SendInvoiceEmail;

class InvoiceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(Sale::class, 'invoice');
    }
    public function index(Request $request)
    {
        $query = Sale::with(['customer','user']);

        // Tenant scoping: prefer authenticated user's tenant
        if ($request->user()) {
            $query->where('tenant_id', $request->user()->tenant_id);
        } elseif ($request->query('tenant_id')) {
            $query->where('tenant_id', $request->query('tenant_id'));
        }

        if ($q = $request->query('q')) {
            $query->where(function($w) use ($q) {
                $w->where('invoice_number', 'ilike', "%$q%")
                  ->orWhereHas('customer', function($c) use ($q) {
                      $c->where('name', 'ilike', "%$q%");
                  });
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($from = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $perPage = min(100, (int) $request->query('per_page', 25));
        $list = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($list);
    }

    public function show(Sale $invoice)
    {
        $invoice->load(['customer','user','items']);
        return response()->json($invoice);
    }

    public function pdf(Sale $invoice)
    {
        $invoice->load(['customer','user','items']);

        // Build a minimal HTML for the PDF (frontend owns UI) — simple server-side template
        $itemsHtml = '';
        foreach ($invoice->items ?? [] as $it) {
            $itemsHtml .= "<tr><td>{$it->description}</td><td style='text-align:right;'>{$it->quantity}</td><td style='text-align:right;'>{$it->price}</td><td style='text-align:right;'>{$it->total}</td></tr>";
        }

        $html = "<!doctype html><html><head><meta charset='utf-8'><style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}th,td{padding:6px;border:1px solid #ddd}</style></head><body>".
            "<h2>Factura: {$invoice->invoice_number}</h2>".
            "<p><strong>Cliente:</strong> ".htmlspecialchars($invoice->customer->name ?? '')."</p>".
            "<p><strong>Fecha:</strong> {$invoice->created_at}</p>".
            "<table><thead><tr><th>Descripción</th><th style='text-align:right;'>Cant</th><th style='text-align:right;'>Precio</th><th style='text-align:right;'>Total</th></tr></thead><tbody>".
            $itemsHtml.
            "</tbody></table>".
            "<p style='text-align:right;'><strong>Subtotal:</strong> {$invoice->subtotal}</p>".
            "<p style='text-align:right;'><strong>Total:</strong> {$invoice->total}</p>".
            "</body></html>";

        $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');
        $output = $pdf->output();

        return Response::make($output, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="invoice_'.$invoice->invoice_number.'.pdf"'
        ]);
    }

    public function email(Request $request, Sale $invoice)
    {
        $to = $request->input('to');
        SendInvoiceEmail::dispatch($invoice->id, $to);
        return response()->json(['status' => 'queued'], 202);
    }
}
