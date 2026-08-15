// Background art selection for the /earn share card.
// One picker used by both the on-page card (ShareImage) and the server-rendered
// agent card (supabase/functions/_shared/earn-art.ts mirrors this map).
//
// Slots:
//   sol-default                      SOL + any DeFi platform (and buy & hold)
//   listed-<platform>                USDC / USDT / BTC / ETH + that platform
//   token-<platform>-1 / -2          custom token pick (random, seeded)
import reiArt from '@/assets/rei-share-art.png.asset.json';

/** current art — also the fallback for every slot that has no image yet */
export const DEFAULT_ART = reiArt.url;

export const PLATFORM_SLUG: Record<string, string> = {
  'Jito': 'jito',
  'Kamino': 'kamino',
  'Marinade': 'marinade',
  'marginfi': 'marginfi',
  'NLO by L1X': 'nlo',
};

export const PLATFORM_SLUGS = ['jito', 'kamino', 'marinade', 'marginfi', 'nlo'];

/** every art slot -> image url. Swap a value when the real image is uploaded. */
export const SHARE_ART: Record<string, string> = {
  'sol-default': DEFAULT_ART,

  'listed-jito': DEFAULT_ART,
  'listed-kamino': DEFAULT_ART,
  'listed-marinade': DEFAULT_ART,
  'listed-marginfi': DEFAULT_ART,
  'listed-nlo': DEFAULT_ART,

  'token-jito-1': DEFAULT_ART,
  'token-jito-2': DEFAULT_ART,
  'token-kamino-1': DEFAULT_ART,
  'token-kamino-2': DEFAULT_ART,
  'token-marinade-1': DEFAULT_ART,
  'token-marinade-2': DEFAULT_ART,
  'token-marginfi-1': DEFAULT_ART,
  'token-marginfi-2': DEFAULT_ART,
  'token-nlo-1': DEFAULT_ART,
  'token-nlo-2': DEFAULT_ART,
};

export const TOKEN_SLOTS = PLATFORM_SLUGS.flatMap((p) => [`token-${p}-1`, `token-${p}-2`]);

/** stable 32-bit hash so the same inputs always resolve to the same art */
export function artSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface ArtPick {
  assetSym: string;
  /** null for buy & hold / token mode */
  platformName: string | null;
  /** true when the asset is a custom token from the token list */
  isToken?: boolean;
  /** anything stable (share id, or asset+platform+amount) */
  seed?: string;
}

export function pickShareArtSlot({ assetSym, platformName, isToken, seed }: ArtPick): string {
  if (isToken) {
    const idx = artSeed(seed ?? assetSym ?? 'token') % TOKEN_SLOTS.length;
    return TOKEN_SLOTS[idx];
  }
  const slug = platformName ? PLATFORM_SLUG[platformName] : null;
  if (!slug) return 'sol-default';
  if ((assetSym || '').toUpperCase() === 'SOL') return 'sol-default';
  return `listed-${slug}`;
}

export function pickShareArt(pick: ArtPick): string {
  return SHARE_ART[pickShareArtSlot(pick)] ?? DEFAULT_ART;
}
