import { useEffect, useState } from "react";
import { Car, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import LiveDetection from "../components/LiveDetection.jsx";
import UploadAnalyze from "../components/UploadAnalyze.jsx";
import FatigueChart from "../components/FatigueChart.jsx";
import ModelComparison from "../components/ModelComparison.jsx";
import { getStats } from "../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0, alerts: 0, mild: 0, safe_pct: 100,
    avg_confidence: 0, recent: []
  });
  const [progression, setProgression] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getStats();
        setStats(s);
        setProgression(s.recent.map(r => r.fatigue_stage).reverse());
      } catch (e) { /* silent */ }
    };
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, Admin</h1>
          <p className="text-slate-500 text-sm">Monitor driver alertness and keep roads safer.</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <div>{now.toLocaleDateString()}</div>
          <div>{now.toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Car}           label="Total Predictions"  value={stats.total}          color="blue" />
        <StatCard icon={AlertTriangle} label="Drowsiness Alerts"  value={stats.alerts}         color="red" />
        <StatCard icon={ShieldCheck}   label="Safe Driving"       value={`${stats.safe_pct}%`} color="green" />
        <StatCard icon={Activity}      label="Avg. Confidence"    value={stats.avg_confidence} color="purple" />
      </div>

      {/* Live + Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveDetection />
        <UploadAnalyze />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FatigueChart data={progression} />
        <ModelComparison />
      </div>
    </div>
  );
}