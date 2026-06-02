// Multi-source SOL/USD price oracle.
// Tries Moralis first (primary). If Moralis returns a sane price, returns it.
// Otherwise falls back to the median of Jupiter, Pyth, and CoinGecko.
// Throws only if every source fails — never falls back to a hardcoded constant.

const PYTH_SOL_USD_FEED =
  "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

const MIN_SANE_PRICE = 20;   // hard floor (USD)
const MAX_SANE_PRICE = 2000; // hard ceiling (USD)
const FETCH_TIMEOUT_MS = 5000;

type Source = { name: string; price: number };

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await p;
  } finally {
    clearTimeout(t);
  }
}

async function fetchMoralis(): Promise<number> {
  const apiKey = Deno.env.get("MORALIS_API_KEY");
  if (!apiKey) throw new Error("MORALIS_API_KEY not configured");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      "https://solana-gateway.moralis.io/token/mainnet/So11111111111111111111111111111111111111112/price",
      {
        headers: { Accept: "application/json", "X-API-Key": apiKey },
        signal: ctrl.signal,
      },
    );
    if (!res.ok) throw new Error(`Moralis HTTP ${res.status}`);
    const data = await res.json();
    const price = Number(data?.usdPrice ?? data?.nativePrice?.value);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Moralis returned invalid price");
    }
    return price;
  } finally {
    clearTimeout(t);
  }
}

async function fetchJupiter(): Promise<number> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112",
      { headers: { Accept: "application/json" }, signal: ctrl.signal },
    );
    if (!res.ok) throw new Error(`Jupiter HTTP ${res.status}`);
    const data = await res.json();
    const priceStr =
      data?.data?.["So11111111111111111111111111111111111111112"]?.price;
    const price = Number(priceStr);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Jupiter returned invalid price");
    }
    return price;
  } finally {
    clearTimeout(t);
  }
}

async function fetchPyth(): Promise<number> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_USD_FEED}`,
      { headers: { Accept: "application/json" }, signal: ctrl.signal },
    );
    if (!res.ok) throw new Error(`Pyth HTTP ${res.status}`);
    const data = await res.json();
    const parsed = data?.parsed?.[0]?.price;
    if (!parsed) throw new Error("Pyth missing parsed price");
    const price = Number(parsed.price) * Math.pow(10, Number(parsed.expo));
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Pyth returned invalid price");
    }
    return price;
  } finally {
    clearTimeout(t);
  }
}

async function fetchCoinGecko(): Promise<number> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { headers: { Accept: "application/json" }, signal: ctrl.signal },
    );
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();
    const price = Number(data?.solana?.usd);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("CoinGecko returned invalid price");
    }
    return price;
  } finally {
    clearTimeout(t);
  }
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export interface SolPriceResult {
  price: number;
  sources: Source[];
  median: number;
}

/**
 * Returns the current SOL/USD price as the median of trustworthy oracle responses.
 * Throws if fewer than 1 source succeeds or no source returns a sane price.
 */
export async function fetchSolPriceUsd(logPrefix = "[sol-price]"): Promise<SolPriceResult> {
  // Primary: Moralis. If it returns a sane price, use it directly.
  try {
    const moralisPrice = await fetchMoralis();
    if (moralisPrice >= MIN_SANE_PRICE && moralisPrice <= MAX_SANE_PRICE) {
      console.log(`${logPrefix} moralis (primary): $${moralisPrice}`);
      const src: Source = { name: "moralis", price: moralisPrice };
      return { price: moralisPrice, sources: [src], median: moralisPrice };
    }
    console.warn(`${logPrefix} moralis: out-of-band price $${moralisPrice} — falling back`);
  } catch (err) {
    console.warn(`${logPrefix} moralis (primary) failed, falling back:`, (err as Error)?.message ?? err);
  }

  // Fallbacks: Jupiter + Pyth + CoinGecko (median of sane responses).
  const fetchers: Array<{ name: string; fn: () => Promise<number> }> = [
    { name: "jupiter", fn: fetchJupiter },
    { name: "pyth", fn: fetchPyth },
    { name: "coingecko", fn: fetchCoinGecko },
  ];

  const results = await Promise.allSettled(fetchers.map((f) => f.fn()));

  const sources: Source[] = [];
  results.forEach((r, i) => {
    const name = fetchers[i].name;
    if (r.status === "fulfilled") {
      const p = r.value;
      if (p >= MIN_SANE_PRICE && p <= MAX_SANE_PRICE) {
        console.log(`${logPrefix} ${name}: $${p}`);
        sources.push({ name, price: p });
      } else {
        console.warn(`${logPrefix} ${name}: out-of-band price $${p} — discarded`);
      }
    } else {
      console.warn(`${logPrefix} ${name} failed:`, r.reason?.message ?? r.reason);
    }
  });

  if (sources.length === 0) {
    throw new Error(
      "Unable to fetch a trustworthy SOL price from any oracle (Moralis, Jupiter, Pyth, CoinGecko).",
    );
  }

  const m = median(sources.map((s) => s.price));

  // Disagreement warning if spread > 3%
  if (sources.length >= 2) {
    const prices = sources.map((s) => s.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if ((max - min) / m > 0.03) {
      console.warn(
        `${logPrefix} Oracle disagreement >3%: min $${min}, max $${max}, median $${m}`,
      );
    }
  }

  console.log(
    `${logPrefix} Using median $${m} from ${sources.length} source(s): ${sources.map((s) => s.name).join(", ")}`,
  );

  return { price: m, sources, median: m };
}
