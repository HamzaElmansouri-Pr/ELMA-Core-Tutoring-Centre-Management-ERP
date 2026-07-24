import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getInvoices } from "@/api/finance";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDH } from "@/utils/currency";
import { ArrowLeft, FileText } from "lucide-react";

export function InvoicesListPage() {
  const { t } = useTranslation("common");
  const { data, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
  });

  const invoices = data?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/finance"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold">{t("sidebar_invoices", "Invoices")}</h1>
      </div>

      <div className="bg-white p-6 border rounded-md shadow-sm dark:bg-slate-900">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>#{inv.id}</TableCell>
                  <TableCell>{inv.student?.first_name} {inv.student?.last_name}</TableCell>
                  <TableCell>{inv.month}/{inv.year}</TableCell>
                  <TableCell>{formatDH(inv.total_amount_centimes)}</TableCell>
                  <TableCell>{formatDH(inv.paid_amount_centimes)}</TableCell>
                  <TableCell className="font-semibold text-red-600">
                    {formatDH(inv.balance_due_centimes)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                      inv.status === 'partial' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/invoices/${inv.id}`}>
                         <FileText className="w-4 h-4 me-2" /> {t("view")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">{t("no_data_found")}</p>
                      <p className="text-sm mt-1">{t("no_invoices_yet")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
