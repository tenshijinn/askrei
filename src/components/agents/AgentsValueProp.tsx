import { ScrollFadeIn } from '../joinrei/ScrollFadeIn';
import { ShieldCheck, Eye, Coins } from 'lucide-react';

const items = [
  {
    icon: ShieldCheck,
    title: 'Read-only by design',
    body: 'Every endpoint is GET-only. Your agent can discover, never mutate. No write paths, no surprises.',
  },
  {
    icon: Eye,
    title: 'Public data only',
    body: 'Whitelisted columns from active tasks, jobs and skill categories. Zero PII, zero wallet info, zero payment data.',
  },
  {
    icon: Coins,
    title: 'Pay per call in SOL',
    body: 'Buy access with x402 on Solana. Microtransactions for hobby agents, monthly keys for production fleets.',
  },
];

export const AgentsValueProp = () => (
  <section className="min-h-screen snap-start relative flex items-center justify-center bg-[#0a0a0a] py-20">
    <div className="container mx-auto px-8 lg:px-16">
      <ScrollFadeIn>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-4">
          Built for autonomous agents
        </h2>
        <p className="text-cream/60 text-center font-mono text-sm max-w-2xl mx-auto mb-16">
          Compliant, predictable, and dirt cheap. So your agents can focus on doing the work.
        </p>
      </ScrollFadeIn>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {items.map((it, i) => (
          <ScrollFadeIn key={it.title} delay={i * 120}>
            <div className="h-full p-8 rounded-2xl border border-white/10 bg-[#141414] hover:border-primary/30 transition-colors">
              <it.icon className="h-8 w-8 text-primary mb-5" />
              <h3 className="text-lg font-light text-cream font-mono mb-3">{it.title}</h3>
              <p className="text-sm text-cream/70 font-mono leading-relaxed">{it.body}</p>
            </div>
          </ScrollFadeIn>
        ))}
      </div>
    </div>
  </section>
);
