"use client";

import { useState, useEffect } from "react";
import { calculatePricingAction } from "@/actions/quotes";
import { Calculator, Loader2, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { 
  getPapersCatalog, getAccessories, getPackagingCatalog, 
  getLaborRoutes, getLogistics, getGluesCatalog
} from "@/actions/pricing_config";

interface PricingResult {
  unit_price: number;
  total_price: number;
  breakdown: {
    raw_materials: number;
    accessories_cost: number;
    direct_labor: number;
    factory_overheads: number;
    indirect_costs: number;
    packaging_cost: number;
    freight_cost: number;
    total_production_cost: number;
    production_hours: number;
    capacity_used_pct: number;
  };
}

interface PricingCalculatorProps {
  onAdd?: (configuration: any, pricing: PricingResult) => void;
}

export default function PricingCalculator({ onAdd }: PricingCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // V2 Catalogs
  const [papers, setPapers] = useState<any[]>([]);
  const [accessories, setAccessories] = useState<any[]>([]);
  const [packagings, setPackagings] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [logistics, setLogistics] = useState<any[]>([]);

  const [glues, setGlues] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    product_line: "Tubos",
    requested_quantity: 1000,
    dimensions: { length_mm: 500, width_mm: 0, height_mm: 0, diameter_mm: 100, thickness_mm: 5, wing_1_mm: 0, wing_2_mm: 0 },
    bom: {
      layers: [] as { material_name: string; quantity: number }[],
      glue_name: "",
      glue_grams: 0,
      lamina_madre: "",
      accessories: [] as { material_name: string; quantity: number }[]
    },
    routing: [] as { step: string; speed: number; setup_hours: number; operator_count: number }[],
    packaging: [] as string[],
    logistics: { truck_type: "" }
  });

  useEffect(() => {
    async function load() {
      const [p, a, pkg, r, l, g] = await Promise.all([
        getPapersCatalog(), getAccessories(), getPackagingCatalog(), 
        getLaborRoutes(), getLogistics(), getGluesCatalog()
      ]);
      setPapers(p.data || []);
      setAccessories(a.data || []);
      setPackagings(pkg.data || []);
      setRoutes(r.data || []);
      setLogistics(l.data || []);
      setGlues(g.data || []);
      
      setInitializing(false);
    }
    load();
  }, []);

  // Update default routes when product line changes
  useEffect(() => {
    if (routes.length > 0) {
      const defaultRoutes = routes
        .filter(r => r.product_line === formData.product_line)
        .map(r => ({ step: r.process_name, speed: r.nominal_speed_hr, setup_hours: r.setup_hours, operator_count: 1 }));
      setFormData(prev => ({ ...prev, routing: defaultRoutes }));
    }
  }, [formData.product_line, routes]);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await calculatePricingAction(formData);
    if (error) setError(error);
    else setResult(data);
    setLoading(false);
  };

  const addLayer = () => {
    if (papers.length === 0) return;
    setFormData(prev => ({
      ...prev,
      bom: { ...prev.bom, layers: [...prev.bom.layers, { material_name: papers[0].name, quantity: 1 }] }
    }));
  };

  const removeLayer = (index: number) => {
    setFormData(prev => {
      const newLayers = [...prev.bom.layers];
      newLayers.splice(index, 1);
      return { ...prev, bom: { ...prev.bom, layers: newLayers } };
    });
  };

  const addAccessory = () => {
    if (accessories.length === 0) return;
    setFormData(prev => ({
      ...prev,
      bom: { ...prev.bom, accessories: [...prev.bom.accessories, { material_name: accessories[0].name, quantity: 1 }] }
    }));
  };

  const removeAccessory = (index: number) => {
    setFormData(prev => {
      const newAcc = [...prev.bom.accessories];
      newAcc.splice(index, 1);
      return { ...prev, bom: { ...prev.bom, accessories: newAcc } };
    });
  };

  if (initializing) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calculator className="h-6 w-6 text-[#F97316]" />
          <div>
            <h3 className="text-lg font-bold">Planificador de Producción V2</h3>
            <p className="text-xs text-gray-400">BOM & Routing</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Parámetros Básicos */}
        <div>
           <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Parámetros Básicos</h4>
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Línea de Producto</label>
              <select value={formData.product_line} onChange={(e) => setFormData({...formData, product_line: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black">
                <option value="Tubos">Tubos de Cartón</option>
                <option value="Envases">Envases Compuestos</option>
                <option value="Esquineros">Esquineros</option>
                <option value="Corrugado">Cajas de Corrugado</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Cantidad (Unidades)</label>
              <input type="number" value={formData.requested_quantity} onChange={(e) => setFormData({...formData, requested_quantity: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
            </div>
          </div>
        </div>

        {/* Dimensiones */}
        <div>
           <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Dimensiones (mm)</h4>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Largo / Alto</label>
              <input type="number" value={formData.dimensions.length_mm} onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, length_mm: parseFloat(e.target.value)}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
            </div>
            {formData.product_line === "Corrugado" ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Ancho</label>
                  <input type="number" value={formData.dimensions.width_mm} onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, width_mm: parseFloat(e.target.value)}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Alto</label>
                  <input type="number" value={formData.dimensions.height_mm} onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, height_mm: parseFloat(e.target.value)}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
              </>
            ) : formData.product_line === "Esquineros" ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Ala (mm)</label>
                  <input type="number" value={formData.dimensions.wing_1_mm} onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, wing_1_mm: parseFloat(e.target.value), wing_2_mm: parseFloat(e.target.value)}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Espesor</label>
                  <input type="number" value={formData.dimensions.thickness_mm} onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, thickness_mm: parseFloat(e.target.value)}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Diámetro Int.</label>
                  <input type="number" value={formData.dimensions.diameter_mm} onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, diameter_mm: parseFloat(e.target.value)}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Pared (Espesor)</label>
                  <input type="number" value={formData.dimensions.thickness_mm} onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, thickness_mm: parseFloat(e.target.value)}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bill of Materials (BOM) */}
        <div>
           <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Lista de Materiales (BOM)</h4>
           
           {formData.product_line === "Corrugado" ? (
             <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Lámina Madre</label>
                <select value={formData.bom.lamina_madre} onChange={(e) => setFormData({...formData, bom: {...formData.bom, lamina_madre: e.target.value}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black">
                  <option value="">Seleccionar Papel/Lámina...</option>
                  {papers.map(p => <option key={p.id} value={p.name}>{p.name} (${p.cost_per_unit}/{p.unit_measure})</option>)}
                </select>
             </div>
           ) : (
             <div className="mb-4">
               <div className="flex justify-between items-center mb-2">
                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest text-black">Capas de Papel en Rollo</label>
                 <button type="button" onClick={addLayer} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center font-bold hover:bg-blue-100">
                   <Plus className="w-3 h-3 mr-1" /> Añadir Capa
                 </button>
               </div>
               <div className="space-y-2">
                 {formData.bom.layers.map((layer, idx) => (
                   <div key={idx} className="flex gap-2 items-center">
                     <select 
                       value={layer.material_name} 
                       onChange={(e) => {
                         const newLayers = [...formData.bom.layers];
                         newLayers[idx].material_name = e.target.value;
                         setFormData({...formData, bom: {...formData.bom, layers: newLayers}});
                       }} 
                       className="flex-1 p-2 border rounded-lg text-sm bg-gray-50 text-black"
                     >
                       {papers.map(p => <option key={p.id} value={p.name}>{p.name} (${p.cost_per_unit}/{p.unit_measure})</option>)}
                     </select>
                     <input 
                       type="number" 
                       value={layer.quantity} 
                       onChange={(e) => {
                         const newLayers = [...formData.bom.layers];
                         newLayers[idx].quantity = parseFloat(e.target.value);
                         setFormData({...formData, bom: {...formData.bom, layers: newLayers}});
                       }} 
                       className="w-24 p-2 border rounded-lg text-sm bg-gray-50 text-black" 
                       title="Vueltas/Capas"
                     />
                     <button type="button" onClick={() => removeLayer(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
                 {formData.bom.layers.length === 0 && <p className="text-xs text-gray-400 italic">No hay capas definidas.</p>}
               </div>
               
               <div className="mt-4 grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Pegante</label>
                   <select value={formData.bom.glue_name} onChange={(e) => setFormData({...formData, bom: {...formData.bom, glue_name: e.target.value}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black">
                     <option value="">Automático (~10% peso)</option>
                     {glues.map(g => <option key={g.id} value={g.name}>{g.name} (${g.cost_per_unit}/{g.unit_measure})</option>)}
                   </select>
                 </div>
                 {formData.bom.glue_name && (
                   <div>
                     <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Consumo (Gramos / Und)</label>
                     <input type="number" value={formData.bom.glue_grams} onChange={(e) => setFormData({...formData, bom: {...formData.bom, glue_grams: parseFloat(e.target.value)}})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                   </div>
                 )}
               </div>
             </div>
           )}

           {formData.product_line === "Envases" && (
             <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest text-black">Accesorios (Tapas, Etiquetas)</label>
                 <button type="button" onClick={addAccessory} className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded flex items-center font-bold hover:bg-purple-100">
                   <Plus className="w-3 h-3 mr-1" /> Añadir Accesorio
                 </button>
               </div>
               <div className="space-y-2">
                 {formData.bom.accessories.map((acc, idx) => (
                   <div key={idx} className="flex gap-2 items-center">
                     <select 
                       value={acc.material_name} 
                       onChange={(e) => {
                         const newAcc = [...formData.bom.accessories];
                         newAcc[idx].material_name = e.target.value;
                         setFormData({...formData, bom: {...formData.bom, accessories: newAcc}});
                       }} 
                       className="flex-1 p-2 border rounded-lg text-sm bg-gray-50 text-black"
                     >
                       {accessories.map(a => <option key={a.id} value={a.name}>{a.name} (${a.cost_per_unit}/{a.unit_measure})</option>)}
                     </select>
                     <input 
                       type="number" 
                       value={acc.quantity} 
                       onChange={(e) => {
                         const newAcc = [...formData.bom.accessories];
                         newAcc[idx].quantity = parseFloat(e.target.value);
                         setFormData({...formData, bom: {...formData.bom, accessories: newAcc}});
                       }} 
                       className="w-24 p-2 border rounded-lg text-sm bg-gray-50 text-black" 
                       title="Cant. por unidad"
                     />
                     <button type="button" onClick={() => removeAccessory(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
                 {formData.bom.accessories.length === 0 && <p className="text-xs text-gray-400 italic">No hay accesorios definidos.</p>}
               </div>
             </div>
           )}
        </div>

        {/* Routing */}
        <div>
           <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Ruta de Producción (Routing)</h4>
           <div className="space-y-2">
             {formData.routing.map((r, idx) => (
               <div key={idx} className="flex gap-2 items-center text-sm">
                 <div className="flex-1 font-bold text-gray-700 bg-gray-100 p-2 rounded-lg">{r.step}</div>
                 <div className="w-32">
                   <label className="text-[9px] uppercase text-gray-500 block">Vel. (Und/hr)</label>
                   <input 
                     type="number" 
                     value={r.speed} 
                     onChange={(e) => {
                       const newR = [...formData.routing];
                       newR[idx].speed = parseFloat(e.target.value);
                       setFormData({...formData, routing: newR});
                     }} 
                     className="w-full p-1.5 border rounded-lg text-black bg-white" 
                   />
                 </div>
                 <div className="w-24">
                   <label className="text-[9px] uppercase text-gray-500 block">Setup (hr)</label>
                   <input 
                     type="number" 
                     value={r.setup_hours} 
                     onChange={(e) => {
                       const newR = [...formData.routing];
                       newR[idx].setup_hours = parseFloat(e.target.value);
                       setFormData({...formData, routing: newR});
                     }} 
                     className="w-full p-1.5 border rounded-lg text-black bg-white" 
                   />
                 </div>
                 <div className="w-24">
                   <label className="text-[9px] uppercase text-gray-500 block">Operarios</label>
                   <input 
                     type="number" 
                     value={r.operator_count} 
                     onChange={(e) => {
                       const newR = [...formData.routing];
                       newR[idx].operator_count = parseInt(e.target.value) || 1;
                       setFormData({...formData, routing: newR});
                     }} 
                     className="w-full p-1.5 border rounded-lg text-black bg-white" 
                   />
                 </div>
               </div>
             ))}
             {formData.routing.length === 0 && <p className="text-xs text-gray-400 italic">No hay ruta definida para esta línea.</p>}
           </div>
        </div>

        {/* Logística */}
        <div>
           <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Logística y Empaque</h4>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Empaque Secundario</label>
                 <select value={formData.packaging[0] || ""} onChange={(e) => setFormData({...formData, packaging: e.target.value ? [e.target.value] : []})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black">
                   <option value="">Sin empaque...</option>
                   {packagings.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Vehículo de Envío</label>
                 <select value={formData.logistics.truck_type} onChange={(e) => setFormData({...formData, logistics: { truck_type: e.target.value }})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black">
                   <option value="">Sin flete</option>
                   {logistics.map(v => <option key={v.id} value={v.truck_type}>{v.truck_type} ({v.volume_m3} m³)</option>)}
                 </select>
               </div>
           </div>
        </div>

        <button type="button" onClick={handleCalculate} disabled={loading} className="w-full py-4 bg-[#F97316] text-white font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-[#EA580C] transition-all disabled:opacity-50 shadow-lg">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Calcular Matriz de Costos V2</span>}
        </button>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center space-x-2 border border-red-200">
            <AlertCircle className="h-5 w-5" /><span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
              <span className="text-base font-bold text-gray-800">Matriz de Costos Unitarios</span>
              <div className="flex items-center text-[#10B981] text-xs font-bold px-2 py-1 bg-green-100 rounded-full">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Calculado
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Precio por Unidad</span>
                <span className="text-2xl font-black text-[#1F2937]">${result.unit_price.toLocaleString()} COP</span>
              </div>

              <div className="p-6 bg-[#1F2937] text-white rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10"><Calculator className="w-32 h-32" /></div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 relative z-10">Total Proyecto ({result.breakdown.production_hours} hr prod)</p>
                <p className="text-4xl font-black text-white relative z-10">${result.total_price.toLocaleString()} <span className="text-sm text-gray-400 font-bold">COP</span></p>
              </div>

              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] pt-4 mb-2">Desglose (Breakdown)</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Materia Prima Directa</p>
                  <p className="text-sm font-black text-gray-800">${result.breakdown.raw_materials.toLocaleString()}</p>
                </div>
                {result.breakdown.accessories_cost > 0 && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Accesorios</p>
                    <p className="text-sm font-black text-gray-800">${result.breakdown.accessories_cost.toLocaleString()}</p>
                  </div>
                )}
                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Mano de Obra Directa</p>
                  <p className="text-sm font-black text-gray-800">${result.breakdown.direct_labor.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Cargas Fabriles (CIF)</p>
                  <p className="text-sm font-black text-gray-800">${result.breakdown.factory_overheads.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Costos Indirectos (NIF)</p>
                  <p className="text-sm font-black text-gray-800">${result.breakdown.indirect_costs.toLocaleString()}</p>
                </div>
                {result.breakdown.packaging_cost > 0 && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Empaque / Despacho</p>
                    <p className="text-sm font-black text-gray-800">${result.breakdown.packaging_cost.toLocaleString()}</p>
                  </div>
                )}
                {result.breakdown.freight_cost > 0 && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Costo Fletes ({result.breakdown.capacity_used_pct}%)</p>
                    <p className="text-sm font-black text-[#F97316]">${result.breakdown.freight_cost.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {onAdd && (
                <div className="mt-6">
                  <button 
                    type="button"
                    onClick={() => onAdd(formData, result)}
                    className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg transition-all"
                  >
                    ✓ Añadir Ítem a la Cotización
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
