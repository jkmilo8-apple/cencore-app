"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, AlertCircle } from "lucide-react";
import { signInAction } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    
    const { error } = await signInAction(formData);
    
    if (error) {
      setAuthError(error);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Dark branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold tracking-wide mb-4">
            CENCORE<span className="text-[#F97316]">.</span>
          </h1>
          <p className="text-lg text-gray-400 mb-2">Logística Industrial</p>
          <div className="mt-8 w-24 h-1 bg-[#F97316] mx-auto rounded-full" />
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-[#F7F9FB]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-2xl font-bold text-gray-900 tracking-wide">
              CENCORE<span className="text-[#F97316]">.</span>
            </span>
            <p className="text-sm text-gray-500 mt-1">Logística Industrial</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Bienvenido</h2>
          <p className="text-sm text-gray-500 mb-8">Ingrese sus credenciales corporativas para continuar.</p>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center space-x-2 border border-red-200">
              <AlertCircle className="h-5 w-5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Corporativo</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-[#F97316] focus:border-[#F97316] transition-colors"
                  placeholder="usuario@cencore.co"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-[#F97316] focus:border-[#F97316] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div />
              <Link href="#" className="text-sm font-medium text-[#F97316] hover:text-[#EA580C]">
                ¿Olvidó su contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F97316] hover:bg-[#EA580C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316] disabled:opacity-50 transition-colors"
            >
              {loading ? "Ingresando..." : "Ingresar al Panel"}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Redirigiendo al Panel de Control tras el ingreso
          </p>
          <p className="mt-6 text-xs text-gray-400 text-center">
            ¿Problemas de acceso?{" "}
            <Link href="/contact" className="text-[#F97316] hover:text-[#EA580C]">Contactar soporte técnico</Link>
          </p>
        </div>

        <div className="mt-12 text-center text-xs text-gray-400">
          <p>© 2024 CENCORE SAS • SISTEMA DE GESTIÓN LOGÍSTICA</p>
          <div className="flex justify-center space-x-4 mt-2">
            <Link href="#" className="hover:text-gray-600">POLÍTICA DE PRIVACIDAD</Link>
            <Link href="#" className="hover:text-gray-600">TÉRMINOS DE SERVICIO</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
