import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { resolveCompanyFromHost } from "@/lib/supabase/company-resolver"
import { headers } from "next/headers"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers() 
  const host = headersList.get("host") || ""
  const company = await resolveCompanyFromHost(host)
  
  const iconUrl =
  company?.slug?.trim()
    ? `/${company.slug}.png`
    : "/favicon.png"

  if (!company) {
      return {
        title: "Gestión Empresarial Inteligente.",
        description:
          "Plataforma inteligente para la gestión empresarial multiempresa. Controla inventario, ventas y rentabilidad en tiempo real desde un solo lugar.",
        generator: "V1.app",
        icons: {
          icon: "/favicon.png",
        },
      }
  }

  return {
    title: `${company.name}`,
    description: `Gestiona inventario, ventas y rentabilidad de ${company.name} en tiempo real.`,
    icons: {
      icon: iconUrl, 
    },
  }
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
