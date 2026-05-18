import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F7F9FB] overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      <div className="no-print"><Sidebar /></div>
      <div className="flex flex-col flex-1 w-0 overflow-hidden print:block print:w-full print:overflow-visible">
        <div className="no-print"><Header /></div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none print:overflow-visible print:h-auto">
          <div className="py-6 px-4 sm:px-6 lg:px-8 print:p-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
