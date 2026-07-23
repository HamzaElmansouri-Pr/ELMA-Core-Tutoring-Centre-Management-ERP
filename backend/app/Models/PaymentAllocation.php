<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentAllocation extends Model
{
    protected $fillable = ['payment_id', 'invoice_item_id', 'amount_centimes'];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function invoiceItem()
    {
        return $this->belongsTo(InvoiceItem::class);
    }
}
