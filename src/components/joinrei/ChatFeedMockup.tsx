import defiLogo1 from '@/assets/joinrei/defi-logo.png.asset.json';
import defiLogo2 from '@/assets/joinrei/defi-logo2.png.asset.json';
import defiLogo3 from '@/assets/joinrei/defi-logo3.png.asset.json';
import defiLogo4 from '@/assets/joinrei/defi-logo4.png.asset.json';

const bounties = [
  { title: 'Solana Dev Docs Rewrite', org: 'Superteam Earn', reward: '2,000 USDC', logo: defiLogo1.url },
  { title: 'Alpha Quest Sprint', org: 'Zealy · VisionFinance', reward: '750 USDC', logo: defiLogo2.url },
  { title: 'Social Degen Campaign', org: 'QuestN · Banana Zone', reward: '1,200 USDC', logo: defiLogo3.url },
  { title: 'Galxe OAT Content Drop', org: 'Galxe · Apyx', reward: '900 USDC', logo: defiLogo4.url },
];


/** Static preview of the Rei chat terminal, used on marketing sections. */
export const ChatFeedMockup = () => (
  <div className="w-full rounded-2xl overflow-hidden border-[0.5px] border-white/10 bg-[#0d0d0d] font-mono">
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#111]">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white/20" />
        <span className="w-2 h-2 rounded-full bg-white/20" />
        <span className="w-2 h-2 rounded-full bg-white/20" />
        <span className="ml-2 text-[11px] text-cream/50">rei.chat — @WayneAnthonyD</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-[10px] text-cream/40">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> connected
        </span>
        <span className="text-[10px] text-cream/40 px-2 py-0.5 rounded border border-white/10">clear</span>
      </div>
    </div>

    <div className="p-4 space-y-3 max-h-[420px] overflow-hidden">
      <div className="flex gap-3 text-[11px]">
        <span className="text-cream/30 shrink-0">[19:59:39]</span>
        <span className="text-[#ed565a] shrink-0">@WayneAnthonyD</span>
        <span className="text-cream/80">find bounties matching my skills</span>
      </div>
      <div className="flex gap-3 text-[11px]">
        <span className="text-cream/30 shrink-0">[19:59:50]</span>
        <span className="text-cream/50 shrink-0">@rei</span>
        <span className="text-cream/70">Here are some bounties that match your skills:</span>
      </div>

      <div className="space-y-2.5 pt-1">
        {bounties.map((b) => (
          <div
            key={b.title}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#ed565a]/25 bg-[#141414]"
          >
            <img
              src={b.logo}
              alt={`${b.org} logo`}
              className="w-12 h-12 rounded-lg shrink-0 object-cover bg-[#0d0d0d] border border-white/10"
            />

            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-cream truncate">{b.title}</p>
              <p className="text-[10px] text-cream/40 truncate">{b.org}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full border border-[#ed565a]/40 text-[9px] text-[#ed565a]">
                {b.reward}
              </span>
            </div>
            <span className="text-[10px] text-cream/50 shrink-0">Open ↗</span>
          </div>
        ))}
      </div>
    </div>

    <div className="flex items-center gap-3 px-4 py-3 border-t border-white/5 bg-[#111]">
      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0d0d0d] border border-white/10">
        <span className="text-[11px] text-[#ed565a]">@WayneAnthonyD &gt;</span>
        <span className="text-[11px] text-cream/30">
          <span className="animate-pulse">▌</span> type a message or /command...
        </span>
      </div>
      <span className="text-[11px] text-cream/30">send</span>
    </div>
  </div>
);
