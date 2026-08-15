// Server mirror of src/components/earn/shareArt.ts — same slots, same rules,
// resolved to absolute CDN URLs so the edge function can fetch and embed them.

const SITE = 'https://rei.chat';

/** current art (rei-share-art.png) — fallback for every slot without an image */
export const DEFAULT_ART_PATH = '/__l5e/assets-v1/08052738-2400-4a31-a09b-2509fb74fe0e/rei-share-art.png';
export const DEFAULT_ART = `${SITE}${DEFAULT_ART_PATH}`;

export const PLATFORM_SLUG: Record<string, string> = {
  'Jito': 'jito',
  'Kamino': 'kamino',
  'Marinade': 'marinade',
  'marginfi': 'marginfi',
  'NLO by L1X': 'nlo',
};

export const PLATFORM_SLUGS = ['jito', 'kamino', 'marinade', 'marginfi', 'nlo'];

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
  platformName: string | null;
  isToken?: boolean;
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
