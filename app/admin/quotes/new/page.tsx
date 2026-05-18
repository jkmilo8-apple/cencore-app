"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  Calculator, 
  ArrowLeft, 
  Save, 
  Send, 
  Box, 
  ScrollText, 
  Layers, 
  User,
  ChevronRight,
  Info,
  Package
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getClients } from "@/actions/clients";
import { getProducts } from "@/actions/products";
import { createQuoteAction } from "@/actions/quotes";
import { getCommercialConfig } from "@/actions/config";
import PricingCalculator from "@/components/PricingCalculator";
import type { Client, Product } from "@/types/database";

const quotationSchema = z.object({
  clientId: z.string().min(1, "Seleccione un cliente"),
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string().optional(),
    quantity: z.number().min(1, "Mínimo 1"),
    unitPrice: z.number(),
    totalPrice: z.number(),
    configuration: z.any().optional()
  })).min(1, "Agregue al menos un producto"),
  urgentDelivery: z.boolean(),
  notes: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

const CATEGORIES = [
  { id: "Cajas", name: "Cajas", icon: Box, description: "Empaque estándar corrugado" },
  { id: "Rollos", name: "Rollos", icon: ScrollText, description: "Papel Kraft y envoltorios" },
  { id: "Accesorios", name: "Esquineros", icon: Layers, description: "Protección y estibado" },
];

function NewQuotationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Cajas");

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      clientId: "",
      items: [],
      urgentDelivery: false,
      notes: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  useEffect(() => {
    async function loadData() {
      const [cRes, pRes, configRes] = await Promise.all([
        getClients(), 
        getProducts(),
        getCommercialConfig()
      ]);
      setClients(cRes.data || []);
      setProducts(pRes.data || []);
      
      const configMap: Record<string, string> = {};
      configRes.data?.forEach(c => {
        configMap[c.key] = c.value;
      });
      setConfig(configMap);
      
      if (editId) {
        const { getQuote } = await import("@/actions/quotes");
        const { data: existingQuote, items: existingItems } = await getQuote(editId);
        if (existingQuote) {
          setValue("clientId", existingQuote.client_id);
          setValue("urgentDelivery", existingQuote.urgent_delivery || false);
          setValue("notes", existingQuote.notes || "");
          
          if (existingItems && existingItems.length > 0) {
            remove(); // remove defaults
            existingItems.forEach((item: any) => {
              append({
                productId: item.product_id || "",
                description: item.description || "Producto Personalizado",
                quantity: item.quantity,
                unitPrice: Number(item.unit_price),
                totalPrice: Number(item.total_price),
                configuration: item.configuration
              });
            });
          }
        }
      }
      
      setLoading(false);
    }
    loadData();
  }, [editId]);

  const watchedItems = useWatch({ control, name: "items" }) || [];
  const urgentDelivery = useWatch({ control, name: "urgentDelivery" }) || false;

  const calculateTotals = () => {
    let subtotal = 0;
    const itemDetails = watchedItems.map((item) => {
      const unitPrice = item.unitPrice || 0;
      const totalItem = item.totalPrice || 0;
      subtotal += totalItem;
      return { unitPrice, totalItem };
    });

    const totalQuantity = watchedItems.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    
    const threshold2 = Number(config.volume_discount_threshold_2 || 5000);
    const rate2 = Number(config.volume_discount_rate_2 || 0.08);
    const threshold1 = Number(config.volume_discount_threshold_1 || 1000);
    const rate1 = Number(config.volume_discount_rate_1 || 0.04);
    const urgentRate = Number(config.urgent_surcharge || 0.15);

    let discount = 0;
    if (totalQuantity >= threshold2) discount = subtotal * rate2;
    else if (totalQuantity >= threshold1) discount = subtotal * rate1;

    const surcharge = urgentDelivery ? (subtotal - discount) * urgentRate : 0;
    const total = subtotal - discount + surcharge;

    return { subtotal, discount, surcharge, total, itemDetails };
  };

  const pricing = calculateTotals();

  const onSubmit = async (data: QuotationFormValues) => {
    setIsSubmitting(true);

    if (editId) {
      const { updateQuoteAction } = await import("@/actions/quotes");
      const { data: quote, error } = await updateQuoteAction(editId, {
        client_id: data.clientId,
        total_amount: pricing.total,
        notes: data.notes || "",
        urgent_delivery: data.urgentDelivery,
        items: data.items.map((item, idx) => ({
          product_id: products[0]?.id || null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          configuration: item.configuration
        })) as any
      });

      if (error) {
        alert("Error al guardar la cotización: " + error);
        setIsSubmitting(false);
      } else if (quote) {
        router.push(`/admin/quotes/${quote.id}`);
      }
    } else {
      const { createQuoteAction } = await import("@/actions/quotes");
      const { data: quote, error } = await createQuoteAction({
        client_id: data.clientId,
        total_amount: pricing.total,
        notes: data.notes || "",
        urgent_delivery: data.urgentDelivery,
        items: data.items.map((item, idx) => ({
          product_id: products[0]?.id || null, // Fallback product_id for DB if required
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          configuration: item.configuration
        })) as any
      });

      if (error) {
        alert("Error al crear la cotización: " + error);
        setIsSubmitting(false);
      } else if (quote) {
        router.push(`/admin/quotes/${quote.id}`);
      }
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF8F6]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
      <p className="mt-4 text-gray-500 font-medium">Sincronizando Consola de Operaciones...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF8F6] pb-12">
      {/* Header Premium */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/quotes" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#1F2937] tracking-tight">
                {editId ? "Corregir Cotización" : "Consola de Operaciones"}
              </h1>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
                {editId ? "Editar y Reenviar Cotización Industrial" : "Nueva Cotización Industrial"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 border-l pl-6 border-gray-100">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Rodrigo Mendoza</p>
              <p className="text-xs text-[#F97316] font-semibold">Acceso Administrador</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#F97316]/10 flex items-center justify-center border border-[#F97316]/20">
              <User className="h-5 w-5 text-[#F97316]" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            
            {/* Step 1: Client Selection */}
            <section className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center">
                  <span className="bg-[#F97316] text-white h-6 w-6 rounded-md flex items-center justify-center mr-3 text-xs">1</span>
                  Información del Cliente
                </h2>
              </div>
              <div className="p-6">
                <div className="relative">
                  <select
                    {...register("clientId")}
                    className="block w-full pl-4 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] sm:text-sm rounded-lg border transition-all bg-gray-50/50 text-black font-medium"
                  >
                    <option value="">Seleccione un cliente para iniciar...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city || 'Sede Principal'}</option>)}
                  </select>
                  {errors.clientId && <p className="mt-2 text-xs font-bold text-red-500 uppercase tracking-tight">{errors.clientId.message}</p>}
                </div>
              </div>
            </section>

            {/* Step 2: Calculator */}
            <section className="mb-8">
               <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center mb-4 ml-2">
                <span className="bg-[#F97316] text-white h-6 w-6 rounded-md flex items-center justify-center mr-3 text-xs">2</span>
                Configuración Industrial
              </h2>
              <PricingCalculator 
                onAdd={(config, pricingResult) => {
                  let desc = "";
                  const dims = config.dimensions || {};
                  if (config.product_line === "Corrugado") {
                    desc = `Caja Corrugada ${dims.length_mm || 0}x${dims.width_mm || 0}x${dims.height_mm || 0} mm`;
                  } else if (config.product_line === "Esquineros") {
                    desc = `Esquinero de Cartón ${dims.length_mm || 0}x${dims.wing_1_mm || 0}x${dims.thickness_mm || 0} mm`;
                  } else {
                    desc = `${config.product_line === "Tubos" ? "Tubo" : "Envase"} de Cartón Ø${dims.diameter_mm || 0}x${dims.length_mm || 0} mm (Pared ${dims.thickness_mm || 0} mm)`;
                  }

                  append({
                    productId: "",
                    description: desc,
                    quantity: config.requested_quantity || 1000,
                    unitPrice: pricingResult.unit_price,
                    totalPrice: pricingResult.total_price,
                    configuration: config
                  });
                }}
              />
            </section>

            {/* Step 3: Product Configuration */}
            <section className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center">
                  <span className="bg-[#F97316] text-white h-6 w-6 rounded-md flex items-center justify-center mr-3 text-xs">3</span>
                  Ítems Cotizados
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start space-x-3 mb-4">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Nota: Los pedidos superiores a <strong>5,000 unidades</strong> califican para un descuento por volumen del <strong>8%</strong>. El tiempo estimado de producción es de 8 días hábiles.
                  </p>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end p-4 rounded-xl border border-gray-50 bg-gray-50/30 group relative">
                    <div className="lg:col-span-7 flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {(() => {
                          const product = products.find(p => p.id === watchedItems[index]?.productId);
                          if (product?.image_url) {
                            return (
                              <img 
                                src={product.image_url} 
                                alt="Product" 
                                className="h-full w-full object-contain p-1"
                              />
                            );
                          }
                          return <Package className="h-5 w-5 text-gray-300" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Producto Configurado</label>
                        <input
                          type="text"
                          readOnly
                          value={watchedItems[index]?.description || "Producto Personalizado"}
                          className="block w-full text-sm border-gray-200 rounded-lg p-2.5 border bg-gray-100 text-black font-medium"
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cantidad</label>
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="block w-full text-sm border-gray-200 rounded-lg p-2.5 border focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] bg-white text-center font-bold text-black"
                      />
                    </div>
                    <div className="lg:col-span-2 text-right">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subtotal</label>
                      <div className="p-2.5 text-sm font-bold text-gray-700">
                        {formatCurrency(pricing.itemDetails[index]?.totalItem || 0)}
                      </div>
                    </div>
                    <div className="lg:col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {errors.items && <p className="text-xs font-bold text-red-500 uppercase">{errors.items.message}</p>}
              </div>
            </section>

            {/* Step 4: Final Options */}
            <section className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg transition-colors ${urgentDelivery ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"}`}>
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Logística y Urgencia</h3>
                    <p className="text-[10px] text-gray-400 font-medium">Configure el tiempo de entrega prioritario</p>
                  </div>
                </div>
                <div className="flex items-center">
                   <input
                    id="urgentDelivery"
                    type="checkbox"
                    {...register("urgentDelivery")}
                    className="h-5 w-5 text-[#F97316] focus:ring-[#F97316] border-gray-300 rounded-md transition-all cursor-pointer"
                  />
                  <label htmlFor="urgentDelivery" className="ml-3 text-sm font-bold text-gray-700 cursor-pointer">Entrega Prioritaria (+15%)</label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Observaciones Técnicas</label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Detalles sobre el gramaje, flauta o acabado..."
                  className="block w-full rounded-lg border-gray-200 border p-4 text-sm focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all text-black font-medium"
                />
              </div>
            </section>
          </div>

          {/* Right Column: Industrial Summary Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-4">
              <div className="bg-[#1F2937] text-white rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Resumen de Cotización</h2>
                    <div className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-[#F97316]">PRE-FACTURA</div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Unidades Totales</p>
                        <p className="text-xl font-bold">{watchedItems.reduce((acc, curr) => acc + (curr.quantity || 0), 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Ítems</p>
                        <p className="text-xl font-bold">{watchedItems.length}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal de Producción</span>
                        <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
                      </div>
                      
                      {pricing.discount > 0 && (
                        <div className="flex justify-between text-sm text-[#10B981]">
                          <span className="flex items-center">
                            Descuento Industrial
                            <span className="ml-2 text-[10px] bg-[#10B981]/10 px-1 rounded uppercase">VOL</span>
                          </span>
                          <span className="font-bold">-{formatCurrency(pricing.discount)}</span>
                        </div>
                      )}

                      {pricing.surcharge > 0 && (
                        <div className="flex justify-between text-sm text-[#F59E0B]">
                          <span className="flex items-center">
                            Recargo Logístico
                            <span className="ml-2 text-[10px] bg-[#F59E0B]/10 px-1 rounded uppercase">URG</span>
                          </span>
                          <span className="font-bold">+{formatCurrency(pricing.surcharge)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/10 flex flex-col items-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.3em] mb-2">Total Estimado</p>
                      <p className="text-4xl font-black text-white">{formatCurrency(pricing.total)}</p>
                      <p className="text-[10px] text-[#F97316] font-bold mt-2 tracking-widest uppercase">Pesos Colombianos (COP)</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || watchedItems.length === 0}
                    className="w-full py-4 px-6 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-[#F97316]/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                  >
                    {isSubmitting ? "Guardando..." : (editId ? "Guardar Corrección" : "Generar Cotización")}
                  </button>
                  <button
                    type="button"
                    className="w-full py-3 px-6 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Guardar en Borradores
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                  <Save className="h-4 w-4" />
                </div>
                <p className="text-[10px] text-gray-500 font-medium">Auto-guardado habilitado. La cotización es válida por 15 días.</p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF8F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
        <p className="mt-4 text-gray-500 font-medium">Cargando Consola de Operaciones...</p>
      </div>
    }>
      <NewQuotationForm />
    </Suspense>
  );
}
