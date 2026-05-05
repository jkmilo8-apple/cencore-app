"use client";

import { Save, TrendingUp } from "lucide-react";

const tiers = [
  { name: "Tier 1: Estándar", discount: "0%", description: "Menos de 1,000 unidades" },
  { name: "Tier 2: Mayorista", discount: "5.5%", description: "1,001 - 5,000 unidades" },
  { name: "Tier 3: Industrial", discount: "8.0%", description: "5,001 - 20,000 unidades" },
  { name: "Tier 4: Corporativo", discount: "12.5%", description: "+20,000 unidades" },
];

const materialCosts = [
  { grade: "Liner Kraft 150g", cost: 2850 },
  { grade: "Liner Kraft 200g", cost: 3100 },
  { grade: "Medium Corrugado B-Flute", cost: 2400 },
  { grade: "Medium Corrugado C-Flute", cost: 2600 },
  { grade: "Double Wall BC-Flute", cost: 4200 },
];

const regions = [
  { region: "Bogotá Zona Urbana", multiplier: 1.0 },
  { region: "Cali / Yumbo", multiplier: 1.05 },
  { region: "Medellín", multiplier: 1.08 },
  { region: "Barranquilla", multiplier: 1.12 },
  { region: "Otras Ciudades", multiplier: 1.20 },
];

export default function PricingConfigPage() {
  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Motor de Precios</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configura las variables de costos de materia prima, logística y reglas comerciales.
          </p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors">
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </button>
      </div>

      {/* Trend Chart Placeholder */}
      <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-[#F97316] mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Tendencia: Papel Kraft &amp; Liner (COP/Ton)</h2>
        </div>
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">Gráfica de tendencia de precios — integración con datos en tiempo real</p>
        </div>
      </div>

      {/* Global Factors */}
      <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Factores Globales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">IVA (%)</label>
            <input type="number" defaultValue={19} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#F97316] focus:border-[#F97316]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Margen Base (%)</label>
            <input type="number" defaultValue={25} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#F97316] focus:border-[#F97316]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Factor de Desperdicio (%)</label>
            <input type="number" defaultValue={3.5} step={0.1} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#F97316] focus:border-[#F97316]" />
          </div>
        </div>
      </div>

      {/* Material Costs Table */}
      <div className="bg-white shadow rounded-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Costos Base por Grado de Material</h2>
          <p className="text-sm text-gray-500 mt-1">Defina el costo por kilogramo de material base.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grado de Material</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo (COP/Kg)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materialCosts.map((mat) => (
                <tr key={mat.grade} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{mat.grade}</td>
                  <td className="px-6 py-4 text-right">
                    <input type="number" defaultValue={mat.cost} className="w-32 text-right rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-[#F97316] focus:border-[#F97316]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Multipliers */}
      <div className="bg-white shadow rounded-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Multiplicadores Logísticos Regionales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Región</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Multiplicador</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {regions.map((r) => (
                <tr key={r.region} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{r.region}</td>
                  <td className="px-6 py-4 text-right">
                    <input type="number" defaultValue={r.multiplier} step={0.01} className="w-24 text-right rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-[#F97316] focus:border-[#F97316]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volume Discount Tiers */}
      <div className="bg-white shadow rounded-lg border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6 border-b pb-2">Escalas de Descuento por Volumen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <div key={tier.name} className="border border-gray-200 rounded-lg p-4 text-center hover:border-[#F97316] transition-colors">
              <p className="text-xs font-medium text-gray-500 uppercase">{tier.name}</p>
              <p className="text-3xl font-bold text-[#F97316] my-2">{tier.discount}</p>
              <p className="text-xs text-gray-500">{tier.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
