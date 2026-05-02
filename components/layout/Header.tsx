"use client";

import { Bell, Search, User } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex-1 min-w-0">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#F97316] focus:border-[#F97316] sm:text-sm transition-colors"
            placeholder="Buscar cotizaciones, clientes..."
          />
        </div>
      </div>
      <div className="flex items-center ml-4 space-x-4">
        <button className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors">
          <span className="sr-only">Ver notificaciones</span>
          <Bell className="h-6 w-6" />
          <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <div className="relative">
          <button className="flex items-center max-w-xs text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316]">
            <span className="sr-only">Abrir menú de usuario</span>
            <div className="h-8 w-8 rounded-full bg-[#1F2937] flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
