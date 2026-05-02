"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Building2, MapPin, Phone, Mail, Edit, Trash2, X } from "lucide-react";
import { getClients, createClientAction, updateClientAction, deleteClientAction } from "@/actions/clients";
import type { Client } from "@/types/database";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", industry: "", city: "", contact_name: "", status: "active" });
  const [saving, setSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await getClients(search || undefined);
    setClients(data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openCreate = () => {
    setEditingClient(null);
    setForm({ name: "", email: "", phone: "", address: "", industry: "", city: "", contact_name: "", status: "active" });
    setIsModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      industry: client.industry || "",
      city: client.city || "",
      contact_name: client.contact_name || "",
      status: client.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = editingClient
      ? await updateClientAction(editingClient.id, form)
      : await createClientAction(form);
    
    if (error) {
      alert("Error al guardar cliente: " + error);
    } else {
      setIsModalOpen(false);
      fetchClients();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
    await deleteClientAction(id);
    fetchClients();
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Clientes</h1>
          <p className="mt-2 text-sm text-gray-700">Administra el directorio de clientes y sus configuraciones comerciales.</p>
        </div>
        <button onClick={openCreate} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors">
          <Plus className="-ml-1 mr-2 h-5 w-5" /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-100">
        <div className="p-4 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus:ring-[#F97316] focus:border-[#F97316] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-black font-medium"
              placeholder="Buscar por nombre, email o industria..."
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando clientes...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron clientes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto Principal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.industry || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.contact_name || "—"}</div>
                      <div className="text-sm text-gray-500 flex flex-col space-y-1 mt-1">
                        {client.email && <span className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {client.email}</span>}
                        {client.phone && <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {client.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.city ? <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-gray-400" /> {client.city}</span> : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${client.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {client.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button onClick={() => openEdit(client)} className="text-blue-600 hover:text-blue-900" title="Editar"><Edit className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
            
            <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-900">{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6 text-gray-400" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium" placeholder="Nombre completo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contacto</label>
                    <input type="text" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Industria</label>
                    <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                    <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-row-reverse gap-3">
                <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 inline-flex justify-center rounded-md border border-transparent px-4 py-2 bg-[#F97316] text-sm font-medium text-white hover:bg-[#EA580C] disabled:opacity-50 transition-colors">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="flex-1 inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
