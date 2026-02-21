// src/app/dashboard/components/CostVsRevenueChart.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

type CostVsRevenueChartProps = {
  totalSales: number;
  totalCost: number;
};

export default function CostVsRevenueChart({ totalSales, totalCost }: CostVsRevenueChartProps) {
  const data = [
    { name: "Ventas", value: totalSales },
    { name: "Costo de Inventario", value: totalCost },
  ];

  const COLORS = ["#8B5CF6", "#EC4899"];

  return (
    <div>
      <h2 className="font-semibold mb-4">Ventas vs. Costo de Inventario</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
