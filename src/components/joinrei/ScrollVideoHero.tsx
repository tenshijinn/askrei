import { useEffect, useRef, useState } from 'react';
import scrollVideo from '@/assets/joinrei/scroll-rei.mp4.asset.json';
import reiLogo from '@/assets/joinrei/rei-logo.png';
import colosseumLogo from '@/assets/joinrei/colosseum-logo.png';
import twitterVerifiedBadge from '@/assets/joinrei/twitter-verified-badge.png';

const rotatingPlatforms = ['Galxe', 'QuestN', 'TaskOn', 'Zealy', 'Layer3', 'Crew3', 'RabbitHole'];
const rotatingTaskWords = ['Tasks', 'Bounties', 'Quests'];

const SimplePill = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] border border-primary/20">
    <span className="text-xs text-cream/80 font-mono">{label}</span>
  </div>
);

const IconPill = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] border border-primary/20">
    {children}
    <span className="text-xs text-cream/80 font-mono">{label}</span>
  </div>
);

export const ScrollVideoHero = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetTimeRef = useRef(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [taskFade, setTaskFade] = useState(true);

  useEffect(() => {
    const i = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((p) => (p + 1) % rotatingPlatforms.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setTaskFade(false);
      setTimeout(() => {
        setTaskIndex((p) => (p + 1) % rotatingTaskWords.length);
        setTaskFade(true);
      }, 300);
    }, 2400);
    return () => clearInterval(i);
  }, []);

  // Scrub video based on scroll progress through the section
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let duration = video.duration;
    const onMeta = () => {
      duration = video.duration;
    };
    video.addEventListener('loadedmetadata', onMeta);
    if (!isNaN(video.duration)) duration = video.duration;

    const tick = () => {
      const v = videoRef.current;
      if (!v || !duration || isNaN(duration)) {
        rafRef.current = null;
        return;
      }
      const diff = targetTimeRef.current - v.currentTime;
      if (Math.abs(diff) > 0.01) {
        // smooth interpolation
        try {
          v.currentTime = v.currentTime + diff * 0.25;
        } catch {}
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      if (!duration || isNaN(duration)) return;
      targetTimeRef.current = Math.min(duration - 0.05, progress * duration);
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('loadedmetadata', onMeta);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#0a0a0a]"
      style={{ height: '300vh' }}
    >
      <div className="sticky top-0 h-screen w-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* LEFT — scrollable content (visually scroll-synced via sticky right) */}
        <div className="relative h-screen overflow-hidden">
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              // The left panel content slides up as user scrolls through 300vh
              // Mapped via CSS scroll-linked transform using a separate effect below
            }}
            id="scroll-left-track"
          >
            <LeftPanelTrack />
          </div>

          {/* Logo top-right of left panel */}
          <div className="absolute top-4 left-4 z-30 bg-[#0a0a0a] p-2">
            <img src={reiLogo} alt="Rei AI" className="h-12 lg:h-16 w-auto block" />
          </div>
        </div>

        {/* RIGHT — sticky scrubbing video */}
        <div className="relative h-screen bg-black hidden lg:block">
          <video
            ref={videoRef}
            src={scrollVideo.url}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-6 right-6 z-20">
            <a href="https://arena.colosseum.org/projects/explore/rei" target="_blank" rel="noopener noreferrer">
              <img src={colosseumLogo} alt="Colosseum" className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>

      {/* Track translator: mirrors scroll progress into left panel translateY */}
      <LeftTrackController sectionRef={sectionRef} />
    </section>
  );

  // -- inline helpers --
  function LeftPanelTrack() {
    return (
      <div className="flex flex-col text-primary">
        {/* Block 1: Hero */}
        <div className="h-screen w-full flex flex-col justify-center px-8 lg:px-12 xl:px-16">
          <h1 className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] xl:text-[2.5rem] font-light text-primary leading-[1.15] tracking-tight">
            A Thousand Unicorn Bounties
            <br />
            in Your Chat
          </h1>
          <p className="mt-6 text-sm md:text-base text-primary/70 font-mono leading-relaxed">
            Rei AI matches crypto{' '}
            <span className={`transition-opacity duration-300 font-bold text-primary ${taskFade ? 'opacity-100' : 'opacity-0'}`}>
              {rotatingTaskWords[taskIndex]}
            </span>{' '}
            from{' '}
            <span className={`transition-opacity duration-300 font-bold text-primary ${fade ? 'opacity-100' : 'opacity-0'}`}>
              {rotatingPlatforms[wordIndex]}
            </span>{' '}
            to your <strong className="font-bold text-primary">skills</strong>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <SimplePill label="Discover Projects" />
            <SimplePill label="Earn Crypto" />
            <SimplePill label="Earn Points" />
          </div>
          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <button
              className="btn-manga"
              style={{ backgroundColor: '#ed565a', borderColor: '#ed565a', color: '#181818' }}
              onClick={() => (window.location.href = '/rei')}
            >
              Start Now
            </button>
          </div>
        </div>

        {/* Block 2: Value prop — icons stacked vertically */}
        <div className="h-screen w-full flex flex-col justify-center px-8 lg:px-12 xl:px-16">
          <h2 className="text-[1.5rem] md:text-[1.75rem] lg:text-[2rem] font-light text-primary leading-tight">
            Earn Points & Rewards
          </h2>
          <p className="mt-4 text-sm md:text-base font-mono text-primary/70 leading-relaxed max-w-md">
            Accumulate points passively as you use the platform and redeem for rewards.
          </p>
          <div className="mt-6 flex flex-col gap-3 items-start">
            <IconPill
              label="Verified Login"
              children={
                <>
                  <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <img src={twitterVerifiedBadge} alt="Verified" className="h-4 w-4 object-contain" />
                </>
              }
            />
            <IconPill
              label="Matches Skills to Tasks"
              children={
                <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                </svg>
              }
            />
            <IconPill
              label="Proof-of-Talent"
              children={
                <svg className="h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l2.39 4.84L20 7.74l-4 3.9.94 5.5L12 14.77 7.06 17.14 8 11.64l-4-3.9 5.61-.9z" />
                </svg>
              }
            />
          </div>
          <button
            className="btn-manga btn-manga-primary px-8 py-3 mt-8 self-start"
            onClick={() => (window.location.href = '/rei')}
          >
            Signup
          </button>
        </div>

        {/* Block 3: How it works — stacked frames */}
        <div className="h-screen w-full flex flex-col justify-center px-8 lg:px-12 xl:px-16">
          <h2 className="text-[1.5rem] md:text-[1.75rem] lg:text-[2rem] font-light text-primary leading-tight mb-4">
            How it works
          </h2>
          <div className="flex flex-col gap-3 max-w-md">
            <MiniFrame title="One feed. Every platform.">
              Rei aggregates live bounties from Galxe, Zealy, TaskOn, Earn into one matched feed.
            </MiniFrame>
            <MiniFrame title="Tasks that fit your skills.">
              SkillSync surfaces bounties matched to your wallet history — not random noise.
            </MiniFrame>
            <MiniFrame title="Get verified, get prioritised.">
              Verified X + 60s voice intro gives you a proof-of-talent score.
            </MiniFrame>
          </div>
          <button
            className="btn-manga btn-manga-primary px-8 py-3 mt-6 self-start"
            onClick={() => (window.location.href = '/rei')}
          >
            Signup
          </button>
        </div>
      </div>
    );
  }
};

const MiniFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border-[0.5px] border-white/10 p-4 bg-[#141414]/60 backdrop-blur-sm">
    <h3 className="text-base md:text-lg font-light text-primary leading-tight mb-1">{title}</h3>
    <p className="text-xs md:text-sm font-mono text-primary/70 leading-relaxed">{children}</p>
  </div>
);

const LeftTrackController = ({ sectionRef }: { sectionRef: React.RefObject<HTMLDivElement> }) => {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const track = section.querySelector<HTMLDivElement>('#scroll-left-track');
    if (!track) return;

    let raf: number | null = null;
    const update = () => {
      raf = null;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      // 3 blocks of 100vh inside, so total internal travel = 2 * 100vh
      const offset = progress * (2 * vh);
      track.style.transform = `translate3d(0, ${-offset}px, 0)`;
    };
    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sectionRef]);
  return null;
};
