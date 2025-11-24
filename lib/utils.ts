import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils.ts
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
