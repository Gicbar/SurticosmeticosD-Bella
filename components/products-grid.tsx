"use client"

import { useState } from "react"
import { Edit, Trash2, Search, Package, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert"

// ── CSS — mismo token system ──────────────────────────────────────────────────
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

/* ── Barra de búsqueda ────────────────────────────────────────────────── */
.pg-search-wrap { position:relative; margin-bottom:20px; }
.pg-search-ico  { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; display:flex; }
.pg-search {
  width:100%; height:42px; padding:0 14px 0 40px;
  border:1px solid var(--border); background:#fff;
  font-family:'DM Sans',sans-serif; font-size:13px; color:var(--txt);
  outline:none; transition:border-color .15s; -webkit-appearance:none;
}
.pg-search:focus { border-color:var(--p); }
.pg-search::placeholder { color:var(--muted); }

/* ── Grid de tarjetas ─────────────────────────────────────────────────── */
.pg-grid {
  display:grid; gap:12px;
  grid-template-columns:repeat(2, 1fr);
}
@media(min-width:540px)  { .pg-grid{ grid-template-columns:repeat(3,1fr); } }
@media(min-width:768px)  { .pg-grid{ grid-template-columns:repeat(4,1fr); } }
@media(min-width:1100px) { .pg-grid{ grid-template-columns:repeat(5,1fr); gap:14px; } }
@media(min-width:1400px) { .pg-grid{ grid-template-columns:repeat(6,1fr); } }

/* ── Tarjeta producto ─────────────────────────────────────────────────── */
.pg-card {
  background:#fff; border:1px solid var(--border);
  overflow:hidden; display:flex; flex-direction:column;
  transition:box-shadow .18s, transform .18s; position:relative;
}
.pg-card:hover { box-shadow:0 6px 24px var(--p08); transform:translateY(-2px); }
.pg-card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:var(--p); opacity:0; transition:opacity .18s; z-index:1;
}
.pg-card:hover::before { opacity:1; }

/* Imagen */
.pg-img-wrap {
  aspect-ratio:1/1; position:relative; overflow:hidden;
  background:linear-gradient(135deg, rgba(26,26,24,.04), var(--p08));
}
.pg-img-placeholder {
  width:100%; height:100%; display:flex; align-items:center; justify-content:center;
  color:var(--p); opacity:.5;
}
.pg-img-placeholder svg { width:24px; height:24px; }

/* Body */
.pg-body { padding:12px; flex:1; display:flex; flex-direction:column; gap:10px; }

/* Nombre */
.pg-name {
  font-size:12px; font-weight:500; color:var(--txt);
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
  overflow:hidden; line-height:1.35; margin:0;
  transition:color .14s;
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
.pg-code { font-family:monospace; font-size:9px; background:rgba(26,26,24,.05); padding:1px 5px; }

/* Badge stock */
.pg-stock { display:inline-flex; align-items:center; gap:3px; padding:1px 7px; font-size:9px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
.pg-stock.ok     { background:rgba(22,163,74,.08);   color:var(--ok); }
.pg-stock.low    { background:rgba(217,119,6,.08);   color:var(--warn); }
.pg-stock.out    { background:rgba(220,38,38,.08);   color:var(--danger); }
.pg-stock svg    { width:9px; height:9px; flex-shrink:0; }

/* Divider */
.pg-sep { height:1px; background:var(--border); }

/* Precio */
.pg-price {
  font-family:'Cormorant Garamond',Georgia,serif;
  font-size:18px; font-weight:500; color:var(--p); margin:0;
}

/* Acciones */
.pg-actions { display:flex; gap:6px; }
.pg-btn-edit {
  flex:1; height:32px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center; gap:4px;
  font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500;
  color:var(--muted); cursor:pointer; text-decoration:none;
  transition:border-color .14s, color .14s, background .14s;
}
.pg-btn-edit:hover { border-color:var(--p); color:var(--p); background:var(--p08); }
.pg-btn-edit svg { width:11px; height:11px; }
.pg-btn-del {
  width:32px; height:32px; border:1px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:var(--muted);
  transition:border-color .14s, color .14s, background .14s;
}
.pg-btn-del:hover { border-color:var(--danger); color:var(--danger); background:rgba(220,38,38,.05); }
.pg-btn-del svg { width:12px; height:12px; }

/* Vacío */
.pg-empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px 20px; text-align:center; }
.pg-empty-ico { width:52px; height:52px; background:var(--p08); display:flex; align-items:center; justify-content:center; border-radius:50%; }
.pg-empty-ico svg { color:var(--p); opacity:.4; width:22px; height:22px; }
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

  const stockClass  = (cur: number, min: number) => cur === 0 ? "out" : cur <= min ? "low" : "ok"
  const stockLabel  = (cur: number, min: number) => cur === 0 ? "Sin stock" : cur <= min ? `Bajo (${cur})` : `Stock (${cur})`
  const fmt = (v: number) => Number(v).toLocaleString("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pg-root">

        {/* Búsqueda */}
        <div className="pg-search-wrap">
          <span className="pg-search-ico" aria-hidden><Search size={15}/></span>
          <input
            className="pg-search"
            placeholder="Busca por nombre, código o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="pg-grid">
            {filtered.map(p => (
              <div key={p.id} className="pg-card">
                {/* Imagen */}
                <div className="pg-img-wrap">
                  {p.image_url ? (
                    <Image
                      src={p.image_url} alt={p.name} fill
                      style={{ objectFit:"cover", transition:"transform .3s" }}
                      sizes="(max-width:540px) 50vw, (max-width:768px) 33vw, (max-width:1100px) 25vw, 17vw"
                      className="pg-img"
                    />
                  ) : (
                    <div className="pg-img-placeholder" aria-hidden>
                      <Sparkles/>
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
                        <span className="pg-val" style={{ maxWidth:"55%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {p.categories.name}
                        </span>
                      </div>
                    )}
                    <div className="pg-row">
                      <span className="pg-key">Stock</span>
                      <span className={`pg-stock ${stockClass(p.current_stock, p.min_stock)}`}>
                        <Package/>
                        {stockLabel(p.current_stock, p.min_stock)}
                      </span>
                    </div>
                  </div>

                  <div className="pg-sep" aria-hidden/>

                  <div className="pg-row">
                    <span className="pg-key">Precio</span>
                    <p className="pg-price">{fmt(p.sale_price)}</p>
                  </div>

                  {/* Acciones */}
                  <div className="pg-actions">
                    <Link href={`/dashboard/products/${p.id}/edit`} className="pg-btn-edit">
                      <Edit/> Editar
                    </Link>
                    <button
                      className="pg-btn-del"
                      onClick={() => handleDelete(p.id, p.name)}
                      aria-label={`Eliminar ${p.name}`}
                    >
                      <Trash2/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pg-empty">
            <div className="pg-empty-ico"><Package/></div>
            <p className="pg-empty-t">No se encontraron productos</p>
            <p className="pg-empty-s">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>
    </>
  )
}
