"use client";

import { useState } from "react";
import { calculatePricingAction } from "@/actions/quotes";
import { Calculator, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface PricingResult {
  unit_price: number;
  total_price: number;
  breakdown: {
    raw_materials: number;
    direct_labor: number;
    factory_overheads: number;
    indirect_costs: number;
  };
}

export default function PricingCalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: "Tubos",
    material: "kraft",
    quantity: 1000,
    dimensions: {
      length: 50,
      diameter: 10,
      thickness: 0.5
    }
  });

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    
    // UI -> Next.js Server Action -> FastAPI -> Next.js -> UI
    const { data, error } = await calculatePricingAction(formData);
    
    if (error) {
      setError(error);
    } else {
      setResult(data);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calculator className="h-6 w-6 text-[#F97316]" />
          <div>
            <h3 className="text-lg font-bold">Motor de Costos Industrial</h3>
            <p className="text-xs text-gray-400">Next.js → FastAPI Pipeline</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Categoría</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black"
            >
              <option value="Tubos">Tubos</option>
              <option value="Esquineros">Esquineros</option>
              <option value="Cajas">Cajas</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cantidad</label>
            <input 
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black"
            />
          </div>
        </div>

        <button 
          onClick={handleCalculate}
          disabled={loading}
          className="w-full py-3 bg-[#F97316] text-white font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-[#EA580C] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Calcular Precio Industrial</span>}
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <span className="text-sm font-bold text-gray-700">Resultado del Microservicio</span>
              <div className="flex items-center text-[#10B981] text-xs font-bold">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Sincronizado
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Precio Unitario</span>
                <span className="text-lg font-bold text-[#1F2937]">${result.unit_price.toLocaleString()} COP</span>
              </div>

              <div className="p-4 bg-[#1F2937] text-white rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Total Proyecto</p>
                <p className="text-3xl font-black">${result.total_price.toLocaleString()} COP</p>
              </div>

              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em] pt-2">Desglose de Costos (Breakdown)</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border rounded-lg">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Materia Prima</p>
                  <p className="text-sm font-bold text-gray-700">${result.breakdown.raw_materials.toLocaleString()}</p>
                </div>
                <div className="p-2 border rounded-lg">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Mano de Obra</p>
                  <p className="text-sm font-bold text-gray-700">${result.breakdown.direct_labor.toLocaleString()}</p>
                </div>
                <div className="p-2 border rounded-lg">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Cargas Fabriles</p>
                  <p className="text-sm font-bold text-gray-700">${result.breakdown.factory_overheads.toLocaleString()}</p>
                </div>
                <div className="p-2 border rounded-lg">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Costos Indirectos</p>
                  <p className="text-sm font-bold text-gray-700">${result.breakdown.indirect_costs.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
