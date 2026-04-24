"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  Search, X, ShoppingBag, Plus, Minus,
  Sparkles, ArrowRight, Package, Heart
} from "lucide-react"

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

interface PublicCatalogPageProps {
  products: any[]
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

    /* Tokens derivados del primary inyectado desde BD */
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
  }

  .cat-serif { font-family: 'Cormorant Garamond', Georgia, serif; }

  /* ── Header ─────────────────────────────────────────────────── */
  .cat-header {
    position: sticky; top: 0; z-index: 100;
    /* Fondo sólido con el color secundario del tema (viene de BD) */
    background: var(--secondary, #f3edf7);
    border-bottom: 1px solid rgba(var(--primary-rgb,152,76,168), .18);
    /* Sombra coloreada al hacer scroll */
    transition: box-shadow .2s;
  }
  .cat-header.scrolled {
    box-shadow:
      0 1px 0 rgba(var(--primary-rgb,152,76,168), .15),
      0 6px 24px rgba(var(--primary-rgb,152,76,168), .10);
  }

  /* Franja de acento en la parte inferior del header */
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
    padding: 0 12px;
    display: flex; align-items: center; justify-content: space-between;
    height: 58px; gap: 10px;
  }
  @media (min-width: 420px) { .cat-header-inner { padding: 0 16px; gap: 12px; } }
  @media (min-width: 640px) {
    .cat-header-inner { padding: 0 28px; height: 68px; }
  }

  /* Brand */
  .cat-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }

  .cat-logo {
    width: 38px; height: 38px; flex-shrink: 0;
    background: var(--primary, #984ca8);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 12px rgba(var(--primary-rgb,152,76,168), .35);
    overflow: hidden;
  }
  @media (min-width: 640px) { .cat-logo { width: 44px; height: 44px; } }

  .cat-company-name {
    font-size: 16px; font-weight: 400; line-height: 1; letter-spacing: .02em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: min(180px, 48vw);
    color: var(--primary, #984ca8);
  }
  @media (min-width: 480px) { .cat-company-name { max-width: 260px; font-size: 20px; } }

  .cat-company-sub {
    font-size: 8px; letter-spacing: .22em; text-transform: uppercase;
    color: rgba(var(--primary-rgb,152,76,168), .55); margin-top: 3px;
  }

  /* Derecha del header */
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
    text-align: left; flex-shrink: 0; padding-bottom: 4px;
  }
  @media (min-width: 480px) { .cat-intro-count { text-align: right; } }
  .cat-intro-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(30px, 6vw, 44px);
    font-weight: 300; line-height: 1;
    color: rgba(var(--primary-rgb,152,76,168), .20);
  }
  .cat-intro-num-label {
    font-size: 8px; letter-spacing: .2em; text-transform: uppercase;
    color: rgba(var(--primary-rgb,152,76,168), .45); margin-top: 4px;
  }

  /* Línea divisora con color */
  .cat-divider-color {
    height: 1px;
    background: linear-gradient(
      90deg,
      var(--primary, #984ca8),
      rgba(var(--primary-rgb,152,76,168), .25) 50%,
      transparent 100%
    );
    opacity: .35;
  }

  /* ── Filtros ─────────────────────────────────────────────────── */
  .cat-filters {
    background: #fff;
    border-bottom: 1px solid rgba(26,26,24,.07);
    position: sticky; top: 58px; z-index: 50;
    box-shadow: 0 2px 12px rgba(0,0,0,.04);
  }
  @media (min-width: 640px) { .cat-filters { top: 68px; } }

  .cat-filters-inner {
    max-width: 1400px; margin: 0 auto; padding: 0 12px;
  }
  @media (min-width: 420px) { .cat-filters-inner { padding: 0 16px; } }
  @media (min-width: 640px) { .cat-filters-inner { padding: 0 28px; } }

  .cat-search-row {
    position: relative;
    display: flex; align-items: center;
    padding: 10px 0 8px;
    border-bottom: 1px solid rgba(26,26,24,.06);
  }

  .cat-chips-row {
    display: flex; gap: 6px; padding: 9px 0;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .cat-chips-row::-webkit-scrollbar { display: none; }

  .cat-input {
    width: 100%; background: transparent; border: none;
    border-bottom: 1.5px solid rgba(26,26,24,.15);
    padding: 8px 28px 8px 26px;
    /* 16px evita zoom automático en iOS Safari al enfocar */
    font-size: 16px; font-family: 'DM Sans', sans-serif;
    color: #1a1a18; outline: none;
    transition: border-color .2s;
    -webkit-appearance: none; appearance: none;
    border-radius: 0;
  }
  @media (min-width: 640px) { .cat-input { font-size: 14px; } }
  .cat-input:focus { border-bottom-color: var(--primary, #984ca8); }
  .cat-input::placeholder { color: rgba(26,26,24,.35); }

  /* Chips de categoría — píldoras redondeadas */
  .cat-chip {
    display: inline-flex; align-items: center; flex-shrink: 0;
    font-size: 9px; font-weight: 600;
    letter-spacing: .14em; text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 99px;
    border: 1.5px solid rgba(26,26,24,.12);
    color: rgba(26,26,24,.50); background: white;
    cursor: pointer; white-space: nowrap;
    transition: all .18s; -webkit-tap-highlight-color: transparent;
  }
  .cat-chip:hover {
    border-color: rgba(var(--primary-rgb,152,76,168), .40);
    color: var(--primary, #984ca8);
    background: rgba(var(--primary-rgb,152,76,168), .05);
  }
  .cat-chip-active {
    background: var(--primary, #984ca8);
    border-color: var(--primary, #984ca8);
    color: white;
    box-shadow: 0 3px 10px rgba(var(--primary-rgb,152,76,168), .30);
  }

  /* ── Grid ────────────────────────────────────────────────────── */
  .cat-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: 420px)  { .cat-grid { gap: 16px; } }
  @media (min-width: 540px)  { .cat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 768px)  { .cat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  @media (min-width: 1024px) { .cat-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 20px; } }
  @media (min-width: 1280px) { .cat-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); } }

  /* ── Card — sistema de sombras 3D ───────────────────────────── */
  .cat-card {
    position: relative; cursor: pointer;
    background: white;
    border-radius: 18px;
    overflow: visible;        /* sombras no se cortan */
    isolation: isolate;
    display: flex; flex-direction: column;
    -webkit-tap-highlight-color: transparent;

    /* Borde con tono primary sutil */
    border: 1px solid rgba(var(--primary-rgb,152,76,168), .12);

    /* Sombras multicapa: elevación base + halo de color */
    box-shadow:
      0 1px 3px  rgba(0,0,0,.05),
      0 6px 16px rgba(var(--primary-rgb,152,76,168), .09),
      0 18px 36px rgba(var(--primary-rgb,152,76,168), .06),
      inset 0 1px 0 rgba(255,255,255,.95),
      inset 0 -1px 0 rgba(var(--primary-rgb,152,76,168), .05);

    transition: transform .28s cubic-bezier(.25,.46,.45,.94),
                box-shadow .28s ease, border-color .28s;
    will-change: transform;
    animation: catCardIn .4s ease both;
  }

  /* Clip del contenido para mantener border-radius */
  .cat-card > *:first-child { border-radius: 18px 18px 0 0; overflow: hidden; }
  .cat-card > *:last-child  { border-radius: 0 0 18px 18px; }

  /* Franja top — visible en reposo (.2 opacidad), plena en hover */
  .cat-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(
      90deg,
      var(--primary, #984ca8) 0%,
      rgba(var(--primary-rgb,152,76,168), .5) 100%
    );
    opacity: .20;
    border-radius: 18px 18px 0 0;
    z-index: 3; pointer-events: none;
    transition: opacity .28s ease;
  }

  /* Hover — solo dispositivos con puntero */
  @media (hover: hover) and (pointer: fine) {
    .cat-card:hover {
      transform: translateY(-8px) scale(1.018);
      border-color: rgba(var(--primary-rgb,152,76,168), .28);
      box-shadow:
        0 2px 6px  rgba(0,0,0,.04),
        0 12px 28px rgba(var(--primary-rgb,152,76,168), .18),
        0 28px 52px rgba(var(--primary-rgb,152,76,168), .13),
        0 40px 64px rgba(0,0,0,.05),
        inset 0 1px 0 rgba(255,255,255,.98),
        inset 0 -1px 0 rgba(var(--primary-rgb,152,76,168), .10);
    }
    .cat-card:hover::before { opacity: 1; }
    .cat-card:hover .cat-card-img { transform: scale(1.06); }
    .cat-card:hover .cat-body { background: linear-gradient(to bottom, rgba(var(--primary-rgb,152,76,168),.035) 0%, #fff 60%); }
    .cat-card:hover .cat-name { color: var(--primary, #984ca8); }
    .cat-card:hover .cat-price { transform: scale(1.04); }
    .cat-card:hover .cat-add-desktop { transform: translateY(0); }
    .cat-card:hover .cat-img-overlay { opacity: 1; }
  }

  /* Tap en móvil */
  .cat-card:active { transform: scale(.98); }

  /* ── Imagen ──────────────────────────────────────────────────── */
  .cat-img-wrap {
    aspect-ratio: 3/4;
    position: relative; overflow: hidden;
    background: linear-gradient(
      135deg,
      rgba(var(--primary-rgb,152,76,168),.07) 0%,
      rgba(var(--primary-rgb,152,76,168),.03) 100%
    );
  }

  .cat-card-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform .6s cubic-bezier(.25,.46,.45,.94);
  }

  /* Overlay gradiente inferior en hover */
  .cat-img-overlay {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(
      180deg,
      transparent 50%,
      rgba(var(--primary-rgb,152,76,168), .12) 100%
    );
    opacity: 0; transition: opacity .3s;
  }

  .cat-img-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: var(--primary, #984ca8); opacity: .28;
  }

  /* Badge stock */
  .cat-stock-badge {
    position: absolute; top: 8px; left: 8px;
    background: white; color: #c0392b;
    font-size: 8px; font-weight: 700;
    letter-spacing: .06em; padding: 3px 8px;
    border-radius: 99px;
    border: 1px solid #fecdd3;
    box-shadow: 0 2px 6px rgba(0,0,0,.10);
  }

  /* ── Botón añadir DESKTOP — slide-up en hover ───────────────── */
  .cat-add-desktop {
    position: absolute; bottom: 0; left: 0; right: 0;
    transform: translateY(100%);
    transition: transform .3s cubic-bezier(.25,.46,.45,.94);
    background: var(--primary, #984ca8); color: white;
    display: none; align-items: center; justify-content: center; gap: 6px;
    padding: 11px; font-size: 10px; font-weight: 600;
    letter-spacing: .14em; text-transform: uppercase;
    cursor: pointer; border: none; width: 100%;
  }
  @media (hover: hover) and (pointer: fine) {
    .cat-add-desktop { display: flex; }
  }

  /* ── Botón añadir MÓVIL — circular siempre visible ──────────── */
  .cat-add-mobile {
    position: absolute; bottom: 10px; right: 10px;
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--primary, #984ca8); color: white;
    display: flex; align-items: center; justify-content: center;
    border: none; cursor: pointer; touch-action: manipulation;
    box-shadow: 0 4px 14px rgba(var(--primary-rgb,152,76,168), .40);
    transition: transform .15s, box-shadow .15s;
    -webkit-tap-highlight-color: transparent; z-index: 3;
  }
  .cat-add-mobile:active { transform: scale(.88); }
  @media (hover: hover) and (pointer: fine) { .cat-add-mobile { display: none; } }

  /* ── Body de la tarjeta ──────────────────────────────────────── */
  .cat-body {
    padding: 10px 11px 12px;
    flex: 1; display: flex; flex-direction: column; gap: 6px;
    background: linear-gradient(to bottom, rgba(var(--primary-rgb,152,76,168),.02) 0%, #fff 50%);
    transition: background .28s;
    min-width: 0;
  }
  @media (min-width: 420px) { .cat-body { padding: 12px 13px 14px; gap: 8px; } }

  .cat-category-label {
    font-size: 8px; letter-spacing: .18em; text-transform: uppercase;
    color: var(--primary, #984ca8); font-weight: 600; opacity: .7;
  }

  .cat-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 13px; font-weight: 400; line-height: 1.3; color: #1a1a18;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; margin: 0; word-break: break-word;
    transition: color .18s;
  }
  @media (min-width: 420px) { .cat-name { font-size: 14px; } }
  @media (min-width: 640px) { .cat-name { font-size: 15px; } }

  /* Separador con gradiente coloreado */
  .cat-sep {
    height: 1px;
    background: linear-gradient(
      90deg, transparent,
      rgba(var(--primary-rgb,152,76,168),.18) 30%,
      rgba(var(--primary-rgb,152,76,168),.18) 70%,
      transparent
    );
  }

  .cat-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 500;
    color: var(--primary, #984ca8); margin: 0;
    transition: transform .18s;
    text-shadow: 0 1px 8px rgba(var(--primary-rgb,152,76,168),.15);
    transform-origin: left center;
  }
  @media (min-width: 420px) { .cat-price { font-size: 19px; } }
  @media (min-width: 640px) { .cat-price { font-size: 21px; } }

  /* ── Sección de contenido ─────────────────────────────────────── */
  .cat-content {
    max-width: 1400px; margin: 0 auto;
    padding: 16px 12px 48px;
    padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
  }
  @media (min-width: 420px) { .cat-content { padding-left: 16px; padding-right: 16px; } }
  @media (min-width: 640px) { .cat-content { padding: 24px 28px 80px; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); } }

  /* Contador de resultados */
  .cat-count-row {
    display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  }
  @media (min-width: 640px) { .cat-count-row { gap: 16px; margin-bottom: 20px; } }
  .cat-count-label {
    font-size: 9px; letter-spacing: .12em; text-transform: uppercase;
    color: rgba(26,26,24,.40); white-space: nowrap;
    background: rgba(var(--primary-rgb,152,76,168),.07);
    padding: 4px 12px; border-radius: 99px;
  }

  /* ── Sin resultados ──────────────────────────────────────────── */
  .cat-empty {
    text-align: center; padding: 80px 0;
  }
  .cat-empty-ico {
    width: 68px; height: 68px; margin: 0 auto 20px;
    background: rgba(var(--primary-rgb,152,76,168),.08);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .cat-empty-btn {
    background: none;
    border: 1.5px solid rgba(var(--primary-rgb,152,76,168),.25);
    padding: 10px 24px; font-size: 11px; letter-spacing: .12em;
    text-transform: uppercase; cursor: pointer;
    color: var(--primary, #984ca8); border-radius: 99px;
    transition: all .18s;
  }
  .cat-empty-btn:hover { background: var(--primary, #984ca8); color: white; }

  /* ── Skeleton ────────────────────────────────────────────────── */
  .cat-skeleton {
    border-radius: 18px; overflow: hidden;
    background: linear-gradient(
      90deg,
      rgba(var(--primary-rgb,152,76,168),.05) 25%,
      rgba(var(--primary-rgb,152,76,168),.10) 50%,
      rgba(var(--primary-rgb,152,76,168),.05) 75%
    );
    background-size: 200% 100%;
    animation: catShimmer 1.6s infinite;
  }

  /* ── Footer ──────────────────────────────────────────────────── */
  .cat-footer {
    background: var(--secondary, #f3edf7);
    border-top: 1px solid rgba(var(--primary-rgb,152,76,168),.15);
    text-align: center; padding: 20px 16px;
    padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  }
  .cat-footer p {
    font-size: 9px; letter-spacing: .18em; text-transform: uppercase;
    color: rgba(var(--primary-rgb,152,76,168),.55);
  }

  /* ── Cart drawer ─────────────────────────────────────────────── */
  .cat-cart-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(26,26,24,.40);
    backdrop-filter: blur(4px);
    animation: catFadeIn .25s ease;
  }
  .cat-cart-drawer {
    position: absolute; top: 0; right: 0; bottom: 0;
    width: min(420px, 100vw);
    max-width: 100vw;
    background: #FAFAF8;
    display: flex; flex-direction: column;
    animation: catSlideIn .32s cubic-bezier(.25,.46,.45,.94);
    overflow: hidden;
  }
  .cat-drawer-hd {
    padding: 18px 18px 16px;
    border-bottom: 1px solid rgba(26,26,24,.08);
    flex-shrink: 0;
    background: var(--secondary, #f3edf7);
    border-top: 3px solid var(--primary, #984ca8);
    padding-top: calc(18px + env(safe-area-inset-top, 0px));
  }
  @media (min-width: 480px) { .cat-drawer-hd { padding: 22px 24px 20px; } }

  /* Botón WhatsApp */
  .cat-wa-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 16px 14px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    background: var(--primary, #984ca8); color: white;
    font-size: 12px; font-weight: 600;
    letter-spacing: .12em; text-transform: uppercase;
    cursor: pointer; border: none; transition: opacity .2s;
    text-decoration: none; border-radius: 0;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .cat-wa-btn:hover { opacity: .88; }

  /* ── Modal — bottom sheet móvil / centrado desktop ───────────── */
  .cat-modal-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(26,26,24,.55);
    backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0; animation: catFadeIn .2s ease;
  }
  @media (min-width: 600px) {
    .cat-modal-overlay { align-items: center; padding: 16px; }
  }
  .cat-modal {
    background: white; width: 100%;
    max-width: 480px;
    max-height: 92vh; max-height: 92dvh;
    overflow-y: auto; overscroll-behavior: contain;
    border-radius: 20px 20px 0 0;
    animation: catSheetIn .32s cubic-bezier(.34,1.56,.64,1);
    border-top: 3px solid var(--primary, #984ca8);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  @media (min-width: 600px) {
    .cat-modal {
      border-radius: 20px;
      animation: catModalIn .3s cubic-bezier(.34,1.56,.64,1);
    }
  }

  .cat-modal-handle {
    display: block; width: 36px; height: 4px;
    background: rgba(26,26,24,.12); border-radius: 2px;
    margin: 12px auto 0;
  }
  @media (min-width: 600px) { .cat-modal-handle { display: none; } }

  .cat-modal-body { padding: 18px 20px 24px; }
  @media (min-width: 600px) { .cat-modal-body { padding: 24px 28px 28px; } }

  /* Precio + CTA en modal */
  .cat-modal-cta-row {
    display: flex; align-items: center; justify-content: space-between;
    gap: 14px; flex-direction: column; align-items: stretch;
  }
  @media (min-width: 420px) {
    .cat-modal-cta-row { flex-direction: row; align-items: center; }
  }

  /* Botón añadir en modal */
  .cat-modal-add-btn {
    background: var(--primary, #984ca8); color: white; border: none;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 22px; font-size: 11px; font-weight: 600;
    letter-spacing: .12em; text-transform: uppercase;
    cursor: pointer; flex-shrink: 0; border-radius: 10px;
    box-shadow: 0 4px 16px rgba(var(--primary-rgb,152,76,168), .35);
    transition: opacity .15s, transform .15s;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    width: 100%;
  }
  @media (min-width: 420px) { .cat-modal-add-btn { width: auto; } }
  .cat-modal-add-btn:hover { opacity: .88; }
  .cat-modal-add-btn:active { transform: scale(.97); }

  /* ── Qty controls ────────────────────────────────────────────── */
  .cat-qty-btn {
    border: 1.5px solid rgba(var(--primary-rgb,152,76,168),.25);
    width: 32px; height: 32px; border-radius: 6px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all .14s; touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  .cat-qty-btn.minus { background: #fff; color: rgba(26,26,24,.55); }
  .cat-qty-btn.plus  { background: var(--primary, #984ca8); color: white; border-color: transparent; }
  .cat-qty-btn:hover { opacity: .82; }
  .cat-qty-btn:active { transform: scale(.92); }

  /* ── Separador neutro ────────────────────────────────────────── */
  .cat-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(26,26,24,.10), transparent);
  }

  /* ── Cart items scroll ───────────────────────────────────────── */
  .cat-cart-items {
    flex: 1; overflow-y: auto; padding: 12px 18px;
    overscroll-behavior: contain;
  }
  @media (min-width: 480px) { .cat-cart-items { padding: 16px 24px; } }

  .cat-cart-foot {
    padding: 14px 18px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  }
  @media (min-width: 480px) { .cat-cart-foot { padding: 16px 24px; padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); } }

  /* ── Scrollbar ───────────────────────────────────────────────── */
  .cat-scroll::-webkit-scrollbar { width: 3px; }
  .cat-scroll::-webkit-scrollbar-track { background: transparent; }
  .cat-scroll::-webkit-scrollbar-thumb { background: var(--primary, #984ca8); opacity: .4; border-radius: 99px; }

  /* ── Keyframes ───────────────────────────────────────────────── */
  @keyframes catFadeIn  { from { opacity: 0 }              to { opacity: 1 } }
  @keyframes catSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
  @keyframes catSheetIn { from { transform: translateY(100%) } to { transform: translateY(0) } }
  @keyframes catModalIn {
    from { opacity: 0; transform: scale(.94) translateY(10px) }
    to   { opacity: 1; transform: scale(1) translateY(0) }
  }
  @keyframes catCardIn {
    from { opacity: 0; transform: translateY(18px) }
    to   { opacity: 1; transform: translateY(0) }
  }
  @keyframes catShimmer {
    from { background-position: 200% 0 }
    to   { background-position: -200% 0 }
  }
`

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PublicCatalogPage({ products, categories, company }: PublicCatalogPageProps) {
  const searchParams                              = useSearchParams()
  const [search, setSearch]                       = useState("")
  const [selectedCategory, setSelectedCategory]  = useState("all")
  const [imageErrors, setImageErrors]             = useState<Record<string, boolean>>({})
  const [loading, setLoading]                     = useState(true)
  const [cart, setCart]                           = useState<any[]>([])
  const [showCart, setShowCart]                   = useState(false)
  const [selectedProduct, setSelectedProduct]     = useState<any>(null)
  const [showProductModal, setShowProductModal]   = useState(false)
  const [addedId, setAddedId]                     = useState<string | null>(null)
  const [scrolled, setScrolled]                   = useState(false)
  const searchRef                                 = useRef<HTMLInputElement>(null)

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
    document.body.style.overflow = (showCart || showProductModal) ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [showCart, showProductModal])

  const handleImageError = (id: string) => setImageErrors((p) => ({ ...p, [id]: true }))

  const addToCart = (product: any, e?: React.MouseEvent) => {
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

  const getTotalItems  = () => cart.reduce((s, i) => s + i.quantity, 0)
  const getTotalPrice  = () => cart.reduce((s, i) => s + i.sale_price * i.quantity, 0)

  const filtered = products.filter((p) => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === "all" || p.category_name === selectedCategory
    return matchSearch && matchCategory
  })

  const closeModal = () => {
    setShowProductModal(false)
    const url = new URL(window.location.href)
    url.searchParams.delete("productId")
    window.history.pushState({}, "", url)
  }

  const initials = getInitials(company.name)

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa hacer un pedido en *${company.name}*:\n\n` +
    cart.map((i) => `• ${i.name} × ${i.quantity} — ${formatCOP(i.sale_price * i.quantity)}`).join("\n") +
    `\n\n*Total: ${formatCOP(getTotalPrice())}*`
  )
  const whatsappHref = `https://wa.me/${company.phone || ""}?text=${whatsappMsg}`

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
                fontSize: "clamp(24px, 5vw, 50px)", fontWeight: 300,
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
          <div className="cat-divider-color" />
        </div>

        {/* ══ FILTROS ══════════════════════════════════════════════════════════ */}
        <div className="cat-filters">
          <div className="cat-filters-inner">

            {/* Buscador */}
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

            {/* Chips */}
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

          {/* Contador */}
          {!loading && (
            <div className="cat-count-row">
              <span className="cat-count-label">
                {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
              </span>
              <div className="cat-divider" style={{ flex: 1 }} />
            </div>
          )}

          {/* Skeletons */}
          {loading && (
            <div className="cat-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="cat-skeleton" style={{ aspectRatio: "3/4" }} />
              ))}
            </div>
          )}

          {/* Productos */}
          {!loading && filtered.length > 0 && (
            <div className="cat-grid">
              {filtered.map((product, idx) => (
                <div
                  key={product.id}
                  className="cat-card"
                  style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                  onClick={() => { setSelectedProduct(product); setShowProductModal(true) }}
                >
                  {/* Imagen */}
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

                    {product.total_inventario > 0 && product.total_inventario <= 1 && (
                      <div className="cat-stock-badge">Últimas {product.total_inventario}</div>
                    )}

                    {/* Añadir desktop */}
                    <button
                      className="cat-add-desktop"
                      onClick={(e) => { e.stopPropagation(); addToCart(product, e) }}
                    >
                      {addedId === product.id
                        ? <span>✓ Añadido</span>
                        : <><Plus size={12} strokeWidth={2.5} /> Añadir</>
                      }
                    </button>

                    {/* Añadir móvil */}
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

                  {/* Body */}
                  <div className="cat-body">
                    {product.category_name && (
                      <p className="cat-category-label">{product.category_name}</p>
                    )}
                    <h3 className="cat-name" title={product.name}>{product.name}</h3>
                    <div className="cat-sep" aria-hidden />
                    <p className="cat-price">{formatCOP(product.sale_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin resultados */}
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

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <div className="cat-footer">
          <p>{company.name} · Catálogo oficial</p>
        </div>

        {/* ══ CART DRAWER ══════════════════════════════════════════════════════ */}
        {showCart && (
          <div className="cat-cart-overlay" onClick={() => setShowCart(false)}>
            <div className="cat-cart-drawer" onClick={(e) => e.stopPropagation()}>

              {/* Header drawer */}
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

              {/* Items */}
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
                    {cart.map((item, idx) => (
                      <div key={item.id}>
                        <div style={{ display: "flex", gap: 12, padding: "14px 0" }}>
                          {/* Miniatura */}
                          <div style={{
                            width: 60, height: 75, flexShrink: 0,
                            borderRadius: 10, overflow: "hidden",
                            background: "rgba(var(--primary-rgb,152,76,168),.06)",
                            border: "1px solid rgba(var(--primary-rgb,152,76,168),.10)",
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
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {item.category_name && (
                              <p style={{ fontSize: 8, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--primary, #984ca8)", marginBottom: 3, fontWeight: 600, opacity: .7 }}>
                                {item.category_name}
                              </p>
                            )}
                            <p className="cat-serif" style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.3, marginBottom: 4, wordBreak: "break-word", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {item.name}
                            </p>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--primary, #984ca8)", marginBottom: 8 }}>
                              {formatCOP(item.sale_price)}
                            </p>
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
                                {formatCOP(item.sale_price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {idx < cart.length - 1 && <div className="cat-divider" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer drawer */}
              {cart.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(26,26,24,.08)", flexShrink: 0 }}>
                  <div className="cat-cart-foot">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                      <span style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(26,26,24,.45)" }}>
                        Total pedido
                      </span>
                      <span className="cat-serif" style={{ fontSize: 26, fontWeight: 400, color: "var(--primary, #984ca8)" }}>
                        {formatCOP(getTotalPrice())}
                      </span>
                    </div>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="cat-wa-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Solicitar por WhatsApp
                      <ArrowRight size={13} strokeWidth={1.5} />
                    </a>
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

              {/* Imagen */}
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

                {/* Botón cerrar */}
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
                  <div className="cat-stock-badge">
                    Últimas {selectedProduct.total_inventario} unidades
                  </div>
                )}
              </div>

              {/* Info */}
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

                <div className="cat-divider" style={{ marginBottom: 18 }} />

                {/* Precio + CTA */}
                <div className="cat-modal-cta-row">
                  <div>
                    <p style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(26,26,24,.4)", marginBottom: 5 }}>
                      Precio
                    </p>
                    <p className="cat-serif" style={{ fontSize: "clamp(24px, 5vw, 30px)", fontWeight: 400, color: "var(--primary, #984ca8)" }}>
                      {formatCOP(selectedProduct.sale_price)}
                    </p>
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

      </div>
    </>
  )
}
