"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, 
  Save, 
  Layers, 
  Truck, 
  Settings2, 
  HardHat, 
  Factory, 
  Calendar,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { 
  getLaborRates, updateLaborRate, 
  getMaterialCosts, updateMaterialCost,
  getIndirectCosts, createIndirectCost,
  getProductConfigs, updateProductConfig,
  getPricingReferences, updatePricingReference
} from "@/actions/pricing_config";

const TABS = [
  { id: "labor", name: "Mano de Obra", icon: HardHat },
  { id: "materials", name: "Materias Primas", icon: Layers },
  { id: "indirect", name: "Costos Fijos (NIF/CIF)", icon: Factory },
  { id: "configs", name: "Máquinas", icon: Settings2 },
  { id: "refs", name: "Referencias", icon: Truck },
];

interface LaborRate {
  category: string;
  hourly_rate: number;
}

interface MaterialCost {
  material_name: string;
  cost_per_kg: number;
}

interface IndirectCost {
  id: string;
  start_date: string;
  end_date: string;
  rent: number;
  utilities: number;
  administration: number;
  maintenance: number;
  payroll: number;
  others: number;
}

interface ProductConfig {
  category: string;
  machine_speed: number;
  overhead_rate: number;
}

interface PricingReference {
  reference_id: string;
  labor_multiplier: number;
  waste_factor: number;
  setup_time: number;
}

interface AdminData {
  labor: LaborRate[];
  materials: MaterialCost[];
  indirect: IndirectCost[];
  configs: ProductConfig[];
  refs: PricingReference[];
}

export default function PricingAdminPage() {
  const [activeTab, setActiveTab] = useState("labor");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [data, setData] = useState<AdminData>({
    labor: [],
    materials: [],
    indirect: [],
    configs: [],
    refs: []
  });
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [isIndirectModalOpen, setIsIndirectModalOpen] = useState(false);
  const [newIndirect, setNewIndirect] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    rent: 0,
    utilities: 0,
    administration: 0,
    maintenance: 0,
    payroll: 0,
    others: 0
  });

  const loadAllData = useCallback(async () => {
    const [labor, materials, indirect, configs, refs] = await Promise.all([
      getLaborRates(),
      getMaterialCosts(),
      getIndirectCosts(),
      getProductConfigs(),
      getPricingReferences()
    ]);
    
    setData({
      labor: (labor.data as LaborRate[]) || [],
      materials: (materials.data as MaterialCost[]) || [],
      indirect: (indirect.data as IndirectCost[]) || [],
      configs: (configs.data as ProductConfig[]) || [],
      refs: (refs.data as PricingReference[]) || []
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllData();
  }, [loadAllData]);

  const handleUpdateLabor = async (category: string, rate: number) => {
    setSaving(category);
    const { error } = await updateLaborRate(category, rate);
    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setMessage({ type: "success", text: "Tarifa actualizada" });
      loadAllData();
    }
    setSaving(null);
  };

  const handleUpdateMaterial = async (name: string, cost: number) => {
    setSaving(name);
    const { error } = await updateMaterialCost(name, cost);
    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setMessage({ type: "success", text: "Costo actualizado" });
      loadAllData();
    }
    setSaving(null);
  };

  const handleUpdateConfig = async (category: string, machine_speed: number, overhead_rate: number) => {
    setSaving(category);
    const { error } = await updateProductConfig(category, { machine_speed, overhead_rate });
    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setMessage({ type: "success", text: "Configuración actualizada" });
      loadAllData();
    }
    setSaving(null);
  };

  const handleUpdateRef = async (referenceId: string, labor_multiplier: number, waste_factor: number, setup_time: number) => {
    setSaving(referenceId);
    const { error } = await updatePricingReference(referenceId, { labor_multiplier, waste_factor, setup_time });
    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setMessage({ type: "success", text: "Referencia actualizada" });
      loadAllData();
    }
    setSaving(null);
  };

  const handleCreateIndirectCost = async () => {
    setSaving("indirect_new");
    const { error } = await createIndirectCost(newIndirect);
    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setMessage({ type: "success", text: "Periodo creado exitosamente" });
      setIsIndirectModalOpen(false);
      loadAllData();
    }
    setSaving(null);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF8F6]">
      <Loader2 className="h-12 w-12 text-[#F97316] animate-spin" />
      <p className="mt-4 text-gray-500 font-medium">Cargando parámetros industriales...</p>
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
              <h1 className="text-xl font-bold text-[#1F2937] tracking-tight">Configuración del Motor</h1>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest text-black">Parámetros de Costeo Industrial</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                  activeTab === tab.id 
                    ? "bg-[#1F2937] text-white shadow-lg" 
                    : "bg-white text-gray-500 hover:bg-gray-50 border border-transparent"
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? "text-[#F97316]" : ""}`} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  {TABS.find(t => t.id === activeTab)?.name}
                </h2>
                {message && (
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold animate-in fade-in slide-in-from-top-1 ${
                    message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  }`}>
                    {message.type === "success" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    <span>{message.text}</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                {activeTab === "labor" && (
                  <div className="space-y-4">
                    {data.labor.map((item: LaborRate) => (
                      <div key={item.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoría</p>
                          <p className="text-base font-bold text-gray-800">{item.category}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor Hora (COP)</p>
                            <input 
                              type="number"
                              defaultValue={item.hourly_rate}
                              onBlur={(e) => handleUpdateLabor(item.category, parseFloat(e.target.value))}
                              className="w-32 p-2 border rounded-lg text-sm font-bold text-right bg-white text-black"
                            />
                          </div>
                          <div className="w-8 flex justify-center">
                            {saving === item.category ? <Loader2 className="h-4 w-4 animate-spin text-[#F97316]" /> : <Save className="h-4 w-4 text-gray-300" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "materials" && (
                  <div className="space-y-4">
                    {data.materials.map((item: MaterialCost) => (
                      <div key={item.material_name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-black">Nombre del Material</p>
                          <p className="text-base font-bold text-gray-800 capitalize text-black">{item.material_name}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-black">Costo por KG</p>
                            <input 
                              type="number"
                              defaultValue={item.cost_per_kg}
                              onBlur={(e) => handleUpdateMaterial(item.material_name, parseFloat(e.target.value))}
                              className="w-32 p-2 border rounded-lg text-sm font-bold text-right bg-white text-black"
                            />
                          </div>
                          <div className="w-8 flex justify-center">
                            {saving === item.material_name ? <Loader2 className="h-4 w-4 animate-spin text-[#F97316]" /> : <Save className="h-4 w-4 text-gray-300" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "indirect" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                       <p className="text-sm text-gray-500 font-medium">Histórico de Costos Fijos Mensuales</p>
                       <button 
                         onClick={() => setIsIndirectModalOpen(true)}
                         className="flex items-center space-x-2 px-4 py-2 bg-[#F97316] text-white text-xs font-bold rounded-lg hover:bg-[#EA580C] transition-all">
                         <Plus className="h-4 w-4" />
                         <span>Nuevo Periodo</span>
                       </button>
                    </div>
                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Periodo Vigencia</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Arriendo</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Servicios</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mantenimiento</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nómina</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Otros</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Mensual</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {data.indirect.map((item: IndirectCost) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                {item.start_date} → {item.end_date}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{formatCurrency(item.rent)}</td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{formatCurrency(item.utilities)}</td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{formatCurrency(item.administration || 0)}</td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{formatCurrency(item.maintenance || 0)}</td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{formatCurrency(item.payroll || 0)}</td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{formatCurrency(item.others || 0)}</td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-[#F97316]">
                                {formatCurrency(Number(item.rent) + Number(item.utilities) + Number(item.administration || 0) + Number(item.maintenance || 0) + Number(item.payroll || 0) + Number(item.others || 0))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "indirect" && isIndirectModalOpen && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Nuevo Periodo de Costos Fijos (NIF/CIF)</h2>
                        <button onClick={() => setIsIndirectModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha Inicio</label><input type="date" value={newIndirect.start_date} onChange={e => setNewIndirect({...newIndirect, start_date: e.target.value})} className="w-full border p-2 rounded-lg mt-1 font-medium"/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha Fin</label><input type="date" value={newIndirect.end_date} onChange={e => setNewIndirect({...newIndirect, end_date: e.target.value})} className="w-full border p-2 rounded-lg mt-1 font-medium"/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Arriendo</label><input type="number" value={newIndirect.rent} onChange={e => setNewIndirect({...newIndirect, rent: parseFloat(e.target.value) || 0})} className="w-full border p-2 rounded-lg mt-1 font-medium"/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Servicios Públicos</label><input type="number" value={newIndirect.utilities} onChange={e => setNewIndirect({...newIndirect, utilities: parseFloat(e.target.value) || 0})} className="w-full border p-2 rounded-lg mt-1 font-medium"/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administración</label><input type="number" value={newIndirect.administration} onChange={e => setNewIndirect({...newIndirect, administration: parseFloat(e.target.value) || 0})} className="w-full border p-2 rounded-lg mt-1 font-medium"/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mantenimiento</label><input type="number" value={newIndirect.maintenance} onChange={e => setNewIndirect({...newIndirect, maintenance: parseFloat(e.target.value) || 0})} className="w-full border p-2 rounded-lg mt-1 font-medium"/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nómina Fija</label><input type="number" value={newIndirect.payroll} onChange={e => setNewIndirect({...newIndirect, payroll: parseFloat(e.target.value) || 0})} className="w-full border p-2 rounded-lg mt-1 font-medium"/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Otros Gastos</label><input type="number" value={newIndirect.others} onChange={e => setNewIndirect({...newIndirect, others: parseFloat(e.target.value) || 0})} className="w-full border p-2 rounded-lg mt-1 font-medium"/></div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button onClick={() => setIsIndirectModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 font-bold rounded-lg transition-colors">Cancelar</button>
                        <button onClick={handleCreateIndirectCost} disabled={saving === "indirect_new"} className="px-4 py-2 bg-[#F97316] text-white font-bold rounded-lg hover:bg-[#EA580C] flex items-center transition-colors disabled:opacity-50">
                          {saving === "indirect_new" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar Periodo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "configs" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.configs.map((item: ProductConfig) => (
                      <div key={item.category} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900">{item.category}</h3>
                          <Settings2 className="h-4 w-4 text-gray-300" />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Velocidad (Unidades/h)</label>
                            <input 
                              type="number"
                              defaultValue={item.machine_speed}
                              onBlur={(e) => handleUpdateConfig(item.category, parseFloat(e.target.value), item.overhead_rate)}
                              className="w-full mt-1 p-2 border rounded-lg text-sm font-bold bg-white text-black"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Factor CIF (%)</label>
                            <input 
                              type="number"
                              step="0.01"
                              defaultValue={item.overhead_rate}
                              onBlur={(e) => handleUpdateConfig(item.category, item.machine_speed, parseFloat(e.target.value))}
                              className="w-full mt-1 p-2 border rounded-lg text-sm font-bold bg-white text-black"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-gray-400">Autoguardado activado</p>
                          {saving === item.category && <Loader2 className="h-4 w-4 animate-spin text-[#F97316]" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "refs" && (
                  <div className="space-y-4">
                    {data.refs.map((item: PricingReference) => (
                      <div key={item.reference_id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-[#F97316]/10 rounded-lg flex items-center justify-center text-[#F97316]">
                              <Truck className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{item.reference_id}</h3>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Parámetros Técnicos</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 font-bold rounded uppercase">Vigente</span>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 text-black">Mult. Labor</label>
                            <input 
                              type="number" 
                              step="0.1" 
                              defaultValue={item.labor_multiplier} 
                              onBlur={(e) => handleUpdateRef(item.reference_id, parseFloat(e.target.value), item.waste_factor, item.setup_time)}
                              className="w-full p-2 border rounded-lg text-sm font-bold bg-gray-50 text-black" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 text-black">Desperdicio</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              defaultValue={item.waste_factor} 
                              onBlur={(e) => handleUpdateRef(item.reference_id, item.labor_multiplier, parseFloat(e.target.value), item.setup_time)}
                              className="w-full p-2 border rounded-lg text-sm font-bold bg-gray-50 text-black" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 text-black">Setup (Hrs)</label>
                            <input 
                              type="number" 
                              step="0.5" 
                              defaultValue={item.setup_time} 
                              onBlur={(e) => handleUpdateRef(item.reference_id, item.labor_multiplier, item.waste_factor, parseFloat(e.target.value))}
                              className="w-full p-2 border rounded-lg text-sm font-bold bg-gray-50 text-black" 
                            />
                          </div>
                        </div>
                        {saving === item.reference_id && (
                          <div className="flex items-center space-x-2 text-[10px] text-[#F97316] font-bold">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Guardando cambios...</span>
                          </div>
                        )}
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
