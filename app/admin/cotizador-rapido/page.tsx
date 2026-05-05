import PricingCalculator from "@/components/PricingCalculator";

export const metadata = {
  title: "Cotizador Rápido - Cencore",
  description: "Calculadora de costos y cotizaciones industriales.",
};

export default function CotizadorRapidoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cotizador Rápido</h1>
        <p className="mt-1 text-sm text-gray-500">
          Usa esta herramienta para calcular los costos de producción y precios de venta usando el motor de cálculo en FastAPI.
        </p>
      </div>

      <div className="max-w-4xl">
        <PricingCalculator />
      </div>
    </div>
  );
}
