import { TypewriterButton } from '@/components/buttons/TypewriterButton';
import { ScrambleButton } from '@/components/buttons/ScrambleButton';
import { LottieOverlayButton } from '@/components/buttons/LottieOverlayButton';
import { FullLottieLabelButton } from '@/components/buttons/FullLottieLabelButton';

const fire = (name: string) => () => {
  console.log(`[button-lab] ${name} clicked`);
};

const Row = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <div className="border border-white/10 rounded-2xl p-8 bg-[#141414]/60 flex flex-col md:flex-row items-start md:items-center gap-6">
    <div className="flex-1">
      <div className="text-primary font-mono text-sm uppercase tracking-wider">{title}</div>
      <div className="text-cream/50 font-mono text-xs mt-1">{subtitle}</div>
    </div>
    <div>{children}</div>
  </div>
);

const ButtonLab = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-primary p-8 md:p-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2">Button Lab</h1>
        <p className="text-cream/60 font-mono text-sm mb-10">
          Hover each, then click. All four navigate after a brief <code>{'> running…'}</code> flash.
        </p>

        <div className="flex flex-col gap-5">
          <Row title="1. Typewriter" subtitle="pure JS — no dependencies, lightest weight">
            <TypewriterButton label="Promote Task" onAction={fire('typewriter')} />
          </Row>
          <Row title="2. Scramble / glitch" subtitle="pure JS — matrix-style glyph cycling">
            <ScrambleButton label="Promote Task" onAction={fire('scramble')} />
          </Row>
          <Row title="3. Lottie overlay" subtitle="lottie-react + 3 small .json files (caret, scanline, loader)">
            <LottieOverlayButton label="Promote Task" onAction={fire('lottie-overlay')} />
          </Row>
          <Row title="4. Full Lottie label" subtitle="label itself is a stroke-drawn animation; loader is a .json">
            <FullLottieLabelButton label="Promote Task" onAction={fire('full-lottie')} />
          </Row>
        </div>

        <p className="text-cream/40 font-mono text-xs mt-10">
          Tell me which one you want and I'll wire it into your real CTAs (and remove this page).
        </p>
      </div>
    </div>
  );
};

export default ButtonLab;
