import { forwardRef } from 'react';
import type { Invoice } from '@/api/finance';
import type { GlobalSettings } from '@/api/settings';
import { formatDH } from '@/utils/currency';

interface ReceiptTemplateProps {
  invoice: Invoice;
  settings?: GlobalSettings;
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(({ invoice, settings }, ref) => {
  const isRtl = settings?.default_locale === 'ar';

  return (
    <div ref={ref} className="p-8 bg-white text-black max-w-3xl mx-auto font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-start mb-8 border-b pb-4">
        <div className="flex items-center gap-4">
          {settings?.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="h-16 object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{settings?.center_name || 'Tutoring Center'}</h1>
            {settings?.address && <p className="text-sm text-gray-600">{settings.address}</p>}
            {settings?.phone && <p className="text-sm text-gray-600">{settings.phone}</p>}
          </div>
        </div>
        <div className={`text-${isRtl ? 'left' : 'right'}`}>
          <h2 className="text-3xl font-light text-gray-400 uppercase tracking-widest">RECEIPT</h2>
          <p className="text-sm mt-2 font-semibold">Invoice #{invoice.id}</p>
          <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</h3>
        <p className="text-lg font-medium">{invoice.student.name}</p>
        <p className="text-sm text-gray-600">Period: {invoice.month}/{invoice.year}</p>
      </div>

      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-2 text-sm font-semibold text-gray-600">Description</th>
            <th className="py-2 text-sm font-semibold text-gray-600 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-3 text-sm">
                <span className="font-medium">{item.school_class.subject.name}</span>
                <span className="text-gray-500 ms-2">({item.school_class.name})</span>
              </td>
              <td className="py-3 text-sm text-right font-medium">
                {formatDH(item.amount_centimes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold">{formatDH(invoice.total_amount_centimes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-semibold text-green-600">{formatDH(invoice.paid_amount_centimes)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Balance Due</span>
            <span className={invoice.balance_due_centimes > 0 ? 'text-red-600' : 'text-gray-900'}>
              {formatDH(invoice.balance_due_centimes)}
            </span>
          </div>
        </div>
      </div>

      {invoice.status === 'paid' && (
        <div className="mt-16 text-center">
          <div className="inline-block border-4 border-green-500 text-green-500 text-2xl font-bold uppercase py-2 px-6 transform -rotate-12 rounded">
            PAID IN FULL
          </div>
        </div>
      )}

      <div className="mt-16 text-center text-xs text-gray-400">
        Thank you for your business.
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
