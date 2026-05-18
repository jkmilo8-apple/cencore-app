"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, Mail, MapPin, Phone, FileText,
  Printer, Send, Trash2, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:    { label: "Borrador",    color: "bg-gray-100 text-gray-700 border-gray-200",    icon: <FileText className="h-4 w-4" /> },
  sent:     { label: "Enviada",     color: "bg-blue-100 text-blue-800 border-blue-200",    icon: <Send className="h-4 w-4" /> },
  review:   { label: "En Revisión", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="h-4 w-4" /> },
  approved: { label: "Aprobada",    color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle2 className="h-4 w-4" /> },
  rejected: { label: "Rechazada",   color: "bg-red-100 text-red-700 border-red-200",       icon: <XCircle className="h-4 w-4" /> },
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdatingStatus(newStatus);
    const { updateQuoteStatusAction } = await import("@/actions/quotes");
    const { data, error } = await updateQuoteStatusAction(id, newStatus);
    setUpdatingStatus(null);
    if (error) {
      showToast("error", error || "Error al actualizar el estado.");
    } else {
      showToast("success", `Estado de cotización actualizado a "${statusConfig[newStatus]?.label}" ✓`);
      setQuote((prev: any) => ({ ...prev, status: newStatus }));
    }
  };

  useEffect(() => {
    async function load() {
      const { getQuote } = await import("@/actions/quotes");
      const { data, items: qItems } = await getQuote(id);
      if (!data) { router.push("/admin/quotes"); return; }
      setQuote(data);
      setItems(qItems || []);
      setLoading(false);
    }
    load();
  }, [id, router]);

  const handlePrint = () => window.print();

  const handleSend = async () => {
    setSending(true);
    const { sendQuoteToClientAction } = await import("@/actions/quotes");
    const { success, error } = await sendQuoteToClientAction(id);
    setSending(false);
    if (success) {
      showToast("success", "Cotización enviada al cliente ✓");
      setQuote((prev: any) => ({ ...prev, status: "sent" }));
    } else {
      showToast("error", error || "Error al enviar.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta cotización borrador? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const { deleteQuoteAction } = await import("@/actions/quotes");
    const { success, error } = await deleteQuoteAction(id);
    setDeleting(false);
    if (success) {
      router.push("/admin/quotes");
    } else {
      showToast("error", error || "Error al eliminar.");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
      </div>
    );
  }

  const client = quote?.clients as any;
  const subtotal = Number(quote?.total_amount || 0);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;
  const st = statusConfig[quote?.status] || statusConfig["draft"];
  const isDraft = quote?.status === "draft";
  const canSend = quote?.status === "approved" && !!client?.email;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-bold ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.text}
        </div>
      )}

      {/* Header — hidden on print */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center space-x-4">
          <Link href="/admin/quotes" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {quote?.quote_number || quote?.id?.slice(0, 8)}
            </h1>
            <p className="text-sm text-gray-500">
              Generada el {new Date(quote?.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
              {quote?.valid_until && ` • Válida hasta ${new Date(quote.valid_until).toLocaleDateString("es-CO")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Status badge */}
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${st.color}`}>
            {st.icon}<span>{st.label}</span>
          </span>

          {/* Status Transitions state machine toolbar */}
          <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
            {/* Draft transitions */}
            {quote?.status === "draft" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("review")}
                  disabled={updatingStatus !== null}
                  title="Poner en Revisión"
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded text-white bg-yellow-500 hover:bg-yellow-600 transition-colors disabled:opacity-60"
                >
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>Revisar</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={updatingStatus !== null}
                  title="Rechazar Cotización"
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Rechazar</span>
                </button>
              </>
            )}

            {/* Review transitions */}
            {quote?.status === "review" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={updatingStatus !== null}
                  title="Aprobar Cotización"
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  <span>Aprobar</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={updatingStatus !== null}
                  title="Rechazar Cotización"
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Rechazar</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus("draft")}
                  disabled={updatingStatus !== null}
                  title="Volver a Borrador"
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition-colors disabled:opacity-60"
                >
                  <FileText className="h-3.5 w-3.5 mr-1 text-gray-400" />
                  <span>Borrador</span>
                </button>
              </>
            )}

            {/* Approved transitions */}
            {quote?.status === "approved" && (
              <button
                onClick={() => handleUpdateStatus("review")}
                disabled={updatingStatus !== null}
                title="Volver a Revisión"
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded text-white bg-yellow-500 hover:bg-yellow-600 transition-colors disabled:opacity-60"
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>Revisar</span>
              </button>
            )}

            {/* Rejected transitions */}
            {quote?.status === "rejected" && (
              <button
                onClick={() => handleUpdateStatus("draft")}
                disabled={updatingStatus !== null}
                title="Volver a Borrador para corregir"
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition-colors disabled:opacity-60"
              >
                <FileText className="h-3.5 w-3.5 mr-1 text-gray-400" />
                <span>Borrador</span>
              </button>
            )}

            {/* Sent status */}
            {quote?.status === "sent" && (
              <span className="text-xs text-gray-500 font-bold px-2 py-1 flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />
                Cotización Finalizada
              </span>
            )}
          </div>

          <Link
            href={`/admin/quotes/new?edit=${id}`}
            className="inline-flex items-center px-4 py-2 border border-[#F97316] shadow-sm text-sm font-medium rounded-md text-[#F97316] bg-white hover:bg-[#FFF8F6] transition-colors"
          >
            <FileText className="mr-2 h-4 w-4 text-[#F97316]" /> Corregir / Editar
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Printer className="mr-2 h-4 w-4 text-gray-400" /> Imprimir / PDF
          </button>

          {canSend && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors disabled:opacity-60"
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar al Cliente
            </button>
          )}

          {isDraft && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* ── PRINTABLE DOCUMENT ── */}
      <div id="quote-print-area">
        {/* Company Header (print only branding) */}
        <div className="print-only hidden mb-8 flex items-center justify-between border-b-2 border-[#F97316] pb-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">CENCORE SAS</h1>
            <p className="text-sm text-gray-500">Empaques Industriales · NIT: 000.000.000-0</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#F97316]">{quote?.quote_number}</p>
            <p className="text-sm text-gray-500">Cotización Comercial</p>
          </div>
        </div>

        {/* Urgent banner */}
        {quote?.urgent_delivery && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center space-x-2 text-red-700 text-sm font-bold">
            <AlertTriangle className="h-4 w-4" />
            <span>Entrega URGENTE solicitada</span>
          </div>
        )}

        {/* Client Info + Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white shadow rounded-lg border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Información del Cliente</h2>
            {client ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Empresa</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />{client.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Contacto</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.contact_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Correo</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />{client.email || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Teléfono</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />{client.phone || "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase">Dirección</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />{client.address || "—"}, {client.city || ""}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">Información del cliente no disponible.</p>
            )}
          </div>

          <div className="bg-white shadow rounded-lg border border-[#F97316] border-t-4 p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">Resumen Financiero</h2>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">IVA (19%)</dt>
                <dd className="text-sm font-medium text-gray-900">{formatCurrency(tax)}</dd>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <dt className="text-base font-bold text-gray-900">Total (COP)</dt>
                <dd className="text-2xl font-bold text-[#F97316]">{formatCurrency(total)}</dd>
              </div>
            </dl>
            {quote?.valid_until && (
              <p className="mt-4 text-xs text-gray-400 border-t pt-3">
                Válida hasta: <span className="font-bold text-gray-600">{new Date(quote.valid_until).toLocaleDateString("es-CO")}</span>
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Desglose de Ítems</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item: any, idx: number) => {
                    const product = item.products as any;
                    const description = product?.name || item.description || "Ítem personalizado";
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{description}</p>
                          {item.configuration && (() => {
                            const conf = item.configuration;
                            const dims = conf.dimensions || {};
                            const line = conf.product_line;
                            if (line === "Corrugado") {
                              return (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Caja: {dims.length_mm || 0}×{dims.width_mm || 0}×{dims.height_mm || 0} mm
                                </p>
                              );
                            }
                            if (line === "Esquineros") {
                              return (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Esquinero: {dims.length_mm || 0}×{dims.wing_1_mm || 0}×{dims.thickness_mm || 0} mm
                                </p>
                              );
                            }
                            if (line === "Tubos" || line === "Envases") {
                              return (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {line}: Ø{dims.diameter_mm || 0}×{dims.length_mm || 0} mm (Pared {dims.thickness_mm || 0} mm)
                                </p>
                              );
                            }
                            // Fallback to legacy
                            if (dims.diameter !== undefined || dims.length !== undefined) {
                              return (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Ø{dims.diameter}×{dims.length}cm
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">{Number(item.quantity).toLocaleString("es-CO")} u.</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(Number(item.unit_price))}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{formatCurrency(Number(item.total_price))}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-700">Subtotal</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-[#F97316]">TOTAL con IVA</td>
                    <td className="px-6 py-3 text-right text-base font-black text-[#F97316]">{formatCurrency(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        {quote?.notes && (
          <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2 border-b pb-2">Notas y Condiciones</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-gray-400 text-center pb-6">
          <FileText className="h-4 w-4 inline mr-1" />
          Cencore SAS — Documento generado electrónicamente. Cotización #{quote?.quote_number}
        </div>
      </div>
    </div>
  );
}
