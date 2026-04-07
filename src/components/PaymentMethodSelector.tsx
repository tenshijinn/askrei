import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Zap } from "lucide-react";

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: 'solana-pay' | 'x402') => void;
  amount?: number;
  solAmount?: number;
}

export const PaymentMethodSelector = ({ onMethodSelect, amount, solAmount }: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Choose Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          {amount && solAmount ? `Amount: $${amount} USD (~${solAmount.toFixed(4)} SOL)` : amount ? `Amount: $${amount} USD` : "Select how you'd like to pay"}
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50" onClick={() => onMethodSelect('solana-pay')}>
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}><QrCode className="h-6 w-6 text-white" /></div>
            <div><h4 className="font-semibold">Solana Pay</h4><p className="text-xs text-muted-foreground mt-1">Scan QR code with any Solana wallet</p></div>
            <Button className="w-full" variant="outline" size="sm">Use Solana Pay</Button>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50" onClick={() => onMethodSelect('x402')}>
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}><Zap className="h-6 w-6 text-white" /></div>
            <div><h4 className="font-semibold">x402 Protocol</h4><p className="text-xs text-muted-foreground mt-1">Fast micropayments with connected wallet</p></div>
            <Button className="w-full" variant="outline" size="sm">Use x402</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};