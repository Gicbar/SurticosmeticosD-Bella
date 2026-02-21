import { createClient } from '@/lib/supabase/client'

/**
 * Retorna una query base ya filtrada por company_id.
 *
 * Uso en cualquier componente:
 *   const rows = await companyQuery('products', companyId).select('*')
 */
export function companyQuery(table: string, companyId: string) {
  const supabase = createClient()
  return supabase.from(table).eq('company_id', companyId) as ReturnType<
    ReturnType<typeof createClient>['from']
  >
}

/**
 * Agrega company_id automáticamente a cualquier objeto antes de insertar.
 *
 * Uso:
 *   await supabase.from('products').insert(withCompany(formValues, companyId))
 */
export function withCompany<T extends object>(
  data: T,
  companyId: string
): T & { company_id: string } {
  return { ...data, company_id: companyId }
}
