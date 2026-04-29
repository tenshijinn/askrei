import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageSquare, Zap, Database, Upload, ArrowDown, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

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

  const startSubscription = async () => {
    if (!isValid) return;
    setIsUploading(true);
    try {
      let screenshotUrl: string | null = null;

      if (screenshot) {
        const ext = screenshot.name.split(".").pop() || "png";
        const path = `unlimited-posts/${email.replace(/[^a-zA-Z0-9]/g, "_")}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("rei-contributor-files")
          .upload(path, screenshot, { contentType: screenshot.type, upsert: false });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

        const { data: signed, error: signErr } = await supabase.storage
          .from("rei-contributor-files")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr || !signed?.signedUrl) throw new Error("Could not generate image URL");
        screenshotUrl = signed.signedUrl;
      }

      setCheckoutMeta({
        customerEmail: email,
        interval,
        metadata: {
          product_id: "unlimited_posts",
          project_name: projectName,
          project_link: projectLink,
          billing_interval: interval,
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
            <h2 className="text-xl text-cream text-center mb-10 font-light">How It Works</h2>
            <div className="flex flex-col items-center gap-1">
              <FlowBox label="Link + Screenshot" />
              <ArrowDown className="h-5 w-5 text-blue-400/70 my-1" />
              <FlowBox label="Rei Database" icon={<Database className="h-4 w-4 text-cream/60" />} />
              <ArrowDown className="h-5 w-5 text-blue-400/70 my-1" />
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <FlowBox label="Rei Chatbot" icon={<MessageSquare className="h-5 w-5 text-cream/70" />} small />
                <FlowBox label="Rei AI Agent" icon={<Zap className="h-5 w-5 text-cream/70" />} small />
              </div>
            </div>
            <div className="mt-10 space-y-3 text-xs text-cream/60 leading-relaxed">
              <p>• Drop a link to your active campaign (Galxe, Zealy, QuestN, TaskOn, Layer3, custom).</p>
              <p>• Rei keeps your campaign in sync automatically for the duration of your subscription.</p>
              <p>• Every new task is auto-indexed and surfaced to skill-matched contributors via AskRei + Agent Rei.</p>
              <p>• Subscription renews monthly or yearly via Stripe. Cancel anytime — sync stops at period end.</p>
            </div>
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
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function FlowBox({
  label,
  icon,
  small,
}: {
  label: string;
  icon?: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div
      className={`w-full ${small ? "" : "max-w-md"} rounded-xl border border-white/15 bg-[#141414] flex flex-col items-center justify-center text-cream ${
        small ? "py-6 gap-2" : "py-5"
      }`}
    >
      {icon}
      <span className={small ? "text-sm" : "text-base"}>{label}</span>
    </div>
  );
}
