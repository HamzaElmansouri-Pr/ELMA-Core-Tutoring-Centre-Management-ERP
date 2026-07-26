import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardKPIs, getUnpaidAlerts, getProfitBreakdown } from "@/api/dashboard";
import { formatDH } from "@/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircleWarning } from "lucide-react";
import { useTranslation } from "react-i18next";

const RevenueChart = React.lazy(() => import("@/components/dashboard/RevenueChart"));

export function DashboardPage() {
  const { t } = useTranslation("common");
  
  const { data: kpis } = useQuery({ queryKey: ["kpis"], queryFn: getDashboardKPIs });
  const { data: alerts } = useQuery({ queryKey: ["unpaidAlerts"], queryFn: getUnpaidAlerts });
  const { data: breakdown } = useQuery({ queryKey: ["profitBreakdown"], queryFn: getProfitBreakdown });

  // Generate dynamic line colors for the chart
  const colors = ["#2563eb", "#16a34a", "#dc2626", "#ca8a04", "#9333ea", "#0891b2"];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('dashboard', 'Dashboard')}</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-medium">Revenue This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {kpis ? formatDH(kpis.revenue_this_month_centimes) : '...'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Cash-basis (Payments - Refunds)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {kpis ? kpis.active_students : '...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-medium">Sessions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {kpis ? kpis.sessions_today : '...'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit Breakdown Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by Subject (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <React.Suspense fallback={<div className="h-80 w-full flex items-center justify-center text-gray-400 animate-pulse bg-gray-50 dark:bg-gray-800 rounded-lg">Loading chart data...</div>}>
              <RevenueChart breakdown={breakdown} colors={colors} />
            </React.Suspense>
          </CardContent>
        </Card>

        {/* Unpaid Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <MessageCircleWarning className="w-5 h-5" />
              Unpaid Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts?.map((alert) => (
              <div key={alert.invoice_id} className="flex flex-col gap-2 p-3 border rounded bg-red-50/50 dark:bg-red-950/10">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{alert.student_name}</div>
                    <div className="text-xs text-gray-500">{alert.month}/{alert.year} Invoice</div>
                  </div>
                  <div className="font-bold text-red-600">
                    {formatDH(alert.amount_due_centimes)}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  {alert.parent_phone ? (
                    <a 
                      href={`https://wa.me/${alert.parent_phone.replace(/\D/g,'')}?text=Hello, this is a reminder regarding an unpaid invoice of ${formatDH(alert.amount_due_centimes)} for ${alert.student_name}.`}
                      target="_blank" rel="noreferrer"
                      className="text-xs flex items-center gap-1 text-green-600 hover:underline"
                    >
                      WhatsApp Reminder
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">No phone</span>
                  )}
                  
                  <Link to={`/invoices/${alert.invoice_id}`} className="text-xs text-blue-600 hover:underline flex items-center">
                    View <ArrowRight className="w-3 h-3 ms-1" />
                  </Link>
                </div>
              </div>
            ))}
            {alerts?.length === 0 && (
              <div className="text-center text-gray-500 py-4">No unpaid invoices.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
