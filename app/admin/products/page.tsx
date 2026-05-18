"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Package, Plus, Edit, Trash2, X, Camera, Upload, Info } from "lucide-react";
import { getProducts, createProductAction, updateProductAction, deleteProductAction } from "@/actions/products";
import { uploadProductImage } from "@/actions/storage";
import type { Product } from "@/types/database";

const CATEGORIES = ["Tubos", "Esquineros", "Cajas", "Láminas", "Single Face"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: 0, sku: "",
    category: "Tubos", stock: 0, status: "active", image_url: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await getProducts({
      category: category !== "all" ? category : undefined,
      search: search || undefined,
    });
    setProducts(data || []);
    setLoading(false);
  }, [search, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: "", description: "", price: 0, sku: "", category: "Tubos", stock: 0, status: "active", image_url: "" });
    setIsModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: Number(product.price) || 0,
      sku: product.sku || "",
      category: product.category || "Tubos",
      stock: product.stock || 0,
      status: product.status || "active",
      image_url: product.image_url || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = editingProduct
      ? await updateProductAction(editingProduct.id, form)
      : await createProductAction(form);
    if (error) {
      alert("Error al guardar: " + error);
    } else {
      setIsModalOpen(false);
      fetchProducts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    const { success, error } = await deleteProductAction(id);
    if (!success) alert("Error al eliminar: " + error);
    else fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Catálogo de Productos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Referencia visual de tipos de empaque industrial. Los precios se calculan dinámicamente.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" /> Nuevo Producto
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-bold mb-1">¿Cómo cotizar productos?</p>
          <p>
            Ve a <strong>Cotizaciones → Nueva Cotización</strong>. Allí encontrarás el <strong>Planificador de Producción</strong> donde
            configuras las especificaciones técnicas (dimensiones, materiales, cantidad) y el motor de precios calcula
            el costo industrial en tiempo real. Luego añades ese ítem a la cotización.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg border border-gray-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="block w-full pl-10 text-sm border border-gray-300 rounded-md py-2 focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full text-sm border border-gray-300 rounded-md py-2 px-3 focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <Package className="mx-auto h-12 w-12 text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">No hay productos registrados.</p>
          <button onClick={openCreate} className="mt-4 text-sm text-[#F97316] font-bold hover:underline">
            + Agregar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden hover:border-[#F97316] transition-all group">
              <div className="h-48 bg-gray-50 flex items-center justify-center relative overflow-hidden p-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-300">
                    <Package className="h-12 w-12 mb-2 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Sin Imagen</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                  <button onClick={() => openEdit(product)} className="p-2 bg-white shadow-lg rounded-full text-blue-600 hover:bg-blue-50 transform hover:scale-110 transition-all"><Edit className="h-5 w-5" /></button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 bg-white shadow-lg rounded-full text-red-600 hover:bg-red-50 transform hover:scale-110 transition-all"><Trash2 className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{product.description || "Sin descripción"}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-2 flex-shrink-0">
                    {product.category || "General"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {product.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                  <span className="text-xs text-gray-400 italic">Precio por motor de costos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. Tubo Kraft 10cm"
                    className="mt-1 block w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 block w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Características técnicas o notas del producto..."
                    className="mt-1 block w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium"
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Imagen de Referencia</label>
                  <div className="mt-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        placeholder="URL de imagen..."
                        className="flex-1 text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium"
                      />
                      <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        <Upload className="h-4 w-4 mr-2 text-gray-400" />
                        Subir
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploading(true);
                              const fd = new FormData();
                              fd.append("file", file);
                              const { url, error } = await uploadProductImage(fd);
                              if (url) setForm({ ...form, image_url: url });
                              if (error) alert(error);
                              setUploading(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                      {form.image_url ? (
                        <img src={form.image_url} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-xl" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <Camera className="h-10 w-10 mb-2 opacity-20" />
                          <span className="text-xs uppercase tracking-widest font-black opacity-20">Vista Previa</span>
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <div className="animate-spin h-8 w-8 border-4 border-[#F97316] border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 block w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-[#F97316] focus:border-[#F97316] text-black font-medium"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-row-reverse gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name}
                  className="flex-1 inline-flex justify-center rounded-md border border-transparent px-4 py-2 bg-[#F97316] text-sm font-medium text-white hover:bg-[#EA580C] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
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
