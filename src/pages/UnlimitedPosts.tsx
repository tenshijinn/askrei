import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, Check, Settings } from "lucide-react";
import flowImage from "@/assets/unlimited-posts-flow.png.asset.json";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getStripeEnvironment } from "@/lib/stripe";

type Interval = "monthly" | "yearly";
const PRICE_IDS: Record<Interval, string> = {
  monthly: "unlimited_posts_monthly",
  yearly: "unlimited_posts_yearly",
};
const PRICE_COPY: Record<Interval, { amount: string; period: string; perDay: string; badgeSuffix: string; saveNote?: string }> = {
  monthly: { amount: "$99", period: "p/m", perDay: "Just $3.30 per day", badgeSuffix: "MONTHLY", },
  yearly:  { amount: "$999", period: "p/y", perDay: "Just $2.73 per day", badgeSuffix: "YEARLY", saveNote: "Save 15.9% vs monthly" },
};

export default function UnlimitedPosts() {
  const [projectName, setProjectName] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [manageEmail, setManageEmail] = useState("");
  const [manageLoading, setManageLoading] = useState(false);
  const [interval, setInterval] = useState<Interval>(() => {
    if (typeof window === "undefined") return "monthly";
    return new URLSearchParams(window.location.search).get("interval") === "yearly" ? "yearly" : "monthly";
  });
  const [checkoutMeta, setCheckoutMeta] = useState<{
    customerEmail: string;
    metadata: Record<string, string>;
    interval: Interval;
  } | null>(null);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const isValid =
    projectName.trim().length > 0 &&
    projectLink.trim().length > 0 &&
    /^https?:\/\/.+/.test(projectLink) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const generateShortCode = (len = 8) => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, (n) => alphabet[n % alphabet.length]).join("");
  };

  const startSubscription = async () => {
    if (!isValid) return;
    setIsUploading(true);
    try {
      let screenshotUrl: string | null = null;

      if (screenshot) {
        const form = new FormData();
        form.append('file', screenshot, screenshot.name);
        form.append('kind', 'campaign-screenshot');
        form.append('owner_key', email);
        const { data: upData, error: upErr } = await supabase.functions.invoke('upload-contributor-file', { body: form });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
        if (!upData?.signedUrl) throw new Error(upData?.error || 'Could not generate image URL');
        screenshotUrl = upData.signedUrl;
      }

      // Capture buyer identity so the promotion can be linked to their Rei account.
      let xUserId: string | undefined;
      let walletAddress: string | undefined;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const claims = session?.user?.user_metadata as Record<string, unknown> | undefined;
        if (claims) {
          if (typeof claims.x_user_id === "string") xUserId = claims.x_user_id;
          if (typeof claims.wallet_address === "string") walletAddress = claims.wallet_address;
        }
        if (xUserId && !walletAddress) {
          const { data: reg } = await supabase
            .from("rei_registry")
            .select("wallet_address")
            .eq("x_user_id", xUserId)
            .maybeSingle();
          if (reg?.wallet_address) walletAddress = reg.wallet_address;
        }
      } catch {
        // identity is optional; continue without it
      }

      const shortCode = generateShortCode();

      setCheckoutMeta({
        customerEmail: email,
        interval,
        metadata: {
          product_id: "unlimited_posts",
          project_name: projectName,
          project_link: projectLink,
          billing_interval: interval,
          short_code: shortCode,
          ...(xUserId ? { x_user_id: xUserId } : {}),
          ...(walletAddress ? { wallet_address: walletAddress } : {}),
          ...(screenshotUrl ? { screenshot_url: screenshotUrl } : {}),
          customer_email: email,
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to prepare checkout");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream font-mono">
      <PaymentTestModeBanner />

      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-cream/70 hover:text-primary transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-10 lg:py-14">
        {/* Hero */}
        <div className="max-w-6xl mx-auto mb-10">
          <h1 className="text-2xl md:text-4xl font-light text-primary flex items-center gap-3">
            <span className="text-cream/40">◉</span>
            Automated Unlimited Task Promotion Package
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* How it works */}
          <div className="rei-surface p-6 lg:p-10">
            <h2 className="text-xl text-cream text-center mb-6 font-light">How It Works</h2>
            <div className="flex justify-center">
              <img
                src={flowImage.url}
                alt="Unlimited Posts flow: Submit bounty URL, Rei database syncs, then matches to Rei Chatbot and Rei AI Agent"
                className="max-h-[420px] w-auto object-contain"
              />
            </div>
            <ol className="mt-8 space-y-2 text-xs text-cream/60 leading-relaxed list-decimal list-inside">
              <li>Drop a link to your active campaign.</li>
              <li>Rei keeps it auto-synced for your whole subscription.</li>
              <li>New tasks surface to matched contributors via AskRei + Agent Rei.</li>
              <li>Renews monthly or yearly via Stripe — cancel anytime.</li>
            </ol>
          </div>


          {/* Form / checkout */}
          <div className="rei-surface p-6 lg:p-8">
            {!checkoutMeta && (
              <div className="space-y-5">
                <div>
                  <div className="rei-section-label">Project name *</div>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter your project name"
                    maxLength={100}
                    className="rei-field"
                  />
                </div>
                <div>
                  <div className="rei-section-label">Campaign link *</div>
                  <input
                    value={projectLink}
                    onChange={(e) => setProjectLink(e.target.value)}
                    placeholder="https://your-campaign-url.com"
                    type="url"
                    className="rei-field"
                  />
                  <p className="mt-1 text-[10px] text-cream/40">
                    Public URL only (Zealy / TaskOn / QuestN / Galxe / Layer3 / custom). No login walls.
                  </p>
                </div>
                <div>
                  <div className="rei-section-label">Email *</div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourproject.com"
                    type="email"
                    className="rei-field"
                  />
                </div>
                <div>
                  <div className="rei-section-label">Campaign image (optional)</div>
                  <label className="block">
                    <div className="rei-surface-2 border-dashed border border-white/15 hover:border-primary/40 transition-colors rounded-xl p-5 cursor-pointer text-center">
                      {screenshotPreview ? (
                        <div className="space-y-3">
                          <img src={screenshotPreview} alt="preview" className="max-h-32 mx-auto rounded border border-white/10" />
                          <div className="text-xs text-cream/60">{screenshot?.name} — click to change</div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-5 w-5 text-cream/40 mx-auto" />
                          <div className="text-xs text-cream/60">Optional — helps us match your project's branding (PNG/JPG, max 10MB)</div>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                  </label>
                </div>

                <div className="pt-3 border-t border-white/10">
                  {/* Billing interval toggle */}
                  <div className="rei-section-label">Billing</div>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-full border border-white/10 bg-[#0f0f0f] mb-4">
                    {(["monthly", "yearly"] as Interval[]).map((opt) => {
                      const active = interval === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setInterval(opt)}
                          className={`relative py-2 rounded-full text-xs uppercase tracking-wider transition-all ${
                            active
                              ? "bg-primary text-[#0a0a0a] font-medium"
                              : "text-cream/60 hover:text-cream"
                          }`}
                        >
                          {opt === "monthly" ? "Monthly" : "Yearly"}
                          {opt === "yearly" && (
                            <span
                              className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
                                active ? "bg-[#0a0a0a]/20 text-[#0a0a0a]" : "bg-primary/20 text-primary"
                              }`}
                            >
                              -15.9%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-light text-cream">Payment:</span>
                    <span className="text-2xl font-light text-primary">
                      {PRICE_COPY[interval].amount} {PRICE_COPY[interval].period}
                    </span>
                  </div>
                  <div className="mb-3 text-[11px] text-cream/60">
                    {PRICE_COPY[interval].perDay}
                    {PRICE_COPY[interval].saveNote && (
                      <span className="text-primary"> · {PRICE_COPY[interval].saveNote}</span>
                    )}
                  </div>
                  <div className="rei-surface-2 p-4 text-center mb-4">
                    <div className="text-xl font-light text-cream mb-1">Stripe</div>
                    <div className="text-[10px] text-cream/50 tracking-wider">
                      {PRICE_COPY[interval].badgeSuffix} SUBSCRIPTION
                    </div>
                  </div>
                  <button
                    onClick={startSubscription}
                    disabled={!isValid || isUploading}
                    className="btn-manga btn-manga-primary w-full"
                    style={{ borderRadius: "28px", padding: "14px 22px", opacity: isValid && !isUploading ? 1 : 0.4 }}
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Preparing...
                      </span>
                    ) : (
                      "START SUBSCRIPTION"
                    )}
                  </button>
                  {!isValid && (
                    <p className="mt-2 text-[10px] text-cream/40 text-center">
                      Fill all required fields with a valid URL & email to continue
                    </p>
                  )}
                </div>
              </div>
            )}

            {checkoutMeta && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm text-cream font-light">Complete payment</h3>
                  <button
                    onClick={() => setCheckoutMeta(null)}
                    className="text-[10px] text-cream/50 hover:text-primary"
                  >
                    ← edit details
                  </button>
                </div>
                <div className="rei-surface-2 p-3 text-[11px] space-y-1">
                  <div className="flex items-center gap-1 text-primary"><Check className="h-3 w-3" /> Campaign details captured</div>
                  <div className="text-cream/60">{projectName} · {email}</div>
                </div>
                <StripeEmbeddedCheckout
                  priceId={PRICE_IDS[checkoutMeta.interval]}
                  customerEmail={checkoutMeta.customerEmail}
                  metadata={checkoutMeta.metadata}
                  onAlreadySubscribed={() => {
                    toast.info("You already have an active subscription. Opening the management portal...");
                    setManageEmail(checkoutMeta.customerEmail);
                    setCheckoutMeta(null);
                    openManagePortal(checkoutMeta.customerEmail);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Manage existing subscription */}
        <div className="max-w-6xl mx-auto mt-10">
          <div className="rei-surface p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="text-sm text-cream font-light">Manage an existing subscription</h3>
            </div>
            <p className="text-[11px] text-cream/50 mb-4">
              Enter the email you subscribed with to open the secure customer portal — update payment method, change plan, or cancel.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={manageEmail}
                onChange={(e) => setManageEmail(e.target.value)}
                placeholder="you@yourproject.com"
                type="email"
                className="rei-field flex-1"
              />
              <button
                onClick={() => openManagePortal(manageEmail)}
                disabled={manageLoading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manageEmail)}
                className="btn-manga px-5 py-3 rounded-full text-xs uppercase tracking-wider disabled:opacity-40"
              >
                {manageLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Opening...</span>
                ) : (
                  "Open portal"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  async function openManagePortal(targetEmail: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      toast.error("Enter a valid email");
      return;
    }
    setManageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-customer-portal", {
        body: {
          email: targetEmail,
          returnUrl: window.location.href,
          environment: getStripeEnvironment(),
        },
      });
      if (error || !data?.url) {
        throw new Error(data?.error || error?.message || "No subscription found for that email.");
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open portal");
    } finally {
      setManageLoading(false);
    }
  }
}

