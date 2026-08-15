// Server-side share card for the /earn calculator (1200x630, Twitter/OG safe).
// Hand-written SVG (deterministic layout) rasterised with resvg-wasm.

import { initWasm, Resvg } from 'npm:@resvg/resvg-wasm@2.6.2';
import type { CalcResult } from './earn-calc.ts';
import { fmt } from './earn-calc.ts';

const WASM_URL = 'https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm';
const FONT_REGULAR = 'https://cdn.jsdelivr.net/gh/googlefonts/opensans@main/fonts/ttf/OpenSans-Regular.ttf';
const FONT_BOLD = 'https://cdn.jsdelivr.net/gh/googlefonts/opensans@main/fonts/ttf/OpenSans-Bold.ttf';

let wasmReady: Promise<void> | null = null;
let fontsReady: Promise<Uint8Array[]> | null = null;

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

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** naive character-budget truncation (Open Sans, sized for the card) */
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}\u2026` : s);

const ACCENT = '#ed565a';
const BG = '#0b0a09';
const INK = '#f4ece6';
const MUTED = '#8d8579';

export function buildCardSvg(r: CalcResult): string {
  const up = r.profit >= 0;
  const valueColor = up ? '#79d19a' : ACCENT;
  const headline = r.mode === 'defi' ? `$${r.asset} on ${r.platform}` : `$${r.asset} \u00b7 buy & hold`;
  const cadence = `$${fmt(r.amount)} bounty ${r.frequency.toLowerCase()}`;
  const yieldLine = r.mode === 'defi' ? `${r.apy_percent}% ${r.yield_note}` : 'no yield \u00b7 spot only';

  // sparkline of the value curve
  const pts = r.monthly_series.map((m) => m.value);
  const maxV = Math.max(...pts, 1);
  const W = 1000, X0 = 100, Y0 = 470, H = 110;
  const path = pts
    .map((v, i) => {
      const x = X0 + (pts.length === 1 ? W : (i / (pts.length - 1)) * W);
      const y = Y0 + H - (v / maxV) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `${path} L${(X0 + W).toFixed(1)},${(Y0 + H).toFixed(1)} L${X0.toFixed(1)},${(Y0 + H).toFixed(1)} Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${valueColor}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${valueColor}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="${BG}"/>
  <rect x="0" y="0" width="1200" height="6" fill="${ACCENT}"/>
  <rect x="40" y="40" width="1120" height="550" rx="22" fill="#131110" stroke="#2a2624"/>

  <text x="100" y="120" font-family="Open Sans" font-weight="700" font-size="30" fill="${ACCENT}" letter-spacing="6">REI</text>
  <text x="182" y="120" font-family="Open Sans" font-size="26" fill="${MUTED}">Bounty Earning Calculator</text>

  <text x="100" y="196" font-family="Open Sans" font-weight="700" font-size="46" fill="${INK}">${esc(clip(headline, 34))}</text>
  <text x="100" y="238" font-family="Open Sans" font-size="26" fill="${MUTED}">${esc(clip(`${cadence} \u00b7 ${yieldLine}`, 60))}</text>
  <text x="100" y="278" font-family="Open Sans" font-size="24" fill="${MUTED}">${esc(clip(r.window_label, 62))}</text>

  <text x="100" y="352" font-family="Open Sans" font-size="24" fill="${MUTED}">Total bounties earned</text>
  <text x="100" y="410" font-family="Open Sans" font-weight="700" font-size="52" fill="${INK}">$${fmt(r.invested)}</text>

  <text x="560" y="352" font-family="Open Sans" font-size="24" fill="${MUTED}">Would now be worth</text>
  <text x="560" y="410" font-family="Open Sans" font-weight="700" font-size="52" fill="${valueColor}">$${fmt(r.final_value)}</text>

  <text x="1100" y="352" text-anchor="end" font-family="Open Sans" font-size="24" fill="${MUTED}">Multiple</text>
  <text x="1100" y="410" text-anchor="end" font-family="Open Sans" font-weight="700" font-size="52" fill="${valueColor}">${r.multiple.toFixed(2)}x</text>

  <path d="${area}" fill="url(#fade)"/>
  <path d="${path}" fill="none" stroke="${valueColor}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>

  <text x="100" y="560" font-family="Open Sans" font-size="24" fill="${MUTED}">rei.chat/earn</text>
  <text x="1100" y="560" text-anchor="end" font-family="Open Sans" font-size="20" fill="#5f5a52">Backtest \u00b7 not financial advice</text>
</svg>`;
}

export async function renderCardPng(r: CalcResult): Promise<Uint8Array> {
  await ensureWasm();
  const fontBuffers = await ensureFonts();
  const resvg = new Resvg(buildCardSvg(r), {
    fitTo: { mode: 'width', value: 1200 },
    font: { fontBuffers, defaultFontFamily: 'Open Sans', loadSystemFonts: false },
  });
  return resvg.render().asPng();
}
