import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { model: "Custom CNN", "Val Accuracy": 0.81, "Test Accuracy": 0.85 },
  { model: "MobileNetV2", "Val Accuracy": 0.98, "Test Accuracy": 0.97 }
];

export default function ModelComparison() {
  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Model Performance Comparison</div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="model" />
          <YAxis domain={[0.6, 1]} tickFormatter={(v) => v.toFixed(2)} />
          <Tooltip formatter={(v) => v.toFixed(2)} />
          <Legend />
          <Bar dataKey="Val Accuracy" fill="#2563EB" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Test Accuracy" fill="#F59E0B" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}