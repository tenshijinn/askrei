import arubaito from '@/assets/joinrei/logo-bar-arubaito.png';
import ignyte from '@/assets/joinrei/logo-bar-ignyte.png';
import solanaFoundation from '@/assets/joinrei/logo-bar-solana-foundation.png';
import colossium from '@/assets/joinrei/logo-bar-colossium.png';

export const LogoBar = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center bg-[#0a0a0a]">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="flex items-center justify-around gap-6 md:gap-10 lg:gap-16 flex-wrap">
          <img
            src={arubaito}
            alt="Arubaito - Private Members Network Club"
            className="h-16 md:h-20 lg:h-24 xl:h-28 w-auto object-contain opacity-90"
          />
          <img
            src={ignyte}
            alt="IGNYTE - 1 of 15 Shortlisted / 3000 Applicants"
            className="h-16 md:h-20 lg:h-24 xl:h-28 w-auto object-contain opacity-90"
          />
          <img
            src={solanaFoundation}
            alt="Solana Foundation"
            className="h-16 md:h-20 lg:h-24 xl:h-28 w-auto object-contain opacity-90"
          />
          <a
            href="https://arena.colosseum.org/projects/explore/rei"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-100 opacity-90"
          >
            <img
              src={colossium}
              alt="Colosseum Frontier"
              className="h-16 md:h-20 lg:h-24 xl:h-28 w-auto object-contain"
            />
          </a>
        </div>
      </div>
    </section>
  );
};
