import { LayoutDashboard, Video, UploadCloud, BarChart3, ShieldCheck } from "lucide-react";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Live Detection", icon: Video, active: false },
  { label: "Upload & Analyze", icon: UploadCloud, active: false },
  { label: "Analytics", icon: BarChart3, active: false }
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-navy text-white flex flex-col">
      <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
        <ShieldCheck className="text-accent-light" size={30} />
        <div>
          <div className="font-extrabold text-lg">DrowsyDrive AI</div>
          <div className="text-xs text-slate-300">Safer Roads, Smarter AI</div>
        </div>
      </div>

      <nav className="flex-1 py-4">
        {items.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition cursor-pointer
              ${active ? "bg-accent text-white border-l-4 border-accent-light"
                       : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
          >
            <Icon size={18} />
            {label}
          </div>
        ))}
      </nav>

      <div className="px-6 py-4 text-xs text-slate-400 border-t border-white/10">
        Detect Early. Prevent Accidents.
      </div>
    </aside>
  );
}