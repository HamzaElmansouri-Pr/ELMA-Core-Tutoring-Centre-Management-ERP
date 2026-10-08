import { useQuery } from "@tanstack/react-query";
import { getDashboardKPIs, getUnpaidAlerts } from "@/api/dashboard";
import { formatDH } from "@/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircleWarning, Wallet, GraduationCap, Users, Library } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DashboardPage() {
  const { t } = useTranslation("common");
  
  const { data: kpis } = useQuery({ queryKey: ["kpis"], queryFn: getDashboardKPIs });
  const { data: alerts } = useQuery({ queryKey: ["unpaidAlerts"], queryFn: getUnpaidAlerts });

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('dashboard', 'Dashboard overview')}</h1>
      </div>

      {/* Premium KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-gradient-to-br from-emerald-500 to-green-600">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-transform">
            <Wallet className="w-24 h-24 text-white" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-emerald-100">Revenue This Month</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-extrabold text-white tracking-tight">
              {kpis ? formatDH(kpis.revenue_this_month_centimes) : '...'}
            </div>
            <p className="text-xs text-emerald-100/80 mt-2 font-medium bg-black/10 inline-block px-2 py-1 rounded-full backdrop-blur-sm">Cash-basis (Payments - Refunds)</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-gradient-to-br from-blue-500 to-indigo-600">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-transform">
            <GraduationCap className="w-24 h-24 text-white" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-100">Active Students</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-extrabold text-white tracking-tight">
              {kpis ? kpis.active_students : '...'}
            </div>
            <p className="text-xs text-blue-100/80 mt-2 font-medium bg-black/10 inline-block px-2 py-1 rounded-full backdrop-blur-sm">Total Enrolled</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-gradient-to-br from-amber-500 to-orange-600">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-transform">
            <Users className="w-24 h-24 text-white" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-amber-100">Professors</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-extrabold text-white tracking-tight">
              {kpis ? kpis.total_teachers : '...'}
            </div>
            <p className="text-xs text-amber-100/80 mt-2 font-medium bg-black/10 inline-block px-2 py-1 rounded-full backdrop-blur-sm">Active Teachers</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-gradient-to-br from-purple-500 to-pink-600">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-transform">
            <Library className="w-24 h-24 text-white" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-purple-100">Classes</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-extrabold text-white tracking-tight">
              {kpis ? kpis.total_classes : '...'}
            </div>
            <p className="text-xs text-purple-100/80 mt-2 font-medium bg-black/10 inline-block px-2 py-1 rounded-full backdrop-blur-sm">Active School Classes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6">

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
