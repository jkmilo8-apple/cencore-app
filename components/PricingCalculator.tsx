"use client";

import { useState, useEffect } from "react";
import { calculatePricingAction } from "@/actions/quotes";
import { Calculator, Loader2, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import {
  getPapersCatalog, getAccessories, getPackagingCatalog,
  getLaborRoutes, getLogistics, getGluesCatalog, getLaborProfiles
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
  income_statement?: {
    venta_total: number;
    costo_materia_prima: number;
    utilidad_bruta: number;
    gastos_operacionales: number;
    carga_fabril_cif: number;
    mano_de_obra: number;
    utilidad_operacional: number;
    impuestos: number;
    rentabilidad_neta_ejercicio: number;
    porcentaje_rentabilidad: number;
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
  const [laborProfiles, setLaborProfiles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    product_line: "Tubos",
    requested_quantity: 1000,
    margin: 0.25,
    dimensions: { length_mm: 500, width_mm: 0, height_mm: 0, diameter_mm: 100, thickness_mm: 5, wing_1_mm: 0, wing_2_mm: 0 },
    bom: {
      layers: [] as { material_name: string; quantity: number }[],
      glue_name: "",
      glue_grams: 0,
      glue_gms: 0,
      glue_layers: 0,
      lamina_madre: "",
      accessories: [] as { material_name: string; quantity: number }[]
    },
    routing: [] as { step: string; speed: number; setup_hours: number; operator_count: number; labor_profile: string }[],
    packaging: [] as { material_name: string; quantity: number }[],
    logistics: { truck_type: "" },
    waste_pct: 0.0,
    cabida: 1,
    margen_puntas_mm: 10.0,
    grosor_cuchilla_corte_mm: 5.0,
  });
  // Input de margen como string para soportar decimales (ej. 7.77)
  const [marginStr, setMarginStr] = useState("25");

  // Estado para parámetros avanzados manuales (Mermas, consumos, etc)
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Estado para fletes manuales
  const [forceManualFreight, setForceManualFreight] = useState(false);
  const [manualFreightCost, setManualFreightCost] = useState("45000");

  useEffect(() => {
    async function load() {
      const [p, a, pkg, r, l, g, lp] = await Promise.all([
        getPapersCatalog(), getAccessories(), getPackagingCatalog(),
        getLaborRoutes(), getLogistics(), getGluesCatalog(), getLaborProfiles()
      ]);
      setPapers(p.data || []);
      setAccessories(a.data || []);
      setPackagings(pkg.data || []);
      setRoutes(r.data || []);
      setLogistics(l.data || []);
      setGlues(g.data || []);
      setLaborProfiles(lp.data || []);

      setInitializing(false);
    }
    load();
  }, []);

  // Actualizar ruta por defecto cuando cambia la línea de producto
  useEffect(() => {
    if (routes.length > 0) {
      // (F) Filtrar solo los procesos válidos para la línea de producto seleccionada
      const lineRoutes = routes.filter(r => r.product_line === formData.product_line);
      const defaultRoutes = lineRoutes.map(r => {
        const matchedProfile = laborProfiles.find(lp =>
          lp.profile_name.toLowerCase().includes(r.process_name.toLowerCase()) ||
          (r.process_name.toLowerCase() === "formar" && lp.profile_name.toLowerCase().includes("formadora"))
        )?.profile_name || "";

        return {
          step: r.process_name,
          speed: r.nominal_speed_hr,
          setup_hours: r.setup_hours,
          operator_count: 1,
          labor_profile: matchedProfile
        };
      });
      setFormData(prev => ({ ...prev, routing: defaultRoutes }));
    }
  }, [formData.product_line, routes, laborProfiles]);

  const getPayload = () => {
    const length = formData.dimensions.length_mm || 0;
    const computedCabida = length > 0 ? Math.max(1, Math.floor(2000 / length)) : 1;
    
    if (showAdvanced) {
      return {
        ...formData,
        cabida: computedCabida,
        logistics: {
          ...formData.logistics,
          manual_freight_cost: forceManualFreight ? (parseFloat(manualFreightCost) || 0) : null
        }
      };
    }

    // Auto-calculate glue gms and layers for payload
    const thickness = formData.dimensions.thickness_mm || 5.0;
    let glue_gms = 0;
    if (thickness <= 1.8) glue_gms = 55;
    else if (thickness <= 2.9) glue_gms = 65;
    else if (thickness <= 5.0) glue_gms = 70;
    else if (thickness <= 7.5) glue_gms = 80;
    else if (thickness <= 12.0) glue_gms = 100;
    else glue_gms = 120;

    const glue_layers = Math.max(1, formData.bom.layers.length - 1);

    return {
      ...formData,
      cabida: computedCabida,
      waste_pct: 0.0, // Clear manual waste pct in auto mode so backend uses fixed waste tubes
      bom: {
        ...formData.bom,
        glue_gms: formData.bom.glue_name ? glue_gms : 0,
        glue_layers: formData.bom.glue_name ? glue_layers : 0,
      },
      logistics: {
        ...formData.logistics,
        manual_freight_cost: forceManualFreight ? (parseFloat(manualFreightCost) || 0) : null
      }
    };
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    const payload = getPayload();
    const { data, error } = await calculatePricingAction(payload);
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

  const removeRoutingStep = (index: number) => {
    setFormData(prev => {
      const newR = [...prev.routing];
      newR.splice(index, 1);
      return { ...prev, routing: newR };
    });
  };

  const addRoutingStep = (routeRow: any) => {
    const matchedProfile = laborProfiles.find(lp =>
      lp.profile_name.toLowerCase().includes(routeRow.process_name?.toLowerCase()) ||
      (routeRow.process_name?.toLowerCase() === "formar" && lp.profile_name.toLowerCase().includes("formadora"))
    )?.profile_name || "";
    setFormData(prev => ({
      ...prev,
      routing: [...prev.routing, {
        step: routeRow.process_name,
        speed: (routeRow.nominal_speed_hr != null && !isNaN(Number(routeRow.nominal_speed_hr))) ? Number(routeRow.nominal_speed_hr) : 1,
        setup_hours: (routeRow.setup_hours != null && !isNaN(Number(routeRow.setup_hours))) ? Number(routeRow.setup_hours) : 0,
        operator_count: 1,
        labor_profile: matchedProfile,
      }]
    }));
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
              <select value={formData.product_line} onChange={(e) => setFormData({ ...formData, product_line: e.target.value })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black">
                <option value="Tubos">Tubos de Cartón</option>
                <option value="Envases">Envases Compuestos</option>
                <option value="Esquineros">Esquineros</option>
                <option value="Corrugado">Cajas de Corrugado</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Cantidad (Unidades)</label>
              <input type="number" value={formData.requested_quantity} onChange={(e) => setFormData({ ...formData, requested_quantity: parseInt(e.target.value) || 0 })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Margen de Utilidad Esperado (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={marginStr}
                  onChange={(e) => {
                    setMarginStr(e.target.value);
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed)) setFormData(prev => ({ ...prev, margin: parsed / 100 }));
                  }}
                  className="w-28 p-2 border-2 border-orange-300 rounded-lg text-sm bg-orange-50 text-black font-bold"
                  placeholder="Ej. 7.77"
                />
                <span className="text-sm text-gray-500">% sobre el costo total de producción</span>
                <span className="ml-auto text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  Factor: {(1 + formData.margin).toFixed(4)}x
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <label className="inline-flex items-center text-xs font-bold text-gray-700 cursor-pointer bg-orange-50/50 border border-orange-100 rounded-lg px-3 py-2 hover:bg-orange-50 transition-colors">
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 mr-2 h-4 w-4"
                />
                <span className="text-orange-950">Habilitar parámetros manuales (Mermas y consumos avanzados)</span>
              </label>
            </div>
            {(formData.product_line === "Tubos" || formData.product_line === "Envases") && (
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-black">Merma y Configuración del Tubo Padre</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase font-bold mb-1">
                      {showAdvanced ? "Desperdicio Formado (%)" : "Desperdicio Fijo (Tubo Padre)"}
                    </label>
                    {showAdvanced ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.waste_pct}
                        onChange={(e) => setFormData({ ...formData, waste_pct: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 border border-orange-300 rounded-lg text-sm bg-orange-50 text-black font-semibold"
                        placeholder="Ej. 50"
                      />
                    ) : (
                      <div className="w-full p-2 border border-amber-300 rounded-lg text-sm bg-amber-50 text-amber-900 font-bold">
                        {(formData.dimensions.thickness_mm || 0) <= 6.0 ? 35 : 45} tubos padres <span className="text-[10px] text-gray-500 font-normal">(Automático)</span>
                      </div>
                    )}
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      {showAdvanced ? `Factor: ×${(1 + formData.waste_pct / 100).toFixed(2)}` : `Seguro por espesor: ${(formData.dimensions.thickness_mm || 0) <= 6.0 ? "<= 6.0 mm (35 u)" : "> 6.0 mm (45 u)"}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase font-bold mb-1">Especificaciones Tubo Padre</label>
                    <div className="w-full p-2 border border-blue-300 rounded-lg text-xs bg-blue-50 text-blue-900 font-semibold">
                      D. Ext: {((formData.dimensions.diameter_mm || 0) + 2 * (formData.dimensions.thickness_mm || 0)).toFixed(1)} mm &nbsp;· Largo: {((formData.dimensions.length_mm || 0) + 10).toFixed(0)} mm
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5">Refile fijo: +10 mm</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dimensiones */}
        <div>
          <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Dimensiones (mm)</h4>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Largo / Alto</label>
              <input type="number" value={isNaN(formData.dimensions.length_mm) ? "" : formData.dimensions.length_mm} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, length_mm: parseFloat(e.target.value) } })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
            </div>
            {formData.product_line === "Corrugado" ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Ancho</label>
                  <input type="number" value={isNaN(formData.dimensions.width_mm) ? "" : formData.dimensions.width_mm} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, width_mm: parseFloat(e.target.value) } })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Alto</label>
                  <input type="number" value={isNaN(formData.dimensions.height_mm) ? "" : formData.dimensions.height_mm} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height_mm: parseFloat(e.target.value) } })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
              </>
            ) : formData.product_line === "Esquineros" ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Ala (mm)</label>
                  <input type="number" value={isNaN(formData.dimensions.wing_1_mm) ? "" : formData.dimensions.wing_1_mm} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, wing_1_mm: parseFloat(e.target.value), wing_2_mm: parseFloat(e.target.value) } })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Espesor</label>
                  <input type="number" value={isNaN(formData.dimensions.thickness_mm) ? "" : formData.dimensions.thickness_mm} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, thickness_mm: parseFloat(e.target.value) } })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Diámetro Int.</label>
                  <input type="number" value={isNaN(formData.dimensions.diameter_mm) ? "" : formData.dimensions.diameter_mm} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, diameter_mm: parseFloat(e.target.value) } })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Pared (Espesor)</label>
                  <input type="number" value={isNaN(formData.dimensions.thickness_mm) ? "" : formData.dimensions.thickness_mm} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, thickness_mm: parseFloat(e.target.value) } })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black" />
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
              <select value={formData.bom.lamina_madre} onChange={(e) => setFormData({ ...formData, bom: { ...formData.bom, lamina_madre: e.target.value } })} className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black">
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
                        setFormData({ ...formData, bom: { ...formData.bom, layers: newLayers } });
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
                        setFormData({ ...formData, bom: { ...formData.bom, layers: newLayers } });
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
                  <select
                    value={formData.bom.glue_name}
                    onChange={(e) => {
                      const autoLayers = Math.max(0, formData.bom.layers.length - 1);
                      setFormData({ ...formData, bom: { ...formData.bom, glue_name: e.target.value, glue_layers: autoLayers } });
                    }}
                    className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black"
                  >
                    <option value="">Auto (~10% peso papel)</option>
                    {glues.map(g => <option key={g.id} value={g.name}>{g.name} (${g.cost_per_unit}/{g.unit_measure})</option>)}
                  </select>
                </div>
                {formData.bom.glue_name && (
                  showAdvanced ? (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Consumo (GMS / m²)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={formData.bom.glue_gms}
                          onChange={(e) => setFormData({ ...formData, bom: { ...formData.bom, glue_gms: parseFloat(e.target.value) || 0 } })}
                          className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black font-semibold"
                          placeholder="Ej. 70"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Capas de Pegante</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.bom.glue_layers}
                          onChange={(e) => setFormData({ ...formData, bom: { ...formData.bom, glue_layers: parseInt(e.target.value) || 0 } })}
                          className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-black font-semibold"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 bg-gray-50 border border-gray-100 rounded-lg p-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5 text-black">Consumo Pegante</span>
                        <span className="font-bold text-gray-700">
                          {(() => {
                            const thickness = formData.dimensions.thickness_mm || 5.0;
                            if (thickness <= 1.8) return 55;
                            if (thickness <= 2.9) return 65;
                            if (thickness <= 5.0) return 70;
                            if (thickness <= 7.5) return 80;
                            if (thickness <= 12.0) return 100;
                            return 120;
                          })()} gr/m² <span className="text-gray-400 font-normal">(Asignado)</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5 text-black">Capas de Pegante</span>
                        <span className="font-bold text-gray-700">
                          {Math.max(1, formData.bom.layers.length - 1)} capas <span className="text-gray-400 font-normal">(Auto)</span>
                        </span>
                      </div>
                    </div>
                  )
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
                        setFormData({ ...formData, bom: { ...formData.bom, accessories: newAcc } });
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
                        setFormData({ ...formData, bom: { ...formData.bom, accessories: newAcc } });
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
          <div className="flex justify-between items-center mb-3 border-b pb-2">
            <h4 className="font-bold text-gray-800">Ruta de Producción (Routing)</h4>
            <div className="flex items-center gap-2">
              <select
                id="route-add-select"
                className="text-xs border rounded-lg p-1.5 bg-white text-black font-medium"
                defaultValue=""
              >
                <option value="">+ Añadir paso...</option>
                {routes
                  .filter(r => r.product_line === formData.product_line)
                  .map(r => (
                    <option key={r.id} value={r.id}>{r.process_name}</option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const sel = document.getElementById("route-add-select") as HTMLSelectElement;
                  const routeId = sel?.value;
                  if (!routeId) return;
                  const routeRow = routes.find((r: any) => String(r.id) === routeId);
                  if (routeRow) addRoutingStep(routeRow);
                  sel.value = "";
                }}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700"
              >
                Añadir
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {formData.routing.map((r, idx) => (
              <div key={idx} className={`flex gap-2 items-center text-sm rounded-xl p-1 ${r.operator_count === 0 ? "opacity-50 bg-gray-50 border border-dashed border-gray-300" : ""}`}>
                <div className="flex-1 font-bold text-gray-700 bg-gray-100 p-2.5 rounded-lg">
                  {r.step}
                  {r.operator_count === 0 && <span className="ml-2 text-[9px] text-gray-400 font-normal uppercase tracking-wider">— ignorado</span>}
                </div>
                <div className="w-48">
                  <label className="text-[9px] uppercase text-gray-500 block">Perfil Operario</label>
                  <select
                    value={r.labor_profile}
                    onChange={(e) => {
                      const newR = [...formData.routing];
                      newR[idx].labor_profile = e.target.value;
                      setFormData({ ...formData, routing: newR });
                    }}
                    className="w-full p-1.5 border rounded-lg text-black bg-white text-xs font-semibold"
                    disabled={r.operator_count === 0}
                  >
                    <option value="">Seleccionar perfil...</option>
                    {laborProfiles.map(p => (
                      <option key={p.id} value={p.profile_name}>{p.profile_name} (${(p.base_salary_monthly / 160).toLocaleString(undefined, { maximumFractionDigits: 0 })}/h base)</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-[9px] uppercase text-gray-500 block">Vel. (Und/h)</label>
                  <input
                    type="number"
                    value={r.speed}
                    onChange={(e) => {
                      const newR = [...formData.routing];
                      newR[idx].speed = parseFloat(e.target.value);
                      setFormData({ ...formData, routing: newR });
                    }}
                    className="w-full p-1.5 border rounded-lg text-black bg-white font-medium"
                    disabled={r.operator_count === 0}
                  />
                </div>
                <div className="w-20">
                  <label className="text-[9px] uppercase text-gray-500 block">Setup (h)</label>
                  <input
                    type="number"
                    value={r.setup_hours}
                    onChange={(e) => {
                      const newR = [...formData.routing];
                      newR[idx].setup_hours = parseFloat(e.target.value);
                      setFormData({ ...formData, routing: newR });
                    }}
                    className="w-full p-1.5 border rounded-lg text-black bg-white font-medium"
                    disabled={r.operator_count === 0}
                  />
                </div>
                <div className="w-16">
                  <label className="text-[9px] uppercase text-gray-500 block">Operarios</label>
                  <input
                    type="number"
                    min="0"
                    value={r.operator_count}
                    onChange={(e) => {
                      const newR = [...formData.routing];
                      newR[idx].operator_count = parseInt(e.target.value) ?? 0;
                      setFormData({ ...formData, routing: newR });
                    }}
                    className={`w-full p-1.5 border rounded-lg text-black font-medium ${
                      r.operator_count === 0 ? "bg-gray-200 text-gray-400" : "bg-white"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRoutingStep(idx)}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0"
                  title="Eliminar paso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {formData.routing.length === 0 && <p className="text-xs text-gray-400 italic">No hay pasos en la ruta. Usa el selector de arriba para añadir.</p>}
          </div>
          {/* Logística y Empaque */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Logística y Empaque</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehículo */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Vehículo de Envío</label>
                <select value={formData.logistics.truck_type} onChange={(e) => setFormData({ ...formData, logistics: { truck_type: e.target.value } })} className="w-full p-2.5 border rounded-lg text-sm bg-gray-50 text-black font-semibold">
                  <option value="">Cálculo y Asignación Automática</option>
                  <option value="Sin flete">Sin flete (Retiro en planta)</option>
                  {logistics.map(v => <option key={v.id} value={v.truck_type}>{v.truck_type} ({v.volume_m3} m³)</option>)}
                </select>

                <div className="mt-3">
                  <label className="inline-flex items-center text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceManualFreight}
                      onChange={(e) => setForceManualFreight(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-2 h-4 w-4"
                    />
                    Forzar tarifa de flete manual
                  </label>
                  {forceManualFreight && (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Costo Flete Manual (COP)</label>
                      <input
                        type="number"
                        value={manualFreightCost}
                        onChange={(e) => setManualFreightCost(e.target.value)}
                        className="w-full p-2 border-2 border-orange-300 rounded-lg text-sm bg-orange-50 text-black font-bold"
                        placeholder="Ej. 45000"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Insumos de Empaque */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black">Insumos de Empaque Secundario</label>

                <div className="flex gap-2 mb-3">
                  <select id="pkg-select" className="flex-1 p-2 border rounded-lg text-xs bg-white text-black font-medium">
                    <option value="">Añadir empaque...</option>
                    {packagings.map(p => <option key={p.id} value={p.name}>{p.name} (${p.cost_per_unit}/{p.unit_measure})</option>)}
                  </select>
                  <input id="pkg-qty" type="number" defaultValue="1" min="1" className="w-16 p-2 border rounded-lg text-xs bg-white text-black font-semibold text-center" title="Cantidad" />
                  <button
                    type="button"
                    onClick={() => {
                      const select = document.getElementById("pkg-select") as HTMLSelectElement;
                      const qtyInput = document.getElementById("pkg-qty") as HTMLInputElement;
                      const val = select?.value;
                      const qty = parseFloat(qtyInput?.value) || 1;
                      if (!val) return;
                      if (formData.packaging.some(p => p.material_name === val)) {
                        alert("Empaque ya agregado.");
                        return;
                      }
                      setFormData(prev => ({
                        ...prev,
                        packaging: [...prev.packaging, { material_name: val, quantity: qty }]
                      }));
                      select.value = "";
                      qtyInput.value = "1";
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                  >
                    Añadir
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {formData.packaging.map((pkg, idx) => {
                    const isBox = /\d+x\d+x\d+/.test(pkg.material_name);
                    return (
                      <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 border rounded-lg">
                        <span className="flex-1 text-xs font-semibold text-gray-700 truncate">{pkg.material_name}</span>
                        {isBox && (formData.product_line === "Tubos" || formData.product_line === "Envases") ? (
                          <span className="text-[9px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded border border-green-200">
                            Cubicación Auto
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-gray-400 font-bold">Cant:</span>
                            <input
                              type="number"
                              value={pkg.quantity}
                              onChange={(e) => {
                                const newPkg = [...formData.packaging];
                                newPkg[idx].quantity = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, packaging: newPkg });
                              }}
                              className="w-12 p-1 border rounded text-xs text-black font-semibold text-center"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newPkg = [...formData.packaging];
                            newPkg.splice(idx, 1);
                            setFormData({ ...formData, packaging: newPkg });
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {formData.packaging.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-2 bg-gray-50 border rounded-lg border-dashed">No se han seleccionado empaques secundarios.</p>
                  )}
                </div>
              </div>
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

              {/* Estado de Resultados proyectado */}
              {result.income_statement && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-3">Estado de Resultados Proyectado</div>

                  <div className="bg-gray-900 text-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-800 text-xs">
                    <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-gray-300">Concepto Financiero</span>
                      <span className="font-bold uppercase tracking-wider text-[10px] text-gray-300">Valor (COP)</span>
                    </div>

                    <div className="divide-y divide-gray-800">
                      <div className="p-3 flex justify-between items-center">
                        <span className="text-gray-400">Ingresos Totales (Venta de Proyecto)</span>
                        <span className="font-semibold text-white">${result.income_statement.venta_total.toLocaleString()}</span>
                      </div>

                      <div className="p-3 flex justify-between items-center">
                        <span className="text-gray-400">(-) Costo Materia Prima e Insumos</span>
                        <span className="text-gray-300">${result.income_statement.costo_materia_prima.toLocaleString()}</span>
                      </div>

                      <div className="p-3 flex justify-between items-center bg-gray-800/40">
                        <span className="font-bold text-gray-200">(=) Utilidad Bruta</span>
                        <span className="font-bold text-blue-400">${result.income_statement.utilidad_bruta.toLocaleString()}</span>
                      </div>

                      <div className="p-3 flex justify-between items-center">
                        <span className="text-gray-400">(-) Mano de Obra Directa (MOD)</span>
                        <span className="text-gray-300">${result.income_statement.mano_de_obra.toLocaleString()}</span>
                      </div>

                      <div className="p-3 flex justify-between items-center">
                        <span className="text-gray-400">(-) Carga Fabril CIF Proporcional</span>
                        <span className="text-gray-300">${result.income_statement.carga_fabril_cif.toLocaleString()}</span>
                      </div>

                      <div className="p-3 flex justify-between items-center bg-gray-800/30 font-semibold text-gray-200">
                        <span>(=) Gastos Operacionales (MOD + CIF)</span>
                        <span className="text-orange-400">${(result.income_statement.mano_de_obra + result.income_statement.carga_fabril_cif).toLocaleString()}</span>
                      </div>

                      <div className="p-3 flex justify-between items-center">
                        <span className="text-gray-400">(-) Otros Gastos (NIF + Flete)</span>
                        <span className="text-gray-300">${result.income_statement.gastos_operacionales.toLocaleString()}</span>
                      </div>

                      <div className="p-3 flex justify-between items-center bg-gray-800 font-bold">
                        <span className="text-gray-100">(=) Utilidad Operacional (EBIT)</span>
                        <span className="text-yellow-400">${result.income_statement.utilidad_operacional.toLocaleString()}</span>
                      </div>

                      <div className="p-3 flex justify-between items-center">
                        <span className="text-gray-400">(-) Provisión Impuesto de Renta (35%)</span>
                        <span className="text-red-400">${result.income_statement.impuestos.toLocaleString()}</span>
                      </div>

                      <div className="p-4 flex justify-between items-center bg-black font-black text-sm border-t border-gray-700">
                        <span className="text-white">(=) Utilidad Neta del Ejercicio</span>
                        <span className={result.income_statement.rentabilidad_neta_ejercicio > 0 ? "text-[#10B981]" : "text-red-400"}>
                          ${result.income_statement.rentabilidad_neta_ejercicio.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-black/80 border-t border-gray-850 flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-400">Rentabilidad Neta del Ejercicio</span>
                      <span className={`px-2.5 py-1 rounded-full font-black text-xs ${result.income_statement.porcentaje_rentabilidad > 15
                          ? "bg-green-950 text-green-400 border border-green-800"
                          : result.income_statement.porcentaje_rentabilidad > 0
                            ? "bg-yellow-950 text-yellow-400 border border-yellow-800"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}>
                        {result.income_statement.porcentaje_rentabilidad.toFixed(2)} %
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {onAdd && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => onAdd(getPayload(), result)}
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
