// Background art selection for the /earn share card.
// One picker used by both the on-page card (ShareImage) and the server-rendered
// agent card (supabase/functions/_shared/earn-art.ts mirrors this map).
//
// Slots:
//   sol-default            SOL + any DeFi platform (and buy & hold)
//   <platform>-1 / -2      any other asset on that platform (random, seeded)
//   token-1 / token-2      token mode (random, seeded)
import reiArt from '@/assets/rei-share-art.png.asset.json';
import jito1 from '@/assets/earn/jito-rei.webp.asset.json';
import jito2 from '@/assets/earn/jito-rei2.webp.asset.json';
import marinade1 from '@/assets/earn/defi-marinade.webp.asset.json';
import marinade2 from '@/assets/earn/defi-marinade2.webp.asset.json';
import marginfi1 from '@/assets/earn/defi-marginfi.webp.asset.json';
import marginfi2 from '@/assets/earn/defi-marginfi2.webp.asset.json';
import nlo1 from '@/assets/earn/nlo-defi.webp.asset.json';
import nlo2 from '@/assets/earn/nlo-defi2.webp.asset.json';
import kamino1 from '@/assets/earn/kamino-defi1.png.asset.json';
import kamino2 from '@/assets/earn/kamino-defi2.png.asset.json';
import token1 from '@/assets/earn/rei-token1.png.asset.json';
import token2 from '@/assets/earn/rei-token2.png.asset.json';

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

/** every art slot -> image url */
export const SHARE_ART: Record<string, string> = {
  'sol-default': DEFAULT_ART,

  'jito-1': jito1.url,
  'jito-2': jito2.url,
  'kamino-1': kamino1.url,
  'kamino-2': kamino2.url,
  'marinade-1': marinade1.url,
  'marinade-2': marinade2.url,
  'marginfi-1': marginfi1.url,
  'marginfi-2': marginfi2.url,
  'nlo-1': nlo1.url,
  'nlo-2': nlo2.url,

  'token-1': token1.url,
  'token-2': token2.url,
};

/** focal point per slot so her face stays centred in the card panel */
export const ART_FOCUS: Record<string, string> = {
  'sol-default': '50% 26%',
  'jito-1': '48% 30%',
  'jito-2': '50% 32%',
  'kamino-1': '50% 40%',
  'kamino-2': '52% 38%',
  'marinade-1': '46% 34%',
  'marinade-2': '48% 34%',
  'marginfi-1': '55% 42%',
  'marginfi-2': '54% 40%',
  'nlo-1': '52% 32%',
  'nlo-2': '55% 34%',
  'token-1': '38% 32%',
  'token-2': '45% 30%',
};

export const TOKEN_SLOTS = ['token-1', 'token-2'];

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
  const key = seed ?? `${assetSym}|${platformName}`;
  if (isToken) return TOKEN_SLOTS[artSeed(key) % TOKEN_SLOTS.length];
  const slug = platformName ? PLATFORM_SLUG[platformName] : null;
  if (!slug) return 'sol-default';
  if ((assetSym || '').toUpperCase() === 'SOL') return 'sol-default';
  return `${slug}-${(artSeed(key) % 2) + 1}`;
}

export function pickShareArt(pick: ArtPick): string {
  return SHARE_ART[pickShareArtSlot(pick)] ?? DEFAULT_ART;
}

/** object-position for the picked art so her face lands centred in the panel */
export function pickShareFocus(pick: ArtPick): string {
  return ART_FOCUS[pickShareArtSlot(pick)] ?? '50% 26%';
}
