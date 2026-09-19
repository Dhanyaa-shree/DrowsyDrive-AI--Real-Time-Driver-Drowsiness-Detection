import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function FatigueChart({ data = [] }) {
  // Expects data = array of stage values [0,0,1,1,2,...]
  const chartData = data.map((stage, i) => ({ minute: i + 1, stage }));
  const demo = [
    { minute: 1, stage: 0 }, { minute: 2, stage: 0 }, { minute: 3, stage: 0 },
    { minute: 4, stage: 0 }, { minute: 5, stage: 1 }, { minute: 6, stage: 1 },
    { minute: 7, stage: 1 }, { minute: 8, stage: 2 }, { minute: 9, stage: 2 },
    { minute: 10, stage: 2 }
  ];

  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Fatigue Level Progression</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData.length ? chartData : demo}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="minute" />
          <YAxis domain={[0, 2]} ticks={[0, 1, 2]}
                 tickFormatter={(v) => ["Alert", "Mild", "Severe"][v]} />
          <Tooltip formatter={(v) => ["Alert", "Mild", "Severe"][v]} />
          <Line type="monotone" dataKey="stage" stroke="#EF4444"
                strokeWidth={2} dot={{ r: 4, fill: "#EF4444" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}