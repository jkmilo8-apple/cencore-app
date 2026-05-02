import { createClient } from "@/lib/supabase/server";
import { DollarSign, FileText, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  const supabase = await createClient();

  const [clientsRes, quotesRes, productsRes] = await Promise.all([
    supabase.from("clients").select("id, name, status", { count: "exact" }),
    supabase.from("quotes").select("*, clients(name)", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
    supabase.from("products").select("id, stock", { count: "exact" }),
  ]);

  const clients = clientsRes.data || [];
  const quotes = quotesRes.data || [];
  const products = productsRes.data || [];
  const totalRevenue = quotes.reduce((sum, q) => sum + Number(q.total_amount || 0), 0);
  const approvedQuotes = quotes.filter((q) => q.status === "approved");

  return {
    totalClients: clientsRes.count || 0,
    totalQuotes: quotesRes.count || 0,
    totalProducts: productsRes.count || 0,
    totalRevenue,
    approvedRevenue: approvedQuotes.reduce((s, q) => s + Number(q.total_amount || 0), 0),
    recentQuotes: quotes,
    topClients: clients.slice(0, 5),
  };
}

const statusLabels: Record<string, { label: string; style: string }> = {
  draft: { label: "Borrador", style: "bg-gray-100 text-gray-800" },
  review: { label: "En Revisión", style: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprobada", style: "bg-green-100 text-green-800" },
  rejected: { label: "Rechazada", style: "bg-red-100 text-red-800" },
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

  const kpis = [
    { label: "Cotizaciones Totales", value: data.totalQuotes, icon: FileText, color: "bg-blue-50 text-blue-600" },
    { label: "Clientes Activos", value: data.totalClients, icon: Users, color: "bg-green-50 text-green-600" },
    { label: "Ingresos Aprobados", value: formatCurrency(data.approvedRevenue), icon: DollarSign, color: "bg-orange-50 text-[#F97316]" },
    { label: "Productos en Catálogo", value: data.totalProducts, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
        <p className="mt-2 text-sm text-gray-700">Resumen operativo del sistema de cotizaciones Cencore.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{kpi.label}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{kpi.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow rounded-lg border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Cotizaciones Recientes</h2>
            <Link href="/admin/quotes" className="text-sm text-[#F97316] hover:text-[#EA580C]">Ver todas →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Cotización</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentQuotes.map((quote) => {
                  const st = statusLabels[quote.status as keyof typeof statusLabels] || statusLabels["draft"];
                  const clientObj = quote.clients as any;
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-[#F97316]">
                        <Link href={`/admin/quotes/${quote.id}`}>{quote.quote_number || quote.id.slice(0, 8)}</Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{clientObj?.name || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.style}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(Number(quote.total_amount))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Clientes</h2>
            <Link href="/admin/clients" className="text-sm text-[#F97316] hover:text-[#EA580C]">Ver todos →</Link>
          </div>
          <ul className="divide-y divide-gray-200">
            {data.topClients.map((client) => (
              <li key={client.id} className="px-6 py-4 flex items-center hover:bg-gray-50">
                <div className="h-8 w-8 bg-[#FFF7ED] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#F97316]">{client.name.charAt(0)}</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
