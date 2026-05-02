import Link from "next/link";
import { ArrowRight, Recycle, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Recycle,
    title: "Sostenibilidad",
    description: "Materiales corrugados 100% reciclables provenientes de bosques sostenibles.",
    cta: "LEER MÁS",
  },
  {
    icon: Shield,
    title: "Durabilidad",
    description: "Diseñados para una resistencia extrema al apilamiento.",
    cta: "ESPECIFICACIONES TÉCNICAS",
  },
  {
    icon: Zap,
    title: "Cotización Rápida",
    description: "Nuestro motor Cencore proporciona cotizaciones instantáneas.",
    cta: "INICIAR COTIZACIÓN",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900 tracking-wide">
                CENCORE<span className="text-[#F97316]">.</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#F97316]">Iniciar Sesión</Link>
              <Link href="/admin/quotes/new" className="bg-[#F97316] text-white px-4 py-2 rounded-md text-sm font-medium">Cotizar</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 bg-gray-900 text-white text-center">
        <h1 className="text-5xl font-bold mb-6">Empaque Industrial de <span className="text-[#F97316]">Precisión</span></h1>
        <p className="max-w-2xl mx-auto text-gray-300 mb-10 text-lg">Soluciones estructurales para logística de alto impacto.</p>
        <Link href="/admin/quotes/new" className="inline-flex items-center bg-[#F97316] px-8 py-4 rounded-md font-bold hover:bg-[#EA580C]">
          Solicitar Cotización <ArrowRight className="ml-2" />
        </Link>
      </section>
    </div>
  );
}
