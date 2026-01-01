<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Sale;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public $sale;
    protected $pdf;

    public function __construct(Sale $sale, $pdfBytes)
    {
        $this->sale = $sale;
        $this->pdf = $pdfBytes;
    }

    public function build()
    {
        $subject = 'Factura '.$this->sale->invoice_number;
        $body = "<p>Adjunto la factura <strong>".$this->sale->invoice_number."</strong>.</p>";
        $m = $this->subject($subject)
            ->html($body);

        if ($this->pdf) {
            $m->attachData($this->pdf, 'invoice_'.$this->sale->invoice_number.'.pdf', [
                'mime' => 'application/pdf'
            ]);
        }

        return $m;
    }
}
