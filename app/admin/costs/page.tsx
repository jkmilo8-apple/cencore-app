"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, Save, Layers, Truck, Settings2, HardHat, Factory, Plus, Loader2, CheckCircle2, AlertCircle, Package, X
} from "lucide-react";
import Link from "next/link";
import { 
  getMaterialsCatalog, createMaterial, updateMaterial,
  getLaborRoutes, createLaborRoute, updateLaborRoute,
  getVehicles, updateVehicle, createVehicle,
  getLaborProvisions, updateLaborProvision,
  getIndirectCosts, createIndirectCost, updateIndirectCost,
  getBusinessLines, updateBusinessLine, createBusinessLine,
  getLaborProfiles, createLaborProfile, updateLaborProfile
} from "@/actions/pricing_config";

const TABS = [
  { id: "materials", name: "Catálogo de Materiales (V2)", icon: Layers },
  { id: "labor_routes", name: "Rutas de Producción (V2)", icon: Settings2 },
  { id: "labor", name: "Mano de Obra (V2)", icon: HardHat },
  { id: "indirect", name: "Costos Fijos y Var (NIF/CIF)", icon: Factory },
  { id: "logistics", name: "Logística y Fletes", icon: Truck },
  { id: "business_lines", name: "Líneas de Negocio", icon: Package },
];

export default function PricingAdminPage() {
  const [activeTab, setActiveTab] = useState("materials");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [data, setData] = useState<any>({
    materials: [], laborRoutes: [], vehicles: [], labor: [], laborProfiles: [], indirect: [], businessLines: []
  });
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  
  const [showNewMaterial, setShowNewMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: "", category: "Papel", unit_measure: "kg", cost_per_unit: 0 });

  const [showNewRoute, setShowNewRoute] = useState(false);
  const [newRoute, setNewRoute] = useState({ product_line: "Tubos", process_name: "", nominal_speed_hr: 0, setup_hours: 0, operator_count: 1 });

  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ vehicle_type: "", cubic_capacity: 0, freight_cost: 0, dimensions: "" });

  const [showNewIndirect, setShowNewIndirect] = useState(false);
  const [newIndirect, setNewIndirect] = useState({ 
    item_name: "", 
    cost_type: "fixed", 
    amount: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: ""
  });

  const [showNewBL, setShowNewBL] = useState(false);
  const [newBL, setNewBL] = useState({ name: "", code: "", description: "" });

  // Nuevo estado para perfil laboral
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({
    profile_name: "",
    profile_type: "Operativo",
    base_salary_monthly: 0,
    eps_pct: 8.5,
    pension_pct: 12.0,
    arl_pct: 0.522,
    cesantias_pct: 8.33,
    prima_pct: 8.33,
    vacaciones_pct: 4.17,
    intereses_cesantias_pct: 1.0,
    ccf_pct: 4.0,
    sena_pct: 0.0,
    icbf_pct: 0.0,
    transport_subsidy: 162000
  });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const [mat, routes, v, l, profiles, ind, bl] = await Promise.all([
      getMaterialsCatalog(), 
      getLaborRoutes(), 
      getVehicles(), 
      getLaborProvisions(), 
      getLaborProfiles(),
      getIndirectCosts(), 
      getBusinessLines()
    ]);
    setData({
      materials: mat.data || [], 
      laborRoutes: routes.data || [], 
      vehicles: v.data || [],
      labor: l.data || [], 
      laborProfiles: profiles.data || [],
      indirect: ind.data || [], 
      businessLines: bl.data || []
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  const handleUpdate = async (type: string, id: string, updates: any, actionFn: any) => {
    setSaving(id);
    const { error } = await actionFn(id, updates);
    if (error) setMessage({ type: "error", text: error });
    else {
      setMessage({ type: "success", text: "Actualizado exitosamente" });
      loadAllData();
    }
    setTimeout(() => setMessage(null), 3000);
    setSaving(null);
  };

  const handleCreateMaterial = async () => {
    setSaving("new_material");
    const { error } = await createMaterial(newMaterial);
    if (error) setMessage({ type: "error", text: error });
    else {
      setMessage({ type: "success", text: "Material creado exitosamente" });
      setShowNewMaterial(false);
      setNewMaterial({ name: "", category: "Papel", unit_measure: "kg", cost_per_unit: 0 });
      loadAllData();
    }
    setTimeout(() => setMessage(null), 3000);
    setSaving(null);
  };

  const handleCreateRoute = async () => {
    setSaving("new_route");
    const { error } = await createLaborRoute(newRoute);
    if (error) setMessage({ type: "error", text: error });
    else {
      setMessage({ type: "success", text: "Ruta creada exitosamente" });
      setShowNewRoute(false);
      setNewRoute({ product_line: "Tubos", process_name: "", nominal_speed_hr: 0, setup_hours: 0, operator_count: 1 });
      loadAllData();
    }
    setTimeout(() => setMessage(null), 3000);
    setSaving(null);
  };

  const handleCreateVehicle = async () => {
    setSaving("new_veh");
    const { error } = await createVehicle(newVehicle);
    if (error) setMessage({ type: "error", text: error });
    else {
      setMessage({ type: "success", text: "Vehículo creado" });
      setShowNewVehicle(false);
      setNewVehicle({ vehicle_type: "", cubic_capacity: 0, freight_cost: 0, dimensions: "" });
      loadAllData();
    }
    setTimeout(() => setMessage(null), 3000);
    setSaving(null);
  };

  const handleCreateIndirect = async () => {
    setSaving("new_ind");
    const payload = {
      ...newIndirect,
      end_date: newIndirect.end_date || null
    };
    const { error } = await createIndirectCost(payload);
    if (error) setMessage({ type: "error", text: error });
    else {
      setMessage({ type: "success", text: "Costo NIF/CIF creado" });
      setShowNewIndirect(false);
      setNewIndirect({ 
        item_name: "", 
        cost_type: "fixed", 
        amount: 0,
        start_date: new Date().toISOString().split("T")[0],
        end_date: ""
      });
      loadAllData();
    }
    setTimeout(() => setMessage(null), 3000);
    setSaving(null);
  };

  const handleCreateBL = async () => {
    setSaving("new_bl");
    const { error } = await createBusinessLine(newBL);
    if (error) setMessage({ type: "error", text: error });
    else {
      setMessage({ type: "success", text: "Línea de Negocio creada" });
      setShowNewBL(false);
      setNewBL({ name: "", code: "", description: "" });
      loadAllData();
    }
    setTimeout(() => setMessage(null), 3000);
    setSaving(null);
  };

  const handleCreateProfile = async () => {
    setSaving("new_profile");
    const { error } = await createLaborProfile(newProfile);
    if (error) setMessage({ type: "error", text: error });
    else {
      setMessage({ type: "success", text: "Perfil laboral creado" });
      setShowNewProfile(false);
      setNewProfile({
        profile_name: "",
        profile_type: "Operativo",
        base_salary_monthly: 0,
        eps_pct: 8.5,
        pension_pct: 12.0,
        arl_pct: 0.522,
        cesantias_pct: 8.33,
        prima_pct: 8.33,
        vacaciones_pct: 4.17,
        intereses_cesantias_pct: 1.0,
        ccf_pct: 4.0,
        sena_pct: 0.0,
        icbf_pct: 0.0,
        transport_subsidy: 162000
      });
      loadAllData();
    }
    setTimeout(() => setMessage(null), 3000);
    setSaving(null);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF8F6]">
      <Loader2 className="h-12 w-12 text-[#F97316] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF8F6] pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#1F2937] tracking-tight">Motor de Precios</h1>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest text-black">Matriz de Costos Industriales V2</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-2">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === tab.id ? "bg-[#1F2937] text-white shadow-lg" : "bg-white text-gray-500 hover:bg-gray-50 border border-transparent"}`}>
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? "text-[#F97316]" : ""}`} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">{TABS.find(t => t.id === activeTab)?.name}</h2>
                {message && (
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold animate-in fade-in slide-in-from-top-1 ${message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    {message.type === "success" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    <span>{message.text}</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* MATERIALS CATALOG V2 */}
                {activeTab === "materials" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-gray-500 text-black">Gestión unificada de materias primas e insumos.</p>
                      <button onClick={() => setShowNewMaterial(!showNewMaterial)} className="bg-[#F97316] text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-orange-600 transition-colors">
                        <Plus className="h-4 w-4" /> Nuevo Material
                      </button>
                    </div>

                    {showNewMaterial && (
                      <div className="flex flex-wrap justify-between items-end gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="flex flex-col space-y-2">
                          <input type="text" placeholder="Nombre (Ej. America 300)" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="p-2 border rounded text-sm text-black w-48" />
                          <div className="flex space-x-2">
                            <select value={newMaterial.category} onChange={e => setNewMaterial({...newMaterial, category: e.target.value})} className="w-32 p-2 border rounded text-sm text-black bg-white">
                              <option value="Papel">Papel</option>
                              <option value="Corrugado">Corrugado</option>
                              <option value="Pegante">Pegante</option>
                              <option value="Accesorio">Accesorio</option>
                              <option value="Empaque">Empaque</option>
                            </select>
                            <input type="text" placeholder="Und. (Ej. kg)" value={newMaterial.unit_measure} onChange={e => setNewMaterial({...newMaterial, unit_measure: e.target.value})} className="w-20 p-2 border rounded text-sm text-black" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-orange-600 uppercase">Costo por Und.</p>
                            <input type="number" value={newMaterial.cost_per_unit} onChange={e => setNewMaterial({...newMaterial, cost_per_unit: parseFloat(e.target.value)})} className="w-24 p-2 border rounded-lg text-sm font-bold text-right text-black bg-white" />
                          </div>
                          <button onClick={handleCreateMaterial} disabled={saving === "new_material" || !newMaterial.name} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg disabled:opacity-50">
                            {saving === "new_material" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </button>
                          <button onClick={() => { setShowNewMaterial(false); setNewMaterial({ name: "", category: "Papel", unit_measure: "kg", cost_per_unit: 0 }); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {["Papel", "Corrugado", "Pegante", "Accesorio", "Empaque"].map(category => {
                      const items = data.materials.filter((m: any) => m.category === category);
                      if (items.length === 0) return null;
                      return (
                        <div key={category} className="mb-6">
                          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase border-b pb-1">{category}</h3>
                          <div className="space-y-2">
                            {items.map((m: any) => (
                              <div key={m.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col space-y-2">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-gray-800 text-sm">{m.name}</p>
                                    <p className="text-xs text-gray-500">Unidad: {m.unit_measure}</p>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Costo</p>
                                      <input type="number" defaultValue={m.cost_per_unit} onBlur={(e) => handleUpdate("material", m.id, { cost_per_unit: parseFloat(e.target.value) }, updateMaterial)} className="w-24 p-1.5 border rounded text-sm font-bold text-right text-black bg-white" />
                                    </div>
                                    <div className="w-8 flex justify-center">{saving === m.id ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <Save className="h-4 w-4 text-gray-300" />}</div>
                                  </div>
                                </div>

                                {category === "Empaque" && (
                                  <div className="mt-2 text-xs border-t pt-2 border-gray-200">
                                    <span className="font-bold text-gray-600 block mb-1">Dependencias automáticas de insumo:</span>
                                    {m.dependencies && m.dependencies.length > 0 ? (
                                      <div className="flex flex-wrap gap-2 items-center mb-2">
                                        {m.dependencies.map((dep: any, idx: number) => (
                                          <span key={idx} className="bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded flex items-center gap-1">
                                            {dep.material_name} ({dep.quantity_ratio}x)
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                const newDeps = m.dependencies.filter((_: any, i: number) => i !== idx);
                                                handleUpdate("material", m.id, { dependencies: newDeps.length > 0 ? newDeps : null }, updateMaterial);
                                              }}
                                              className="hover:text-red-500 font-bold ml-1"
                                              title="Eliminar dependencia"
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic block mb-2">Sin dependencias configuradas</span>
                                    )}
                                    
                                    <div className="flex gap-2 items-center flex-wrap">
                                      <select 
                                        id={`dep-select-${m.id}`} 
                                        className="text-[11px] p-1 border rounded bg-white text-black max-w-xs"
                                        defaultValue=""
                                      >
                                        <option value="" disabled>Vincular otro material...</option>
                                        {data.materials
                                          .filter((mat: any) => mat.id !== m.id)
                                          .map((mat: any) => (
                                            <option key={mat.id} value={mat.name}>{mat.name}</option>
                                          ))
                                        }
                                      </select>
                                      <input 
                                        id={`dep-ratio-${m.id}`} 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="Ratio" 
                                        className="w-16 text-[11px] p-1 border rounded text-black bg-white" 
                                        defaultValue="1.0"
                                      />
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const selectEl = document.getElementById(`dep-select-${m.id}`) as HTMLSelectElement;
                                          const ratioEl = document.getElementById(`dep-ratio-${m.id}`) as HTMLInputElement;
                                          const matName = selectEl.value;
                                          const ratio = parseFloat(ratioEl.value) || 1.0;
                                          if (matName) {
                                            const currentDeps = m.dependencies || [];
                                            const newDeps = [...currentDeps, { material_name: matName, quantity_ratio: ratio }];
                                            handleUpdate("material", m.id, { dependencies: newDeps }, updateMaterial);
                                            selectEl.value = "";
                                            ratioEl.value = "1.0";
                                          }
                                        }}
                                        className="bg-gray-800 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-gray-700 transition-colors"
                                      >
                                        Vincular
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* LABOR ROUTES V2 */}
                {activeTab === "labor_routes" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-gray-500 text-black">Rutas de producción y capacidades nominales.</p>
                      <button onClick={() => setShowNewRoute(!showNewRoute)} className="bg-[#F97316] text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-orange-600 transition-colors">
                        <Plus className="h-4 w-4" /> Nueva Ruta
                      </button>
                    </div>

                    {showNewRoute && (
                      <div className="flex flex-wrap justify-between items-end gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="flex flex-col space-y-2">
                          <select value={newRoute.product_line} onChange={e => setNewRoute({...newRoute, product_line: e.target.value})} className="p-2 border rounded text-sm text-black bg-white w-36">
                            <option value="Tubos">Tubos</option>
                            <option value="Envases">Envases</option>
                            <option value="Corrugado">Corrugado</option>
                            <option value="Esquineros">Esquineros</option>
                          </select>
                          <input type="text" placeholder="Proceso (Ej. Formar)" value={newRoute.process_name} onChange={e => setNewRoute({...newRoute, process_name: e.target.value})} className="p-2 border rounded text-sm text-black w-36" />
                        </div>
                        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-orange-600 uppercase">Velocidad/h</p>
                            <input type="number" step="1" value={newRoute.nominal_speed_hr} onChange={e => setNewRoute({...newRoute, nominal_speed_hr: parseFloat(e.target.value)})} className="w-20 p-2 border rounded-lg text-sm font-bold text-right text-black" />
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-orange-600 uppercase">Setup (h)</p>
                            <input type="number" step="0.1" value={newRoute.setup_hours} onChange={e => setNewRoute({...newRoute, setup_hours: parseFloat(e.target.value)})} className="w-20 p-2 border rounded-lg text-sm font-bold text-right text-black" />
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-orange-600 uppercase">Operarios</p>
                            <input type="number" step="1" value={newRoute.operator_count} onChange={e => setNewRoute({...newRoute, operator_count: parseInt(e.target.value)})} className="w-16 p-2 border rounded-lg text-sm font-bold text-right text-black" />
                          </div>
                          <button onClick={handleCreateRoute} disabled={saving === "new_route" || !newRoute.process_name} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg disabled:opacity-50">
                            {saving === "new_route" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </button>
                          <button onClick={() => { setShowNewRoute(false); setNewRoute({ product_line: "Tubos", process_name: "", nominal_speed_hr: 0, setup_hours: 0, operator_count: 1 }); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {["Tubos", "Envases", "Corrugado", "Esquineros"].map(product_line => {
                      const items = data.laborRoutes.filter((r: any) => r.product_line === product_line);
                      if (items.length === 0) return null;
                      return (
                        <div key={product_line} className="mb-6">
                          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase border-b pb-1">{product_line}</h3>
                          <div className="space-y-2">
                            {items.map((p: any) => (
                              <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="font-bold text-gray-800 w-1/4 text-black text-sm">{p.process_name}</p>
                                <div className="flex items-center space-x-4 w-3/4 justify-end">
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Velocidad/h</p>
                                    <input type="number" step="1" defaultValue={p.nominal_speed_hr} onBlur={(e) => handleUpdate("route", p.id, { nominal_speed_hr: parseFloat(e.target.value) }, updateLaborRoute)} className="w-20 p-1.5 border rounded text-sm font-bold text-right text-black bg-white" />
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Setup (h)</p>
                                    <input type="number" step="0.1" defaultValue={p.setup_hours} onBlur={(e) => handleUpdate("route", p.id, { setup_hours: parseFloat(e.target.value) }, updateLaborRoute)} className="w-20 p-1.5 border rounded text-sm font-bold text-right text-black bg-white" />
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Operarios</p>
                                    <input type="number" defaultValue={p.operator_count} onBlur={(e) => handleUpdate("route", p.id, { operator_count: parseInt(e.target.value) }, updateLaborRoute)} className="w-16 p-1.5 border rounded text-sm font-bold text-right text-black bg-white" />
                                  </div>
                                  <div className="w-8 flex justify-center">{saving === p.id ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <Save className="h-4 w-4 text-gray-300" />}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* LABOR */}
                {activeTab === "labor" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">Perfiles Laborales V2</h3>
                        <p className="text-xs text-gray-500">Defina los salarios, subsidios y factores parafiscales de ley por cargo.</p>
                      </div>
                      <button onClick={() => setShowNewProfile(!showNewProfile)} className="bg-[#F97316] text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-orange-600 transition-colors">
                        <Plus className="h-4 w-4" /> Nuevo Perfil
                      </button>
                    </div>

                    {showNewProfile && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4">
                        <h4 className="font-bold text-orange-800 text-sm">Crear Nuevo Perfil Laboral</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-orange-600 uppercase block mb-1">Nombre del Perfil</label>
                            <input type="text" placeholder="Ej. Operario Extrusora" value={newProfile.profile_name} onChange={e => setNewProfile({...newProfile, profile_name: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-orange-600 uppercase block mb-1">Tipo de Perfil</label>
                            <select value={newProfile.profile_type} onChange={e => setNewProfile({...newProfile, profile_type: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white text-black">
                              <option value="Operativo">Operativo</option>
                              <option value="Administrativo">Administrativo</option>
                              <option value="Gerencial">Gerencial</option>
                              <option value="Prestación de Servicios">Prestación de Servicios</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-orange-600 uppercase block mb-1">Salario Base Mensual</label>
                            <input type="number" placeholder="Ej. 1300000" value={newProfile.base_salary_monthly} onChange={e => setNewProfile({...newProfile, base_salary_monthly: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded-lg text-sm bg-white text-black font-bold" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Aux. Transporte</label>
                            <input type="number" value={newProfile.transport_subsidy} onChange={e => setNewProfile({...newProfile, transport_subsidy: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">EPS (%)</label>
                            <input type="number" step="0.01" value={newProfile.eps_pct} onChange={e => setNewProfile({...newProfile, eps_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Pensión (%)</label>
                            <input type="number" step="0.01" value={newProfile.pension_pct} onChange={e => setNewProfile({...newProfile, pension_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">ARL (%)</label>
                            <input type="number" step="0.001" value={newProfile.arl_pct} onChange={e => setNewProfile({...newProfile, arl_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Cesantías (%)</label>
                            <input type="number" step="0.01" value={newProfile.cesantias_pct} onChange={e => setNewProfile({...newProfile, cesantias_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Prima (%)</label>
                            <input type="number" step="0.01" value={newProfile.prima_pct} onChange={e => setNewProfile({...newProfile, prima_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Vacaciones (%)</label>
                            <input type="number" step="0.01" value={newProfile.vacaciones_pct} onChange={e => setNewProfile({...newProfile, vacaciones_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Int. Cesantías (%)</label>
                            <input type="number" step="0.01" value={newProfile.intereses_cesantias_pct} onChange={e => setNewProfile({...newProfile, intereses_cesantias_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">CCF (%)</label>
                            <input type="number" step="0.01" value={newProfile.ccf_pct} onChange={e => setNewProfile({...newProfile, ccf_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">SENA (%)</label>
                            <input type="number" step="0.01" value={newProfile.sena_pct} onChange={e => setNewProfile({...newProfile, sena_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">ICBF (%)</label>
                            <input type="number" step="0.01" value={newProfile.icbf_pct} onChange={e => setNewProfile({...newProfile, icbf_pct: parseFloat(e.target.value) || 0})} className="w-full p-1.5 border rounded text-xs bg-white text-black" />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-orange-200">
                          <button onClick={() => { setShowNewProfile(false); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                            Cancelar
                          </button>
                          <button onClick={handleCreateProfile} disabled={saving === "new_profile" || !newProfile.profile_name} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50">
                            {saving === "new_profile" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Perfil"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {data.laborProfiles && data.laborProfiles.map((p: any) => {
                        // Cálculo en vivo
                        const sumPcts = (p.eps_pct || 0) + (p.pension_pct || 0) + (p.arl_pct || 0) + (p.cesantias_pct || 0) + (p.prima_pct || 0) + (p.vacaciones_pct || 0) + (p.intereses_cesantias_pct || 0) + (p.ccf_pct || 0) + (p.sena_pct || 0) + (p.icbf_pct || 0);
                        const monthlyCost = p.profile_type === "Prestación de Servicios"
                          ? (p.base_salary_monthly || 0)
                          : (p.base_salary_monthly || 0) * (1 + sumPcts / 100) + (p.transport_subsidy || 0);
                        const hourlyRate = monthlyCost / 160;

                        return (
                          <div key={p.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                              <div>
                                <span className="font-bold text-gray-800 text-sm mr-2">{p.profile_name}</span>
                                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{p.profile_type}</span>
                              </div>
                              <div className="w-8 flex justify-center">{saving === p.id ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <Save className="h-4 w-4 text-gray-300" />}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Salario Base Mensual</label>
                                <input 
                                  type="number" 
                                  defaultValue={p.base_salary_monthly} 
                                  onBlur={(e) => handleUpdate("laborProfile", p.id, { base_salary_monthly: parseFloat(e.target.value) || 0 }, updateLaborProfile)} 
                                  className="w-full p-2 border rounded-lg text-sm bg-white text-black font-bold" 
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Aux. Transporte</label>
                                <input 
                                  type="number" 
                                  defaultValue={p.transport_subsidy} 
                                  onBlur={(e) => handleUpdate("laborProfile", p.id, { transport_subsidy: parseFloat(e.target.value) || 0 }, updateLaborProfile)} 
                                  className="w-full p-2 border rounded-lg text-sm bg-white text-black" 
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tipo de Cargo</label>
                                <select 
                                  value={p.profile_type} 
                                  onChange={(e) => handleUpdate("laborProfile", p.id, { profile_type: e.target.value }, updateLaborProfile)} 
                                  className="w-full p-2 border rounded-lg text-sm bg-white text-black"
                                >
                                  <option value="Operativo">Operativo</option>
                                  <option value="Administrativo">Administrativo</option>
                                  <option value="Gerencial">Gerencial</option>
                                  <option value="Prestación de Servicios">Prestación de Servicios</option>
                                </select>
                              </div>
                            </div>

                            {p.profile_type !== "Prestación de Servicios" && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 bg-white p-3 rounded-lg border border-gray-200">
                                <div>
                                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">EPS (%)</label>
                                  <input type="number" step="0.01" defaultValue={p.eps_pct} onBlur={(e) => handleUpdate("laborProfile", p.id, { eps_pct: parseFloat(e.target.value) || 0 }, updateLaborProfile)} className="w-full p-1 border rounded text-xs bg-gray-50 text-black text-right" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Pensión (%)</label>
                                  <input type="number" step="0.01" defaultValue={p.pension_pct} onBlur={(e) => handleUpdate("laborProfile", p.id, { pension_pct: parseFloat(e.target.value) || 0 }, updateLaborProfile)} className="w-full p-1 border rounded text-xs bg-gray-50 text-black text-right" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">ARL (%)</label>
                                  <input type="number" step="0.001" defaultValue={p.arl_pct} onBlur={(e) => handleUpdate("laborProfile", p.id, { arl_pct: parseFloat(e.target.value) || 0 }, updateLaborProfile)} className="w-full p-1 border rounded text-xs bg-gray-50 text-black text-right" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Cesantías (%)</label>
                                  <input type="number" step="0.01" defaultValue={p.cesantias_pct} onBlur={(e) => handleUpdate("laborProfile", p.id, { cesantias_pct: parseFloat(e.target.value) || 0 }, updateLaborProfile)} className="w-full p-1 border rounded text-xs bg-gray-50 text-black text-right" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Prima (%)</label>
                                  <input type="number" step="0.01" defaultValue={p.prima_pct} onBlur={(e) => handleUpdate("laborProfile", p.id, { prima_pct: parseFloat(e.target.value) || 0 }, updateLaborProfile)} className="w-full p-1 border rounded text-xs bg-gray-50 text-black text-right" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Vacac. (%)</label>
                                  <input type="number" step="0.01" defaultValue={p.vacaciones_pct} onBlur={(e) => handleUpdate("laborProfile", p.id, { vacaciones_pct: parseFloat(e.target.value) || 0 }, updateLaborProfile)} className="w-full p-1 border rounded text-xs bg-gray-50 text-black text-right" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">CCF (%)</label>
                                  <input type="number" step="0.01" defaultValue={p.ccf_pct} onBlur={(e) => handleUpdate("laborProfile", p.id, { ccf_pct: parseFloat(e.target.value) || 0 }, updateLaborProfile)} className="w-full p-1 border rounded text-xs bg-gray-50 text-black text-right" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Sena/ICBF (%)</label>
                                  <div className="flex gap-1">
                                    <input type="number" step="0.01" defaultValue={p.sena_pct} onBlur={(e) => handleUpdate("laborProfile", p.id, { sena_pct: parseFloat(e.target.value) || 0 }, updateLaborProfile)} placeholder="Sena" className="w-full p-1 border rounded text-xs bg-gray-50 text-black text-right" title="Sena" />
                                    <input type="number" step="0.01" defaultValue={p.icbf_pct} onBlur={(e) => handleUpdate("laborProfile", p.id, { icbf_pct: parseFloat(e.target.value) || 0 }, updateLaborProfile)} placeholder="ICBF" className="w-full p-1 border rounded text-xs bg-gray-50 text-black text-right" title="ICBF" />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* LIVE PREVIEW OF CALCULATIONS */}
                            <div className="flex flex-wrap justify-between items-center p-3 bg-orange-50 border border-orange-100 rounded-lg text-xs">
                              <div>
                                <span className="text-gray-500">Recargos Ley: </span>
                                <span className="font-bold text-orange-700">+{sumPcts.toFixed(3)}%</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Costo Mensual Empresa: </span>
                                <span className="font-bold text-[#1F2937]">{formatCurrency(monthlyCost)}</span>
                              </div>
                              <div className="bg-[#1F2937] text-white px-2 py-1 rounded text-[11px] font-bold">
                                Costo Hora MOD: {formatCurrency(hourlyRate)}/h
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LOGISTICS */}
                {activeTab === "logistics" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-gray-500 text-black">Vehículos de Flete</p>
                      <button onClick={() => setShowNewVehicle(!showNewVehicle)} className="bg-[#F97316] text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-orange-600 transition-colors">
                        <Plus className="h-4 w-4" /> Nuevo Vehículo
                      </button>
                    </div>

                    {showNewVehicle && (
                      <div className="flex flex-wrap justify-between items-end gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="flex flex-col space-y-2">
                          <input type="text" placeholder="Tipo de Vehículo" value={newVehicle.vehicle_type} onChange={e => setNewVehicle({...newVehicle, vehicle_type: e.target.value})} className="p-2 border rounded text-sm text-black w-48" />
                          <div className="flex space-x-2">
                            <input type="number" placeholder="Capacidad m³" value={newVehicle.cubic_capacity} onChange={e => setNewVehicle({...newVehicle, cubic_capacity: parseFloat(e.target.value)})} className="w-32 p-2 border rounded text-sm text-black" />
                            <input type="text" placeholder="Dimensiones" value={newVehicle.dimensions} onChange={e => setNewVehicle({...newVehicle, dimensions: e.target.value})} className="w-32 p-2 border rounded text-sm text-black" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-orange-600 uppercase">Costo Flete</p>
                            <input type="number" value={newVehicle.freight_cost} onChange={e => setNewVehicle({...newVehicle, freight_cost: parseFloat(e.target.value)})} className="w-32 p-2 border rounded-lg text-sm font-bold text-right text-black bg-white" />
                          </div>
                          <button onClick={handleCreateVehicle} disabled={saving === "new_veh" || !newVehicle.vehicle_type} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg disabled:opacity-50">
                            {saving === "new_veh" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </button>
                          <button onClick={() => { setShowNewVehicle(false); setNewVehicle({ vehicle_type: "", cubic_capacity: 0, freight_cost: 0, dimensions: "" }); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {data.vehicles.map((v: any) => (
                        <div key={v.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div><p className="font-bold text-gray-800 text-black">{v.vehicle_type}</p><p className="text-xs text-gray-500 text-black">Dims: {v.dimensions} | Capacidad: {v.cubic_capacity} m³</p></div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Costo Total Flete</p>
                              <input type="number" defaultValue={v.freight_cost} onBlur={(e) => handleUpdate("veh", v.id, { freight_cost: parseFloat(e.target.value) }, updateVehicle)} className="w-32 p-2 border rounded-lg text-sm font-bold text-right text-black" />
                            </div>
                            <div className="w-8 flex justify-center">{saving === v.id ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <Save className="h-4 w-4 text-gray-300" />}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INDIRECT COSTS */}
                {activeTab === "indirect" && (
                   <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-gray-500 text-black">Costos Indirectos de Fabricación y No Industriales (NIF/CIF)</p>
                      <button onClick={() => setShowNewIndirect(!showNewIndirect)} className="bg-[#F97316] text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-orange-600 transition-colors">
                        <Plus className="h-4 w-4" /> Nuevo Costo
                      </button>
                    </div>

                    {showNewIndirect && (
                      <div className="flex flex-wrap justify-between items-end gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="flex flex-col space-y-2">
                          <input type="text" placeholder="Nombre (Ej. Arriendo)" value={newIndirect.item_name} onChange={e => setNewIndirect({...newIndirect, item_name: e.target.value})} className="p-2 border rounded text-sm text-black w-48 bg-white" />
                          <div className="flex space-x-2">
                            <select value={newIndirect.cost_type} onChange={e => setNewIndirect({...newIndirect, cost_type: e.target.value as "fixed"|"variable"})} className="w-32 p-2 border rounded text-sm text-black bg-white">
                              <option value="fixed">Fijo</option>
                              <option value="variable">Variable</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-[10px] font-bold text-orange-600 uppercase">Vigencia Inicio</span>
                          <input type="date" value={newIndirect.start_date} onChange={e => setNewIndirect({...newIndirect, start_date: e.target.value})} className="p-2 border rounded text-sm text-black w-36 bg-white" />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-[10px] font-bold text-orange-600 uppercase">Vigencia Fin (Opcional)</span>
                          <input type="date" value={newIndirect.end_date} onChange={e => setNewIndirect({...newIndirect, end_date: e.target.value})} className="p-2 border rounded text-sm text-black w-36 bg-white" />
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-orange-600 uppercase">Monto Mensual</p>
                            <input type="number" value={newIndirect.amount} onChange={e => setNewIndirect({...newIndirect, amount: parseFloat(e.target.value) || 0})} className="w-32 p-2 border rounded-lg text-sm font-bold text-right text-black bg-white" />
                          </div>
                          <button onClick={handleCreateIndirect} disabled={saving === "new_ind" || !newIndirect.item_name} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg disabled:opacity-50">
                            {saving === "new_ind" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </button>
                          <button onClick={() => { setShowNewIndirect(false); setNewIndirect({ item_name: "", cost_type: "fixed", amount: 0, start_date: new Date().toISOString().split("T")[0], end_date: "" }); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {data.indirect.map((ind: any) => (
                        <div key={ind.id} className="flex flex-wrap justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                           <div className="flex-1 min-w-[200px]">
                             <p className="font-bold text-gray-800 text-black">{ind.item_name}</p>
                             <div className="flex items-center gap-2 mt-2">
                               <div className="flex flex-col">
                                 <span className="text-[9px] text-gray-400 font-bold uppercase">Inicio</span>
                                 <input 
                                   type="date" 
                                   defaultValue={ind.start_date}
                                   onBlur={(e) => {
                                     if (e.target.value && e.target.value !== ind.start_date) {
                                       handleUpdate("indirect", ind.id, { start_date: e.target.value }, updateIndirectCost);
                                     }
                                   }}
                                   className="text-xs p-1 border border-gray-200 rounded text-black bg-white w-28"
                                 />
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[9px] text-gray-400 font-bold uppercase">Fin</span>
                                 <input 
                                   type="date" 
                                   defaultValue={ind.end_date || ""}
                                   onBlur={(e) => {
                                     const val = e.target.value || null;
                                     if (val !== ind.end_date) {
                                       handleUpdate("indirect", ind.id, { end_date: val }, updateIndirectCost);
                                     }
                                   }}
                                   className="text-xs p-1 border border-gray-200 rounded text-black bg-white w-28"
                                 />
                               </div>
                             </div>
                           </div>
                           <div className="flex items-center space-x-4">
                              <select
                                value={ind.cost_type}
                                onChange={(e) => handleUpdate("indirect", ind.id, { cost_type: e.target.value }, updateIndirectCost)}
                                className="text-xs font-bold border border-gray-200 rounded p-1 bg-white text-black animate-none"
                              >
                                <option value="fixed">Fijo</option>
                                <option value="variable">Variable</option>
                              </select>
                              <div className="text-right">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Monto Mensual</p>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-black">$</span>
                                    <input 
                                      type="number"
                                      defaultValue={ind.amount}
                                      onBlur={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        if (val !== ind.amount) {
                                          handleUpdate("indirect", ind.id, { amount: val }, updateIndirectCost);
                                        }
                                      }}
                                      className="text-sm font-bold border border-transparent hover:border-gray-200 focus:border-gray-300 rounded p-0.5 bg-transparent text-right w-24 text-black focus:bg-white"
                                    />
                                  </div>
                              </div>
                              <div className="w-8 flex justify-center">{saving === ind.id ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <Save className="h-4 w-4 text-gray-300" />}</div>
                           </div>
                        </div>
                      ))}
                    </div>
                   </div>
                )}

                {/* BUSINESS LINES */}
                {activeTab === "business_lines" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-gray-500 text-black">Gestión de Líneas de Negocio (Tubos, Esquineros, etc.)</p>
                      <button onClick={() => setShowNewBL(!showNewBL)} className="bg-[#F97316] text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-orange-600 transition-colors">
                        <Plus className="h-4 w-4" /> Nueva
                      </button>
                    </div>

                    {showNewBL && (
                      <div className="flex flex-wrap justify-between items-end gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="flex flex-col space-y-2">
                          <input type="text" placeholder="Nombre (Ej. Envases)" value={newBL.name} onChange={e => setNewBL({...newBL, name: e.target.value})} className="p-2 border rounded text-sm text-black w-48" />
                          <div className="flex space-x-2">
                            <input type="text" placeholder="CODE" value={newBL.code} onChange={e => setNewBL({...newBL, code: e.target.value})} className="w-32 p-2 border rounded text-sm text-black" />
                            <input type="text" placeholder="Descripción" value={newBL.description} onChange={e => setNewBL({...newBL, description: e.target.value})} className="w-48 p-2 border rounded text-sm text-black" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button onClick={handleCreateBL} disabled={saving === "new_bl" || !newBL.name || !newBL.code} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg disabled:opacity-50">
                            {saving === "new_bl" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </button>
                          <button onClick={() => { setShowNewBL(false); setNewBL({ name: "", code: "", description: "" }); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {data.businessLines.map((bl: any) => (
                      <div key={bl.id} className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100 gap-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800 text-black">{bl.name}</p>
                            <p className="text-xs text-gray-500 text-black">Code: {bl.code}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Estado</p>
                              <select 
                                defaultValue={bl.is_active ? "true" : "false"} 
                                onChange={(e) => handleUpdate("business_line", bl.id, { is_active: e.target.value === "true" }, updateBusinessLine)}
                                className="p-2 border rounded-lg text-sm font-bold text-black bg-white"
                              >
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                              </select>
                            </div>
                            <div className="w-8 flex justify-center">{saving === bl.id ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <Save className="h-4 w-4 text-gray-300" />}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          <p className="font-bold mb-1">Parámetros Default (JSON):</p>
                          <textarea 
                            defaultValue={JSON.stringify(bl.default_params, null, 2)}
                            onBlur={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                handleUpdate("business_line", bl.id, { default_params: parsed }, updateBusinessLine);
                              } catch (err) {
                                setMessage({ type: "error", text: "JSON Inválido" });
                              }
                            }}
                            className="w-full h-24 p-2 border rounded bg-white font-mono text-black"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
