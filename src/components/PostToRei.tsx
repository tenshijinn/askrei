import { useState } from 'react';
import { SolanaPayQR } from '@/components/SolanaPayQR';
import { X402Payment } from '@/components/X402Payment';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

const ROLE_OPTIONS = [
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'marketer', label: 'Marketer' },
  { value: 'community', label: 'Community' },
  { value: 'content', label: 'Content' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'other', label: 'Other' },
];

const OPPORTUNITY_TYPES = [
  { value: 'job', label: 'Job', description: 'Full-time or part-time position', table: 'jobs' },
  { value: 'contract', label: 'Contract', description: 'Fixed-term freelance work', table: 'jobs' },
  { value: 'task', label: 'Task', description: 'One-time deliverable', table: 'tasks' },
  { value: 'bounty', label: 'Bounty', description: 'Open/competitive task', table: 'tasks' },
  { value: 'gig', label: 'Gig', description: 'Short-term work', table: 'tasks' },
  { value: 'quest', label: 'Quest', description: 'Gamified campaign', table: 'tasks' },
];

type OpportunityType = 'job' | 'contract' | 'task' | 'bounty' | 'gig' | 'quest';
type PaymentMethod = 'solana-pay' | 'x402' | null;

interface PaymentData {
  qrCodeUrl: string;
  reference: string;
  paymentUrl: string;
  amount: number;
  solAmount: number;
  recipient: string;
}

export const PostToRei = () => {
  const { publicKey } = useWallet();
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('job');
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [compensation, setCompensation] = useState('');
  const [link, setLink] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const generatePayment = async () => {
    if (!publicKey) { toast.error('Please connect your wallet first'); return; }
    setIsGeneratingPayment(true);
    try {
      const solPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const solPriceData = await solPriceResponse.json();
      const solPrice = solPriceData.solana.usd;
      const usdAmount = 5;
      const solAmount = usdAmount / solPrice;
      const { Keypair } = await import('@solana/web3.js');
      const keypair = Keypair.generate();
      const reference = keypair.publicKey.toString();
      const recipient = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';
      const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === opportunityType);
      const label = `${typeConfig?.label || 'Opportunity'} Posting`;
      const message = `Post ${opportunityType} to Rei Portal`;
      const paymentUrl = `solana:${recipient}?amount=${solAmount.toFixed(9)}&reference=${reference}&label=${encodeURIComponent(label)}&message=${encodeURIComponent(message)}`;
      const qrCodeUrl = await QRCode.toDataURL(paymentUrl, { width: 400, margin: 2, color: { dark: '#0a0a0a', light: '#e8c4b8' } });
      setPaymentData({ qrCodeUrl, reference, paymentUrl, amount: usdAmount, solAmount, recipient });
      setShowPaymentMethod(true);
    } catch (error) { console.error('Payment generation error:', error); toast.error('Failed to generate payment'); }
    finally { setIsGeneratingPayment(false); }
  };

  const handlePaymentMethodSelect = (method: 'solana-pay' | 'x402') => { setSelectedPaymentMethod(method); setShowPaymentMethod(false); };

  const handlePaymentComplete = async (reference: string) => {
    setIsSubmitting(true);
    try {
      const { data: paymentRef, error: refError } = await supabase.from('payment_references').select('*').eq('reference', reference).maybeSingle();
      if (refError) throw new Error('Payment reference not found');
      let verifyData;
      if (paymentRef && paymentRef.status === 'completed') {
        verifyData = { verified: true, signature: paymentRef.tx_signature, amount: Number(paymentRef.amount), tokenMint: 'So11111111111111111111111111111111111111112', tokenAmount: Number(paymentRef.amount) };
      } else {
        const { data, error: verifyError } = await supabase.functions.invoke('verify-solana-pay', { body: { reference, walletAddress: publicKey?.toString() } });
        if (verifyError || !data?.verified) throw new Error(data?.error || 'Payment verification failed');
        verifyData = data;
      }
      const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === opportunityType);
      const targetTable = typeConfig?.table as 'jobs' | 'tasks' || 'jobs';
      const { data: existingPost } = await supabase.from(targetTable).select('id').eq('solana_pay_reference', reference).maybeSingle();
      if (existingPost) throw new Error('Payment already used for another posting');
      if (targetTable === 'jobs') {
        const { error: insertError } = await supabase.from('jobs').insert({ title, company_name: companyName, description, requirements: requirements || '', role_tags: selectedRoles, compensation: compensation || '', deadline: deadline || null, link: link || null, employer_wallet: publicKey?.toString(), payment_tx_signature: verifyData.signature, solana_pay_reference: reference, source: 'manual', opportunity_type: opportunityType });
        if (insertError) throw insertError;
      } else {
        if (!link) throw new Error('Link is required for tasks');
        const { error: insertError } = await supabase.from('tasks').insert({ title, company_name: companyName, description, link, role_tags: selectedRoles, compensation: compensation || '', end_date: deadline || null, employer_wallet: publicKey?.toString(), payment_tx_signature: verifyData.signature, solana_pay_reference: reference, source: 'manual', opportunity_type: opportunityType });
        if (insertError) throw insertError;
      }
      await supabase.functions.invoke('award-payment-points', { body: { walletAddress: publicKey?.toString(), reference, amount: verifyData.amount, tokenMint: verifyData.tokenMint, tokenAmount: verifyData.tokenAmount } });
      const typeLabel = OPPORTUNITY_TYPES.find(t => t.value === opportunityType)?.label || 'Opportunity';
      toast.success(`${typeLabel} posted successfully! 10 points awarded.`);
      setTitle(''); setCompanyName(''); setDescription(''); setRequirements(''); setCompensation(''); setLink(''); setDeadline(''); setSelectedRoles([]); setPaymentData(null); setSelectedPaymentMethod(null);
    } catch (error) { console.error('Submission error:', error); toast.error(error instanceof Error ? error.message : 'Failed to submit post'); }
    finally { setIsSubmitting(false); }
  };

  const handleCancelPayment = () => { setSelectedPaymentMethod(null); setShowPaymentMethod(true); };

  const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === opportunityType);
  const isTasksTable = typeConfig?.table === 'tasks';
  const canGeneratePayment = title && companyName && description && selectedRoles.length > 0 && (!isTasksTable || link);

  return (
    <div className="rei-surface" style={{ marginTop: '8px' }}>
      <div className="mb-6">
        <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#f0ede8', marginBottom: '4px' }}>
          Promote Your Project's <span style={{ color: 'hsl(var(--primary))' }}>| Tasks | Jobs | Contracts | Bounty | Gigs | Quests</span>
        </h2>
        <p style={{ fontSize: '13px', color: '#5c5a57', lineHeight: '1.65' }}>
          Promote anything from crypto tasks to jobs for $5. Community members with the right skills will be matched to your opportunities by chatting with Rei.
        </p>
      </div>
      <div className="space-y-5">
        <div><div className="rei-section-label">Type *</div><div className="flex flex-wrap gap-2">{OPPORTUNITY_TYPES.map((type) => (<button key={type.value} onClick={() => setOpportunityType(type.value as OpportunityType)} className="rei-chip" style={{ background: opportunityType === type.value ? 'hsla(18,52%,82%,0.12)' : '#1e1e1e', borderColor: opportunityType === type.value ? 'hsla(18,52%,82%,0.22)' : 'hsla(0,0%,100%,0.18)', color: opportunityType === type.value ? '#e8c4b8' : '#a09e9a' }}>{opportunityType === type.value && <span className="rei-chip-dot" />}{type.label}</button>))}</div></div>
        <div><div className="rei-section-label">Title *</div><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={!isTasksTable ? 'e.g. Senior Solidity Developer' : 'e.g. Smart Contract Audit'} className="rei-field" maxLength={100} /></div>
        <div><div className="rei-section-label">Company/Project *</div><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Solana Labs" className="rei-field" maxLength={100} /></div>
        <div><div className="rei-section-label">Description *</div><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={!isTasksTable ? 'Describe the role...' : 'Describe the task...'} className="rei-field" style={{ minHeight: '100px', resize: 'vertical' }} maxLength={500} /><p style={{ fontSize: '11px', color: '#3d3b38', marginTop: '4px' }}>{description.length}/500</p></div>
        {!isTasksTable && <div><div className="rei-section-label">Requirements</div><textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="List the required skills..." className="rei-field" style={{ minHeight: '80px', resize: 'vertical' }} maxLength={500} /></div>}
        <div><div className="rei-section-label">Link {isTasksTable && '*'}</div><input value={link} onChange={(e) => setLink(e.target.value)} placeholder={!isTasksTable ? 'Application URL (optional)' : 'Details URL (required)'} className="rei-field" type="url" /></div>
        <div><div className="rei-section-label">{!isTasksTable ? 'Compensation' : 'Reward'}</div><input value={compensation} onChange={(e) => setCompensation(e.target.value)} placeholder={!isTasksTable ? 'e.g. $80k-$120k' : 'e.g. 500 USDC'} className="rei-field" /></div>
        <div><div className="rei-section-label">Deadline</div><input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" className="rei-field" /></div>
        <div><div className="rei-section-label">Role Tags *</div><div className="flex flex-wrap gap-2">{ROLE_OPTIONS.map((role) => (<button key={role.value} onClick={() => toggleRole(role.value)} className="rei-chip" style={{ background: selectedRoles.includes(role.value) ? 'hsla(18,52%,82%,0.12)' : '#1e1e1e', borderColor: selectedRoles.includes(role.value) ? 'hsla(18,52%,82%,0.22)' : 'hsla(0,0%,100%,0.18)', color: selectedRoles.includes(role.value) ? '#e8c4b8' : '#a09e9a' }}>{selectedRoles.includes(role.value) && <span className="rei-chip-dot" />}{role.label}</button>))}</div></div>
        {!paymentData && (
          <div style={{ paddingTop: '16px', borderTop: '0.5px solid hsla(0,0%,100%,0.08)' }}>
            {!publicKey && <div className="rei-surface-2 flex flex-col items-center gap-2 mb-3" style={{ padding: '14px' }}><p style={{ fontSize: '12px', color: '#5c5a57' }}>Connect your wallet to post</p><WalletMultiButton className="!bg-[#f0ede8] !text-[#0a0a0a] hover:!opacity-80 !rounded-[28px] !font-sans !text-sm" /></div>}
            <button onClick={generatePayment} disabled={!canGeneratePayment || !publicKey || isGeneratingPayment} className="btn-manga btn-manga-primary w-full" style={{ borderRadius: '28px', padding: '11px 22px', cursor: canGeneratePayment && publicKey ? 'pointer' : 'not-allowed', opacity: canGeneratePayment && publicKey && !isGeneratingPayment ? 1 : 0.4 }}>
              {isGeneratingPayment ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Generating...</span> : 'Generate Payment ($5 USD)'}
            </button>
            {!canGeneratePayment && publicKey && <p style={{ fontSize: '11px', color: '#3d3b38', textAlign: 'center', marginTop: '8px' }}>Fill all required fields (*) to continue</p>}
          </div>
        )}
        {paymentData && showPaymentMethod && (
          <div className="space-y-4">
            <div className="flex justify-center"><WalletMultiButton className="!bg-[#f0ede8] !text-[#0a0a0a] hover:!opacity-80 !rounded-[28px] !font-sans !text-sm" /></div>
            <PaymentMethodSelector onMethodSelect={handlePaymentMethodSelect} amount={paymentData.amount} solAmount={paymentData.solAmount} />
          </div>
        )}
        {paymentData && selectedPaymentMethod === 'solana-pay' && <SolanaPayQR qrCodeUrl={paymentData.qrCodeUrl} reference={paymentData.reference} paymentUrl={paymentData.paymentUrl} amount={paymentData.amount} recipient={paymentData.recipient} walletAddress={publicKey?.toString() || ''} onPaymentComplete={handlePaymentComplete} />}
        {paymentData && selectedPaymentMethod === 'x402' && <X402Payment amount={paymentData.amount} memo={`Post ${opportunityType} to Rei`} onSuccess={handlePaymentComplete} onCancel={handleCancelPayment} />}
      </div>
    </div>
  );
};