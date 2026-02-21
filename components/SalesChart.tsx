// src/app/dashboard/components/SalesChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Sale = {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  saleDate: string;
};

type SalesChartProps = {
  sales: Sale[];
};

export default function SalesChart({ sales }: SalesChartProps) {
  // Agrupar ventas por día
  const salesByDay = sales.reduce((acc: Record<string, number>, sale) => {
    const day = sale.saleDate;
    acc[day] = (acc[day] || 0) + sale.quantity * sale.unitPrice;
    return acc;
  }, {});

  const chartData = Object.entries(salesByDay).map(([date, total]) => ({
    date,
    total,
  }));

  return (
    <div>
      <h2 className="font-semibold mb-4">Ventas Totales en el Rango de Fechas</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Bar dataKey="total" fill="#8B5CF6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
