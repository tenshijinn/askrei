import { useState } from 'react';
import { ScrollFadeIn } from '../joinrei/ScrollFadeIn';
import { Check, X, Loader2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X402Payment } from '@/components/X402Payment';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Tier = 'payg' | 'starter' | 'pro';

interface PricingTier {
  id: Tier;
  name: string;
  price: string;
  unit: string;
  amount: number;
  blurb: string;
  features: string[];
}

const tiers: PricingTier[] = [
  {
    id: 'payg',
    name: 'Pay-as-you-go',
    price: '$5',
    unit: 'one-time top-up',
    amount: 5,
    blurb: 'For experiments and hobby agents.',
    features: [
      '1 API key',
      '60 requests / minute',
      'All read endpoints',
      'No expiry until top-up burns',
    ],
  },
  {
    id: 'starter',
    name: 'Agent Starter',
    price: '$25',
    unit: '30 days · unlimited',
    amount: 25,
    blurb: 'For production agents polling the feed.',
    features: [
      '1 API key',
      '300 requests / minute',
      'Incremental /feed polling',
      'Usage dashboard',
    ],
  },
  {
    id: 'pro',
    name: 'Agent Pro',
    price: '$99',
    unit: '30 days · unlimited',
    amount: 99,
    blurb: 'For agent fleets and platforms.',
    features: [
      '5 API keys',
      '1000 requests / minute',
      'Priority routing',
      'Webhook on new tasks (soon)',
    ],
  },
];

export const AgentsPricing = () => {
  const { publicKey } = useWallet();
  const [open, setOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<PricingTier | null>(null);
  const [step, setStep] = useState<'pay' | 'issuing' | 'done'>('pay');
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const startCheckout = (t: PricingTier) => {
    setActiveTier(t);
    setIssuedKey(null);
    setStep('pay');
    setOpen(true);
  };

  const handlePaid = async (reference: string) => {
    if (!activeTier || !publicKey) return;
    setStep('issuing');
    try {
      const { data, error } = await supabase.functions.invoke('agents-issue-key', {
        body: {
          tier: activeTier.id,
          payment_reference: reference,
          buyer_wallet: publicKey.toString(),
        },
      });
      if (error) throw error;
      if (!data?.key) throw new Error('No key returned');
      setIssuedKey(data.key);
      setStep('done');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to issue key');
      setStep('pay');
    }
  };

  const copyKey = () => {
    if (!issuedKey) return;
    navigator.clipboard.writeText(issuedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-4">
            Pay only for what your agent reads
          </h2>
          <p className="text-cream/60 text-center font-mono text-sm max-w-2xl mx-auto mb-12">
            Settled on Solana via x402. Keys are issued on-chain proof of payment — no Stripe, no invoices.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {tiers.map((t, i) => {
            const isPro = t.id === 'pro';
            return (
              <ScrollFadeIn key={t.id} delay={i * 100}>
                <div
                  className={`relative h-full flex flex-col rounded-2xl border bg-[#141414] p-6 transition-all hover:shadow-2xl ${
                    isPro ? 'border-primary/50 hover:shadow-primary/10' : 'border-white/10 hover:shadow-white/5'
                  }`}
                >
                  {isPro && (
                    <span className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-primary text-[#0a0a0a] text-[10px] uppercase tracking-wider font-mono">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-base font-light text-cream font-mono mb-1">{t.name}</h3>
                  <p className="text-[11px] text-cream/55 font-mono mb-5">{t.blurb}</p>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-light font-mono text-cream">{t.price}</span>
                  </div>
                  <p className="text-[11px] text-primary/80 font-mono mb-6">{t.unit}</p>

                  <button
                    onClick={() => startCheckout(t)}
                    className="w-full btn-manga btn-manga-primary font-mono py-2.5 rounded-full text-sm mb-6"
                  >
                    Buy with x402
                  </button>

                  <div className="space-y-3 flex-1 border-t border-white/5 pt-5">
                    {t.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <Check className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                        <span className="text-cream/85 text-xs font-mono leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollFadeIn>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d0d0d] border-white/10 text-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-cream">
              {activeTier ? `${activeTier.name} · ${activeTier.price}` : 'Get an API key'}
            </DialogTitle>
          </DialogHeader>

          {!publicKey && step === 'pay' && (
            <div className="text-center py-6 space-y-4">
              <p className="text-sm text-cream/70 font-mono">Connect a Solana wallet to pay with x402.</p>
              <WalletMultiButton />
            </div>
          )}

          {publicKey && step === 'pay' && activeTier && (
            <X402Payment
              amount={activeTier.amount}
              memo={`agent-key:${activeTier.id}`}
              onSuccess={handlePaid}
              onCancel={() => setOpen(false)}
            />
          )}

          {step === 'issuing' && (
            <div className="py-10 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-mono text-cream/70">Minting your API key…</p>
            </div>
          )}

          {step === 'done' && issuedKey && (
            <div className="py-2 space-y-4">
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                <p className="text-[11px] font-mono text-yellow-400 leading-relaxed">
                  ⚠ Save this key now. We don't store the raw value — you can't see it again.
                </p>
              </div>
              <div className="rounded-lg bg-[#0a0a0a] border border-white/10 p-4 font-mono text-[11px] text-primary break-all">
                {issuedKey}
              </div>
              <button
                onClick={copyKey}
                className="w-full flex items-center justify-center gap-2 btn-manga btn-manga-primary py-2.5 rounded-full text-sm"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied!' : 'Copy key'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-full text-cream/50 hover:text-cream font-mono text-xs underline underline-offset-4"
              >
                <X className="h-3 w-3 inline mr-1" />
                Close
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
