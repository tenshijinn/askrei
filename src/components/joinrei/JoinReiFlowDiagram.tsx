import { motion } from "framer-motion";
import { Send, Target, MessageSquare, CheckCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import reiLogo from "@/assets/rei-logo-transparent.png";

const PhoneMockup = ({
  children,
  active,
  delay = 0,
}: {
  children: React.ReactNode;
  active: boolean;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative"
    >
      <div
        className="relative rounded-[32px] p-2"
        style={{
          width: "180px",
          height: "360px",
          border: active ? "1.5px solid #e8c4b8" : "1.5px solid rgba(255,255,255,0.15)",
          background: "transparent",
          transition: "border-color 0.3s",
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-2xl z-10"
          style={{ border: "1px solid rgba(255,255,255,0.15)", borderTop: "none" }}
        />
        <div className="relative rounded-[24px] w-full h-full overflow-hidden" style={{ background: "#0a0a0a" }}>
          {children}
        </div>
        {active && (
          <motion.div
            className="absolute inset-0 rounded-[32px] pointer-events-none"
            style={{ boxShadow: "0 0 20px rgba(232, 196, 184, 0.3)" }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
};

export const JoinReiFlowDiagram = () => {
  // Step order: 0=Package, 1=Onboard, 2=CRM, 3=Applicants, 4=Listed, 5=Skillsync, 6=ICP Match
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 7);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Diagram coordinates (within 1300x900 viewBox).
  // Top row (LISTED, SKILLSYNC, ICP MATCH) right-aligned.
  // Bottom row: PACKAGE far left vertically centered on divider; ONBOARD, CRM, APPLICANTS right-aligned matching top row x positions.
  // Phones are 180x360, labels ~20px below.
  // Top row Y: 40 (top) → 400 (bottom of phone)
  // Divider Y: ~470
  // Bottom row Y: 540 (top) → 900 (bottom)
  // Right-aligned columns x-centers: LISTED/ONBOARD=480, SKILLSYNC/CRM=720, ICP/APPLICANTS=960
  // PACKAGE x-center: 130, vertically centered between rows → top at ~290, bottom at ~650 (centered on 470 divider)

  const stepLabels = [
    "PURCHASE PACKAGE",
    "TELEGRAM ONBOARDING",
    "CRM CAMPAIGN MANAGEMENT",
    "APPLICANTS COLLECTED",
    "LISTED ON REI",
    "SKILLSYNC MATCHING",
    "ICP MATCH COMPLETE",
  ];

  return (
    <section
      className="min-h-screen snap-start flex flex-col items-center justify-center text-white py-16 px-4"
      style={{
        background: "#0a0a0a",
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      }}
    >
      {/* Section title + active step label — matches other JoinRei section title sizing */}
      <div className="text-center mb-6 px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-center">
          <span style={{ color: "#FFD700" }}>Rocket Reach</span>
          <span style={{ color: "#e8c4b8" }}> - Reaching Telegram&apos;s 350 million Crypto Users</span>
        </h2>
        <div className="flex justify-center gap-2 mt-6 mb-3">
          {[0, 1, 2, 3, 4, 5, 6].map((step) => (
            <motion.div
              key={step}
              className="h-0.5 rounded-full transition-all"
              style={{
                width: activeStep === step ? "32px" : "4px",
                background: activeStep === step ? "#e8c4b8" : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>
        <div className="text-[10px] md:text-xs" style={{ color: "#6e6b67", letterSpacing: "0.06em" }}>
          {stepLabels[activeStep]}
        </div>
      </div>

      <div className="origin-top scale-[0.4] sm:scale-[0.5] md:scale-[0.65] lg:scale-75 xl:scale-90">
        <div className="relative" style={{ width: "1100px", height: "960px" }}>
          {/* Animated SVG arrows — all hard-angled (terminal style) */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }} viewBox="0 0 1100 960" preserveAspectRatio="none" width="1100" height="960">
            {/* Arrow 1: PACKAGE → ONBOARD (hard L-angle, cream-pink). Package right edge x=220, midline y=455. Onboard top-center x=480, y=540 */}
            <motion.path
              d="M 220 455 L 480 455 L 480 540"
              stroke={activeStep >= 1 ? "#e8c4b8" : "rgba(255,255,255,0.08)"}
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: activeStep >= 1 ? 1 : 0 }}
              transition={{ duration: 0.8 }}
            />
            {activeStep >= 1 && (
              <motion.polygon
                points="480,540 472,528 488,528"
                fill="#e8c4b8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              />
            )}

            {/* Arrow 2: APPLICANTS → LISTED (hard L-angle, blue). Applicants top-center x=960, y=540 → up to y=480 → left to x=480 → up to Listed bottom y=400 */}
            <motion.path
              d="M 960 540 L 960 480 L 480 480 L 480 400"
              stroke={activeStep >= 4 ? "#0088cc" : "rgba(255,255,255,0.08)"}
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: activeStep >= 4 ? 1 : 0 }}
              transition={{ duration: 1 }}
            />
            {activeStep >= 4 && (
              <motion.polygon
                points="480,400 472,412 488,412"
                fill="#0088cc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              />
            )}

            {/* Inline horizontal connectors top row: LISTED → SKILLSYNC → ICP */}
            <motion.line
              x1="570" y1="220" x2="630" y2="220"
              stroke={activeStep >= 5 ? "#e8c4b8" : "rgba(255,255,255,0.08)"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <motion.line
              x1="810" y1="220" x2="870" y2="220"
              stroke={activeStep >= 6 ? "#e8c4b8" : "rgba(255,255,255,0.08)"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Inline horizontal connectors bottom row: ONBOARD → CRM → APPLICANTS */}
            <motion.line
              x1="570" y1="720" x2="630" y2="720"
              stroke={activeStep >= 2 ? "#0088cc" : "rgba(255,255,255,0.08)"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <motion.line
              x1="810" y1="720" x2="870" y2="720"
              stroke={activeStep >= 3 ? "#0088cc" : "rgba(255,255,255,0.08)"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>

          {/* TOP ROW — right-aligned: LISTED, SKILLSYNC, ICP MATCH */}
          {/* LISTED — center x=480, top y=40 */}
          <div className="absolute" style={{ left: "390px", top: "40px", zIndex: 1 }}>
            <div className="flex flex-col items-center gap-2">
              <PhoneMockup active={activeStep === 4} delay={0.3}>
                <div className="flex flex-col h-full p-5" style={{ background: "#111111" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[8px]" style={{ color: "#6e6b67" }}>9:41</div>
                    <div className="text-[8px]" style={{ color: "#e8c4b8", letterSpacing: "0.06em" }}>REI</div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="rounded-2xl p-4 text-center mb-3" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", background: "rgba(232, 196, 184, 0.05)" }}>
                      <img src={reiLogo} alt="Rei" className="w-12 h-12 mx-auto mb-2 object-contain" />
                      <div className="text-xs font-bold mb-1" style={{ color: "#e8c4b8" }}>Live Listing</div>
                      <div className="text-[7px]" style={{ color: "#6e6b67" }}>Now on Rei</div>
                    </div>
                    <div className="text-[7px] mb-1" style={{ color: "#6e6b67" }}>CHANNEL</div>
                    <div className="rounded-lg p-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                      <div className="text-[9px] font-bold leading-tight" style={{ color: "#e8c4b8" }}>Sales Team</div>
                      <div className="text-[7px]" style={{ color: "#6e6b67" }}>Community Outreach</div>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg text-[8px]" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", color: "#e8c4b8", background: "rgba(232, 196, 184, 0.05)", letterSpacing: "0.06em" }}>VIEW LISTING</button>
                </div>
              </PhoneMockup>
              <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>LISTED</div>
            </div>
          </div>

          {/* SKILLSYNC — center x=720, top y=40. Now: Rei chatbot conversation */}
          <div className="absolute" style={{ left: "630px", top: "40px", zIndex: 1 }}>
            <div className="flex flex-col items-center gap-2">
              <PhoneMockup active={activeStep === 5} delay={0.6}>
                <div className="flex flex-col h-full p-4" style={{ background: "#111111" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[8px]" style={{ color: "#6e6b67" }}>9:41</div>
                    <div className="text-[8px]" style={{ color: "#e8c4b8", letterSpacing: "0.06em" }}>REI CHAT</div>
                  </div>
                  <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                    <img src={reiLogo} alt="Rei" className="w-5 h-5 object-contain" />
                    <div>
                      <div className="text-[9px] font-bold" style={{ color: "#e8c4b8" }}>Rei</div>
                      <div className="text-[6px]" style={{ color: "#6e6b67" }}>Online</div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-hidden">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="rounded-lg rounded-tr-sm px-2 py-1.5 max-w-[80%]" style={{ background: "rgba(232, 196, 184, 0.15)", border: "0.5px solid rgba(232, 196, 184, 0.3)" }}>
                        <div className="text-[8px]" style={{ color: "#e8c4b8" }}>Any DeFi bounties open?</div>
                      </div>
                    </div>
                    {/* Rei message */}
                    <div className="flex justify-start">
                      <div className="rounded-lg rounded-tl-sm px-2 py-1.5 max-w-[85%]" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
                        <div className="text-[8px] mb-1" style={{ color: "#e8c4b8" }}>Found a match for you:</div>
                        <div className="text-[7px]" style={{ color: "#6e6b67" }}>DeFi staking bounty on Galxe — 500 USDC</div>
                      </div>
                    </div>
                    {/* Rei suggestion card */}
                    <div className="flex justify-start">
                      <div className="rounded-lg px-2 py-1.5 w-full" style={{ background: "rgba(136, 102, 204, 0.1)", border: "0.5px solid rgba(136, 102, 204, 0.3)" }}>
                        <div className="text-[7px] mb-0.5" style={{ color: "#a78bda" }}>● Galxe</div>
                        <div className="text-[8px] font-bold" style={{ color: "#e8c4b8" }}>DeFi Staking Quest</div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg text-[8px] mt-2" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", color: "#e8c4b8", background: "rgba(232, 196, 184, 0.05)", letterSpacing: "0.06em" }}>VIEW TASK</button>
                </div>
              </PhoneMockup>
              <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>SKILLSYNC</div>
            </div>
          </div>

          {/* ICP MATCH — center x=960, top y=40. Now: Galxe task/bounty page (purple) */}
          <div className="absolute" style={{ left: "870px", top: "40px", zIndex: 1 }}>
            <div className="flex flex-col items-center gap-2">
              <PhoneMockup active={activeStep === 6} delay={0.9}>
                <div className="flex flex-col h-full p-4" style={{ background: "linear-gradient(180deg, #1a1530 0%, #0f0a1f 100%)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[8px]" style={{ color: "#9b8bc4" }}>Close</div>
                    <div className="text-center">
                      <div className="text-[9px] font-bold text-white">Galxe</div>
                      <div className="text-[6px]" style={{ color: "#9b8bc4" }}>Mini App</div>
                    </div>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "rgba(155, 139, 196, 0.2)" }}>
                      <div className="text-[7px]" style={{ color: "#9b8bc4" }}>···</div>
                    </div>
                  </div>
                  <div className="rounded-md py-1.5 px-2 mb-3 text-center" style={{ background: "rgba(155, 139, 196, 0.1)", border: "0.5px solid rgba(155, 139, 196, 0.2)" }}>
                    <div className="text-[7px]" style={{ color: "#a78bda" }}>≋ Galxe • Unlock Web3</div>
                  </div>
                  <div className="rounded-lg p-2 mb-2 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full" style={{ background: "linear-gradient(135deg, #a78bda, #6c4fb8)" }} />
                      <div className="text-[8px] font-bold text-white">49GG</div>
                    </div>
                    <div className="text-[7px]" style={{ color: "#a78bda" }}>My Asset ›</div>
                  </div>
                  <div className="text-[8px] font-bold text-white mb-2">Task 2 Earn</div>
                  <div className="flex-1 space-y-1.5">
                    <div className="rounded-lg p-2 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(155, 139, 196, 0.15)" }}>
                      <div>
                        <div className="text-[8px] font-bold text-white">DeFi Staking</div>
                        <div className="text-[6px]" style={{ color: "#9b8bc4" }}>+500 USDC</div>
                      </div>
                      <div className="px-2 py-0.5 rounded text-[7px] font-bold text-white" style={{ background: "#7c5cd6" }}>Go</div>
                    </div>
                    <div className="rounded-lg p-2 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(155, 139, 196, 0.15)" }}>
                      <div>
                        <div className="text-[8px] font-bold text-white">Join SUI TG</div>
                        <div className="text-[6px]" style={{ color: "#9b8bc4" }}>+100 GG</div>
                      </div>
                      <div className="px-2 py-0.5 rounded text-[7px] font-bold text-white" style={{ background: "#7c5cd6" }}>Go</div>
                    </div>
                    <div className="rounded-lg p-2 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(155, 139, 196, 0.15)" }}>
                      <div>
                        <div className="text-[8px] font-bold text-white">Invite friends</div>
                        <div className="text-[6px]" style={{ color: "#9b8bc4" }}>+Up to 100 GG</div>
                      </div>
                      <div className="px-2 py-0.5 rounded text-[7px] font-bold text-white" style={{ background: "#7c5cd6" }}>Draw</div>
                    </div>
                  </div>
                </div>
              </PhoneMockup>
              <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>ICP MATCH</div>
            </div>
          </div>

          {/* (divider removed) */}

          {/* PACKAGE — left, vertically centered on divider. Center x=130, top y=275 (centers ~455) */}
          <div className="absolute" style={{ left: "40px", top: "275px", zIndex: 1 }}>
            <div className="flex flex-col items-center gap-2">
              <PhoneMockup active={activeStep === 0} delay={0}>
                <div className="flex flex-col h-full p-5" style={{ background: "#111111" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[8px]" style={{ color: "#6e6b67" }}>9:41</div>
                    <div className="text-[8px]" style={{ color: "#e8c4b8", letterSpacing: "0.06em" }}>REI</div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="text-center mb-4">
                      <div className="text-sm font-bold mb-1" style={{ color: "#FFD700", letterSpacing: "0.03em" }}>ROCKET REACH</div>
                      <div className="text-[7px]" style={{ color: "#b8a068", letterSpacing: "0.04em" }}>Premium Package</div>
                    </div>
                    <div className="rounded-xl p-3 mb-3" style={{ border: "0.5px solid rgba(255, 215, 0, 0.3)", background: "rgba(255, 215, 0, 0.05)" }}>
                      <div className="text-[7px] mb-2" style={{ color: "#b8a068" }}>INCLUDES</div>
                      <div className="space-y-1">
                        <div className="text-[8px]" style={{ color: "#FFD700" }}>• ICP Matching</div>
                        <div className="text-[8px]" style={{ color: "#FFD700" }}>• Premium Listing</div>
                        <div className="text-[8px]" style={{ color: "#FFD700" }}>• 350M Reach</div>
                      </div>
                      <div className="pt-2 mt-2" style={{ borderTop: "0.5px solid rgba(255, 215, 0, 0.2)" }}>
                        <div className="text-xl font-bold text-center" style={{ color: "#FFD700" }}>$2,500</div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg text-[8px]" style={{ border: "0.5px solid rgba(255, 215, 0, 0.3)", color: "#FFD700", background: "rgba(255, 215, 0, 0.05)", letterSpacing: "0.06em" }}>PURCHASE</button>
                </div>
              </PhoneMockup>
              <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>PACKAGE</div>
            </div>
          </div>

          {/* BOTTOM ROW — right-aligned: ONBOARD, CRM, APPLICANTS */}
          {/* ONBOARD — center x=480, top y=540 */}
          <div className="absolute" style={{ left: "390px", top: "540px", zIndex: 1 }}>
            <div className="flex flex-col items-center gap-2">
              <PhoneMockup active={activeStep === 1} delay={0.2}>
                <div className="flex flex-col h-full p-5" style={{ background: "#0f0f0f" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[8px] text-white">9:41</div>
                    <Send className="w-3 h-3 text-[#0088cc]" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0088cc 0%, #00a0e9 100%)", boxShadow: "0 4px 12px rgba(0, 136, 204, 0.4)" }}>
                      <Send className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold mb-1 text-white">Welcome!</div>
                    <div className="text-[8px] text-gray-400 mb-4">Join 350M+ users</div>
                    <div className="rounded-xl p-2" style={{ border: "0.5px solid rgba(0, 136, 204, 0.3)", background: "rgba(0, 136, 204, 0.1)" }}>
                      <div className="text-[7px] text-gray-400 mb-1">NEW ACCOUNT</div>
                      <div className="text-xs font-bold text-[#0088cc]">350,000,001</div>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg text-[8px]" style={{ background: "#0088cc", color: "white", letterSpacing: "0.06em" }}>GET STARTED</button>
                </div>
              </PhoneMockup>
              <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>ONBOARD</div>
            </div>
          </div>

          {/* CRM — center x=720, top y=540 */}
          <div className="absolute" style={{ left: "630px", top: "540px", zIndex: 1 }}>
            <div className="flex flex-col items-center gap-2">
              <PhoneMockup active={activeStep === 2} delay={0.5}>
                <div className="flex flex-col h-full p-5" style={{ background: "#111111" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[8px]" style={{ color: "#6e6b67" }}>CRM</div>
                    <Users className="w-3 h-3" style={{ color: "#e8c4b8" }} />
                  </div>
                  <div className="text-xs font-bold mb-3" style={{ color: "#e8c4b8" }}>Campaign<br />Management</div>
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="rounded-lg p-2" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", background: "rgba(232, 196, 184, 0.05)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3 h-3" style={{ color: "#e8c4b8" }} />
                        <div className="text-[9px] font-bold" style={{ color: "#e8c4b8" }}>GameFi Outreach</div>
                      </div>
                      <div className="text-[7px] mb-1" style={{ color: "#6e6b67" }}>15.2K messages sent</div>
                      <div className="flex justify-between text-[7px]">
                        <span style={{ color: "#6e6b67" }}>Open: 68%</span>
                        <span style={{ color: "#e8c4b8" }}>●</span>
                      </div>
                    </div>
                    <div className="rounded-lg p-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-3 h-3" style={{ color: "#6e6b67" }} />
                        <div className="text-[9px] font-bold" style={{ color: "#6e6b67" }}>DeFi Campaign</div>
                      </div>
                      <div className="text-[7px] mb-1" style={{ color: "#4a4845" }}>8.5K messages sent</div>
                      <div className="flex justify-between text-[7px]">
                        <span style={{ color: "#4a4845" }}>Open: 71%</span>
                        <span style={{ color: "#6e6b67" }}>●</span>
                      </div>
                    </div>
                    <div className="rounded-lg p-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                      <div className="text-[7px] mb-1" style={{ color: "#6e6b67" }}>TARGETED SEGMENTS</div>
                      <div className="text-[8px]" style={{ color: "#e8c4b8" }}>847 ICP Matches</div>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg text-[8px]" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", color: "#e8c4b8", background: "rgba(232, 196, 184, 0.05)", letterSpacing: "0.06em" }}>VIEW ANALYTICS</button>
                </div>
              </PhoneMockup>
              <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>CRM (TEAM)</div>
            </div>
          </div>

          {/* APPLICANTS — center x=960, top y=540 */}
          <div className="absolute" style={{ left: "870px", top: "540px", zIndex: 1 }}>
            <div className="flex flex-col items-center gap-2">
              <PhoneMockup active={activeStep === 3} delay={0.8}>
                <div className="flex flex-col h-full p-5" style={{ background: "#111111" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[8px]" style={{ color: "#6e6b67" }}>9:41</div>
                    <div className="text-[8px]" style={{ color: "#e8c4b8", letterSpacing: "0.06em" }}>REI</div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="rounded-2xl p-4 text-center mb-3" style={{ border: "0.5px solid rgba(232, 196, 184, 0.4)", background: "rgba(232, 196, 184, 0.08)" }}>
                      <Target className="w-12 h-12 mx-auto mb-2" style={{ color: "#e8c4b8" }} />
                      <div className="text-sm font-bold mb-1" style={{ color: "#e8c4b8" }}>847 Applicants</div>
                      <div className="text-[8px] mb-3" style={{ color: "#6e6b67" }}>From Telegram<br />Outreach Campaign</div>
                      <div className="rounded-lg p-2 mb-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                        <div className="flex justify-between text-[8px] mb-1">
                          <span style={{ color: "#6e6b67" }}>Qualified</span>
                          <span style={{ color: "#e8c4b8" }}>412</span>
                        </div>
                        <div className="flex justify-between text-[8px]">
                          <span style={{ color: "#6e6b67" }}>Reviewed</span>
                          <span style={{ color: "#e8c4b8" }}>189</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg p-2" style={{ border: "0.5px solid rgba(0, 136, 204, 0.3)", background: "rgba(0, 136, 204, 0.05)" }}>
                      <div className="flex items-center gap-2">
                        <Send className="w-3 h-3 text-[#0088cc]" />
                        <div className="text-[8px]" style={{ color: "#0088cc" }}>Telegram → Rei Flow</div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg text-[8px]" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", color: "#e8c4b8", background: "rgba(232, 196, 184, 0.05)", letterSpacing: "0.06em" }}>VIEW APPLICANTS</button>
                </div>
              </PhoneMockup>
              <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>APPLICANTS</div>
            </div>
          </div>

          {/* (step indicator moved to top of section) */}
        </div>
      </div>
    </section>
  );
};
