import { ScrollFadeIn } from './ScrollFadeIn';

export const HomeVideoDemo = () => {
  return (
    <section className="min-h-screen snap-start relative flex flex-col items-center justify-center bg-[#0a0a0a] px-6 py-16 lg:py-24">
      <ScrollFadeIn>
        <h2 className="text-cream text-3xl md:text-5xl font-bold mb-8 text-center tracking-tight">
          See Rei in Action
        </h2>
      </ScrollFadeIn>
      <ScrollFadeIn delay={150} className="w-full">
        <div
          className="relative w-full max-w-5xl mx-auto"
          style={{ paddingTop: '56.25%' }}
        >
          <iframe
            src="https://www.canva.com/design/DAHKI5RMgpk/JhCwsjTLamgO1GiW_YOtcQ/watch?embed"
            allow="fullscreen; autoplay"
            allowFullScreen
            loading="lazy"
            title="Rei demo"
            className="absolute inset-0 w-full h-full border-0 rounded-lg shadow-2xl bg-black"
          />
        </div>
        <p className="text-cream/60 text-sm text-center mt-4">
          Trouble viewing?{' '}
          <a
            href="https://www.canva.com/design/DAHKI5RMgpk/JhCwsjTLamgO1GiW_YOtcQ/watch"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-cream"
          >
            Open the demo on Canva
          </a>
        </p>
      </ScrollFadeIn>
    </section>
  );
};
