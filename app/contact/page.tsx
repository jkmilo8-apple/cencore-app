"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Phone, Mail, ArrowRight, Share2, Globe, Users } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900 tracking-wide">
                CENCORE<span className="text-[#F97316]">.</span>
              </span>
              <span className="ml-2 text-xs text-gray-500 hidden sm:block">Logística Industrial</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Soluciones</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Materiales</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Precios</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Casos de Estudio</Link>
            </div>
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Iniciar Sesión</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Contacte con Nuestro Equipo <span className="text-[#F97316]">Logístico</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Optimizando las cadenas de suministro globales de cartón con ingeniería de precisión y confiabilidad industrial. Construyamos su solución de empaque.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-[#F7F9FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Contact Info */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">Solicitar Consulta Técnica</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 bg-[#FFF7ED] rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-[#F97316]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Sede Regional</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Calle 100 #13-21, Piso 8<br />
                      Distrito de Negocios Norte<br />
                      Bogotá, Colombia 110111
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 bg-[#FFF7ED] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-[#F97316]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Línea Directa de Logística</h3>
                    <p className="text-sm text-gray-600 mt-1">+57 (601) 555-0192</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 bg-[#FFF7ED] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-[#F97316]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Soporte y Adquisiciones</h3>
                    <p className="text-sm text-gray-600 mt-1">logistics@packflow-industrial.co</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Conexión de Red Global</h3>
                <div className="flex space-x-4">
                  <button className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Users className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Solicitar Consulta Técnica</h2>
              <p className="text-sm text-gray-500 mb-6">
                Complete las especificaciones a continuación. Un especialista en logística responderá en un plazo de 4 horas hábiles.
              </p>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowRight className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">¡Solicitud Enviada!</h3>
                  <p className="text-sm text-gray-500 mt-2">Un especialista se comunicará con usted pronto.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#F97316] focus:border-[#F97316]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Empresa</label>
                      <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#F97316] focus:border-[#F97316]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <input type="email" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#F97316] focus:border-[#F97316]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Producto</label>
                    <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#F97316] focus:border-[#F97316]">
                      <option>Cajas Corrugadas</option>
                      <option>Tubos de Cartón</option>
                      <option>Esquineros Reforzados</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mensaje</label>
                    <textarea rows={4} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#F97316] focus:border-[#F97316]" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Al enviar, usted acepta nuestros protocolos de manejo de datos estructurales y privacidad industrial.
                  </p>
                  <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F97316] hover:bg-[#EA580C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316] transition-colors">
                    Enviar Solicitud
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-950 text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <p>© 2024 Cencore SAS Logística Industrial. Todos los derechos reservados.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Términos de Servicio</Link>
            <Link href="#" className="hover:text-white transition-colors">Política de Privacidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Informe de Sostenibilidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Ubicaciones Globales</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
