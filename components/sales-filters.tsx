"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Filter, Search, X } from "lucide-react"

const FILTERS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .sf-root {
    font-family: 'DM Sans', sans-serif;
    --sf-p:      var(--primary, #984ca8);
    --sf-p10:    rgba(var(--primary-rgb, 152,76,168), 0.10);
    --sf-txt:    #1a1a18;
    --sf-muted:  rgba(26,26,24,0.45);
    --sf-border: rgba(26,26,24,0.08);
  }

  .sf-card {
    background: #fff;
    border: 1px solid var(--sf-border);
    overflow: hidden;
  }
  .sf-hd {
    padding: 12px 18px;
    border-bottom: 1px solid var(--sf-border);
    display: flex; align-items: center; gap: 8px;
  }
  .sf-hd-icon {
    width: 24px; height: 24px;
    background: var(--sf-p10);
    display: flex; align-items: center; justify-content: center;
  }
  .sf-hd-icon svg { color: var(--sf-p); width: 12px; height: 12px; }
  .sf-hd-title {
    font-size: 10px; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--sf-txt); margin: 0;
  }
  .sf-body { padding: 16px 18px; }

  /* Grid de filtros */
  .sf-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) { .sf-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1024px) { .sf-grid { grid-template-columns: 1fr 1fr 1fr auto; align-items: end; } }

  .sf-field { display: flex; flex-direction: column; gap: 5px; }
  .sf-label {
    font-size: 8px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--sf-muted);
  }
  .sf-input {
    height: 38px; padding: 0 12px;
    border: 1px solid var(--sf-border);
    background: #fff; width: 100%;
    font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--sf-txt);
    outline: none; transition: border-color 0.15s;
    -webkit-appearance: none;
  }
  .sf-input:focus { border-color: var(--sf-p); }

  /* Select nativo — más compatible que el custom */
  .sf-select {
    height: 38px; padding: 0 12px;
    border: 1px solid var(--sf-border);
    background: #fff; width: 100%;
    font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--sf-txt);
    outline: none; cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(26,26,24,0.35)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
    transition: border-color 0.15s;
  }
  .sf-select:focus { border-color: var(--sf-p); }

  /* Botones */
  .sf-btn-row { display: flex; gap: 8px; }
  .sf-btn-apply {
    flex: 1; height: 38px;
    background: var(--sf-p); border: none; cursor: pointer;
    color: #fff; font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: opacity 0.15s; white-space: nowrap;
  }
  .sf-btn-apply:hover { opacity: 0.88; }
  .sf-btn-clear {
    height: 38px; padding: 0 14px;
    border: 1px solid var(--sf-border); background: #fff; cursor: pointer;
    color: var(--sf-muted); font-family: 'DM Sans', sans-serif; font-size: 11px;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    transition: border-color 0.15s, color 0.15s;
  }
  .sf-btn-clear:hover { border-color: var(--sf-txt); color: var(--sf-txt); }
`

interface SalesFiltersProps { companyId: string }

export function SalesFilters({ companyId }: SalesFiltersProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [from,    setFrom]    = useState(searchParams.get("from")   || "")
  const [to,      setTo]      = useState(searchParams.get("to")     || "")
  const [client,  setClient]  = useState(searchParams.get("client") || "")
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    ;(async () => {
      const { data } = await createClient().from("clients")
        .select("id, name").eq("company_id", companyId).order("name")
      setClients(data || [])
    })()
  }, [companyId])

  const apply = () => {
    const p = new URLSearchParams()
    if (from) p.set("from", from)
    if (to)   p.set("to",   to)
    if (client && client !== "all") p.set("client", client)
    router.push(`/dashboard/sales?${p.toString()}`)
  }

  const clear = () => {
    setFrom(""); setTo(""); setClient("")
    router.push("/dashboard/sales")
  }

  const hasFilters = from || to || (client && client !== "all")

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FILTERS_CSS }} />
      <div className="sf-root sf-card">
        <div className="sf-hd">
          <div className="sf-hd-icon"><Filter /></div>
          <p className="sf-hd-title">Filtros</p>
          {hasFilters && (
            <span style={{
              marginLeft: "auto", fontSize: 9, fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: "var(--sf-p10)", color: "var(--sf-p)", padding: "2px 8px"
            }}>
              Activos
            </span>
          )}
        </div>
        <div className="sf-body">
          <div className="sf-grid">
            <div className="sf-field">
              <span className="sf-label">Fecha inicial</span>
              <input type="date" className="sf-input" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="sf-field">
              <span className="sf-label">Fecha final</span>
              <input type="date" className="sf-input" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div className="sf-field">
              <span className="sf-label">Cliente</span>
              <select className="sf-select" value={client} onChange={e => setClient(e.target.value)}>
                <option value="all">Todos los clientes</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sf-field">
              <span className="sf-label" style={{ visibility: "hidden" }}>_</span>
              <div className="sf-btn-row">
                <button className="sf-btn-apply" onClick={apply}>
                  <Search size={12} />
                  Aplicar
                </button>
                {hasFilters && (
                  <button className="sf-btn-clear" onClick={clear} aria-label="Limpiar filtros">
                    <X size={12} />
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
