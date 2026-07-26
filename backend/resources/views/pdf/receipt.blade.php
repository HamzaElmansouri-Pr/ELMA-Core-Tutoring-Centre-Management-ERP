<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Receipt</title>
    <style>
        body {
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            color: #333;
            line-height: 1.5;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #ddd;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #2c3e50;
        }
        .header p {
            margin: 5px 0;
            color: #7f8c8d;
        }
        .details {
            margin-bottom: 30px;
        }
        .details table {
            width: 100%;
        }
        .details td {
            vertical-align: top;
        }
        .details .label {
            font-weight: bold;
            color: #555;
            width: 150px;
        }
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .invoice-table th, .invoice-table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }
        .invoice-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
        }
        .totals {
            width: 50%;
            float: right;
            margin-top: 20px;
        }
        .totals table {
            width: 100%;
        }
        .totals td {
            padding: 5px 10px;
            text-align: right;
        }
        .totals .label {
            font-weight: bold;
            text-align: left;
        }
        .totals .grand-total {
            font-size: 1.2em;
            font-weight: bold;
            color: #27ae60;
            border-top: 2px solid #27ae60;
            padding-top: 10px;
        }
        .footer {
            clear: both;
            margin-top: 50px;
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 0.8em;
            font-weight: bold;
            background-color: #27ae60;
            color: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ELMA Tutoring Centre</h1>
        <p>Payment Receipt #{{ str_pad($payment->id, 6, '0', STR_PAD_LEFT) }}</p>
        <p>Date: {{ $payment->created_at->format('Y-m-d H:i') }}</p>
    </div>

    <div class="details">
        <table>
            <tr>
                <td class="label">Student Name:</td>
                <td>{{ $payment->invoice->student->name }}</td>
            </tr>
            <tr>
                <td class="label">Student Phone:</td>
                <td>{{ $payment->invoice->student->phone ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Invoice Period:</td>
                <td>
                    {{ Carbon\Carbon::createFromDate($payment->invoice->year, $payment->invoice->month, 1)->format('F Y') }}
                </td>
            </tr>
            <tr>
                <td class="label">Payment Method:</td>
                <td>{{ ucfirst($payment->payment_method) }}</td>
            </tr>
        </table>
    </div>

    <table class="invoice-table">
        <thead>
            <tr>
                <th>Class</th>
                <th>Subject</th>
                <th>Price</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payment->invoice->items as $item)
            <tr>
                <td>{{ $item->schoolClass->name }}</td>
                <td>{{ $item->schoolClass->subject->name }}</td>
                <td>{{ number_format($item->amount_centimes / 100, 2) }} DA</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td class="label">Subtotal:</td>
                <td>{{ number_format($payment->invoice->total_amount_centimes / 100, 2) }} DA</td>
            </tr>
            @if($payment->invoice->discount_centimes > 0)
            <tr>
                <td class="label">Discount:</td>
                <td style="color: #e74c3c;">-{{ number_format($payment->invoice->discount_centimes / 100, 2) }} DA</td>
            </tr>
            @endif
            <tr>
                <td class="label">Total Due:</td>
                <td>{{ number_format(($payment->invoice->total_amount_centimes - $payment->invoice->discount_centimes) / 100, 2) }} DA</td>
            </tr>
            <tr>
                <td class="label">Amount Paid Now:</td>
                <td class="grand-total">{{ number_format($payment->amount_centimes / 100, 2) }} DA</td>
            </tr>
            <tr>
                <td class="label">Total Paid So Far:</td>
                <td>{{ number_format($payment->invoice->paid_amount_centimes / 100, 2) }} DA</td>
            </tr>
            <tr>
                <td class="label">Remaining Balance:</td>
                <td>
                    @php
                        $balance = $payment->invoice->total_amount_centimes - $payment->invoice->discount_centimes - $payment->invoice->paid_amount_centimes;
                    @endphp
                    @if($balance <= 0)
                        <span class="badge">Fully Paid</span>
                    @else
                        <strong style="color: #e74c3c;">{{ number_format($balance / 100, 2) }} DA</strong>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>Thank you for choosing ELMA Tutoring Centre.</p>
        <p>If you have any questions about this receipt, please contact the administration.</p>
    </div>
</body>
</html>
