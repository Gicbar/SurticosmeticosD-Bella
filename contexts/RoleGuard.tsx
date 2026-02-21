'use client'

import { useCompany, type UserRole } from '@/contexts/CompanyContext'

interface RoleGuardProps {
  allowed: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode // opcional: qué mostrar si no tiene permiso
}

/**
 * Oculta o muestra contenido según el rol del usuario en la empresa.
 *
 * Uso:
 *   <RoleGuard allowed={['admin', 'gerente']}>
 *     <ReporteUtilidades />
 *   </RoleGuard>
 *
 *   <RoleGuard allowed={['admin']} fallback={<p>Sin acceso</p>}>
 *     <ConfiguracionEmpresa />
 *   </RoleGuard>
 */
export function RoleGuard({ allowed, children, fallback = null }: RoleGuardProps) {
  const { role, loading } = useCompany()

  if (loading) return null

  if (!role || !allowed.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
