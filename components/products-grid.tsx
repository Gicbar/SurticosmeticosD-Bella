"use client"

import { useState } from "react"
import { Edit, Trash2, Search, Package, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert"

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

.pg-root {
  font-family:'DM Sans',sans-serif;
  --p:      var(--primary, #984ca8);
  --p08:    rgba(var(--primary-rgb,152,76,168),.08);
  --p15:    rgba(var(--primary-rgb,152,76,168),.15);
  --p30:    rgba(var(--primary-rgb,152,76,168),.30);
  --txt:    #1a1a18;
  --muted:  rgba(26,26,24,.45);
  --border: rgba(26,26,24,.08);
  --ok:     #16a34a;
  --warn:   #d97706;
  --danger: #dc2626;
}

/* ── Barra de búsqueda ───────────────────────────────────────── */
.pg-search-wrap { position:relative; margin-bottom:20px; }
.pg-search-ico  {
  position:absolute; left:13px; top:50%; transform:translateY(-50%);
  color:var(--muted); pointer-events:none; display:flex;
}
.pg-search {
  width:100%; height:42px; padding:0 14px 0 40px;
  border:1px solid var(--border); background:#fff;
  border-radius:4px;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; transition:border-color .15s; -webkit-appearance:none;
}
.pg-search:focus { border-color:var(--p); }
.pg-search::placeholder { color:var(--muted); }

/* ── Grid ────────────────────────────────────────────────────── */
.pg-grid {
  display:grid; gap:16px;
  grid-template-columns:repeat(2, 1fr);
}
@media(min-width:540px)  { .pg-grid{ grid-template-columns:repeat(3,1fr); } }
@media(min-width:768px)  { .pg-grid{ grid-template-columns:repeat(4,1fr); } }
@media(min-width:1100px) { .pg-grid{ grid-template-columns:repeat(5,1fr); gap:18px; } }
@media(min-width:1400px) { .pg-grid{ grid-template-columns:repeat(6,1fr); } }

/* ── Tarjeta ─────────────────────────────────────────────────── */
.pg-card {
  background: #fff;
  border-radius: 18px;
  overflow: visible; /* visible para que la sombra no se corte */
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: default;

  /* Contenedor interno para clip del contenido */
  isolation: isolate;

  /*
   * Sombras multicapa para efecto de profundidad:
   * – capa 1: sombra suave difusa (elevación base)
   * – capa 2: sombra media coloreada con primary muy sutil
   * – capa 3: highlight inset superior (luz desde arriba)
   * – capa 4: inset inferior (borde físico inferior)
   */
  box-shadow:
    0 1px 3px  rgba(0,0,0,.05),
    0 6px 16px rgba(var(--primary-rgb,152,76,168), .10),
    0 18px 36px rgba(var(--primary-rgb,152,76,168), .07),
    inset 0 1px 0 rgba(255,255,255,.95),
    inset 0 -1px 0 rgba(var(--primary-rgb,152,76,168), .06);

  /* Borde con tono primary muy sutil */
  border: 1px solid rgba(var(--primary-rgb,152,76,168), .14);

  transition: box-shadow .24s ease, transform .24s ease, border-color .24s;
  will-change: transform;
}

/* Clip del contenido (evita que la imagen se salga del radius) */
.pg-card > * { border-radius: inherit; }
.pg-card > *:not(:last-child) { border-radius: 18px 18px 0 0; }
.pg-card > *:last-child       { border-radius: 0 0 18px 18px; }

/* Hover */
.pg-card:hover {
  transform: translateY(-7px) scale(1.015);
  border-color: rgba(var(--primary-rgb,152,76,168), .30);
  box-shadow:
    0 2px 6px  rgba(0,0,0,.04),
    0 10px 28px rgba(var(--primary-rgb,152,76,168), .18),
    0 28px 52px rgba(var(--primary-rgb,152,76,168), .13),
    0 40px 64px rgba(0,0,0,.05),
    inset 0 1px 0 rgba(255,255,255,.98),
    inset 0 -1px 0 rgba(var(--primary-rgb,152,76,168), .10);
}

/* Franja top con color — siempre presente, se intensifica en hover */
.pg-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 4px;
  background: linear-gradient(90deg, var(--p) 0%, rgba(var(--primary-rgb,152,76,168),.5) 100%);
  opacity: .25;
  transition: opacity .24s ease;
  z-index: 3;
  border-radius: 18px 18px 0 0;
  pointer-events: none;
}
.pg-card:hover::before { opacity: 1; }

/* ── Imagen ──────────────────────────────────────────────────── */
.pg-img-wrap {
  aspect-ratio: 1/1;
  position: relative;
  overflow: hidden;
  border-radius: 18px 18px 0 0;
  /* Fondo con tono primary muy suave */
  background: linear-gradient(
    135deg,
    rgba(var(--primary-rgb,152,76,168),.07) 0%,
    rgba(var(--primary-rgb,152,76,168),.03) 100%
  );
}

/* Overlay gradiente en hover */
.pg-img-wrap::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(
    180deg,
    transparent 50%,
    rgba(var(--primary-rgb,152,76,168),.10) 100%
  );
  opacity: 0;
  transition: opacity .24s;
  pointer-events: none;
}
.pg-card:hover .pg-img-wrap::after { opacity: 1; }

.pg-img-placeholder {
  width:100%; height:100%;
  display:flex; align-items:center; justify-content:center;
  color:var(--p); opacity:.3;
}
.pg-img-placeholder svg { width:30px; height:30px; }

/* ── Body ────────────────────────────────────────────────────── */
.pg-body {
  padding: 13px 14px 14px;
  flex: 1; display: flex; flex-direction: column; gap: 9px;
  border-radius: 0 0 18px 18px;
  /* Degradado muy sutil de color en el body */
  background: linear-gradient(
    to bottom,
    rgba(var(--primary-rgb,152,76,168),.025) 0%,
    #fff 60%
  );
}

/* Nombre */
.pg-name {
  font-size:12px; font-weight:500; color:var(--txt);
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
  overflow:hidden; line-height:1.35; margin:0;
  transition:color .16s;
}
.pg-card:hover .pg-name { color:var(--p); }

/* Descripción */
.pg-desc {
  font-size:10px; color:var(--muted); margin:0;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
  overflow:hidden; line-height:1.4;
}

/* Info rows */
.pg-info { display:flex; flex-direction:column; gap:4px; }
.pg-row  { display:flex; justify-content:space-between; align-items:center; }
.pg-key  { font-size:9px; font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--muted); }
.pg-val  { font-size:10px; font-weight:500; color:var(--txt); }
.pg-code {
  font-family:monospace; font-size:9px;
  background: rgba(var(--primary-rgb,152,76,168),.07);
  color: var(--p);
  padding:1px 6px; border-radius:3px;
  border: 1px solid rgba(var(--primary-rgb,152,76,168),.12);
}

/* Badge stock */
.pg-stock { display:inline-flex; align-items:center; gap:3px; padding:2px 8px; font-size:9px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; border-radius:99px; }
.pg-stock.ok  { background:rgba(22,163,74,.10); color:var(--ok); }
.pg-stock.low { background:rgba(217,119,6,.10); color:var(--warn); }
.pg-stock.out { background:rgba(220,38,38,.10); color:var(--danger); }
.pg-stock svg { width:9px; height:9px; flex-shrink:0; }

/* Separador con color */
.pg-sep {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--primary-rgb,152,76,168),.18) 30%,
    rgba(var(--primary-rgb,152,76,168),.18) 70%,
    transparent
  );
}

/* Precio */
.pg-price {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:21px; font-weight:500; color:var(--p); margin:0;
  transition: transform .18s;
  text-shadow: 0 1px 8px rgba(var(--primary-rgb,152,76,168),.15);
}
.pg-card:hover .pg-price { transform: scale(1.04); }

/* ── Acciones ────────────────────────────────────────────────── */
.pg-actions { display:flex; gap:6px; }
.pg-btn-edit {
  flex:1; height:34px;
  border: 1px solid rgba(var(--primary-rgb,152,76,168),.20);
  background: rgba(var(--primary-rgb,152,76,168),.04);
  border-radius:10px;
  display:flex; align-items:center; justify-content:center; gap:5px;
  font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500;
  color: var(--p); opacity:.75;
  cursor:pointer; text-decoration:none;
  transition: all .16s;
}
.pg-btn-edit:hover {
  border-color: var(--p);
  background: rgba(var(--primary-rgb,152,76,168),.10);
  opacity: 1;
  box-shadow: 0 2px 10px rgba(var(--primary-rgb,152,76,168),.18);
}
.pg-btn-edit svg { width:11px; height:11px; }

.pg-btn-del {
  width:34px; height:34px;
  border: 1px solid rgba(26,26,24,.08);
  background: rgba(26,26,24,.02);
  border-radius:10px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:var(--muted);
  transition: all .16s;
}
.pg-btn-del:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: rgba(220,38,38,.06);
  box-shadow: 0 2px 8px rgba(220,38,38,.12);
}
.pg-btn-del svg { width:12px; height:12px; }

/* ── Estado vacío ────────────────────────────────────────────── */
.pg-empty {
  display:flex; flex-direction:column; align-items:center; gap:14px;
  padding:64px 20px; text-align:center;
}
.pg-empty-ico {
  width:56px; height:56px; background:var(--p08);
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
}
.pg-empty-ico svg { color:var(--p); opacity:.35; width:24px; height:24px; }
.pg-empty-t { font-size:14px; font-weight:500; color:var(--txt); margin:0; }
.pg-empty-s { font-size:12px; color:var(--muted); margin:0; }
`

type Product = {
  id: string; name: string; description: string | null; barcode: string | null
  sale_price: number; min_stock: number; image_url: string | null
  current_stock: number; categories: { name: string } | null; suppliers: { name: string } | null
}

export function ProductsGrid({ products }: { products: Product[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.categories?.name.toLowerCase().includes(q)
  })

  const handleDelete = async (id: string, name: string) => {
    const ok = await showConfirm(`¿Eliminar "${name}"?`, "Esta acción no se puede deshacer")
    if (!ok) return
    const { error } = await createClient().from("products").delete().eq("id", id)
    if (error) showError(error.message, "Error al eliminar")
    else { await showSuccess("Producto eliminado", ""); router.refresh() }
  }

  const stockClass = (cur: number, min: number) => cur === 0 ? "out" : cur <= min ? "low" : "ok"
  const stockLabel = (cur: number, min: number) => cur === 0 ? "Sin stock" : cur <= min ? `Bajo (${cur})` : `${cur} uds.`
  const fmt = (v: number) => Number(v).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pg-root">

        {/* Búsqueda */}
        <div className="pg-search-wrap">
          <span className="pg-search-ico" aria-hidden><Search size={15} /></span>
          <input
            className="pg-search"
            placeholder="Busca por nombre, código o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {filtered.length > 0 ? (
          <div className="pg-grid">
            {filtered.map(p => (
              <div key={p.id} className="pg-card">

                {/* Imagen */}
                <div className="pg-img-wrap">
                  {p.image_url ? (
                    <Image
                      src={p.image_url} alt={p.name} fill
                      style={{ objectFit: "cover", transition: "transform .4s ease" }}
                      sizes="(max-width:540px) 50vw, (max-width:768px) 33vw, (max-width:1100px) 25vw, 17vw"
                    />
                  ) : (
                    <div className="pg-img-placeholder" aria-hidden>
                      <Sparkles />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="pg-body">
                  <p className="pg-name" title={p.name}>{p.name}</p>
                  {p.description && <p className="pg-desc">{p.description}</p>}

                  <div className="pg-info">
                    {p.barcode && (
                      <div className="pg-row">
                        <span className="pg-key">Código</span>
                        <span className="pg-code">{p.barcode}</span>
                      </div>
                    )}
                    {p.categories && (
                      <div className="pg-row">
                        <span className="pg-key">Categoría</span>
                        <span className="pg-val" style={{ maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.categories.name}
                        </span>
                      </div>
                    )}
                    <div className="pg-row">
                      <span className="pg-key">Stock</span>
                      <span className={`pg-stock ${stockClass(p.current_stock, p.min_stock)}`}>
                        <Package aria-hidden />
                        {stockLabel(p.current_stock, p.min_stock)}
                      </span>
                    </div>
                  </div>

                  <div className="pg-sep" aria-hidden />

                  <div className="pg-row" style={{ alignItems: "flex-end" }}>
                    <span className="pg-key">Precio</span>
                    <p className="pg-price">{fmt(p.sale_price)}</p>
                  </div>

                  {/* Acciones */}
                  <div className="pg-actions">
                    <Link href={`/dashboard/products/${p.id}/edit`} className="pg-btn-edit">
                      <Edit aria-hidden /> Editar
                    </Link>
                    <button
                      className="pg-btn-del"
                      onClick={() => handleDelete(p.id, p.name)}
                      aria-label={`Eliminar ${p.name}`}
                    >
                      <Trash2 aria-hidden />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="pg-empty">
            <div className="pg-empty-ico"><Package /></div>
            <p className="pg-empty-t">No se encontraron productos</p>
            <p className="pg-empty-s">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>
    </>
  )
}
