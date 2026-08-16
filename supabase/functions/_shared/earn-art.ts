// Server mirror of src/components/earn/shareArt.ts — same slots, same rules,
// resolved to absolute CDN URLs so the edge function can fetch and embed them.

const SITE = 'https://rei.chat';

/** current art (rei-share-art.png) — used for SOL and buy & hold */
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

export const SHARE_ART: Record<string, string> = {
  'sol-default': DEFAULT_ART,

  'jito-1': A('ccab5f69-7ba8-4a7b-bb66-694b83026f19', 'jito-rei.webp'),
  'jito-2': A('32bfe1b6-366c-4dc3-b289-de5c4ff4a174', 'jito-rei2.webp'),
  'kamino-1': A('ab46b701-0ecd-4968-bd36-06cae85dcb07', 'kamino-defi1.png'),
  'kamino-2': A('c1482141-25d7-4338-97b8-ca2918008320', 'kamino-defi2.png'),
  'marinade-1': A('e7ef4f7c-7f97-47e3-b876-9db3568d7502', 'defi-marinade.webp'),
  'marinade-2': A('52d97d6f-64c2-4344-9244-39f6163f0fda', 'defi-marinade2.webp'),
  'marginfi-1': A('a282bdd3-dbbd-4994-a299-53753a75d41d', 'defi-marginfi.webp'),
  'marginfi-2': A('9efc2259-6f3a-475c-b8f5-425a85636bf4', 'defi-marginfi2.webp'),
  'nlo-1': A('e112317a-a5a5-415b-93a3-e2dca908cc56', 'nlo-defi.webp'),
  'nlo-2': A('cff0046a-4de5-421d-ab97-eb4cd4b0a68f', 'nlo-defi2.webp'),

  'token-1': A('3f119531-8532-493b-9482-718228902ba8', 'rei-token1.png'),
  'token-2': A('1910f481-3c24-4ade-90bc-484a8a03044a', 'rei-token2.png'),
};

export const TOKEN_SLOTS = ['token-1', 'token-2'];

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

/** vertical framing per slot, mirrors ART_FOCUS in src/components/earn/shareArt.ts */
export const ART_ALIGN: Record<string, string> = {
  'sol-default': 'xMidYMin slice',
  'jito-1': 'xMidYMin slice',
  'jito-2': 'xMidYMin slice',
  'kamino-1': 'xMidYMid slice',
  'kamino-2': 'xMidYMid slice',
  'marinade-1': 'xMidYMid slice',
  'marinade-2': 'xMidYMid slice',
  'marginfi-1': 'xMidYMid slice',
  'marginfi-2': 'xMidYMid slice',
  'nlo-1': 'xMidYMin slice',
  'nlo-2': 'xMidYMid slice',
  'token-1': 'xMinYMid slice',
  'token-2': 'xMidYMid slice',
};

export function pickShareAlign(pick: ArtPick): string {
  return ART_ALIGN[pickShareArtSlot(pick)] ?? 'xMidYMin slice';
}
