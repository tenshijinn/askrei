import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useMemo } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  priceId: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ priceId, customerEmail, metadata, returnUrl }: Props) {
  const checkoutOptions = useMemo(
    () => ({
      fetchClientSecret: async () => {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            priceId,
            customerEmail,
            metadata,
            returnUrl: returnUrl || `${window.location.origin}/unlimited-posts/return?session_id={CHECKOUT_SESSION_ID}`,
            environment: getStripeEnvironment(),
          },
        });
        if (error || !data?.clientSecret) {
          throw new Error(error?.message || data?.error || "Failed to create checkout session");
        }
        return data.clientSecret as string;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [priceId, customerEmail, JSON.stringify(metadata || {}), returnUrl]
  );

  return (
    <div id="checkout" className="rounded-xl overflow-hidden">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={checkoutOptions}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
