export default function Topbar() {
  return (
    <header className="bg-navy text-white px-6 py-3 flex items-center justify-between">
      <div className="font-semibold text-sm text-slate-200">
        Driver Drowsiness Detection System
      </div>
      <div className="text-xs text-slate-300">
        {new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}
      </div>
    </header>
  );
}