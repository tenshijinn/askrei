import { ScrollFadeIn } from './ScrollFadeIn';
import twitterVerifiedBadge from '@/assets/joinrei/twitter-verified-badge.png';

export const JoinReiDemoSection = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1: Onboarding - Proof of Humanity */}
          <ScrollFadeIn delay={0}>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-sm md:text-base lg:text-lg font-light text-primary mb-4 tracking-wide whitespace-nowrap">
                PROOF OF HUMANITY/TALENT
              </h3>
              <div className="w-full aspect-[552/816] rounded-2xl overflow-hidden border-[0.5px] border-white/10 bg-[#111]">
                <div className="w-full h-full flex flex-col">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <span className="text-[10px] text-cream/40 font-mono">rei.app/onboarding</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                    </div>
                  </div>
                  <div className="flex-1 p-5 flex flex-col gap-4">
                    {/* Step indicators */}
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-7 h-7 rounded-full bg-[#ed565a] flex items-center justify-center text-[10px] font-bold text-white">1</div>
                      <div className="w-8 h-[1px] bg-white/20" />
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-cream/40">2</div>
                      <div className="w-8 h-[1px] bg-white/20" />
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-cream/40">3</div>
                    </div>

                    <h4 className="text-sm font-light text-primary text-center mt-2">Verify Your Identity</h4>
                    
                    {/* Twitter login button */}
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#181818] border border-primary/20 hover:border-primary/40 transition-colors">
                      <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <img src={twitterVerifiedBadge} alt="Verified" className="h-4 w-4 object-contain" />
                      <span className="text-xs text-cream/80 font-mono">Sign in with X</span>
                    </button>

                    {/* Wallet connect */}
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#181818] border border-primary/20">
                      <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="6" width="20" height="14" rx="2" />
                        <path d="M22 10H2" />
                        <circle cx="18" cy="14" r="1.5" />
                      </svg>
                      <span className="text-xs text-cream/80 font-mono">Connect Wallet</span>
                    </button>

                    {/* Role selection preview */}
                    <div className="mt-auto">
                      <span className="text-[10px] text-cream/40 font-mono mb-2 block">Select Roles</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Dev', 'Design', 'Community', 'Research'].map((role, i) => (
                          <span 
                            key={role}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${
                              i === 0 ? 'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a]' : 'bg-white/5 border border-white/10 text-cream/50'
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Voice record hint */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                      <div className="w-3 h-3 rounded-full bg-[#ed565a] animate-pulse" />
                      <span className="text-[10px] text-cream/50 font-mono">Record 30s voice intro</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollFadeIn>

          {/* Card 2: Chat with Rei */}
          <ScrollFadeIn delay={150}>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-sm md:text-base lg:text-lg font-light text-primary mb-4 tracking-wide whitespace-nowrap">
                FIND TASKS MATCHED TO SKILLS
              </h3>
              <div className="w-full aspect-[552/816] rounded-2xl overflow-hidden border-[0.5px] border-white/10 bg-[#111]">
                <div className="w-full h-full flex flex-col">
                  {/* Terminal header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <span className="text-[10px] text-cream/40 font-mono">rei://chat</span>
                    <div className="flex gap-1.5">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-[#ed565a]/20 text-[#ed565a] font-mono">Talent</span>
                    </div>
                  </div>

                  <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                    {/* Rei message */}
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-[9px] px-2 py-0.5 rounded bg-[#ed565a]/20 text-[#ed565a] font-mono border border-[#ed565a]/30">Rei</span>
                      <p className="text-[11px] text-cream/80 font-mono leading-relaxed">Hey! I found 3 tasks matching your skills in Community & Design.</p>
                    </div>

                    {/* Task cards */}
                    <div className="space-y-2 ml-2">
                      <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-cream/70 font-mono">Galxe Quest</span>
                          <span className="text-[9px] text-green-400/70 font-mono">0.5 SOL</span>
                        </div>
                        <p className="text-[9px] text-cream/40 font-mono mt-0.5">Community activation campaign</p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-cream/70 font-mono">QuestN Bounty</span>
                          <span className="text-[9px] text-green-400/70 font-mono">1.2 SOL</span>
                        </div>
                        <p className="text-[9px] text-cream/40 font-mono mt-0.5">Design social media assets</p>
                      </div>
                    </div>

                    {/* User message */}
                    <div className="flex items-start gap-2 justify-end">
                      <p className="text-[11px] text-blue-300 font-mono leading-relaxed text-right">Show me the Galxe quest details</p>
                      <span className="shrink-0 text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">You</span>
                    </div>

                    {/* Rei reply */}
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-[9px] px-2 py-0.5 rounded bg-[#ed565a]/20 text-[#ed565a] font-mono border border-[#ed565a]/30">Rei</span>
                      <p className="text-[11px] text-cream/80 font-mono leading-relaxed">Sure! Here's the breakdown...</p>
                    </div>

                    {/* Quick action pills */}
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      {['Find Tasks', 'My Points', 'Earnings'].map((action) => (
                        <span key={action} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] text-cream/50 font-mono">
                          {action}
                        </span>
                      ))}
                    </div>

                    {/* Input bar */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                      <span className="text-[10px] text-gray-500 font-mono flex-1 text-left">Ask Rei anything...</span>
                      <div className="w-5 h-5 rounded bg-[#ed565a]/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#ed565a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollFadeIn>

          {/* Card 3: Post Tasks */}
          <ScrollFadeIn delay={300}>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-sm md:text-base lg:text-lg font-light text-primary mb-4 tracking-wide whitespace-nowrap">
                POST TASKS | CHATBOT OR X
              </h3>
              <div className="w-full aspect-[552/816] rounded-2xl overflow-hidden border-[0.5px] border-white/10 bg-[#111]">
                <div className="w-full h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <span className="text-[10px] text-cream/40 font-mono">rei://post-task</span>
                    <div className="flex gap-1.5">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">Employer</span>
                    </div>
                  </div>

                  <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                    {/* Opportunity type selector */}
                    <div>
                      <span className="text-[10px] text-cream/40 font-mono mb-1.5 block text-left">Type</span>
                      <div className="flex flex-wrap gap-1">
                        {['Job', 'Task', 'Bounty', 'Quest'].map((type, i) => (
                          <span 
                            key={type}
                            className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                              i === 2 ? 'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a]' : 'bg-white/5 border border-white/10 text-cream/50'
                            }`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[10px] text-cream/40 font-mono mb-1 block text-left">Title</span>
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-cream/60 font-mono text-left block">Community Bounty Q2</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-cream/40 font-mono mb-1 block text-left">Company</span>
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-cream/60 font-mono text-left block">Phantom Wallet</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-cream/40 font-mono mb-1 block text-left">Description</span>
                        <div className="px-3 py-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-[10px] text-cream/60 font-mono leading-relaxed">Create social media content for our community growth campaign...</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-cream/40 font-mono mb-1 block text-left">Compensation</span>
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-[10px] text-cream/60 font-mono">2.5 SOL</span>
                        </div>
                      </div>
                    </div>

                    {/* Role tags */}
                    <div>
                      <span className="text-[10px] text-cream/40 font-mono mb-1.5 block text-left">Role Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {['Community', 'Content', 'Designer'].map((tag, i) => (
                          <span 
                            key={tag}
                            className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                              i < 2 ? 'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a]' : 'bg-white/5 border border-white/10 text-cream/50'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Submit button */}
                    <div className="mt-auto">
                      <button className="w-full py-2 rounded-lg bg-[#ed565a] text-white text-[11px] font-mono font-medium">
                        Pay 5 USDC & Post
                      </button>
                      <p className="text-[8px] text-cream/30 font-mono text-center mt-1.5">Solana Pay • x402</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollFadeIn>
        </div>

        <ScrollFadeIn delay={500}>
          <div className="flex justify-center mt-8">
            <button 
              className="btn-manga btn-manga-primary px-8 py-3"
              onClick={() => window.location.href = '/rei'}
            >
              Promote Task
            </button>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
