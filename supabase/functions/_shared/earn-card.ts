// Server-side share card for the /earn calculator.
// Mirrors the on-page card (src/components/earn/ShareImage.tsx): 1600x900,
// diagonal art panel, $ASSET on PLATFORM row with logos, big % headline,
// stat rows and the value/contribution sparkline.
//
// Rendered as hand-written SVG (deterministic) and rasterised with resvg-wasm.
// Raster art/logos are fetched once and embedded as base64 data URIs.

import { initWasm, Resvg } from 'npm:@resvg/resvg-wasm@2.6.2';
import type { CalcResult } from './earn-calc.ts';
import { fmt } from './earn-calc.ts';
import { pickShareArt } from './earn-art.ts';
import PLOGO from './earn-plogo.json' with { type: 'json' };

const WASM_URL = 'https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm';
const FONT_REGULAR = 'https://cdn.jsdelivr.net/gh/googlefonts/opensans@main/fonts/ttf/OpenSans-Regular.ttf';
const FONT_BOLD = 'https://cdn.jsdelivr.net/gh/googlefonts/opensans@main/fonts/ttf/OpenSans-Bold.ttf';

const ASSET_LOGO_URL: Record<string, string> = {
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
};

let wasmReady: Promise<void> | null = null;
let fontsReady: Promise<Uint8Array[]> | null = null;
const imageCache = new Map<string, string | null>();

function ensureWasm() {
  if (!wasmReady) wasmReady = initWasm(fetch(WASM_URL)).then(() => undefined);
  return wasmReady;
}

function ensureFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all(
      [FONT_REGULAR, FONT_BOLD].map(async (u) => {
        const res = await fetch(u);
        if (!res.ok) throw new Error(`font ${u} HTTP ${res.status}`);
        return new Uint8Array(await res.arrayBuffer());
      }),
    );
  }
  return fontsReady;
}

const b64 = (bytes: Uint8Array) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
};

/** fetch a remote raster and return a data URI (null on failure) */
async function dataUri(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  if (imageCache.has(url)) return imageCache.get(url)!;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? 'image/png';
    const uri = `data:${type};base64,${b64(new Uint8Array(await res.arrayBuffer()))}`;
    imageCache.set(url, uri);
    return uri;
  } catch (e) {
    console.error('[earn-card] image fetch failed', url, (e as Error).message);
    imageCache.set(url, null);
    return null;
  }
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}\u2026` : s);

// palette copied from ShareImage.tsx
const TEXT = '#f1e8dd';
const MUTED = '#8f8579';
const MUTED2 = '#5f574f';
const CREAM = '#eddccb';
const GREEN = '#7fe0a3';
const RED = '#ed565a';
const BG = '#0a0a09';

const W = 1600;
const H = 900;

interface CardImages {
  art: string | null;
  assetLogo: string | null;
  platformLogo: string | null;
}

function sparkline(r: CalcResult) {
  const vals = r.monthly_series.map((m) => m.value);
  const cons = r.monthly_series.map((m) => m.contributed);
  if (!vals.length) return null;
  const max = Math.max(...vals, ...cons, 1);
  const top = 486, height = H - top; // bottom 46% of the card
  const x = (i: number) => (vals.length === 1 ? W : (i / (vals.length - 1)) * W);
  const y = (v: number) => top + height - (v / max) * (height - 40);
  const line = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const valD = line(vals);
  return {
    valD,
    conD: line(cons),
    areaD: `${valD} L${W},${H} L0,${H} Z`,
  };
}

function buildSvg(r: CalcResult, img: CardImages): string {
  const gain = r.final_value - r.invested;
  const pct = r.invested > 0 ? (gain / r.invested) * 100 : 0;
  const down = gain < 0;
  const accent = down ? RED : GREEN;
  const chart = sparkline(r);
  const windowLabel = r.window_label.replace(/\u2192/g, 'to');
  const platformName = r.platform;

  // panel geometry: 60% wide art panel on the right with a diagonal seam
  const panelX = W * 0.4;
  const panelW = W - panelX;
  const seam = `${(panelX + panelW * 0.15).toFixed(0)},0 ${W},0 ${W},${H} ${(panelX + panelW * 0.03).toFixed(0)},${H}`;

  const artLayer = img.art
    ? `<clipPath id="seam"><polygon points="${seam}"/></clipPath>
  <g clip-path="url(#seam)">
    <rect x="${panelX}" y="0" width="${panelW}" height="${H}" fill="#15130f"/>
    <image href="${img.art}" x="${panelX}" y="0" width="${panelW}" height="${H}" preserveAspectRatio="xMidYMin slice"/>
    <rect x="${panelX}" y="0" width="${panelW}" height="${H}" fill="url(#seamFade)"/>
  </g>`
    : `<clipPath id="seam"><polygon points="${seam}"/></clipPath>
  <g clip-path="url(#seam)"><rect x="${panelX}" y="0" width="${panelW}" height="${H}" fill="#15130f"/></g>`;

  // ---- left column ----
  const L = 80;
  const rows: Array<[string, string]> = [
    ['Bounties Earned', `$${fmt(r.invested)}`],
    ['DeFi Invested Bounties', `$${fmt(r.final_value)}`],
    ['Window', clip(windowLabel, 40)],
  ];
  const statRows = rows
    .map(([k, v], i) => {
      const y = 700 + i * 56;
      return `<text x="${L}" y="${y}" font-size="27" fill="${MUTED}">${esc(k)}</text>
  <text x="${L + 660}" y="${y}" text-anchor="end" font-size="27" font-weight="700" fill="${TEXT}">${esc(v)}</text>`;
    })
    .join('\n  ');

  // asset + platform row
  let cursor = L;
  const parts: string[] = [];
  if (img.assetLogo) {
    parts.push(
      `<clipPath id="assetClip"><circle cx="${cursor + 24}" cy="${330 - 14}" r="24"/></clipPath>
  <image href="${img.assetLogo}" x="${cursor}" y="${330 - 38}" width="48" height="48" clip-path="url(#assetClip)" preserveAspectRatio="xMidYMid slice"/>`,
    );
    cursor += 61;
  }
  const assetText = `$${r.asset}`;
  parts.push(`<text x="${cursor}" y="330" font-size="40" font-weight="700" fill="${TEXT}">${esc(assetText)}</text>`);
  cursor += assetText.length * 24 + 18;

  if (platformName) {
    parts.push(`<text x="${cursor}" y="330" font-size="30" fill="${MUTED}">on</text>`);
    cursor += 62;
    if (img.platformLogo) {
      parts.push(
        `<clipPath id="platClip"><rect x="${cursor}" y="${330 - 36}" width="46" height="46" rx="10"/></clipPath>
  <image href="${img.platformLogo}" x="${cursor}" y="${330 - 36}" width="46" height="46" clip-path="url(#platClip)" preserveAspectRatio="xMidYMid meet"/>`,
      );
      cursor += 58;
    }
    parts.push(`<text x="${cursor}" y="330" font-size="40" font-weight="700" fill="${TEXT}">${esc(clip(platformName, 18))}</text>`);
  } else {
    parts.push(`<text x="${cursor}" y="330" font-size="30" fill="${MUTED}">buy &amp; hold</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Open Sans">
  <defs>
    <linearGradient id="seamFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BG}" stop-opacity="1"/>
      <stop offset="22%" stop-color="${BG}" stop-opacity="0.5"/>
      <stop offset="46%" stop-color="${BG}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="shareFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${CREAM}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${CREAM}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  ${artLayer}

  ${chart ? `<path d="${chart.areaD}" fill="url(#shareFill)"/>
  <path d="${chart.conD}" fill="none" stroke="${RED}" stroke-width="5" stroke-dasharray="14 12" opacity="0.55"/>
  <path d="${chart.valD}" fill="none" stroke="${CREAM}" stroke-width="6" opacity="0.9"/>` : ''}

  <rect x="${L}" y="70" width="64" height="64" rx="14" fill="${RED}"/>
  <text x="${L + 32}" y="115" text-anchor="middle" font-size="28" font-weight="700" fill="#14100e">R</text>
  <text x="${L + 84}" y="116" font-size="34" font-weight="700" fill="${TEXT}" letter-spacing="2">REI</text>
  <text x="${L + 176}" y="116" font-size="34" fill="${MUTED2}">\u203a</text>
  <text x="${L + 200}" y="116" font-size="34" fill="${MUTED}">Bounties</text>
  <text x="${L + 356}" y="116" font-size="34" fill="${MUTED2}">\u203a</text>
  <text x="${L + 380}" y="116" font-size="34" fill="${MUTED}">DeFi</text>

  <rect x="${L}" y="168" width="660" height="1" fill="#2a2521"/>

  ${parts.join('\n  ')}

  <text x="${L}" y="470" font-size="118" font-weight="700" fill="${accent}" letter-spacing="-3">${down ? '' : '+'}${pct.toFixed(0)}%</text>
  <text x="${L}" y="530" font-size="44" fill="${accent}" opacity="0.9">$${fmt(r.final_value)} \u00b7 from $${fmt(r.invested)}</text>

  ${statRows}

  <text x="${W - 70}" y="96" text-anchor="end" font-size="26" fill="${CREAM}">rei.chat</text>
  <text x="${W - 240}" y="96" text-anchor="end" font-size="26" fill="${CREAM}">@AskRei_</text>

  <rect x="${W - 690}" y="${H - 116}" width="620" height="62" rx="31" fill="rgba(10,9,8,0.72)" stroke="rgba(237,220,203,0.18)"/>
  <text x="${W - 660}" y="${H - 74}" font-size="26" fill="${TEXT}">Find crypto's bounties aggregated by Rei AI</text>
</svg>`;
}

export async function buildCardSvg(r: CalcResult, seed?: string): Promise<string> {
  const artUrl = pickShareArt({
    assetSym: r.asset,
    platformName: r.platform,
    isToken: r.mode === 'token' && !ASSET_LOGO_URL[r.asset],
    seed: seed ?? `${r.asset}|${r.platform}|${r.amount}|${r.frequency}|${r.period}`,
  });
  const plogo = (PLOGO as Record<string, { url: string }>)[r.platform ?? ''] ?? null;

  const [art, assetLogo, platformLogo] = await Promise.all([
    dataUri(artUrl),
    dataUri(ASSET_LOGO_URL[r.asset] ?? null),
    dataUri(plogo?.url ?? null),
  ]);

  return buildSvg(r, { art, assetLogo, platformLogo });
}

export async function renderCardPng(r: CalcResult, seed?: string): Promise<Uint8Array> {
  await ensureWasm();
  const [fontBuffers, svg] = await Promise.all([ensureFonts(), buildCardSvg(r, seed)]);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontBuffers, defaultFontFamily: 'Open Sans', loadSystemFonts: false },
  });
  return resvg.render().asPng();
}
