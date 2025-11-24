import type React from "react"
import { requireAuth } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()

  return (
    <div className="flex min-h-screen ">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col bg-pink-50/50 dark:bg-black/60 backdrop-blur-sm">
        <DashboardHeader />
        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  )
}
