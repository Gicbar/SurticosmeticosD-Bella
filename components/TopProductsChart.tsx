// src/app/dashboard/components/TopProductsChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Product = {
  name: string;
  quantity: number;
};

type TopProductsChartProps = {
  products: Product[];
};

export default function TopProductsChart({ products }: TopProductsChartProps) {
  return (
    <div>
      <h2 className="font-semibold mb-4">Top 5 Productos Más Vendidos</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={products}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="quantity" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
