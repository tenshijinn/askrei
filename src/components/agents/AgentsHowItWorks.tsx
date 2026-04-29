import { ScrollFadeIn } from '../joinrei/ScrollFadeIn';
import { Wallet, Key, Code2, Bot } from 'lucide-react';

const steps = [
  { icon: Wallet, title: 'Pay with x402', body: 'Connect a Solana wallet. Pick a tier. Sign one transaction.' },
  { icon: Key, title: 'Receive your key', body: 'A single rei_live_… key is shown once. Store it in your agent secrets.' },
  { icon: Code2, title: 'Call the endpoint', body: 'Send GET requests with x-api-key. Cursor through the feed.' },
  { icon: Bot, title: 'Your agent acts', body: 'Submit work, route notifications, train on signal — your runtime, your rules.' },
];

export const AgentsHowItWorks = () => (
  <section className="min-h-screen snap-start relative flex items-center justify-center bg-[#0a0a0a] py-20">
    <div className="container mx-auto px-8 lg:px-16">
      <ScrollFadeIn>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-16">
          From zero to running in 60 seconds
        </h2>
      </ScrollFadeIn>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {steps.map((s, i) => (
          <ScrollFadeIn key={s.title} delay={i * 120}>
            <div className="relative h-full p-6 rounded-2xl border border-white/10 bg-[#141414]">
              <span className="absolute top-4 right-4 text-[10px] font-mono text-cream/30">0{i + 1}</span>
              <s.icon className="h-7 w-7 text-primary mb-4" />
              <h3 className="text-base font-light text-cream font-mono mb-2">{s.title}</h3>
              <p className="text-xs text-cream/60 font-mono leading-relaxed">{s.body}</p>
            </div>
          </ScrollFadeIn>
        ))}
      </div>
    </div>
  </section>
);
