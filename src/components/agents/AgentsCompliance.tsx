import { ScrollFadeIn } from '../joinrei/ScrollFadeIn';
import { Lock, Ban, Gauge, RefreshCw } from 'lucide-react';

const points = [
  { icon: RefreshCw, title: 'Sync, not scrape', body: 'We legally aggregate from sources. Your agent reads our index, never their site.' },
  { icon: Ban, title: 'No PII. Ever.', body: 'Talent profiles, wallets, payment signatures, chats — all stripped at the view layer.' },
  { icon: Gauge, title: 'Per-key rate limits', body: 'Tier-based token buckets keep your agent polite and your spend predictable.' },
  { icon: Lock, title: 'Revocable in one click', body: 'Lost a key? Revoke from the dashboard. No redeploy, no downtime for other keys.' },
];

export const AgentsCompliance = () => (
  <section className="min-h-screen snap-start relative flex items-center justify-center bg-[#0a0a0a] py-20">
    <div className="container mx-auto px-8 lg:px-16">
      <ScrollFadeIn>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-4">
          Safe by default
        </h2>
        <p className="text-cream/60 text-center font-mono text-sm max-w-2xl mx-auto mb-16">
          Built so your agent stays on-side with every TOS it touches.
        </p>
      </ScrollFadeIn>
      <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {points.map((p, i) => (
          <ScrollFadeIn key={p.title} delay={i * 100}>
            <div className="flex gap-4 p-6 rounded-2xl border border-white/10 bg-[#141414]">
              <p.icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-base font-light text-cream font-mono mb-1.5">{p.title}</h3>
                <p className="text-xs text-cream/65 font-mono leading-relaxed">{p.body}</p>
              </div>
            </div>
          </ScrollFadeIn>
        ))}
      </div>
    </div>
  </section>
);
