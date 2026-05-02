"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, FileText, Settings, LogOut, DollarSign } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Cotizaciones", href: "/admin/quotes", icon: FileText },
  { name: "Configuración Comercial", href: "/admin/products/commercial", icon: DollarSign },
  { name: "Clientes", href: "/admin/clients", icon: Users },
  { name: "Productos", href: "/admin/products", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-[#1F2937] text-white min-h-screen">
      <div className="flex items-center justify-center h-16 bg-[#111827] border-b border-gray-800">
        <span className="text-xl font-bold text-white tracking-wide">
          CENCORE<span className="text-[#F97316]">.</span>
        </span>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-[#F97316] text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors">
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
