'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'gerente' | 'vendedor'

interface CompanyContextType {
  companyId: string | null
  companyName: string | null
  role: UserRole | null
  loading: boolean
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CompanyContext = createContext<CompanyContextType>({
  companyId: null,
  companyName: null,
  role: null,
  loading: true,
})

// ─── Provider ────────────────────────────────────────────────────────────────

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CompanyContextType>({
    companyId: null,
    companyName: null,
    role: null,
    loading: true,
  })

  useEffect(() => {
    async function loadCompany() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setState({ companyId: null, companyName: null, role: null, loading: false })
        return
      }

      // Buscar la empresa del usuario con su rol y nombre de empresa
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          role,
          companies (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        console.error('[CompanyContext] Error cargando empresa:', error)
        setState({ companyId: null, companyName: null, role: null, loading: false })
        return
      }

      const company = Array.isArray(data.companies) ? data.companies[0] : data.companies

      setState({
        companyId: data.company_id,
        companyName: company?.name ?? null,
        role: data.role as UserRole,
        loading: false,
      })
    }

    loadCompany()
  }, [])

  return (
    <CompanyContext.Provider value={state}>
      {children}
    </CompanyContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCompany() {
  const context = useContext(CompanyContext)

  if (context === undefined) {
    throw new Error('useCompany debe usarse dentro de <CompanyProvider>')
  }

  return context
}
