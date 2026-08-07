import { useEffect, useRef, useState } from 'react';

// =====================================================================
// Admin-only preview page: 10 animated mockup states of Rei.
// Unlinked (no nav). Aspect ratio 9:16 (Instagram Reel) per mockup.
// No titles, no surrounding text. Generous spacing for screenshotting.
// =====================================================================

// ---------- Hooks ----------
const usePrefersReducedMotion = () => {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(mq.matches);
    const h = (e: MediaQueryListEvent) => setR(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return r;
};

const useTypewriter = (text: string, active: boolean, speed = 35, startDelay = 0) => {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active) { setOut(text); return; }
    setOut('');
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => { clearTimeout(start); if (interval) clearInterval(interval); };
  }, [text, active, speed, startDelay]);
  return out;
};

const useLoopPhase = (steps: number, intervalMs: number, active: boolean) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active) return;
    setPhase(0);
    const tick = setInterval(() => setPhase(p => (p + 1) % steps), intervalMs);
    return () => clearInterval(tick);
  }, [steps, intervalMs, active]);
  return phase;
};

// ---------- Frame wrapper ----------
const Frame = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden border-[0.5px] border-white/10 bg-[#111]">
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
      <span className="text-[10px] text-cream/40 font-mono">{label}</span>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
        <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
      </div>
    </div>
    <div className="w-full h-[calc(100%-2rem)] flex flex-col">
      {children}
    </div>
  </div>
);

const Caret = () => <span className="animate-pulse">▌</span>;
const Pulse = ({ className = '' }: { className?: string }) => (
  <span className={`inline-block w-2 h-2 rounded-full bg-[#ed565a] animate-pulse ${className}`} />
);

// =====================================================================
// 1. AskRei chatbot — conversational matching
// =====================================================================
const M1_AskRei = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(8, 1400, active && !reduced);
  return (
    <Frame label="rei://chat">
      <div className="flex-1 p-5 flex flex-col gap-3 overflow-hidden">
        {phase >= 1 && (
          <div className="flex items-start gap-2 animate-fade-in">
            <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">You</span>
            <p className="text-[12px] text-cream/80 font-mono leading-relaxed">Got any Solana design bounties this week?</p>
          </div>
        )}
        {phase >= 2 && (
          <div className="flex items-start gap-2 animate-fade-in">
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#ed565a]/20 text-[#ed565a] font-mono border border-[#ed565a]/30">Rei</span>
            <p className="text-[12px] text-cream/80 font-mono leading-relaxed">Found 4. Top match below ↓</p>
          </div>
        )}
        {phase >= 3 && (
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 animate-fade-in">
            <div className="flex justify-between"><span className="text-[11px] text-cream/80 font-mono">Phantom · Brand kit refresh</span><span className="text-[10px] text-green-400 font-mono">3.2 SOL</span></div>
            <p className="text-[10px] text-cream/40 font-mono mt-0.5">Figma · 5 day deadline · Senior</p>
          </div>
        )}
        {phase >= 4 && (
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 animate-fade-in">
            <div className="flex justify-between"><span className="text-[11px] text-cream/80 font-mono">Jupiter · Landing page</span><span className="text-[10px] text-green-400 font-mono">1.8 SOL</span></div>
            <p className="text-[10px] text-cream/40 font-mono mt-0.5">Web3 · 7 day deadline · Mid</p>
          </div>
        )}
        {phase >= 5 && (
          <div className="flex items-start gap-2 justify-end animate-fade-in">
            <p className="text-[12px] text-blue-300 font-mono">Apply to Phantom</p>
            <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">You</span>
          </div>
        )}
        {phase >= 6 && (
          <div className="flex items-start gap-2 animate-fade-in">
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#ed565a]/20 text-[#ed565a] font-mono border border-[#ed565a]/30">Rei</span>
            <div className="px-2.5 py-1.5 rounded-lg bg-[#ed565a]/10 border border-[#ed565a]/30">
              <p className="text-[10px] text-[#ed565a] font-mono">Application drafted ✓</p>
              <p className="text-[9px] text-cream/60 font-mono mt-0.5">Sent with verified portfolio</p>
            </div>
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {['Find tasks', 'My points', 'Earnings', 'Refer'].map(a => (
            <span key={a} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] text-cream/50 font-mono">{a}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[10px] text-gray-500 font-mono flex-1 text-left">Ask Rei anything<Caret /></span>
          <div className="w-5 h-5 rounded bg-[#ed565a]/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-[#ed565a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </div>
        </div>
      </div>
    </Frame>
  );
};

// =====================================================================
// 2. Onboarding / Proof of Talent
// =====================================================================
const M2_Onboarding = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(7, 1200, active && !reduced);
  const step = phase >= 5 ? 3 : phase >= 3 ? 2 : 1;
  const xSigned = phase >= 2;
  const wallet = phase >= 4;
  const roles = phase >= 5 ? Math.min(3, phase - 4) : 0;
  return (
    <Frame label="rei.app/onboarding">
      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 justify-center">
          {[1,2,3].map((n,i)=>(
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-500 ${step>=n?'bg-[#ed565a] text-white scale-110':'bg-white/10 text-cream/40'}`}>{n}</div>
              {i<2 && <div className={`w-10 h-[1px] ${step>n?'bg-[#ed565a]/60':'bg-white/20'}`} />}
            </div>
          ))}
        </div>
        <h4 className="text-base font-light text-primary text-center">Verify Your Identity</h4>
        <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#181818] border ${xSigned?'border-green-500/50':'border-primary/20'}`}>
          <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span className="text-xs text-cream/80 font-mono">Sign in with X</span>
          {xSigned && <svg className="h-3.5 w-3.5 text-green-400 animate-fade-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
        </button>
        <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#181818] border ${wallet?'border-green-500/50':'border-primary/20'}`}>
          <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M22 10H2"/><circle cx="18" cy="14" r="1.5" /></svg>
          <span className="text-xs text-cream/80 font-mono">{wallet?'7xKn…9pQ2':'Connect Wallet'}</span>
          {wallet && <svg className="h-3.5 w-3.5 text-green-400 animate-fade-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
        </button>
        <div>
          <span className="text-[10px] text-cream/40 font-mono mb-2 block">Pick your roles</span>
          <div className="flex flex-wrap gap-1.5">
            {['Dev','Design','Community','Research','Content','Ops'].map((r,i)=>(
              <span key={r} className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all ${i<roles*2?'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a]':'bg-white/5 border border-white/10 text-cream/50'}`}>{r}</span>
            ))}
          </div>
        </div>
        <div className="mt-auto flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
          <Pulse />
          <div className="flex items-end gap-0.5 h-3 flex-1">
            {Array.from({length:14}).map((_,b)=>(
              <div key={b} className="w-0.5 bg-[#ed565a]/60 rounded-full animate-pulse" style={{height:`${30+((b*17)%70)}%`,animationDelay:`${b*100}ms`,animationDuration:'900ms'}} />
            ))}
          </div>
          <span className="text-[10px] text-cream/50 font-mono">30s intro</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-cream/50">
          <span>Trust score</span>
          <span className="text-[#ed565a]">{phase >= 6 ? '92' : '—'}/100</span>
        </div>
      </div>
    </Frame>
  );
};

// =====================================================================
// 3. Post a task / pay $5 SOL
// =====================================================================
const M3_PostTask = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(8, 1400, active && !reduced);
  const showFields = phase >= 2;
  const title = useTypewriter('Community Bounty Q2', active && showFields && !reduced, 50, 0);
  const company = useTypewriter('Phantom Wallet', active && showFields && !reduced, 55, 800);
  const desc = useTypewriter('Create social media content for our Q2 community growth campaign...', active && showFields && !reduced, 22, 1700);
  const pay = useTypewriter('2.5 SOL', active && showFields && !reduced, 70, 4200);
  const types = ['Job','Task','Bounty','Quest'];
  const tIdx = phase % 4;
  const tags = phase >= 6 ? 3 : phase >= 5 ? 2 : phase >= 4 ? 1 : 0;
  const posted = phase >= 7;
  return (
    <Frame label="rei://post-task">
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        <div>
          <span className="text-[10px] text-cream/40 font-mono mb-1.5 block">Type</span>
          <div className="flex gap-1.5">
            {types.map((t,i)=>(
              <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-mono ${i===tIdx?'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a]':'bg-white/5 border border-white/10 text-cream/50'}`}>{t}</span>
            ))}
          </div>
        </div>
        {[
          { l: 'Title', v: title, full: 'Community Bounty Q2' },
          { l: 'Company', v: company, full: 'Phantom Wallet' },
          { l: 'Description', v: desc, full: 'Create social media content for our Q2 community growth campaign...' },
          { l: 'Compensation', v: pay, full: '2.5 SOL' },
        ].map(f=>(
          <div key={f.l}>
            <span className="text-[10px] text-cream/40 font-mono mb-1 block">{f.l}</span>
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[11px] text-cream/70 font-mono leading-relaxed block min-h-[1em]">
                {f.v}{showFields && !reduced && f.v.length>0 && f.v.length<f.full.length && <Caret />}
              </span>
            </div>
          </div>
        ))}
        <div>
          <span className="text-[10px] text-cream/40 font-mono mb-1.5 block">Role tags</span>
          <div className="flex flex-wrap gap-1">
            {['Community','Content','Designer','Web3'].map((t,i)=>(
              <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-mono ${i<tags?'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a]':'bg-white/5 border border-white/10 text-cream/50'}`}>{t}</span>
            ))}
          </div>
        </div>
        <div className="mt-auto">
          <button className={`w-full py-2.5 rounded-lg text-[12px] font-mono font-medium ${posted?'bg-green-500 text-white':'bg-[#ed565a] text-white animate-pulse'}`}>
            {posted?'Posted ✓':'Pay 5 USDC & Post'}
          </button>
          <p className="text-[9px] text-cream/30 font-mono text-center mt-1.5">Solana Pay • x402</p>
        </div>
      </div>
    </Frame>
  );
};

// =====================================================================
// 4. SkillSync — auto-match graph
// =====================================================================
const M4_SkillSync = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(6, 1500, active && !reduced);
  const skills = ['React','Solana','Figma','Rust','Writing','Marketing'];
  const tasks = [
    { name: 'Marinade UI revamp', match: 96, skill: ['React','Figma'] },
    { name: 'Drift docs polish', match: 88, skill: ['Writing'] },
    { name: 'Helius indexer', match: 81, skill: ['Rust','Solana'] },
    { name: 'Tensor mod tools', match: 73, skill: ['React'] },
  ];
  return (
    <Frame label="rei://skillsync">
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div>
          <span className="text-[10px] text-cream/40 font-mono mb-1.5 block">Your verified skills</span>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s,i)=>(
              <span key={s} className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all ${phase>=1+Math.floor(i/2)?'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a]':'bg-white/5 border border-white/10 text-cream/40'}`}>{s}</span>
            ))}
          </div>
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex items-center gap-2">
          <Pulse />
          <span className="text-[10px] text-cream/60 font-mono">SkillSync running…</span>
          <span className="ml-auto text-[10px] text-[#ed565a] font-mono">{phase>=2?'4 matches':'…'}</span>
        </div>
        <div className="space-y-2 flex-1">
          {tasks.map((t,i)=>(
            <div key={t.name} className={`px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 transition-all ${phase>=2+i?'opacity-100 translate-x-0':'opacity-0 translate-x-2'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-cream/80 font-mono">{t.name}</span>
                <span className="text-[10px] text-green-400 font-mono">{t.match}%</span>
              </div>
              <div className="mt-1 h-1 bg-white/5 rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#ed565a] to-orange-400" style={{ width: `${t.match}%` }} />
              </div>
              <div className="flex gap-1 mt-1.5">
                {t.skill.map(s=>(<span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-[#ed565a]/10 text-[#ed565a]/80 font-mono">{s}</span>))}
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-2 rounded-lg text-[11px] font-mono bg-[#ed565a] text-white">Auto-apply to top 3</button>
      </div>
    </Frame>
  );
};

// =====================================================================
// 5. Earnings hub / dashboard
// =====================================================================
const M5_Earnings = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(5, 1600, active && !reduced);
  const total = phase >= 1 ? 12.84 : 0;
  return (
    <Frame label="rei://earnings">
      <div className="flex-1 p-5 flex flex-col gap-4">
        <div>
          <span className="text-[10px] text-cream/40 font-mono">Lifetime earnings</span>
          <div className="text-3xl font-light text-primary mt-1">{total.toFixed(2)} <span className="text-base text-[#ed565a]">SOL</span></div>
          <div className="text-[10px] text-green-400 font-mono">+0.42 SOL this week</div>
        </div>
        <div className="h-24 flex items-end gap-1">
          {[3,5,2,7,4,9,6,11,8,12,10,14].map((v,i)=>(
            <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-[#ed565a] to-orange-300 transition-all" style={{ height: `${(v/14)*100}%`, opacity: phase>=1?1:0.2, transitionDelay: `${i*40}ms` }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[{l:'Tasks',v:'27'},{l:'Avg payout',v:'0.48 SOL'},{l:'Streak',v:'11d'}].map(s=>(
            <div key={s.l} className="px-2 py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-[11px] text-cream/80 font-mono">{s.v}</div>
              <div className="text-[9px] text-cream/40 font-mono">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 flex-1 overflow-hidden">
          {[
            {n:'Phantom · Brand kit', a:'+3.20 SOL', t:'2h'},
            {n:'Drift · Docs', a:'+0.80 SOL', t:'1d'},
            {n:'Jupiter · Landing', a:'+1.80 SOL', t:'3d'},
            {n:'Tensor · Mod', a:'+0.55 SOL', t:'4d'},
          ].map((r,i)=>(
            <div key={r.n} className={`flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 transition-all ${phase>=1+Math.floor(i/2)?'opacity-100':'opacity-30'}`}>
              <div>
                <div className="text-[11px] text-cream/80 font-mono">{r.n}</div>
                <div className="text-[9px] text-cream/40 font-mono">{r.t} ago</div>
              </div>
              <span className="text-[11px] text-green-400 font-mono">{r.a}</span>
            </div>
          ))}
        </div>
        <button className="w-full py-2 rounded-lg text-[11px] font-mono bg-[#ed565a] text-white">Withdraw 12.84 SOL</button>
      </div>
    </Frame>
  );
};

// =====================================================================
// 6. NFT reward minted
// =====================================================================
const M6_NFTReward = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(5, 1500, active && !reduced);
  return (
    <Frame label="rei://reward">
      <div className="flex-1 p-5 flex flex-col items-center justify-center gap-5 text-center">
        <div className={`relative w-44 h-44 rounded-2xl border-[1.5px] border-[#ed565a]/50 bg-gradient-to-br from-[#ed565a]/30 via-orange-500/10 to-purple-600/20 transition-all duration-700 ${phase>=1?'opacity-100 scale-100':'opacity-0 scale-90'}`}>
          <div className="absolute inset-2 rounded-xl border border-white/10 bg-[#0a0a0a]/60 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[44px] font-bold text-[#ed565a] leading-none">REI</div>
              <div className="text-[10px] text-cream/60 font-mono mt-1">PROOF · OF · WORK</div>
              <div className="text-[9px] text-cream/40 font-mono mt-1">#0427</div>
            </div>
          </div>
          {phase>=2 && <div className="absolute -inset-2 rounded-2xl border border-[#ed565a]/40 animate-ping" />}
        </div>
        <div className={`transition-all ${phase>=2?'opacity-100':'opacity-0'}`}>
          <div className="text-sm text-primary font-light">Bounty Completed</div>
          <div className="text-[10px] text-cream/50 font-mono">Phantom · Brand kit refresh</div>
        </div>
        <div className={`grid grid-cols-3 gap-2 w-full ${phase>=3?'opacity-100':'opacity-0'} transition-all`}>
          {[{l:'XP',v:'+250'},{l:'Tier',v:'Gold'},{l:'Mint',v:'✓'}].map(s=>(
            <div key={s.l} className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-[11px] text-cream/80 font-mono">{s.v}</div>
              <div className="text-[9px] text-cream/40 font-mono">{s.l}</div>
            </div>
          ))}
        </div>
        <button className={`w-full py-2.5 rounded-lg text-[12px] font-mono bg-[#ed565a] text-white transition-all ${phase>=4?'opacity-100':'opacity-50'}`}>Claim NFT</button>
        <p className="text-[9px] text-cream/30 font-mono">Soulbound · Solana</p>
      </div>
    </Frame>
  );
};

// =====================================================================
// 7. Live opportunity feed
// =====================================================================
const M7_Feed = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(8, 1200, active && !reduced);
  const items = [
    { src: 'Galxe', name: 'DAO activation quest', tag: 'Community', pay: '0.5 SOL', new: true },
    { src: 'QuestN', name: 'Design social pack', tag: 'Design', pay: '1.2 SOL' },
    { src: 'Superteam', name: 'Solana writing contest', tag: 'Content', pay: '500 USDC' },
    { src: 'Layer3', name: 'Onchain quest hunter', tag: 'Growth', pay: '0.8 SOL' },
    { src: 'Earn', name: 'Smart contract review', tag: 'Dev', pay: '4 SOL' },
    { src: 'Zealy', name: 'Mod team recruitment', tag: 'Ops', pay: '300 USDC' },
  ];
  return (
    <Frame label="rei://feed">
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center gap-2">
          <Pulse />
          <span className="text-[10px] text-cream/60 font-mono">Live · 2,481 open · {phase} new</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All','Bounty','Job','Quest','Grant'].map((t,i)=>(
            <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-mono ${i===0?'bg-[#ed565a]/20 border border-[#ed565a]/40 text-[#ed565a]':'bg-white/5 border border-white/10 text-cream/50'}`}>{t}</span>
          ))}
        </div>
        <div className="space-y-2 flex-1 overflow-hidden">
          {items.map((it,i)=>(
            <div key={it.name} className={`px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 transition-all ${phase>=i?'opacity-100 translate-y-0':'opacity-0 translate-y-2'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ed565a]/10 text-[#ed565a] font-mono">{it.src}</span>
                  <span className="text-[11px] text-cream/80 font-mono">{it.name}</span>
                </div>
                <span className="text-[10px] text-green-400 font-mono">{it.pay}</span>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-cream/50 font-mono">{it.tag}</span>
                {i===0 && <span className="text-[9px] text-[#ed565a] font-mono animate-pulse">NEW</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
};

// =====================================================================
// 8. AI agent API console (x402 payment)
// =====================================================================
const M8_AgentAPI = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(8, 1200, active && !reduced);
  const lines = [
    '$ curl https://rei.chat/v1/feed/tasks \\',
    '    -H "x-api-key: rei_live_••••8f2a"',
    '',
    '{ "ok": true, "count": 247,',
    '  "tasks": [',
    '    { "id": "tsk_91", "title": "Phantom brand kit",',
    '      "pay": "3.2 SOL", "deadline": "2026-05-08" },',
    '    { "id": "tsk_92", "title": "Jupiter landing",',
    '      "pay": "1.8 SOL", "deadline": "2026-05-12" }',
    '  ] }',
    '',
    '✓ x402 payment settled · 0.001 USDC',
  ];
  return (
    <Frame label="rei://agents">
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center gap-2">
          <Pulse />
          <span className="text-[10px] text-cream/60 font-mono">agent_42 · Pro tier</span>
          <span className="ml-auto text-[10px] text-[#ed565a] font-mono">42ms</span>
        </div>
        <div className="flex-1 rounded-lg bg-black/60 border border-white/10 p-3 overflow-hidden">
          {lines.map((l,i)=>(
            <div key={i} className={`text-[10px] font-mono leading-relaxed transition-opacity duration-300 ${phase>=i?'opacity-100':'opacity-0'} ${l.startsWith('$')?'text-[#ed565a]':l.startsWith('✓')?'text-green-400':'text-cream/70'}`}>
              {l || '\u00A0'}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[{l:'Calls',v:'12,481'},{l:'Spend',v:'$12.48'},{l:'Rate',v:'1k/min'}].map(s=>(
            <div key={s.l} className="px-2 py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-[11px] text-cream/80 font-mono">{s.v}</div>
              <div className="text-[9px] text-cream/40 font-mono">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
};

// =====================================================================
// 9. Multi-chain wallet payments
// =====================================================================
const M9_Payments = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(6, 1500, active && !reduced);
  const chains = [
    { n: 'Solana', sym: 'SOL', col: 'from-purple-500 to-green-400' },
    { n: 'Base', sym: 'ETH', col: 'from-blue-500 to-blue-300' },
    { n: 'Polygon', sym: 'MATIC', col: 'from-purple-600 to-indigo-400' },
    { n: 'Arbitrum', sym: 'ARB', col: 'from-blue-600 to-cyan-400' },
  ];
  const sel = phase % 4;
  return (
    <Frame label="rei://pay">
      <div className="flex-1 p-5 flex flex-col gap-4">
        <div>
          <span className="text-[10px] text-cream/40 font-mono">Send payment</span>
          <div className="text-3xl font-light text-primary mt-1">$48.00</div>
          <div className="text-[10px] text-cream/50 font-mono">≈ {chains[sel].sym==='SOL'?'0.21 SOL':chains[sel].sym==='ETH'?'0.014 ETH':chains[sel].sym==='MATIC'?'62.4 MATIC':'21 ARB'}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {chains.map((c,i)=>(
            <button key={c.n} className={`px-3 py-3 rounded-lg border transition-all ${i===sel?'border-[#ed565a]/60 bg-[#ed565a]/10':'border-white/10 bg-white/5'}`}>
              <div className={`w-6 h-6 rounded-full mx-auto mb-1 bg-gradient-to-br ${c.col}`} />
              <div className="text-[11px] text-cream/80 font-mono">{c.n}</div>
              <div className="text-[9px] text-cream/40 font-mono">{c.sym}</div>
            </button>
          ))}
        </div>
        <div className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cream/40 font-mono">To</span>
            <span className="text-[11px] text-cream/80 font-mono">7xKn…9pQ2</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-cream/40 font-mono">Network fee</span>
            <span className="text-[10px] text-green-400 font-mono">{chains[sel].sym==='SOL'?'$0.0001':'$0.02'}</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${phase>=4?'bg-green-500/10 border border-green-500/40':'bg-white/5 border border-white/10'}`}>
          <div className={`w-2 h-2 rounded-full ${phase>=4?'bg-green-400':'bg-yellow-400 animate-pulse'}`} />
          <span className="text-[10px] text-cream/70 font-mono">{phase>=4?'Confirmed · 1 block':'Awaiting signature…'}</span>
        </div>
        <button className={`mt-auto w-full py-2.5 rounded-lg text-[12px] font-mono ${phase>=4?'bg-green-500 text-white':'bg-[#ed565a] text-white animate-pulse'}`}>{phase>=4?'Sent ✓':'Sign & send'}</button>
        <p className="text-[9px] text-cream/30 font-mono text-center">Solana Pay · x402 · WalletConnect</p>
      </div>
    </Frame>
  );
};

// =====================================================================
// 10. Talent leaderboard
// =====================================================================
const M10_Leaderboard = ({ active, reduced }: { active: boolean; reduced: boolean }) => {
  const phase = useLoopPhase(7, 1200, active && !reduced);
  const rows = [
    { r: 1, n: 'kira.sol', xp: '12,480', t: 'Dev' },
    { r: 2, n: 'mochi.eth', xp: '11,920', t: 'Design' },
    { r: 3, n: 'akira_dao', xp: '10,205', t: 'Community' },
    { r: 4, n: 'shoutaro', xp: '9,840', t: 'Content' },
    { r: 5, n: 'rin.sol', xp: '8,712', t: 'Dev' },
    { r: 6, n: 'you', xp: '7,930', t: 'Design', me: true },
    { r: 7, n: 'haru', xp: '6,402', t: 'Ops' },
  ];
  return (
    <Frame label="rei://leaderboard">
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cream/40 font-mono">Season 03 · Week 7</span>
          <span className="ml-auto text-[10px] text-[#ed565a] font-mono">2d 4h left</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {rows.slice(0,3).map((r,i)=>(
            <div key={r.n} className={`text-center px-2 py-3 rounded-lg border ${i===0?'border-[#ed565a]/50 bg-[#ed565a]/10':i===1?'border-cream/30 bg-cream/5':'border-orange-500/30 bg-orange-500/5'}`}>
              <div className="text-[18px]">{['🥇','🥈','🥉'][i]}</div>
              <div className="text-[11px] text-cream/80 font-mono mt-1 truncate">{r.n}</div>
              <div className="text-[10px] text-[#ed565a] font-mono">{r.xp} XP</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 flex-1">
          {rows.slice(3).map((r,i)=>(
            <div key={r.n} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${r.me?'border-[#ed565a]/50 bg-[#ed565a]/10':'border-white/10 bg-white/5'} transition-all ${phase>=i?'opacity-100':'opacity-30'}`}>
              <span className="text-[10px] text-cream/40 font-mono w-4">{r.r}</span>
              <span className="text-[11px] text-cream/80 font-mono flex-1">{r.n}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-cream/50 font-mono">{r.t}</span>
              <span className="text-[10px] text-[#ed565a] font-mono">{r.xp}</span>
            </div>
          ))}
        </div>
        <div className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-cream/50">Next reward</span>
            <span className="text-[#ed565a]">5 SOL + Gold NFT</span>
          </div>
          <div className="mt-1 h-1.5 bg-white/5 rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#ed565a] to-orange-400 transition-all" style={{ width: `${40+phase*8}%` }} />
          </div>
        </div>
      </div>
    </Frame>
  );
};

// =====================================================================
// Page
// =====================================================================
const AdminMockups = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.05 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const mockups = [
    M1_AskRei, M2_Onboarding, M3_PostTask, M4_SkillSync, M5_Earnings,
    M6_NFTReward, M7_Feed, M8_AgentAPI, M9_Payments, M10_Leaderboard,
  ];

  return (
    <div ref={ref} className="rei-theme min-h-screen bg-[#0a0a0a] py-20 px-10 lg:px-20">
      {/* 2 mockups per row, sized close to a real phone (≈430px wide → 9:16 ≈ 764px tall) */}
      <div className="grid gap-16 lg:gap-24 grid-cols-1 md:grid-cols-2 max-w-[1100px] mx-auto justify-items-center">
        {mockups.map((M, i) => (
          <div key={i} className="w-full max-w-[480px]">
            <M active={active} reduced={reduced} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMockups;
