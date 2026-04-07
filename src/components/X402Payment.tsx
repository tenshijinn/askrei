import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface X402PaymentProps {
  amount: number;
  memo: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
}

export const X402Payment = ({ amount, memo, onSuccess, onCancel }: X402PaymentProps) => {
  const { publicKey, signTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'creating' | 'signing' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [solAmount, setSolAmount] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);

  const handlePayment = async () => {
    if (!publicKey || !signTransaction) { toast.error('Please connect your wallet first'); return; }
    setIsProcessing(true); setPaymentStatus('creating');
    try {
      const { data: paymentData, error: createError } = await supabase.functions.invoke('x402-create-payment', { body: { amount, memo, payerPublicKey: publicKey.toString() } });
      if (createError) throw createError;
      if (!paymentData?.transaction) throw new Error('Failed to create payment transaction');
      setSolAmount(paymentData.solAmount); setSolPrice(paymentData.solPrice);
      setPaymentStatus('signing');
      const transactionBuffer = Uint8Array.from(atob(paymentData.transaction), c => c.charCodeAt(0));
      const { Transaction } = await import('@solana/web3.js');
      const transaction = Transaction.from(transactionBuffer);
      const signedTransaction = await signTransaction(transaction);
      const signedTransactionBase64 = signedTransaction.serialize().toString('base64');
      setPaymentStatus('verifying');
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('x402-verify-payment', { body: { signedTransaction: signedTransactionBase64, reference: paymentData.reference } });
      if (verifyError) throw verifyError;
      if (!verifyData?.success) throw new Error(verifyData?.error || 'Payment verification failed');
      setPaymentStatus('success'); toast.success('Payment completed successfully!');
      setTimeout(() => { onSuccess(paymentData.reference); }, 1000);
    } catch (error: any) { setPaymentStatus('error'); setErrorMessage(error.message || 'Payment failed'); toast.error(error.message || 'Payment failed'); }
    finally { setIsProcessing(false); }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success': return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case 'error': return <XCircle className="h-12 w-12 text-red-500" />;
      default: return <Zap className="h-12 w-12 text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'creating': return 'Creating payment request...';
      case 'signing': return 'Please sign the transaction in your wallet...';
      case 'verifying': return 'Verifying payment...';
      case 'success': return 'Payment successful!';
      case 'error': return errorMessage || 'Payment failed';
      default: return 'Ready to pay';
    }
  };

  return (
    <Card className="p-6 space-y-6">
      {!publicKey ? (
        <div className="text-center space-y-4">
          <div className="flex justify-center"><XCircle className="h-12 w-12 text-yellow-500" /></div>
          <div><h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3><p className="text-sm text-muted-foreground">Please connect your wallet to proceed with x402 payment</p></div>
          <Button onClick={onCancel} variant="outline" className="w-full">Go Back</Button>
        </div>
      ) : (
        <>
          <div className="text-center space-y-4">
            <div className="flex justify-center">{isProcessing ? <Loader2 className="h-12 w-12 text-primary animate-spin" /> : getStatusIcon()}</div>
            <div>
              <h3 className="text-lg font-semibold mb-2">x402 Payment</h3>
              <p className="text-sm text-muted-foreground mb-4">{getStatusText()}</p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount:</span><span className="font-semibold">${amount} USD</span></div>
                {solAmount && solPrice && <div className="flex justify-between text-sm"><span className="text-muted-foreground">SOL Amount:</span><span className="font-mono text-xs">{solAmount.toFixed(6)} SOL (${solPrice.toFixed(2)}/SOL)</span></div>}
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Method:</span><span className="font-semibold">x402 Protocol</span></div>
                {memo && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Memo:</span><span className="font-mono text-xs">{memo.slice(0, 20)}...</span></div>}
              </div>
            </div>
            {paymentStatus === 'error' && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{errorMessage}</div>}
          </div>
          <div className="flex gap-3">
            <Button onClick={onCancel} variant="outline" className="flex-1" disabled={isProcessing}>Cancel</Button>
            <Button onClick={handlePayment} className="flex-1" disabled={isProcessing || paymentStatus === 'success'}>
              {isProcessing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing</>) : paymentStatus === 'success' ? 'Completed' : 'Pay with x402'}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};