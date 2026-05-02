"use client";

import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, CheckCircle2, DollarSign, Truck, Percent } from "lucide-react";
import { getCommercialConfig, updateConfigAction } from "@/actions/config";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string;
  updated_at: string;
}

export default function CommercialConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const { data } = await getCommercialConfig();
      setConfigs(data || []);
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSaving(key);
    const { error } = await updateConfigAction(key, value);
    setSaving(null);

    if (error) {
      setMessage({ type: "error", text: "Error al actualizar: " + error });
    } else {
      setMessage({ type: "success", text: "Configuración actualizada correctamente" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const translations: Record<string, string> = {
    // Categories
    pricing: "Estrategia de Precios",
    logistics: "Logística y Operaciones",
    discounts: "Descuentos y Promociones",
    
    // Keys
    urgent_surcharge: "Recargo por Urgencia",
    volume_discount_threshold_1: "Umbral Descuento 1 (Cantidad)",
    volume_discount_rate_1: "Tasa Descuento 1 (%)",
    volume_discount_threshold_2: "Umbral Descuento 2 (Cantidad)",
    volume_discount_rate_2: "Tasa Descuento 2 (%)",
    base_currency: "Moneda Base del Sistema",
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "pricing": return <DollarSign className="h-5 w-5 text-blue-500" />;
      case "logistics": return <Truck className="h-5 w-5 text-orange-500" />;
      case "discounts": return <Percent className="h-5 w-5 text-green-500" />;
      default: return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F97316]"></div>
      <p className="mt-4 text-gray-500 italic">Cargando motor de reglas...</p>
    </div>
  );

  const categories = Array.from(new Set(configs.map(c => c.category)));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/products" className="mr-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-500 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configuración Comercial</h1>
            <p className="mt-1 text-sm text-gray-500 uppercase tracking-widest font-semibold">Motor de Precios y Reglas de Negocio</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center shadow-lg border animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === "success" ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"}`}>
          {message.type === "success" ? <CheckCircle2 className="h-5 w-5 mr-3 text-green-500" /> : <AlertCircle className="h-5 w-5 mr-3 text-red-500" />}
          <p className="text-sm font-bold uppercase tracking-tight">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {categories.map(category => (
          <div key={category} className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden border border-gray-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {renderCategoryIcon(category)}
              </div>
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wider">
                {translations[category] || category}
              </h2>
            </div>
            <div className="p-6 divide-y divide-gray-50">
              {configs.filter(c => c.category === category).map(config => (
                <div key={config.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 first:pt-0 last:pb-0">
                  <div className="flex-1 max-w-2xl">
                    <label className="block text-[10px] font-black text-[#F97316] uppercase tracking-[0.2em] mb-2">
                      {translations[config.key] || config.key.replace(/_/g, ' ')}
                    </label>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">{config.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        type="text"
                        defaultValue={config.value}
                        onBlur={(e) => {
                          if (e.target.value !== config.value) {
                            handleUpdate(config.key, e.target.value);
                          }
                        }}
                        className="block w-32 sm:w-48 text-right pr-4 py-3 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#F97316]/10 focus:border-[#F97316] sm:text-base font-bold text-black bg-gray-50/30 transition-all"
                      />
                      {saving === config.key && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <div className="animate-spin h-5 w-5 border-2 border-[#F97316] border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLDivElement).querySelector('input');
                        if (input) handleUpdate(config.key, input.value);
                      }}
                      className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#F97316] hover:border-[#F97316]/30 shadow-sm transition-all active:scale-95"
                      title="Guardar cambios"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-r-xl shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-orange-400" aria-hidden="true" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider">Aviso Importante</h3>
            <div className="mt-2 text-sm text-orange-700">
              <p>
                Los cambios realizados en esta pantalla afectarán el cálculo de <strong>todas las cotizaciones nuevas</strong> de forma inmediata. 
                Las cotizaciones existentes no serán recalculadas automáticamente para preservar la integridad de los contratos ya emitidos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
