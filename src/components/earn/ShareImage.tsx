import reiLogo from '@/assets/rei-logo.png';
import { pickShareArt, pickShareFocus } from './shareArt';
import { fmt } from './data';

export interface ShareImageProps {
  assetSym: string;
  assetLogoUrl?: string;
  platformName: string | null; // null => buy & hold
  platformLogoUrl?: string;
  invested: number;
  finalVal: number;
  windowLabel: string;
  /** true when the asset is a custom token from the token list */
  isToken?: boolean;
  /** stable seed so the same selection always resolves to the same art */
  artSeed?: string;
  chart: {
    W: number;
    H: number;
    valD: string;
    conD: string;
    areaD: string;
  } | null;
}

const TEXT = '#f1e8dd';
const MUTED = '#8f8579';
const MUTED2 = '#5f574f';
const CREAM = '#eddccb';
const GREEN = '#7fe0a3';
const RED = '#ed565a';
const PROXY = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/img-proxy?u=`;
/** Remote logos must be CORS-readable for html-to-image; route them via our proxy. */
const cors = (u?: string) => (u && /^https?:\/\//i.test(u) ? `${PROXY}${encodeURIComponent(u)}` : u);

const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Off-screen 1600x900 (16:9) tweet image. Inline styles only so html-to-image
 *  can serialise it without any external stylesheet. */
export default function ShareImage({
  assetSym, assetLogoUrl, platformName, platformLogoUrl, invested, finalVal, windowLabel, chart,
  isToken, artSeed,
}: ShareImageProps) {
  const pick = { assetSym, platformName, isToken, seed: artSeed ?? assetSym };
  const artUrl = pickShareArt(pick);
  const artFocus = pickShareFocus(pick);
  const gain = finalVal - invested;
  const pct = invested > 0 ? (gain / invested) * 100 : 0;
  const down = gain < 0;
  const accent = down ? RED : GREEN;

  const stat = (k: string, v: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'baseline' }}>
      <span style={{ color: MUTED }}>{k}</span>
      <span style={{ color: TEXT, fontWeight: 600 }}>{v}</span>
    </div>
  );

  return (
    <div
      style={{
        position: 'relative', width: 1600, height: 900, overflow: 'hidden',
        background: '#0a0a09', color: TEXT, fontFamily: MONO,
      }}
    >
      {/* right art panel, diagonal seam */}
      <div
        style={{
          position: 'absolute', top: 0, right: 0, width: '60%', height: '100%',
          clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 3% 100%)',
          background: '#15130f', overflow: 'hidden',
        }}
      >
        <img
          src={artUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 26%' }}
        />
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(100deg, #0a0a09 0%, rgba(10,9,8,0.5) 20%, rgba(10,9,8,0) 44%)',
          }}
        />
      </div>

      {/* sparkline across the full card */}
      {chart && (
        <svg
          viewBox={`0 0 ${chart.W} ${chart.H}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '46%' }}
        >
          <defs>
            <linearGradient id="shareFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CREAM} stopOpacity="0.22" />
              <stop offset="100%" stopColor={CREAM} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={chart.areaD} fill="url(#shareFill)" />
          <path d={chart.conD} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="14 12" opacity={0.55} />
          <path d={chart.valD} fill="none" stroke={CREAM} strokeWidth={6} opacity={0.9} />
        </svg>
      )}

      {/* left info panel */}
      <div
        style={{
          position: 'absolute', left: 0, top: 0, width: '60%', height: '100%',
          padding: '70px 80px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={reiLogo} alt="Rei" style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 34, color: MUTED }}>
            <b style={{ color: TEXT, fontWeight: 700, letterSpacing: 2 }}>REI</b>
            <span style={{ color: MUTED2 }}>›</span>Bounties<span style={{ color: MUTED2 }}>›</span>DeFi
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(237,220,203,0.12)', margin: '34px 0 40px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 13, fontSize: 40, fontWeight: 600, color: TEXT }}>
            {assetLogoUrl && (
              <img src={cors(assetLogoUrl)} crossOrigin="anonymous" alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
            )}
            ${assetSym}
          </span>
          {platformName ? (
            <>
              <span style={{ fontSize: 30, color: MUTED }}>on</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 40, fontWeight: 600, color: TEXT }}>
                {platformLogoUrl && (
                  <img src={cors(platformLogoUrl)} crossOrigin="anonymous" alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'contain' }} />
                )}
                {platformName}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 30, color: MUTED }}>buy &amp; hold</span>
          )}
        </div>

        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 118, lineHeight: 1, letterSpacing: -3, color: accent, marginTop: 26 }}>
          {down ? '' : '+'}{pct.toFixed(0)}%
        </div>
        <div style={{ fontSize: 44, color: accent, marginTop: 12, opacity: 0.9 }}>
          ${fmt(finalVal)} · from ${fmt(invested)}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 18, fontSize: 27, maxWidth: 660 }}>
          {stat('Bounties Earned', `$${fmt(invested)}`)}
          {stat('DeFi Invested Bounties', `$${fmt(finalVal)}`)}
          {stat('Window', windowLabel)}
        </div>
      </div>

      {/* top-right creds */}
      <div style={{ position: 'absolute', top: 64, right: 70, display: 'flex', gap: 34, fontSize: 26, color: CREAM, zIndex: 3 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 24 24" fill={CREAM} width={24} height={24} style={{ width: 24, height: 24 }}>
            <path d="M18.9 1.2h3.6l-7.9 9 9.3 12.3h-7.3l-5.7-7.5-6.6 7.5H.7l8.4-9.6L0 1.2h7.5l5.2 6.8zM17.6 20.4h2L6.5 3.2H4.4z" />
          </svg>
          @AskRei_
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>rei.chat</span>
      </div>

      {/* bottom-right chip */}
      <div
        style={{
          position: 'absolute', bottom: 56, right: 64, display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(10,9,8,0.7)', border: '1px solid rgba(237,220,203,0.18)', borderRadius: 999,
          padding: '12px 22px 12px 14px', fontSize: 26, color: TEXT, zIndex: 3,
        }}
      >
        <img src={reiLogo} alt="" style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover' }} />
        Find crypto's bounties aggregated by Rei AI
      </div>
    </div>
  );
}
