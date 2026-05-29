import { ScrollFadeIn } from './ScrollFadeIn';

export const HomeVideoDemo = () => {
  return (
    <section className="min-h-screen snap-start relative flex flex-col items-center justify-center bg-[#0a0a0a] px-6 py-16 lg:py-24">
      <ScrollFadeIn>
        <h2 className="text-cream text-3xl md:text-5xl font-bold mb-8 text-center tracking-tight">
          See Rei in Action
        </h2>
      </ScrollFadeIn>
      <ScrollFadeIn delay={150}>
        <div
          className="relative w-full max-w-5xl mx-auto"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            src="https://www.canva.com/design/DAHKI5RMgpk/JhCwsjTLamgO1GiW_YOtcQ/view?embed"
            allow="fullscreen"
            allowFullScreen
            loading="lazy"
            title="Rei demo"
            className="absolute inset-0 w-full h-full border-0 rounded-lg shadow-2xl"
          />
        </div>
      </ScrollFadeIn>
    </section>
  );
};
