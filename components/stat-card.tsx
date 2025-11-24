// components/stat-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: "default" | "primary" | "accent"
  subtitle?: string | null
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  variant = "default",
  subtitle = null
}: StatCardProps) {
  const variants = {
    default: "icon-inventory",
    primary: "text-primary",
    accent: "text-chart-4",
  }
  
  return (
    <Card className="card-dashboard group">
      <CardHeader className="card-header-dashboard flex flex-row items-center justify-between pb-2">
        <CardTitle className="card-title-dashboard text-xs uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className={`${variants[variant]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="card-value-dashboard text-xl md:text-2xl font-bold">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}