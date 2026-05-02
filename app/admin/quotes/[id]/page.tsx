import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Building2, Mail, MapPin, FileText, Printer, Send } from "lucide-react";
import { notFound } from "next/navigation";
import type { Client } from "@/types/database";

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*, clients(*)")
    .eq("id", id)
    .single();

  if (quoteError || !quote) {
    notFound();
  }

  const { data: items } = await supabase
    .from("quote_items")
    .select("*, products(*)")
    .eq("quote_id", id);

  const client = (quote.clients as unknown) as Client | null;
  const quoteItems = items || [];
  const subtotal = Number(quote.total_amount);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/quotes" className="mr-4 text-gray-400 hover:text-gray-500">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{quote.quote_number || quote.id.slice(0, 8)}</h1>
            <p className="text-sm text-gray-500">
              Generada el {new Date(quote.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white">
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#F97316]">
            <Send className="mr-2 h-4 w-4" /> Enviar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow rounded-lg border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Cliente</h2>
          {client ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Empresa</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center"><Building2 className="h-4 w-4 mr-2" /> {client.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Correo</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center"><Mail className="h-4 w-4 mr-2" /> {client.email || "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Información del cliente no disponible.</p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg border-[#F97316] border-t-4 p-6">
          <dl className="space-y-4">
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <dt className="text-base font-bold text-gray-900">Total (COP)</dt>
              <dd className="text-2xl font-bold text-[#F97316]">{formatCurrency(total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {quoteItems.length > 0 && (
        <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quoteItems.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.products?.name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(Number(item.total_price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
