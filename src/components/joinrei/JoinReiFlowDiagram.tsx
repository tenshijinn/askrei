import { motion } from "framer-motion";
import { Eye, Send, User, Target, Briefcase, ArrowRight, MessageSquare, CheckCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";

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

const ConnectionLine = ({ active, delay = 0 }: { active: boolean; delay?: number }) => {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-center justify-center"
      style={{ width: "60px" }}
    >
      <div className="relative w-full h-[1px]">
        <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.1)" }} />
        {active && (
          <motion.div
            className="absolute inset-0"
            style={{ background: "#e8c4b8", transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </div>
      <ArrowRight className={`w-3 h-3 ml-1 ${active ? "text-[#e8c4b8]" : "text-white/10"}`} />
    </motion.div>
  );
};

export const JoinReiFlowDiagram = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="min-h-screen snap-start flex items-center justify-center text-white py-16 px-4"
      style={{
        background: "#0a0a0a",
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      }}
    >
      <div className="origin-center scale-[0.45] sm:scale-[0.6] md:scale-75 lg:scale-90 xl:scale-100">
        <div className="w-[1300px] relative">
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ zIndex: 10 }}>
            <motion.path
              d="M 290 402 L 290 480 L 415 480 L 415 610"
              stroke={activeStep >= 1 ? "#FFD700" : "rgba(255,255,255,0.1)"}
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: activeStep >= 1 ? 1 : 0 }}
              transition={{ duration: 1 }}
            />
            {activeStep >= 1 && (
              <motion.polygon
                points="415,618 410,608 420,608"
                fill="#FFD700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />
            )}
            <motion.path
              d="M 1155 608 L 1155 540 L 1220 470 L 1220 400 L 560 400 L 560 378"
              stroke={activeStep === 4 ? "#0088cc" : "rgba(255,255,255,0.1)"}
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: activeStep === 4 ? 1 : 0 }}
              transition={{ duration: 1.2 }}
            />
            {activeStep === 4 && (
              <motion.polygon
                points="560,368 555,378 565,378"
                fill="#0088cc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              />
            )}
          </svg>

          <div className="mb-20 relative" style={{ zIndex: 1 }}>
            <div className="flex items-center justify-center gap-3 flex-wrap md:flex-nowrap">
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

              <ConnectionLine active={activeStep >= 1} delay={0.2} />

              <div className="flex flex-col items-center gap-2">
                <PhoneMockup active={activeStep === 1} delay={0.3}>
                  <div className="flex flex-col h-full p-5" style={{ background: "#111111" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[8px]" style={{ color: "#6e6b67" }}>9:41</div>
                      <div className="text-[8px]" style={{ color: "#e8c4b8", letterSpacing: "0.06em" }}>REI</div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="rounded-2xl p-4 text-center mb-3" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", background: "rgba(232, 196, 184, 0.05)" }}>
                        <Eye className="w-10 h-10 mx-auto mb-2" style={{ color: "#e8c4b8" }} />
                        <div className="text-xs font-bold mb-1" style={{ color: "#e8c4b8" }}>Live Listing</div>
                        <div className="text-[7px]" style={{ color: "#6e6b67" }}>Now on Rei</div>
                      </div>
                      <div className="text-[7px] mb-1" style={{ color: "#6e6b67" }}>CHANNEL</div>
                      <div className="rounded-lg p-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                        <div className="text-[9px] font-bold" style={{ color: "#e8c4b8" }}>Crypto Jobs</div>
                        <div className="text-[7px]" style={{ color: "#6e6b67" }}>1.2M subscribers</div>
                      </div>
                    </div>
                    <button className="w-full py-2 rounded-lg text-[8px]" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", color: "#e8c4b8", background: "rgba(232, 196, 184, 0.05)", letterSpacing: "0.06em" }}>VIEW LISTING</button>
                  </div>
                </PhoneMockup>
                <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>LISTED</div>
              </div>

              <ConnectionLine active={activeStep >= 2} delay={0.4} />

              <div className="flex flex-col items-center gap-2">
                <PhoneMockup active={activeStep === 2} delay={0.6}>
                  <div className="flex flex-col h-full p-5" style={{ background: "#111111" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[8px]" style={{ color: "#6e6b67" }}>9:41</div>
                      <div className="text-[8px]" style={{ color: "#e8c4b8", letterSpacing: "0.06em" }}>MATCHING</div>
                    </div>
                    <div className="text-xs font-bold mb-3" style={{ color: "#e8c4b8" }}>Who are you<br />looking for?</div>
                    <div className="flex-1 space-y-2">
                      <div className="rounded-xl p-2" style={{ border: "0.5px solid rgba(232, 196, 184, 0.4)", background: "rgba(232, 196, 184, 0.08)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="w-3 h-3" style={{ color: "#e8c4b8" }} />
                          <div className="text-[9px] font-bold" style={{ color: "#e8c4b8" }}>Senior Dev</div>
                        </div>
                        <div className="text-[7px]" style={{ color: "#6e6b67" }}>Solana • Rust</div>
                      </div>
                      <div className="rounded-xl p-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="w-3 h-3" style={{ color: "#6e6b67" }} />
                          <div className="text-[9px] font-bold" style={{ color: "#6e6b67" }}>Designer</div>
                        </div>
                        <div className="text-[7px]" style={{ color: "#4a4845" }}>UI/UX • Web3</div>
                      </div>
                      <div className="rounded-xl p-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="w-3 h-3" style={{ color: "#6e6b67" }} />
                          <div className="text-[9px] font-bold" style={{ color: "#6e6b67" }}>Growth Lead</div>
                        </div>
                        <div className="text-[7px]" style={{ color: "#4a4845" }}>Marketing</div>
                      </div>
                    </div>
                    <button className="w-full py-2 rounded-lg text-[8px]" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", color: "#e8c4b8", background: "rgba(232, 196, 184, 0.05)", letterSpacing: "0.06em" }}>FIND MATCH</button>
                  </div>
                </PhoneMockup>
                <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>SKILLSYNC</div>
              </div>

              <ConnectionLine active={activeStep >= 3} delay={0.8} />

              <div className="flex flex-col items-center gap-2">
                <PhoneMockup active={activeStep === 3} delay={1}>
                  <div className="flex flex-col h-full p-5" style={{ background: "#111111" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[8px]" style={{ color: "#6e6b67" }}>9:41</div>
                      <div className="text-[7px] px-2 py-0.5 rounded" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", color: "#e8c4b8" }}>MATCH</div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="rounded-2xl p-4 text-center" style={{ border: "0.5px solid rgba(232, 196, 184, 0.4)", background: "rgba(232, 196, 184, 0.08)" }}>
                        <User className="w-12 h-12 mx-auto mb-2" style={{ color: "#e8c4b8" }} />
                        <div className="text-sm font-bold mb-1" style={{ color: "#e8c4b8" }}>Perfect Match!</div>
                        <div className="text-[8px] mb-3" style={{ color: "#6e6b67" }}>3 ICPs found for<br />Senior Solana Dev</div>
                        <div className="flex justify-center gap-1 mb-3">
                          <div className="w-6 h-6 rounded-full" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", background: "rgba(232, 196, 184, 0.15)" }} />
                          <div className="w-6 h-6 rounded-full" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", background: "rgba(232, 196, 184, 0.15)" }} />
                          <div className="w-6 h-6 rounded-full" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", background: "rgba(232, 196, 184, 0.15)" }} />
                        </div>
                      </div>
                    </div>
                    <button className="w-full py-2 rounded-lg text-[8px] mb-1" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", color: "#e8c4b8", background: "rgba(232, 196, 184, 0.05)", letterSpacing: "0.06em" }}>CONTACT ALL</button>
                    <button className="w-full py-2 rounded-lg text-[8px]" style={{ border: "0.5px solid rgba(255,255,255,0.07)", color: "#6e6b67", background: "transparent", letterSpacing: "0.06em" }}>VIEW PROFILES</button>
                  </div>
                </PhoneMockup>
                <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>ICP MATCH</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-20">
            <div className="h-[0.5px] flex-1 max-w-md" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="text-[9px]" style={{ color: "#6e6b67", letterSpacing: "0.06em" }}>TELEGRAM CRM OUTREACH</div>
            <div className="h-[0.5px] flex-1 max-w-md" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>

          <div className="relative" style={{ zIndex: 1 }}>
            <div className="flex items-center justify-center gap-20 flex-wrap md:flex-nowrap">
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

              <div className="flex flex-col items-center gap-2">
                <PhoneMockup active={activeStep === 2} delay={0.6}>
                  <div className="flex flex-col h-full p-5" style={{ background: "#111111" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[8px]" style={{ color: "#6e6b67" }}>CRM</div>
                      <Users className="w-3 h-3" style={{ color: "#e8c4b8" }} />
                    </div>
                    <div className="text-xs font-bold mb-3" style={{ color: "#e8c4b8" }}>Campaign<br />Management</div>
                    <div className="flex-1 space-y-2 overflow-y-auto">
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

              <div className="flex flex-col items-center gap-2">
                <PhoneMockup active={activeStep === 3} delay={1}>
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
                          <div className="text-[8px]" style={{ color: "#0088cc" }}>Telegram → Rei Flow Complete</div>
                        </div>
                      </div>
                    </div>
                    <button className="w-full py-2 rounded-lg text-[8px]" style={{ border: "0.5px solid rgba(232, 196, 184, 0.3)", color: "#e8c4b8", background: "rgba(232, 196, 184, 0.05)", letterSpacing: "0.06em" }}>VIEW APPLICANTS</button>
                  </div>
                </PhoneMockup>
                <div className="text-[8px] text-center" style={{ color: "#6e6b67", letterSpacing: "0.04em" }}>APPLICANTS</div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-16 text-center"
          >
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2, 3, 4].map((step) => (
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
            <div className="text-[9px]" style={{ color: "#6e6b67", letterSpacing: "0.06em" }}>
              {activeStep === 0 && "PURCHASE PACKAGE"}
              {activeStep === 1 && "LIST ON REI • TELEGRAM ONBOARDING"}
              {activeStep === 2 && "SKILLSYNC MATCHING • CRM MANAGEMENT"}
              {activeStep === 3 && "ICP MATCH • APPLICANTS"}
              {activeStep === 4 && "LOOP COMPLETE"}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
