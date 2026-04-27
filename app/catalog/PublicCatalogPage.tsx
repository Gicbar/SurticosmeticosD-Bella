"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  Search, X, ShoppingBag, Plus, Minus,
  Sparkles, ArrowRight, Package, Heart, Tag, AlertTriangle, Clock, Check
} from "lucide-react"
import { createPublicClient } from "@/lib/supabase/public-client"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CompanyInfo = {
  id: string
  name: string
  slug: string
  domain: string | null
  phone?: string | null
  logo_url?: string | null
  theme?: Record<string, string> | null
}

type CatalogProduct = {
  id: string
  name: string
  description: string | null
  sale_price: number
  image_url: string | null
  category_id: string | null
  category_name: string | null
  total_inventario: number
  company_id: string
  catalog_stock?: string | null
  offer_price: number | null
  offer_discount_pct: number | null
  offer_start: string | null
  offer_end: string | null
  offer_campaign_id: string | null
  has_offer: boolean
  effective_price: number
}

type CartItem = CatalogProduct & { quantity: number }

interface PublicCatalogPageProps {
  products: CatalogProduct[]
  categories: { name: string }[]
  company: CompanyInfo
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return ""
  // Acepta "YYYY-MM-DD" o ISO completo. Parseo por partes para evitar drift TZ.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return ""
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
}

function priceOf(p: CatalogProduct) {
  return p.has_offer && p.offer_price != null ? Number(p.offer_price) : Number(p.sale_price)
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CATALOG_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  /* ── Variables del tema ─────────────────────────────────────── */
  .cat-root {
    font-family: 'DM Sans', sans-serif;
    background: #f8f7f5;
    min-height: 100vh;
    min-height: 100svh;
    color: #1a1a18;
    overflow-x: hidden;

    --p:   var(--primary, #984ca8);
    --rgb: var(--primary-rgb, 152,76,168);
    --sec: var(--secondary, #f3edf7);
    --acc: var(--accent, #7b3d8a);

    --p04: rgba(var(--primary-rgb,152,76,168), .04);
    --p08: rgba(var(--primary-rgb,152,76,168), .08);
    --p12: rgba(var(--primary-rgb,152,76,168), .12);
    --p20: rgba(var(--primary-rgb,152,76,168), .20);
    --p30: rgba(var(--primary-rgb,152,76,168), .30);

    --txt:    #1a1a18;
    --muted:  rgba(26,26,24,.45);
    --border: rgba(26,26,24,.08);

    /* Color de oferta — rojo cálido para que contraste con la marca */
    --offer: #dc2626;
    --offer-bg: rgba(220,38,38,.08);
  }

  .cat-serif { font-family: 'Cormorant Garamond', Georgia, serif; }

  /* ── Header ─────────────────────────────────────────────────── */
  .cat-header {
    position: sticky; top: 0; z-index: 100;
    background: var(--secondary, #f3edf7);
    border-bottom: 1px solid rgba(var(--primary-rgb,152,76,168), .18);
    transition: box-shadow .2s;
  }
  .cat-header.scrolled {
    box-shadow:
      0 1px 0 rgba(var(--primary-rgb,152,76,168), .15),
      0 6px 24px rgba(var(--primary-rgb,152,76,168), .10);
  }

  .cat-header::after {
    content: '';
    position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
    background: linear-gradient(
      90deg,
      var(--primary, #984ca8) 0%,
      rgba(var(--primary-rgb,152,76,168), .4) 60%,
      transparent 100%
    );
  }

  .cat-header-inner {
    max-width: 1400px; margin: 0 auto;
    padding: 0 14px;
    display: flex; align-items: center; justify-content: space-between;
    height: 72px; gap: 12px;
  }
  @media (min-width: 420px) { .cat-header-inner { padding: 0 18px; gap: 14px; } }
  @media (min-width: 640px) {
    .cat-header-inner { padding: 0 32px; height: 88px; }
  }

  .cat-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
  @media (min-width: 640px) { .cat-brand { gap: 18px; } }

  .cat-logo {
    width: 44px; height: 44px; flex-shrink: 0;
    background: var(--primary, #984ca8);
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    box-shadow:
      0 4px 14px rgba(var(--primary-rgb,152,76,168), .28),
      0 0 0 1px rgba(var(--primary-rgb,152,76,168), .15),
      inset 0 1px 0 rgba(255,255,255,.18);
    overflow: hidden;
    position: relative;
  }
  @media (min-width: 420px) { .cat-logo { width: 50px; height: 50px; border-radius: 12px; } }
  @media (min-width: 640px) { .cat-logo { width: 60px; height: 60px; border-radius: 14px; } }

  .cat-company-name {
    font-size: 19px; font-weight: 500; line-height: 1.05; letter-spacing: -.005em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: min(200px, 52vw);
    color: var(--primary, #984ca8);
    margin: 0;
  }
  @media (min-width: 420px) { .cat-company-name { font-size: 23px; max-width: min(280px, 60vw); } }
  @media (min-width: 480px) { .cat-company-name { font-size: 27px; max-width: 340px; } }
  @media (min-width: 640px) { .cat-company-name { font-size: 32px; } }

  .cat-company-sub {
    font-size: 9px; letter-spacing: .28em; text-transform: uppercase;
    color: rgba(var(--primary-rgb,152,76,168), .58);
    margin: 4px 0 0; font-weight: 500;
    display: flex; align-items: center; gap: 7px;
  }
  .cat-company-sub::before {
    content: '';
    width: 16px; height: 1px;
    background: rgba(var(--primary-rgb,152,76,168), .45);
    display: inline-block;
  }
  @media (min-width: 640px) { .cat-company-sub { font-size: 10px; } }

  .cat-header-right {
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }
  @media (min-width: 480px) { .cat-header-right { gap: 16px; } }
  .cat-ref-count {
    font-size: 10px; letter-spacing: .08em;
    color: rgba(var(--primary-rgb,152,76,168), .55);
    background: rgba(var(--primary-rgb,152,76,168), .10);
    padding: 4px 10px; border-radius: 99px;
  }
  @media (max-width: 420px) { .cat-ref-count { display: none; } }

  .cat-cart-btn {
    position: relative; background: none; border: none; cursor: pointer;
    width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 10px;
    background: rgba(var(--primary-rgb,152,76,168), .10);
    color: var(--primary, #984ca8);
    transition: background .15s, transform .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .cat-cart-btn:hover { background: rgba(var(--primary-rgb,152,76,168), .18); transform: scale(1.04); }
  .cat-cart-btn:active { transform: scale(.94); }

  .cat-cart-badge {
    position: absolute; top: -3px; right: -3px;
    background: var(--primary, #984ca8); color: white;
    font-size: 9px; font-weight: 700;
    min-width: 17px; height: 17px; padding: 0 3px;
    border-radius: 99px; border: 2px solid var(--secondary, #f3edf7);
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Sección intro ───────────────────────────────────────────── */
  .cat-intro {
    background: var(--secondary, #f3edf7);
    border-bottom: 1px solid rgba(var(--primary-rgb,152,76,168), .12);
  }
  .cat-intro-inner {
    max-width: 1400px; margin: 0 auto;
    padding: 22px 16px 20px;
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 14px; flex-wrap: wrap;
  }
  @media (min-width: 640px) { .cat-intro-inner { padding: 36px 28px 28px; } }

  .cat-intro-eyebrow {
    font-size: 9px; letter-spacing: .28em; text-transform: uppercase;
    color: var(--primary, #984ca8); margin-bottom: 10px; font-weight: 600;
    display: flex; align-items: center; gap: 8px;
  }
  .cat-intro-eyebrow::before {
    content: '';
    width: 20px; height: 1.5px;
    background: var(--primary, #984ca8);
    display: inline-block;
  }

  .cat-intro-count {
    text-align: right;
  }
  .cat-intro-num {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 30px; font-weight: 300; color: var(--primary, #984ca8);
    line-height: 1; margin: 0;
  }
  .cat-intro-num-label {
    font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
    color: rgba(var(--primary-rgb,152,76,168), .55); margin-top: 5px;
  }

  /* Banner OFERTAS — visible si hay productos en oferta */
  .cat-offer-banner {
    margin-top: 16px;
    padding: 11px 14px;
    background: var(--offer-bg);
    border-left: 3px solid var(--offer);
    color: var(--offer);
    font-size: 12px; font-weight: 500;
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .cat-offer-banner strong { font-weight: 700; }
  .cat-offer-banner svg { flex-shrink: 0; }

  .cat-divider-color {
    height: 2px; max-width: 1400px; margin: 0 auto;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(var(--primary-rgb,152,76,168), .4) 50%,
      transparent 100%
    );
  }

  /* ── Filtros ────────────────────────────────────────────────── */
  .cat-filters {
    background: white;
    border-bottom: 1px solid rgba(26,26,24,.07);
    position: sticky; top: 72px; z-index: 50;
  }
  @media (min-width: 640px) { .cat-filters { top: 88px; } }

  .cat-filters-inner {
    max-width: 1400px; margin: 0 auto;
    padding: 14px 16px 12px;
  }
  @media (min-width: 640px) { .cat-filters-inner { padding: 18px 28px 14px; } }

  .cat-search-row {
    position: relative;
    border-bottom: 1px solid rgba(26,26,24,.06);
    padding-bottom: 12px; margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }

  .cat-input {
    width: 100%; background: transparent; border: none;
    border-bottom: 1.5px solid rgba(26,26,24,.15);
    padding: 10px 0 10px 22px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: #1a1a18; outline: none;
    transition: border-color .2s;
    -webkit-appearance: none;
    border-radius: 0;
  }
  .cat-input::placeholder { color: rgba(26,26,24,.35); }
  .cat-input:focus { border-bottom-color: var(--primary, #984ca8); }

  .cat-chips-row {
    display: flex; gap: 8px; overflow-x: auto;
    padding-bottom: 4px; -webkit-overflow-scrolling: touch;
  }
  .cat-chips-row::-webkit-scrollbar { display: none; }

  .cat-chip {
    flex-shrink: 0;
    padding: 7px 14px;
    border-radius: 99px;
    border: 1.5px solid rgba(26,26,24,.12);
    background: white;
    font-size: 11px; letter-spacing: .04em;
    color: rgba(26,26,24,.65);
    cursor: pointer;
    transition: all .18s;
    white-space: nowrap;
  }
  .cat-chip:hover {
    border-color: rgba(var(--primary-rgb,152,76,168), .40);
    color: var(--primary, #984ca8);
  }
  .cat-chip-active {
    background: var(--primary, #984ca8);
    color: white;
    border-color: var(--primary, #984ca8);
  }

  /* ── Grid productos ─────────────────────────────────────────── */
  .cat-content {
    max-width: 1400px; margin: 0 auto;
    padding: 22px 16px;
  }
  @media (min-width: 640px) { .cat-content { padding: 30px 28px; } }

  .cat-count-row {
    display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
  }
  .cat-count-label {
    font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
    color: rgba(26,26,24,.45);
  }

  .cat-grid {
    display: grid; gap: 10px;
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 640px) { .cat-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; } }
  @media (min-width: 1024px) { .cat-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }
  @media (min-width: 1400px) { .cat-grid { grid-template-columns: repeat(5, 1fr); } }

  .cat-card {
    background: white;
    border-radius: 18px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    display: flex; flex-direction: column;
    border: 1px solid rgba(var(--primary-rgb,152,76,168), .12);
    animation: cardIn .35s ease-out backwards;
    transition: transform .28s ease,
                box-shadow .28s ease, border-color .28s;
  }
  .cat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(var(--primary-rgb,152,76,168), .15);
    border-color: rgba(var(--primary-rgb,152,76,168), .28);
  }
  @keyframes cardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  /* Clip del contenido */
  .cat-card > *:first-child { border-radius: 18px 18px 0 0; overflow: hidden; }
  .cat-card > *:last-child  { border-radius: 0 0 18px 18px; }

  .cat-img-wrap {
    position: relative; width: 100%; aspect-ratio: 3/4;
    overflow: hidden; background: rgba(var(--primary-rgb,152,76,168), .06);
    border-radius: 18px 18px 0 0;
  }

  .cat-card-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform .55s ease;
  }
  .cat-card:hover .cat-card-img { transform: scale(1.05); }

  .cat-img-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: rgba(var(--primary-rgb,152,76,168), .25);
  }

  .cat-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,.06) 100%);
    pointer-events: none;
  }

  /* Badge OFERTA % — esquina superior izquierda, llamativo */
  .cat-offer-badge {
    position: absolute; top: 10px; left: 10px;
    z-index: 4;
    background: var(--offer);
    color: white;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: .02em;
    padding: 6px 10px;
    border-radius: 99px;
    box-shadow: 0 4px 14px rgba(220,38,38,.35);
    display: inline-flex; align-items: center; gap: 4px;
    line-height: 1;
  }
  .cat-offer-badge svg { width: 12px; height: 12px; }

  /* Cinta diagonal "OFERTA" — esquina superior derecha */
  .cat-offer-ribbon {
    position: absolute; top: 12px; right: -28px;
    z-index: 3;
    background: var(--offer);
    color: white;
    font-size: 8px; font-weight: 800;
    letter-spacing: .22em;
    padding: 4px 30px;
    transform: rotate(35deg);
    box-shadow: 0 2px 6px rgba(0,0,0,.18);
  }

  .cat-stock-badge {
    position: absolute; top: 10px; right: 10px;
    background: rgba(255,255,255,.94);
    color: #b91c1c; font-size: 9px; letter-spacing: .12em;
    text-transform: uppercase; font-weight: 700;
    padding: 4px 10px; border-radius: 99px;
    border: 1px solid #fecdd3;
    backdrop-filter: blur(4px);
  }

  /* Card body */
  .cat-body { padding: 12px; background: white; }
  @media (min-width: 640px) { .cat-body { padding: 14px; } }

  .cat-add-desktop, .cat-add-mobile {
    cursor: pointer; border: none; width: 100%;
    background: var(--primary, #984ca8);
    color: white; font-family: 'DM Sans', sans-serif;
    font-weight: 600; font-size: 11px; letter-spacing: .06em;
    text-transform: uppercase;
    padding: 11px; transition: opacity .18s, transform .18s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .cat-add-mobile {
    width: 40px; height: 40px; border-radius: 50%;
    position: absolute; bottom: 10px; right: 10px;
    padding: 0;
    background: var(--primary, #984ca8); color: white;
    border: none; cursor: pointer; touch-action: manipulation;
  }

  .cat-add-desktop {
    position: absolute; bottom: 0; left: 0; right: 0;
    border-radius: 0;
    transform: translateY(100%);
    transition: transform .25s ease;
  }
  .cat-card:hover .cat-add-desktop { transform: translateY(0); }
  .cat-add-desktop:hover { opacity: .92; }
  @media (max-width: 768px) { .cat-add-desktop { display: none; } }
  @media (min-width: 769px) { .cat-add-mobile { display: none; } }

  .cat-category-label {
    font-size: 9px; letter-spacing: .18em; text-transform: uppercase;
    color: var(--primary, #984ca8); margin-bottom: 5px; font-weight: 600; opacity: .7;
  }

  .cat-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 14px; font-weight: 400;
    line-height: 1.25;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.5em;
  }
  @media (min-width: 640px) { .cat-name { font-size: 15px; } }

  .cat-sep {
    width: 24px; height: 1px;
    background: var(--primary, #984ca8); opacity: .35;
    margin-bottom: 8px;
  }

  /* ── Bloque de precio (con o sin oferta) ── */
  .cat-price-row {
    display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
  }
  .cat-price {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 17px; font-weight: 500;
    color: var(--primary, #984ca8);
  }
  @media (min-width: 640px) { .cat-price { font-size: 19px; } }

  .cat-price.offer { color: var(--offer); }
  .cat-price-old {
    font-size: 12px; font-weight: 400;
    color: rgba(26,26,24,.35);
    text-decoration: line-through;
    text-decoration-thickness: 1.5px;
  }

  /* Skeleton */
  .cat-skeleton {
    background: linear-gradient(90deg, rgba(0,0,0,.04) 25%, rgba(0,0,0,.08) 37%, rgba(0,0,0,.04) 63%);
    background-size: 400% 100%; animation: skel 1.4s ease infinite;
    border-radius: 18px;
  }
  @keyframes skel { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

  .cat-empty {
    text-align: center; padding: 64px 16px;
  }
  .cat-empty-ico {
    width: 60px; height: 60px; margin: 0 auto 18px;
    background: rgba(var(--primary-rgb,152,76,168), .08);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .cat-empty-btn {
    margin-top: 8px; background: var(--primary, #984ca8);
    color: white; border: none;
    padding: 10px 24px; border-radius: 99px;
    font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
    font-weight: 600; cursor: pointer; transition: opacity .18s;
  }
  .cat-empty-btn:hover { opacity: .88; }

  .cat-divider {
    height: 1px;
    background: rgba(var(--primary-rgb,152,76,168), .14);
  }

  .cat-footer {
    text-align: center; padding: 30px 16px;
    color: rgba(26,26,24,.4);
    font-size: 11px; letter-spacing: .14em;
  }

  /* ── Cart drawer ─────────────────────────────────────────────── */
  .cat-cart-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(26,26,24,.45);
    animation: fadeIn .25s ease;
    display: flex; justify-content: flex-end;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .cat-cart-drawer {
    width: 100%; max-width: 460px;
    background: #f8f7f5;
    height: 100%; display: flex; flex-direction: column;
    animation: slideIn .3s ease;
    border-top: 3px solid var(--primary, #984ca8);
  }
  @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  @media (max-width: 480px) {
    .cat-cart-drawer {
      width: 100%; max-width: 100%;
      max-height: 92vh; height: 92vh;
      align-self: flex-end; margin-top: auto;
      border-radius: 20px 20px 0 0;
      animation: slideUp .3s ease;
      border-top: 3px solid var(--primary, #984ca8);
    }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  }

  .cat-drawer-hd {
    padding: 18px 18px 14px; border-bottom: 1px solid rgba(26,26,24,.08);
    background: #fff; flex-shrink: 0;
  }

  .cat-cart-items {
    flex: 1; overflow-y: auto; padding: 12px 18px;
  }
  @media (min-width: 480px) { .cat-cart-items { padding: 16px 24px; } }

  .cat-cart-foot {
    padding: 14px 18px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  }
  @media (min-width: 480px) { .cat-cart-foot { padding: 16px 24px; padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); } }

  .cat-qty-btn {
    background: white;
    border: 1.5px solid rgba(var(--primary-rgb,152,76,168),.25);
    width: 32px; height: 32px; border-radius: 6px;
    cursor: pointer; touch-action: manipulation;
    display: flex; align-items: center; justify-content: center;
    color: var(--primary, #984ca8);
    transition: background .12s;
  }
  .cat-qty-btn:hover { background: rgba(var(--primary-rgb,152,76,168),.08); }
  .cat-qty-btn.plus  { background: var(--primary, #984ca8); color: white; border-color: transparent; }
  .cat-qty-btn.plus:hover { opacity: .88; }

  /* Inputs cliente en checkout */
  .cat-form-field { margin-bottom: 12px; }
  .cat-form-label {
    display: block; font-size: 10px; letter-spacing: .14em;
    text-transform: uppercase; color: rgba(26,26,24,.55);
    margin-bottom: 6px; font-weight: 600;
  }
  .cat-form-input {
    width: 100%; height: 44px; padding: 0 13px;
    border: 1.5px solid rgba(var(--primary-rgb,152,76,168),.20);
    background: white;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: #1a1a18; outline: none; border-radius: 10px;
    transition: border-color .15s;
  }
  .cat-form-input:focus { border-color: var(--primary, #984ca8); }

  /* Aviso de "bajo stock" en el carrito */
  .cat-warn-box {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 10px 12px;
    background: rgba(217,119,6,.08);
    border-left: 3px solid #d97706;
    color: #b45309;
    font-size: 11px; line-height: 1.5;
    margin-bottom: 12px; border-radius: 0 8px 8px 0;
  }
  .cat-warn-box svg { flex-shrink: 0; margin-top: 1px; }

  /* Modal de éxito con código */
  .cat-success-modal {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(26,26,24,.6);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .cat-success-card {
    background: white; max-width: 420px; width: 100%;
    border-radius: 20px; overflow: hidden;
    border-top: 4px solid var(--primary, #984ca8);
    animation: popIn .28s ease-out;
  }
  @keyframes popIn { from { transform: scale(.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .cat-success-hd {
    padding: 22px 22px 12px; text-align: center;
  }
  .cat-success-icon {
    width: 56px; height: 56px; margin: 0 auto 12px;
    background: rgba(22,163,74,.12); color: #16a34a;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .cat-success-code {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 36px; font-weight: 500;
    color: var(--primary, #984ca8);
    letter-spacing: .12em;
    margin: 8px 0 4px;
  }
  .cat-success-body {
    padding: 0 22px 22px; font-size: 13px; line-height: 1.6;
    color: rgba(26,26,24,.7);
  }
  .cat-success-actions {
    display: flex; gap: 8px; padding: 0 22px 22px;
  }
  .cat-success-actions a, .cat-success-actions button {
    flex: 1; height: 46px; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    text-decoration: none;
  }
  .cat-success-wa {
    background: #25d366; color: white;
  }
  .cat-success-wa:hover { opacity: .9; }
  .cat-success-close {
    background: white; color: rgba(26,26,24,.6);
    border: 1px solid rgba(26,26,24,.12) !important;
  }

  /* Botón WhatsApp checkout */
  .cat-wa-btn {
    width: 100%; background: var(--primary, #984ca8);
    color: white; padding: 14px;
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    border-radius: 10px;
    transition: opacity .18s;
    text-decoration: none;
  }
  .cat-wa-btn:hover:not(:disabled) { opacity: .9; }
  .cat-wa-btn:disabled { opacity: .5; cursor: not-allowed; }
  .cat-wa-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,.3); border-top-color: white;
    border-radius: 50%; animation: cat-spin .7s linear infinite;
  }
  @keyframes cat-spin { to { transform: rotate(360deg); } }

  /* Modales detalle */
  .cat-modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(26,26,24,.45);
    display: flex; justify-content: center; align-items: center;
    padding: 16px;
  }
  .cat-modal {
    background: white; max-width: 480px; width: 100%; max-height: 92vh;
    overflow-y: auto;
    border-radius: 20px;
    position: relative;
    border-top: 3px solid var(--primary, #984ca8);
    animation: popIn .25s ease;
  }
  .cat-modal-handle {
    display: none;
    width: 40px; height: 4px; margin: 8px auto;
    background: rgba(26,26,24,.12); border-radius: 2px;
  }
  .cat-modal-body { padding: 24px; }
  .cat-modal-cta-row {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }
  .cat-modal-add-btn {
    background: var(--primary, #984ca8); color: white; border: none;
    padding: 14px 24px; font-size: 11px; font-weight: 600;
    letter-spacing: .14em; text-transform: uppercase;
    cursor: pointer; flex-shrink: 0; border-radius: 10px;
    display: flex; align-items: center; gap: 7px;
    transition: opacity .18s;
  }
  .cat-modal-add-btn:hover { opacity: .9; }

  .cat-scroll::-webkit-scrollbar { width: 4px; }
  .cat-scroll::-webkit-scrollbar-track { background: transparent; }
  .cat-scroll::-webkit-scrollbar-thumb { background: var(--primary, #984ca8); opacity: .4; border-radius: 99px; }
`

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PublicCatalogPage({ products, categories, company }: PublicCatalogPageProps) {
  const searchParams                              = useSearchParams()
  const [search, setSearch]                       = useState("")
  const [selectedCategory, setSelectedCategory]  = useState("all")
  const [imageErrors, setImageErrors]             = useState<Record<string, boolean>>({})
  const [loading, setLoading]                     = useState(true)
  const [cart, setCart]                           = useState<CartItem[]>([])
  const [showCart, setShowCart]                   = useState(false)
  const [selectedProduct, setSelectedProduct]     = useState<CatalogProduct | null>(null)
  const [showProductModal, setShowProductModal]   = useState(false)
  const [addedId, setAddedId]                     = useState<string | null>(null)
  const [scrolled, setScrolled]                   = useState(false)

  // Datos del cliente para el pedido (opcionales pero útiles para que el cajero identifique)
  const [clientName, setClientName]               = useState("")
  const [clientPhone, setClientPhone]             = useState("")

  // Estado de creación del pedido
  const [submitting, setSubmitting]               = useState(false)
  const [orderResult, setOrderResult]             = useState<{
    code: number
    expires_at: string
    frozen_total: number
    warnings: { name: string; available: number; requested: number }[]
    waHref: string
  } | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => {
    const productId = searchParams.get("productId")
    if (productId && products) {
      const p = products.find((p) => p.id == productId)
      if (p) { setSelectedProduct(p); setShowProductModal(true) }
    }
  }, [searchParams, products])

  useEffect(() => {
    document.body.style.overflow = (showCart || showProductModal || orderResult) ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [showCart, showProductModal, orderResult])

  const handleImageError = (id: string) => setImageErrors((p) => ({ ...p, [id]: true }))

  const addToCart = (product: CatalogProduct, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id)
      if (ex) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 800)
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === productId)
      if (ex && ex.quantity > 1) return prev.map((i) => i.id === productId ? { ...i, quantity: i.quantity - 1 } : i)
      return prev.filter((i) => i.id !== productId)
    })
  }

  const getTotalItems = () => cart.reduce((s, i) => s + i.quantity, 0)
  const getTotalPrice = () => cart.reduce((s, i) => s + priceOf(i) * i.quantity, 0)
  const getTotalSavings = () =>
    cart.reduce((s, i) => i.has_offer ? s + (Number(i.sale_price) - Number(i.offer_price)) * i.quantity : s, 0)
  const hasAnyOffer = () => cart.some((i) => i.has_offer)

  const filtered = products.filter((p) => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === "all" || p.category_name === selectedCategory
    return matchSearch && matchCategory
  })

  const offerCount = products.filter((p) => p.has_offer).length

  const closeModal = () => {
    setShowProductModal(false)
    const url = new URL(window.location.href)
    url.searchParams.delete("productId")
    window.history.pushState({}, "", url)
  }

  const initials = getInitials(company.name)

  // ── Solicitar pedido: llama RPC, genera código, abre WhatsApp con mensaje claro
  const handleSolicitar = async () => {
    if (!cart.length) return
    setSubmitting(true)
    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase.rpc("rpc_crear_pedido_catalogo", {
        p_company_id:   company.id,
        p_client_name:  clientName.trim() || null,
        p_client_phone: clientPhone.trim() || null,
        p_items: {
          items: cart.map((i) => ({
            product_id: i.id,
            quantity:   i.quantity,
            unit_price: priceOf(i),
            has_offer:  i.has_offer,
            offer_end:  i.offer_end || null,
          })),
        },
      })

      if (error) throw error
      if (!data?.ok) throw new Error("No se pudo crear el pedido")

      const code = Number(data.code)
      const expiresAt: string = data.expires_at
      const frozenTotal = Number(data.frozen_total)
      const warnings = (data.low_stock_warnings || []) as any[]

      // Construir mensaje de WhatsApp claro y completo
      const lineas = cart.map((i) => {
        const p = priceOf(i)
        const subt = formatCOP(p * i.quantity)
        if (i.has_offer) {
          return `• ${i.name} × ${i.quantity} — ${subt} (PROMO -${i.offer_discount_pct}%)`
        }
        return `• ${i.name} × ${i.quantity} — ${subt}`
      }).join("\n")

      const ahorroLine = getTotalSavings() > 0
        ? `\n💚 Ahorras: *${formatCOP(getTotalSavings())}*`
        : ""

      const datosCliente = (clientName.trim() || clientPhone.trim())
        ? `\n👤 Cliente: ${[clientName.trim(), clientPhone.trim()].filter(Boolean).join(" · ")}`
        : ""

      const fechaVence = formatDate(expiresAt.slice(0, 10))

      const mensaje =
        `Hola, quiero hacer un pedido en *${company.name}*.\n` +
        `\n📋 *Código de pedido:* #${code}\n` +
        `\n${lineas}\n` +
        `\n*Total:* ${formatCOP(frozenTotal)}` +
        ahorroLine +
        datosCliente +
        `\n\n📅 *Disponible hasta:* ${fechaVence}` +
        `\n\nPasaré al punto físico con este código *#${code}* para hacer efectivo el pedido y aprovechar el descuento.` +
        `\n\n⚠️ Entiendo que los productos están sujetos a disponibilidad y pueden agotarse antes de mi visita.`

      const waHref = `https://wa.me/${(company.phone || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(mensaje)}`

      setOrderResult({
        code,
        expires_at: expiresAt,
        frozen_total: frozenTotal,
        warnings: warnings.map((w) => ({ name: w.name, available: w.available, requested: w.requested })),
        waHref,
      })
      // Limpiar carrito una vez creado el pedido
      setCart([])
      setShowCart(false)
    } catch (err: any) {
      const msg = err?.message || "Error al crear el pedido. Intenta de nuevo."
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const closeSuccess = () => {
    setOrderResult(null)
    setClientName("")
    setClientPhone("")
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CATALOG_CSS }} />

      <div className="cat-root">

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <header className={`cat-header${scrolled ? " scrolled" : ""}`}>
          <div className="cat-header-inner">

            {/* Brand */}
            <div className="cat-brand">
              <div className="cat-logo">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                ) : (
                  <span style={{ color: "white", fontSize: 12, fontWeight: 700, letterSpacing: ".05em" }}>
                    {initials}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="cat-serif cat-company-name">{company.name}</p>
                <p className="cat-company-sub">Tienda oficial</p>
              </div>
            </div>

            {/* Derecha */}
            <div className="cat-header-right">
              <span className="cat-ref-count">{products.length} refs.</span>
              <button className="cat-cart-btn" onClick={() => setShowCart(true)} aria-label="Ver carrito">
                <ShoppingBag size={18} strokeWidth={1.5} />
                {getTotalItems() > 0 && (
                  <span className="cat-cart-badge">{getTotalItems()}</span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ══ INTRO ════════════════════════════════════════════════════════════ */}
        <div className="cat-intro">
          <div className="cat-intro-inner">
            <div>
              <p className="cat-intro-eyebrow">Colección completa</p>
              <h1 className="cat-serif" style={{
                fontSize: "clamp(20px, 3.8vw, 38px)", fontWeight: 300,
                lineHeight: 1.15, color: "#1a1a18", margin: 0,
              }}>
                Belleza que{" "}
                <em style={{ fontStyle: "italic", color: "var(--primary, #984ca8)", opacity: .7 }}>transforma</em>
              </h1>
            </div>
            <div className="cat-intro-count">
              <p className="cat-intro-num">{String(products.length).padStart(2, "0")}</p>
              <p className="cat-intro-num-label">referencias</p>
            </div>
          </div>

          {/* Banner de ofertas vigentes */}
          {offerCount > 0 && (
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px 22px" }}>
              <div className="cat-offer-banner">
                <Tag size={14} strokeWidth={2} />
                <span>
                  <strong>{offerCount} {offerCount === 1 ? "producto" : "productos"} en oferta</strong>
                  {" — "}
                  ¡aprovecha los descuentos por tiempo limitado!
                </span>
              </div>
            </div>
          )}

          <div className="cat-divider-color" />
        </div>

        {/* ══ FILTROS ══════════════════════════════════════════════════════════ */}
        <div className="cat-filters">
          <div className="cat-filters-inner">

            <div className="cat-search-row">
              <Search size={13} strokeWidth={1.5} style={{
                position: "absolute", left: 0,
                color: "rgba(26,26,24,.35)", pointerEvents: "none",
              }} />
              <input
                ref={searchRef}
                className="cat-input"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  position: "absolute", right: 0, background: "none", border: "none",
                  cursor: "pointer", padding: 4, color: "rgba(26,26,24,.4)",
                }}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="cat-chips-row">
              <button
                className={`cat-chip${selectedCategory === "all" ? " cat-chip-active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                Todo
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  className={`cat-chip${selectedCategory === c.name ? " cat-chip-active" : ""}`}
                  onClick={() => setSelectedCategory(c.name)}
                >
                  {c.name}
                </button>
              ))}
              {(search || selectedCategory !== "all") && (
                <button
                  onClick={() => { setSearch(""); setSelectedCategory("all") }}
                  style={{
                    flexShrink: 0, background: "none", border: "none",
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 10, color: "rgba(26,26,24,.45)", cursor: "pointer",
                    letterSpacing: ".06em", padding: "5px 6px",
                  }}
                >
                  <X size={11} /> Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ══ GRID ═══════════════════════════════════════════════════════════ */}
        <div className="cat-content">

          {!loading && (
            <div className="cat-count-row">
              <span className="cat-count-label">
                {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
              </span>
              <div className="cat-divider" style={{ flex: 1 }} />
            </div>
          )}

          {loading && (
            <div className="cat-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="cat-skeleton" style={{ aspectRatio: "3/4" }} />
              ))}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="cat-grid">
              {filtered.map((product, idx) => {
                const finalPrice = priceOf(product)
                return (
                <div
                  key={product.id}
                  className="cat-card"
                  style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                  onClick={() => { setSelectedProduct(product); setShowProductModal(true) }}
                >
                  <div className="cat-img-wrap">
                    {product.image_url && !imageErrors[product.id] ? (
                      <img
                        src={product.image_url} alt={product.name}
                        className="cat-card-img" loading="lazy"
                        onError={() => handleImageError(product.id)}
                      />
                    ) : (
                      <div className="cat-img-placeholder"><Package size={28} strokeWidth={1} /></div>
                    )}

                    <div className="cat-img-overlay" />

                    {/* Badge de descuento */}
                    {product.has_offer && (
                      <>
                        <span className="cat-offer-badge">
                          <Tag strokeWidth={2.5} />
                          -{Number(product.offer_discount_pct).toFixed(0)}%
                        </span>
                        <span className="cat-offer-ribbon">OFERTA</span>
                      </>
                    )}

                    {product.total_inventario > 0 && product.total_inventario <= 1 && !product.has_offer && (
                      <div className="cat-stock-badge">Últimas {product.total_inventario}</div>
                    )}

                    <button
                      className="cat-add-desktop"
                      onClick={(e) => { e.stopPropagation(); addToCart(product, e) }}
                    >
                      {addedId === product.id
                        ? <span>✓ Añadido</span>
                        : <><Plus size={12} strokeWidth={2.5} /> Añadir</>
                      }
                    </button>

                    <button
                      className="cat-add-mobile"
                      onClick={(e) => { e.stopPropagation(); addToCart(product, e) }}
                      aria-label={`Añadir ${product.name}`}
                    >
                      {addedId === product.id
                        ? <span style={{ fontSize: 13 }}>✓</span>
                        : <Plus size={15} strokeWidth={2.5} />
                      }
                    </button>
                  </div>

                  <div className="cat-body">
                    {product.category_name && (
                      <p className="cat-category-label">{product.category_name}</p>
                    )}
                    <h3 className="cat-name" title={product.name}>{product.name}</h3>
                    <div className="cat-sep" aria-hidden />
                    <div className="cat-price-row">
                      <p className={`cat-price${product.has_offer ? " offer" : ""}`}>
                        {formatCOP(finalPrice)}
                      </p>
                      {product.has_offer && (
                        <span className="cat-price-old">{formatCOP(Number(product.sale_price))}</span>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="cat-empty">
              <div className="cat-empty-ico">
                <Search size={22} strokeWidth={1} style={{ color: "var(--primary, #984ca8)", opacity: .5 }} />
              </div>
              <p className="cat-serif" style={{ fontSize: 22, fontWeight: 300, marginBottom: 8 }}>
                Sin resultados
              </p>
              <p style={{ fontSize: 13, color: "rgba(26,26,24,.5)", marginBottom: 20 }}>
                Prueba con otros términos o categorías
              </p>
              <button className="cat-empty-btn" onClick={() => { setSearch(""); setSelectedCategory("all") }}>
                Ver todo
              </button>
            </div>
          )}
        </div>

        <div className="cat-footer">
          <p>{company.name} · Catálogo oficial</p>
        </div>

        {/* ══ CART DRAWER ══════════════════════════════════════════════════════ */}
        {showCart && (
          <div className="cat-cart-overlay" onClick={() => setShowCart(false)}>
            <div className="cat-cart-drawer" onClick={(e) => e.stopPropagation()}>

              <div className="cat-drawer-hd">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p className="cat-serif" style={{ fontSize: 20, fontWeight: 400, color: "var(--primary, #984ca8)" }}>
                      Tu selección
                    </p>
                    <p style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(var(--primary-rgb,152,76,168),.55)", marginTop: 2 }}>
                      {getTotalItems()} {getTotalItems() === 1 ? "artículo" : "artículos"}
                    </p>
                  </div>
                  <button onClick={() => setShowCart(false)} style={{
                    background: "rgba(var(--primary-rgb,152,76,168),.10)",
                    border: "none", cursor: "pointer", padding: 8,
                    borderRadius: 8, color: "var(--primary, #984ca8)",
                    display: "flex",
                  }}>
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="cat-scroll cat-cart-items">
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{
                      width: 60, height: 60, margin: "0 auto 16px",
                      background: "rgba(var(--primary-rgb,152,76,168),.08)",
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ShoppingBag size={24} strokeWidth={1} style={{ color: "var(--primary, #984ca8)", opacity: .5 }} />
                    </div>
                    <p className="cat-serif" style={{ fontSize: 18, fontWeight: 300, color: "rgba(26,26,24,.5)" }}>
                      Tu selección está vacía
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(26,26,24,.35)", marginTop: 8 }}>
                      Explora el catálogo y elige tus favoritos
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {cart.map((item, idx) => {
                      const p = priceOf(item)
                      return (
                      <div key={item.id}>
                        <div style={{ display: "flex", gap: 12, padding: "14px 0" }}>
                          <div style={{
                            width: 60, height: 75, flexShrink: 0,
                            borderRadius: 10, overflow: "hidden",
                            background: "rgba(var(--primary-rgb,152,76,168),.06)",
                            border: "1px solid rgba(var(--primary-rgb,152,76,168),.10)",
                            position: "relative",
                          }}>
                            {item.image_url && !imageErrors[item.id] ? (
                              <img src={item.image_url} alt={item.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={() => handleImageError(item.id)}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Package size={18} strokeWidth={1} style={{ color: "rgba(26,26,24,.2)" }} />
                              </div>
                            )}
                            {item.has_offer && (
                              <span style={{
                                position: "absolute", top: 4, left: 4,
                                background: "var(--offer)", color: "white",
                                fontSize: 9, fontWeight: 700,
                                padding: "2px 6px", borderRadius: 99,
                              }}>
                                -{Number(item.offer_discount_pct).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {item.category_name && (
                              <p style={{ fontSize: 8, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--primary, #984ca8)", marginBottom: 3, fontWeight: 600, opacity: .7 }}>
                                {item.category_name}
                              </p>
                            )}
                            <p className="cat-serif" style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.3, marginBottom: 4, wordBreak: "break-word", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {item.name}
                            </p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                              <p style={{ fontSize: 13, fontWeight: 500, color: item.has_offer ? "var(--offer)" : "var(--primary, #984ca8)" }}>
                                {formatCOP(p)}
                              </p>
                              {item.has_offer && (
                                <span style={{ fontSize: 10, color: "rgba(26,26,24,.35)", textDecoration: "line-through" }}>
                                  {formatCOP(Number(item.sale_price))}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <button className="cat-qty-btn minus" onClick={() => removeFromCart(item.id)} aria-label="Disminuir">
                                <Minus size={12} />
                              </button>
                              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 18, textAlign: "center" }}>
                                {item.quantity}
                              </span>
                              <button className="cat-qty-btn plus" onClick={() => addToCart(item)} aria-label="Aumentar">
                                <Plus size={12} />
                              </button>
                              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 500, color: "rgba(26,26,24,.55)", whiteSpace: "nowrap" }}>
                                {formatCOP(p * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {idx < cart.length - 1 && <div className="cat-divider" />}
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(26,26,24,.08)", flexShrink: 0, background: "white" }}>
                  <div className="cat-cart-foot">

                    {/* Aviso de disponibilidad */}
                    <div className="cat-warn-box">
                      <AlertTriangle size={13} strokeWidth={2} />
                      <span>
                        Los productos están <strong>sujetos a disponibilidad</strong> y pueden agotarse antes de tu visita al punto físico.
                        Te recomendamos pasar lo antes posible para hacer efectivo tu pedido.
                      </span>
                    </div>

                    {/* Datos del cliente — opcionales pero útiles */}
                    <div className="cat-form-field">
                      <label className="cat-form-label">Tu nombre (opcional)</label>
                      <input
                        className="cat-form-input"
                        placeholder="Para que el cajero te identifique más rápido"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        maxLength={80}
                      />
                    </div>
                    <div className="cat-form-field">
                      <label className="cat-form-label">Tu teléfono (opcional)</label>
                      <input
                        className="cat-form-input"
                        placeholder="Para contactarte si surge alguna novedad"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        inputMode="tel"
                        maxLength={30}
                      />
                    </div>

                    {/* Totales */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "rgba(26,26,24,.5)" }}>Subtotal</span>
                      <span style={{ fontSize: 13, color: "rgba(26,26,24,.7)" }}>
                        {formatCOP(cart.reduce((s, i) => s + Number(i.sale_price) * i.quantity, 0))}
                      </span>
                    </div>
                    {hasAnyOffer() && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--offer)", fontWeight: 600 }}>Descuentos</span>
                        <span style={{ fontSize: 13, color: "var(--offer)", fontWeight: 600 }}>
                          - {formatCOP(getTotalSavings())}
                        </span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "10px 0 14px" }}>
                      <span style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(26,26,24,.45)" }}>
                        Total pedido
                      </span>
                      <span className="cat-serif" style={{ fontSize: 26, fontWeight: 400, color: "var(--primary, #984ca8)" }}>
                        {formatCOP(getTotalPrice())}
                      </span>
                    </div>

                    <button
                      className="cat-wa-btn"
                      onClick={handleSolicitar}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="cat-wa-spin" />
                          Generando código…
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Solicitar por WhatsApp
                          <ArrowRight size={13} strokeWidth={1.5} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ MODAL DETALLE ════════════════════════════════════════════════════ */}
        {showProductModal && selectedProduct && (
          <div className="cat-modal-overlay" onClick={closeModal}>
            <div className="cat-modal" onClick={(e) => e.stopPropagation()}>

              <span className="cat-modal-handle" />

              <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: "rgba(var(--primary-rgb,152,76,168),.06)" }}>
                {selectedProduct.image_url && !imageErrors[selectedProduct.id] ? (
                  <img
                    src={selectedProduct.image_url} alt={selectedProduct.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => handleImageError(selectedProduct.id)}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Package size={48} strokeWidth={1} style={{ color: "rgba(var(--primary-rgb,152,76,168),.3)" }} />
                  </div>
                )}

                {selectedProduct.has_offer && (
                  <>
                    <span className="cat-offer-badge" style={{ top: 14, left: 14, fontSize: 16, padding: "8px 14px" }}>
                      <Tag strokeWidth={2.5} />
                      -{Number(selectedProduct.offer_discount_pct).toFixed(0)}%
                    </span>
                    <span className="cat-offer-ribbon">OFERTA</span>
                  </>
                )}

                <button onClick={closeModal} style={{
                  position: "absolute", top: 12, right: 12,
                  background: "white", border: "none", width: 36, height: 36,
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 3px 12px rgba(0,0,0,.14)",
                }}>
                  <X size={14} strokeWidth={1.5} />
                </button>

                {selectedProduct.total_inventario > 0 && selectedProduct.total_inventario <= 3 && (
                  <div className="cat-stock-badge" style={{ bottom: 12, top: "auto" }}>
                    Últimas {selectedProduct.total_inventario} unidades
                  </div>
                )}
              </div>

              <div className="cat-modal-body">
                {selectedProduct.category_name && (
                  <p style={{ fontSize: 9, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--primary, #984ca8)", marginBottom: 10, fontWeight: 600, opacity: .7 }}>
                    {selectedProduct.category_name}
                  </p>
                )}

                <h2 className="cat-serif" style={{ fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 400, lineHeight: 1.2, marginBottom: 10 }}>
                  {selectedProduct.name}
                </h2>

                {selectedProduct.description && (
                  <p style={{ fontSize: 13, color: "rgba(26,26,24,.6)", lineHeight: 1.65, marginBottom: 18 }}>
                    {selectedProduct.description}
                  </p>
                )}

                {selectedProduct.has_offer && selectedProduct.offer_end && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "var(--offer-bg)", color: "var(--offer)",
                    padding: "5px 11px", borderRadius: 99,
                    fontSize: 11, fontWeight: 600, marginBottom: 14,
                  }}>
                    <Clock size={11} />
                    Oferta válida hasta {formatDate(selectedProduct.offer_end)}
                  </div>
                )}

                <div className="cat-divider" style={{ marginBottom: 18 }} />

                <div className="cat-modal-cta-row">
                  <div>
                    <p style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(26,26,24,.4)", marginBottom: 5 }}>
                      Precio
                    </p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                      <p className="cat-serif" style={{
                        fontSize: "clamp(24px, 5vw, 30px)", fontWeight: 400,
                        color: selectedProduct.has_offer ? "var(--offer)" : "var(--primary, #984ca8)",
                      }}>
                        {formatCOP(priceOf(selectedProduct))}
                      </p>
                      {selectedProduct.has_offer && (
                        <span style={{ fontSize: 14, color: "rgba(26,26,24,.4)", textDecoration: "line-through" }}>
                          {formatCOP(Number(selectedProduct.sale_price))}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="cat-modal-add-btn"
                    onClick={() => { addToCart(selectedProduct); closeModal(); setShowCart(true) }}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    Añadir al pedido
                  </button>
                </div>

                {selectedProduct.total_inventario > 3 && (
                  <p style={{ fontSize: 11, color: "rgba(26,26,24,.38)", marginTop: 14, letterSpacing: ".04em" }}>
                    {selectedProduct.total_inventario} unidades disponibles
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL ÉXITO PEDIDO ═══════════════════════════════════════════════ */}
        {orderResult && (
          <div className="cat-success-modal">
            <div className="cat-success-card">
              <div className="cat-success-hd">
                <div className="cat-success-icon">
                  <Check size={26} strokeWidth={2.5} />
                </div>
                <p style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(26,26,24,.5)", margin: 0 }}>
                  Pedido generado
                </p>
                <p className="cat-success-code">#{orderResult.code}</p>
                <p style={{ fontSize: 12, color: "rgba(26,26,24,.55)", margin: 0 }}>
                  Disponible hasta {formatDate(orderResult.expires_at.slice(0, 10))}
                </p>
              </div>
              <div className="cat-success-body">
                <p style={{ marginBottom: 10 }}>
                  Envía el mensaje a la tienda por <strong>WhatsApp</strong> y luego acércate al punto físico
                  con tu código <strong>#{orderResult.code}</strong> para hacer efectivo tu pedido.
                </p>
                {orderResult.warnings.length > 0 && (
                  <div className="cat-warn-box" style={{ marginTop: 14 }}>
                    <AlertTriangle size={13} strokeWidth={2} />
                    <span>
                      <strong>Atención:</strong> hay productos con stock limitado.
                      Te recomendamos visitar el punto físico cuanto antes:
                      <br />
                      {orderResult.warnings.map((w, i) => (
                        <span key={i}>
                          • {w.name} (quedan {w.available}, pediste {w.requested})<br />
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 11, color: "rgba(26,26,24,.45)", marginTop: 12, lineHeight: 1.5 }}>
                  Recuerda: los productos están sujetos a disponibilidad. Si demoras tu visita, podrían agotarse.
                </p>
              </div>
              <div className="cat-success-actions">
                <button onClick={closeSuccess} className="cat-success-close">
                  Cerrar
                </button>
                <a
                  href={orderResult.waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cat-success-wa"
                  onClick={closeSuccess}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enviar a WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
