// src/app/dashboard/components/SummaryCards.tsx
"use client";

import { Card } from "@/components/ui/card";

type SummaryCardsProps = {
  totalSales: number;
  totalCost: number;
  profit: number;
};

export default function SummaryCards({ totalSales, totalCost, profit }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <h3 className="text-sm text-gray-500">Ventas Totales</h3>
        <p className="text-2xl font-bold">${totalSales.toLocaleString()}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm text-gray-500">Costo de Inventario</h3>
        <p className="text-2xl font-bold">${totalCost.toLocaleString()}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm text-gray-500">Utilidad</h3>
        <p className="text-2xl font-bold">${profit.toLocaleString()}</p>
      </Card>
    </div>
  );
}
