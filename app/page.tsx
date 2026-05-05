import Link from "next/link";
import { ArrowRight, Recycle, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Recycle,
    title: "Sostenibilidad",
    description: "Materiales corrugados 100% reciclables provenientes de bosques sostenibles. Nuestro ciclo de producción minimiza los residuos mediante cortes precisos y eficiencia estructural.",
    cta: "LEER MÁS",
  },
  {
    icon: Shield,
    title: "Durabilidad",
    description: "Diseñados para una resistencia extrema al apilamiento. Nuestros tubos industriales y esquineros garantizan que su carga de alto valor llegue sin un solo rasguño.",
    cta: "ESPECIFICACIONES TÉCNICAS",
  },
  {
    icon: Zap,
    title: "Cotización Rápida",
    description: "Nuestro motor Cencore proporciona cotizaciones instantáneas basadas en dimensiones, cantidad y grado. No más esperas por representantes de ventas.",
    cta: "INICIAR COTIZACIÓN",
  },
];

const products = [
  {
    title: "Cajas Corrugadas",
    description: "Diseñados para una resistencia extrema al apilamiento. Nuestros tubos industriales y esquineros garantizan que su carga de alto valor llegue sin un solo rasguño.",
  },
  {
    title: "Tubos de Cartón",
    description: "Diseñados para una resistencia extrema al apilamiento. Nuestros tubos industriales y esquineros garantizan que su carga de alto valor llegue sin un solo rasguño.",
  },
  {
    title: "Esquineros Reforzados",
    description: "Nuestro motor Cencore proporciona cotizaciones instantáneas basadas en dimensiones, cantidad y grado. No más esperas por representantes de ventas.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900 tracking-wide">
                CENCORE<span className="text-[#F97316]">.</span>
              </span>
              <span className="ml-2 text-xs text-gray-500 hidden sm:block">Logística Industrial</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Soluciones</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Materiales</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Precios</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Casos de Éxito</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#F97316] transition-colors">Iniciar Sesión</Link>
              <Link href="/contact" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors">
                Contactar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Empaque Industrial de<br />
            <span className="text-[#F97316]">Precisión</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-300 mb-8">
            Cotizaciones rápidas para cajas, tubos y esquineros con precisión de grado industrial y entrega optimizada.
          </p>
          <p className="text-sm text-gray-400 uppercase tracking-wider mb-10">
            EMPRESAS LÍDERES DE LOGÍSTICA CONFÍAN EN NOSOTROS
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/admin/quotes/new" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors">
              Solicitar Cotización
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 hover:bg-gray-800 transition-colors">
              Hablar con Ventas
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#F7F9FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-lg border border-gray-100 p-8 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-[#FFF7ED] flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-[#F97316]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                <button className="inline-flex items-center text-sm font-medium text-[#F97316] hover:text-[#EA580C] transition-colors">
                  {feature.cta}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Empaque Estandarizado para Logística Especializada
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.title} className="border border-gray-200 rounded-lg p-8 hover:border-[#F97316] transition-colors group">
                <div className="h-48 bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Imagen del producto</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#F97316] transition-colors">{product.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para optimizar su cadena de suministro?</h2>
          <p className="text-gray-300 mb-8">
            Únase a más de 500 clientes industriales que confían en Cencore SAS para sus necesidades de empaque estructural.
          </p>
          <p className="text-sm text-gray-400 mb-8">Tiempo de respuesta inferior a 15 minutos en horario comercial.</p>
          <Link href="/contact" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors">
            Contactar Ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-950 text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <p>© 2024 Cencore SAS Logística. Todos los derechos reservados.</p>
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
