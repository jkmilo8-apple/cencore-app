"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Eye, ChevronDown, Trash2, Send, Loader2 } from "lucide-react";
import { getQuotes, updateQuoteStatusAction, deleteQuoteAction, sendQuoteToClientAction } from "@/actions/quotes";
import type { Quote } from "@/types/database";

const statusLabels: Record<string, { label: string; style: string }> = {
  draft:    { label: "Borrador",    style: "bg-gray-100 text-gray-700" },
  sent:     { label: "Enviada",     style: "bg-blue-100 text-blue-800" },
  review:   { label: "En Revisión", style: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprobada",    style: "bg-green-100 text-green-800" },
  rejected: { label: "Rechazada",   style: "bg-red-100 text-red-800" },
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    const { data } = await getQuotes({
      status: statusFilter !== "all" ? statusFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: search || undefined,
    });
    setQuotes(data || []);
    setLoading(false);
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateQuoteStatusAction(id, newStatus);
    fetchQuotes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta cotización borrador? Esta acción no se puede deshacer.")) return;
    setActionLoading(id + "_del");
    const { success, error } = await deleteQuoteAction(id);
    setActionLoading(null);
    if (success) {
      showToast("success", "Cotización eliminada.");
      fetchQuotes();
    } else {
      showToast("error", error || "Error al eliminar.");
    }
  };

  const handleSend = async (id: string) => {
    setActionLoading(id + "_send");
    const { success, error } = await sendQuoteToClientAction(id);
    setActionLoading(null);
    if (success) {
      showToast("success", "Cotización enviada al cliente vía n8n ✓");
      fetchQuotes();
    } else {
      showToast("error", error || "Error al enviar.");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-bold transition-all ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.text}
        </div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Historial de Cotizaciones</h1>
          <p className="mt-2 text-sm text-gray-700">Consulta, filtra y gestiona todas las cotizaciones generadas.</p>
        </div>
        <Link href="/admin/quotes/new" className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors">
          <Plus className="-ml-1 mr-2 h-5 w-5" /> Nueva Cotización
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número o nota..."
              className="block w-full pl-10 text-sm border border-gray-300 rounded-md py-2 focus:ring-[#F97316] focus:border-[#F97316] text-black"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full text-sm border border-gray-300 rounded-md py-2 px-3 focus:ring-[#F97316] focus:border-[#F97316] appearance-none text-black"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="review">En Revisión</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="block w-full text-sm border border-gray-300 rounded-md py-2 px-3 focus:ring-[#F97316] focus:border-[#F97316] text-black" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="block w-full text-sm border border-gray-300 rounded-md py-2 px-3 focus:ring-[#F97316] focus:border-[#F97316] text-black" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando cotizaciones...</div>
        ) : quotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron cotizaciones.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Identificador</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Total</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Emisión</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {quotes.map((quote) => {
                  const st = statusLabels[quote.status as keyof typeof statusLabels] || statusLabels["draft"];
                  const clientName = (quote.clients as any)?.name || "—";
                  const clientEmail = (quote.clients as any)?.email;
                  const isDraft = quote.status === "draft";
                  const canSend = isDraft && !!clientEmail;
                  return (
                    <tr key={quote.id} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-[#F97316] transition-colors">
                          #{quote.quote_number || quote.id.slice(0, 8).toUpperCase()}
                        </div>
                        {quote.urgent_delivery && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase mt-1">
                            Urgente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {clientName}
                        {clientEmail && <div className="text-xs text-gray-400">{clientEmail}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={quote.status}
                            onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                            className={`text-[11px] font-bold uppercase tracking-tight px-3 py-1 rounded-full border-0 ${st.style} cursor-pointer focus:ring-2 focus:ring-[#F97316] outline-none appearance-none pr-6`}
                          >
                            <option value="draft">Borrador</option>
                            <option value="sent">Enviada</option>
                            <option value="review">En Revisión</option>
                            <option value="approved">Aprobada</option>
                            <option value="rejected">Rechazada</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(quote.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(quote.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Enviar */}
                          {canSend && (
                            <button
                              onClick={() => handleSend(quote.id)}
                              disabled={actionLoading === quote.id + "_send"}
                              title="Enviar al cliente via n8n"
                              className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === quote.id + "_send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </button>
                          )}
                          {/* Ver detalle */}
                          <Link href={`/admin/quotes/${quote.id}`} className="p-2 rounded-lg text-gray-400 hover:text-[#F97316] hover:bg-orange-50 transition-colors">
                            <Eye className="h-4 w-4" />
                          </Link>
                          {/* Eliminar (solo borradores) */}
                          {isDraft && (
                            <button
                              onClick={() => handleDelete(quote.id)}
                              disabled={actionLoading === quote.id + "_del"}
                              title="Eliminar borrador"
                              className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === quote.id + "_del" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
