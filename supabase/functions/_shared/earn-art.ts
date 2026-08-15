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

const A = (id: string, f: string) => `${SITE}/__l5e/assets-v1/${id}/${f}`;

const JITO_1 = A('ccab5f69-7ba8-4a7b-bb66-694b83026f19', 'jito-rei.webp');
const JITO_2 = A('32bfe1b6-366c-4dc3-b289-de5c4ff4a174', 'jito-rei2.webp');
const MARINADE_1 = A('e7ef4f7c-7f97-47e3-b876-9db3568d7502', 'defi-marinade.webp');
const MARINADE_2 = A('52d97d6f-64c2-4344-9244-39f6163f0fda', 'defi-marinade2.webp');
const MARGINFI_1 = A('a282bdd3-dbbd-4994-a299-53753a75d41d', 'defi-marginfi.webp');
const MARGINFI_2 = A('9efc2259-6f3a-475c-b8f5-425a85636bf4', 'defi-marginfi2.webp');
const NLO_1 = A('e112317a-a5a5-415b-93a3-e2dca908cc56', 'nlo-defi.webp');
const NLO_2 = A('cff0046a-4de5-421d-ab97-eb4cd4b0a68f', 'nlo-defi2.webp');

export const SHARE_ART: Record<string, string> = {
  'sol-default': DEFAULT_ART,

  'listed-jito': JITO_1,
  'listed-kamino': DEFAULT_ART,
  'listed-marinade': MARINADE_1,
  'listed-marginfi': MARGINFI_1,
  'listed-nlo': NLO_1,

  'token-jito-1': JITO_1,
  'token-jito-2': JITO_2,
  'token-kamino-1': DEFAULT_ART,
  'token-kamino-2': DEFAULT_ART,
  'token-marinade-1': MARINADE_1,
  'token-marinade-2': MARINADE_2,
  'token-marginfi-1': MARGINFI_1,
  'token-marginfi-2': MARGINFI_2,
  'token-nlo-1': NLO_1,
  'token-nlo-2': NLO_2,
};

/** kamino has no art yet, so keep it out of the random token pool */
export const TOKEN_SLOTS = PLATFORM_SLUGS.filter((p) => p !== 'kamino')
  .flatMap((p) => [`token-${p}-1`, `token-${p}-2`]);


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
