import { useState } from 'react';
import { ScrollFadeIn } from '../joinrei/ScrollFadeIn';
import { Copy, Check } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const samples: Record<string, string> = {
  curl: `curl -s "${SUPABASE_URL}/functions/v1/public-feed/feed?limit=10" \\
  -H "apikey: ${ANON?.slice(0, 24)}…" \\
  -H "Authorization: Bearer ${ANON?.slice(0, 24)}…" \\
  -H "x-api-key: rei_live_YOUR_KEY"`,
  typescript: `const res = await fetch(
  "${SUPABASE_URL}/functions/v1/public-feed/feed?since=" + lastSeen,
  {
    headers: {
      apikey: ANON_KEY,
      Authorization: \`Bearer \${ANON_KEY}\`,
      "x-api-key": process.env.REI_KEY!,
    },
  }
);
const { data, next_cursor } = await res.json();
for (const task of data) await agent.consider(task);`,
  python: `import os, requests
r = requests.get(
    f"{SUPABASE_URL}/functions/v1/public-feed/feed",
    params={"since": last_seen, "limit": 50},
    headers={
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "x-api-key": os.environ["REI_KEY"],
    },
).json()
for task in r["data"]:
    agent.consider(task)`,
};

export const AgentsCodeDemo = () => {
  const [tab, setTab] = useState<keyof typeof samples>('curl');
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(samples[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-8 lg:px-16 max-w-5xl">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-4">
            Drop in. Done.
          </h2>
          <p className="text-cream/60 text-center font-mono text-sm max-w-2xl mx-auto mb-10">
            Same shape across runtimes. Pick your stack.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn delay={120}>
          <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4">
              <div className="flex">
                {(Object.keys(samples) as (keyof typeof samples)[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`px-4 py-3 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      tab === k
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-cream/40 hover:text-cream/70'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <button
                onClick={copy}
                className="flex items-center gap-1.5 text-[10px] font-mono text-cream/50 hover:text-primary transition-colors"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-6 text-[12px] leading-relaxed font-mono text-cream/85 overflow-x-auto">
              {samples[tab]}
            </pre>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
