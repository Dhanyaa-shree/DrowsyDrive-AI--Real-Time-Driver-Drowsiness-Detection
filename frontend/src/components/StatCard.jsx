export default function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:   "bg-blue-100 text-blue-600",
    red:    "bg-red-100 text-red-600",
    green:  "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600"
  };

  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </div>
    </div>
  );
}