import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Rocket, Upload, Loader2, Check, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { SolanaPayQR } from '@/components/SolanaPayQR';
import { X402Payment } from '@/components/X402Payment';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';

type PaymentMethod = 'solana-pay' | 'x402' | null;

interface PaymentData {
  qrCodeUrl: string;
  reference: string;
  paymentUrl: string;
  amount: number;
  solAmount: number;
  recipient: string;
}

const TREASURY = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';
const USD_AMOUNT = 2500;

export default function RocketReach() {
  const { publicKey } = useWallet();
  const [projectName, setProjectName] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [solAmount, setSolAmount] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successTask, setSuccessTask] = useState<any>(null);

  // Live SOL price
  useEffect(() => {
    let cancelled = false;
    const fetchPrice = async () => {
      try {
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const d = await r.json();
        if (cancelled) return;
        const p = d?.solana?.usd;
        if (p) {
          setSolPrice(p);
          setSolAmount(USD_AMOUNT / p);
        }
      } catch (e) { console.error('SOL price fetch failed', e); }
    };
    fetchPrice();
    const id = setInterval(fetchPrice, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB'); return;
    }
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const canSubmit = !!(projectName.trim() && projectLink.trim() && screenshot && publicKey && solAmount);

  const generatePayment = async () => {
    if (!canSubmit || !solAmount) return;
    setIsGenerating(true);
    try {
      const { Keypair } = await import('@solana/web3.js');
      const keypair = Keypair.generate();
      const reference = keypair.publicKey.toString();
      const label = 'Rocket Reach Campaign';
      const message = `Rocket Reach: ${projectName}`;
      const paymentUrl = `solana:${TREASURY}?amount=${solAmount.toFixed(9)}&reference=${reference}&label=${encodeURIComponent(label)}&message=${encodeURIComponent(message)}`;
      const qrCodeUrl = await QRCode.toDataURL(paymentUrl, { width: 400, margin: 2, color: { dark: '#0a0a0a', light: '#e8c4b8' } });
      setPaymentData({ qrCodeUrl, reference, paymentUrl, amount: USD_AMOUNT, solAmount, recipient: TREASURY });
      setShowPaymentMethod(true);
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate payment');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMethodSelect = (m: 'solana-pay' | 'x402') => { setSelectedMethod(m); setShowPaymentMethod(false); };

  const handlePaymentComplete = async (reference: string) => {
    if (!screenshot || !publicKey) return;
    setIsProcessing(true);
    try {
      // Verify payment / get tx signature
      const { data: paymentRef } = await supabase
        .from('payment_references').select('*').eq('reference', reference).maybeSingle();
      let txSignature: string | null = paymentRef?.tx_signature || null;
      if (!txSignature) {
        const { data: verifyData, error: vErr } = await supabase.functions.invoke('verify-solana-pay', {
          body: { reference, walletAddress: publicKey.toString() },
        });
        if (vErr || !verifyData?.verified) throw new Error(verifyData?.error || 'Payment verification failed');
        txSignature = verifyData.signature;
      }

      // Upload screenshot
      const ext = screenshot.name.split('.').pop() || 'png';
      const path = `rocket-reach/${publicKey.toString()}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('rei-contributor-files').upload(path, screenshot, {
        contentType: screenshot.type, upsert: false,
      });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
      const { data: signed, error: signErr } = await supabase.storage
        .from('rei-contributor-files').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed?.signedUrl) throw new Error('Could not generate screenshot URL');

      // Call AI extraction edge function
      const { data: extractData, error: extractErr } = await supabase.functions.invoke('extract-campaign-from-screenshot', {
        body: {
          projectName, projectLink,
          screenshotUrl: signed.signedUrl,
          employerWallet: publicKey.toString(),
          paymentTxSignature: txSignature,
          solanaPayReference: reference,
        },
      });
      if (extractErr || !extractData?.success) throw new Error(extractData?.error || 'Failed to extract campaign');

      setSuccessTask(extractData.task);
      toast.success('Campaign launched into Rei network!');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = () => { setSelectedMethod(null); setShowPaymentMethod(true); };

  if (successTask) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-cream font-mono flex items-center justify-center p-4">
        <div className="max-w-xl w-full rei-surface text-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
              <Check className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-light text-primary">Campaign is live</h1>
          <p className="text-cream/80 text-sm leading-relaxed">
            <span className="text-primary">{successTask.title}</span> is now indexed in Rei's network and will be matched to thousands of contributors via AskRei.
          </p>
          <div className="rei-surface-2 p-4 text-left text-xs space-y-2">
            <div><span className="text-cream/60">Title:</span> <span className="text-cream">{successTask.title}</span></div>
            {successTask.compensation && <div><span className="text-cream/60">Reward:</span> <span className="text-cream">{successTask.compensation}</span></div>}
            {successTask.role_tags?.length > 0 && <div><span className="text-cream/60">Roles:</span> <span className="text-cream">{successTask.role_tags.join(', ')}</span></div>}
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/rei" className="btn-manga btn-manga-primary px-6 py-3 rounded-full text-sm inline-flex items-center gap-2">
              View on Rei <ExternalLink className="h-4 w-4" />
            </Link>
            <Link to="/" className="btn-manga px-6 py-3 rounded-full text-sm">Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream font-mono">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-cream/70 hover:text-primary transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <WalletMultiButton className="!bg-[#f0ede8] !text-[#0a0a0a] hover:!opacity-80 !rounded-[28px] !font-mono !text-xs" />
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-light text-primary mb-4">
            Rocket Reach <span className="text-cream/40">|</span> Task Promotion Package
          </h1>
          <p className="text-cream/70 text-sm md:text-base leading-relaxed">
            Get your campaign in front of the entire Rei talent network — instantly. Pay once, and Rei AI ingests, indexes, and matches your task to thousands of skilled Web3 contributors.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rei-surface-2 px-5 py-3 rounded-full">
            <span className="text-3xl font-light text-primary">${USD_AMOUNT.toLocaleString()}</span>
            <span className="text-cream/50 text-sm">USD</span>
            {solAmount && solPrice && (
              <span className="text-cream/60 text-xs ml-2 border-l border-white/10 pl-3">
                ≈ {solAmount.toFixed(3)} SOL <span className="text-cream/40">@ ${solPrice.toFixed(2)}/SOL</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* How it works */}
          <div className="rei-surface p-6 lg:p-8">
            <h2 className="text-lg text-primary mb-6 font-light">How it works</h2>
            <ol className="space-y-5">
              {[
                { n: 1, t: 'Submit your campaign', d: 'Drop in your project name, link, and a screenshot of your existing campaign page (Galxe, Zealy, QuestN, Layer3, custom — anything visual).' },
                { n: 2, t: 'Pay $2,500 in SOL', d: 'Pay once via Solana Pay or x402 with any connected Solana wallet. Live SOL conversion at the time of payment.' },
                { n: 3, t: 'Rei AI extracts & indexes', d: "Our AI reads your screenshot — pulling out title, description, prizes, roles and skills — and writes a clean, structured task into Rei's network." },
                { n: 4, t: 'Matched to contributors', d: 'AskRei and Agent Rei surface your campaign to skill-matched contributors across Galxe, Zealy, QuestN, TaskOn, Layer3 and beyond — across Solana, Ethereum, Polygon, Arbitrum, Base.' },
              ].map(s => (
                <li key={s.n} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border border-primary/40 bg-primary/10 text-primary flex items-center justify-center text-sm font-light">
                    {s.n}
                  </div>
                  <div className="flex-1">
                    <div className="text-cream font-light text-sm mb-1">{s.t}</div>
                    <div className="text-cream/60 text-xs leading-relaxed">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Form */}
          <div className="rei-surface p-6 lg:p-8">
            {!paymentData && (
              <>
                <h2 className="text-lg text-primary mb-6 font-light">Submit your campaign</h2>
                <div className="space-y-5">
                  <div>
                    <div className="rei-section-label">Project name *</div>
                    <input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. SonicChain Genesis Quest"
                      maxLength={100}
                      className="rei-field"
                    />
                  </div>
                  <div>
                    <div className="rei-section-label">Project link *</div>
                    <input
                      value={projectLink}
                      onChange={(e) => setProjectLink(e.target.value)}
                      placeholder="https://galxe.com/your-campaign"
                      type="url"
                      className="rei-field"
                    />
                  </div>
                  <div>
                    <div className="rei-section-label">Campaign screenshot *</div>
                    <label className="block">
                      <div className="rei-surface-2 border-dashed border border-white/15 hover:border-primary/40 transition-colors rounded-xl p-6 cursor-pointer text-center">
                        {screenshotPreview ? (
                          <div className="space-y-3">
                            <img src={screenshotPreview} alt="preview" className="max-h-40 mx-auto rounded border border-white/10" />
                            <div className="text-xs text-cream/60">{screenshot?.name} — click to change</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-6 w-6 text-cream/40 mx-auto" />
                            <div className="text-xs text-cream/60">Drop or click to upload (PNG/JPG, max 10MB)</div>
                            <div className="text-[10px] text-cream/40">Rei AI will read this to auto-fill title, description, prizes & roles</div>
                          </div>
                        )}
                      </div>
                      <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                    </label>
                  </div>

                  {!publicKey && (
                    <div className="rei-surface-2 flex flex-col items-center gap-2 p-4">
                      <p className="text-xs text-cream/60">Connect your wallet to continue</p>
                      <WalletMultiButton className="!bg-[#f0ede8] !text-[#0a0a0a] hover:!opacity-80 !rounded-[28px] !font-mono !text-xs" />
                    </div>
                  )}

                  <button
                    onClick={generatePayment}
                    disabled={!canSubmit || isGenerating}
                    className="btn-manga btn-manga-primary w-full"
                    style={{ borderRadius: '28px', padding: '14px 22px', opacity: canSubmit && !isGenerating ? 1 : 0.4 }}
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Generating...</span>
                    ) : (
                      `Pay $${USD_AMOUNT.toLocaleString()} & Launch Campaign`
                    )}
                  </button>
                  {!canSubmit && publicKey && (
                    <p className="text-[11px] text-cream/40 text-center">Fill all required fields (*) to continue</p>
                  )}
                </div>
              </>
            )}

            {paymentData && showPaymentMethod && !isProcessing && (
              <PaymentMethodSelector
                onMethodSelect={handleMethodSelect}
                amount={paymentData.amount}
                solAmount={paymentData.solAmount}
              />
            )}

            {paymentData && selectedMethod === 'solana-pay' && !isProcessing && (
              <SolanaPayQR
                qrCodeUrl={paymentData.qrCodeUrl}
                reference={paymentData.reference}
                paymentUrl={paymentData.paymentUrl}
                amount={paymentData.amount}
                recipient={paymentData.recipient}
                walletAddress={publicKey?.toString() || ''}
                onPaymentComplete={handlePaymentComplete}
              />
            )}

            {paymentData && selectedMethod === 'x402' && !isProcessing && (
              <X402Payment
                amount={paymentData.amount}
                memo={`Rocket Reach: ${projectName}`}
                onSuccess={handlePaymentComplete}
                onCancel={handleCancelPayment}
              />
            )}

            {isProcessing && (
              <div className="text-center space-y-4 py-8">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                <div className="text-cream font-light">Rei AI is reading your screenshot...</div>
                <div className="text-xs text-cream/60">Extracting title, description, prizes, roles & skills</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
