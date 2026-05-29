export const HomeVideoDemo = () => {
  return (
    <section className="min-h-screen snap-start relative flex flex-col items-center justify-center bg-[#0a0a0a] p-6 md:p-12">
      <h2 className="text-3xl md:text-4xl font-heading text-cream mb-8 tracking-wide">
        Watch Rei in Action
      </h2>
      <div className="w-full max-w-5xl aspect-video relative rounded-lg overflow-hidden border border-cream/20 shadow-2xl">
        <iframe
          src="https://www.canva.com/design/DAHKI5RMgpk/JhCwsjTLamgO1GiW_YOtcQ/watch?embed"
          allow="fullscreen; clipboard-write"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full border-0"
          title="Rei demo walkthrough"
        />
      </div>
    </section>
  );
};
