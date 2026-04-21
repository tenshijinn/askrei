import arubaito from '@/assets/joinrei/logo-bar-arubaito.png';
import ignyte from '@/assets/joinrei/logo-bar-ignyte.png';
import solanaFoundation from '@/assets/joinrei/logo-bar-solana-foundation.png';
import colossium from '@/assets/joinrei/logo-bar-colossium.png';

export const LogoBar = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center bg-[#0a0a0a]">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="flex flex-col md:flex-row items-center justify-around gap-10 md:gap-6 lg:gap-10 md:flex-nowrap">
          <a
            href="https://arubaito.app"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-100 opacity-90 flex-shrink"
          >
            <img
              src={arubaito}
              alt="Arubaito - Private Members Network Club"
              className="h-14 md:h-12 lg:h-16 xl:h-20 w-auto object-contain"
            />
          </a>
          <img
            src={ignyte}
            alt="IGNYTE - 1 of 15 Shortlisted / 3000 Applicants"
            className="h-14 md:h-12 lg:h-16 xl:h-20 w-auto object-contain opacity-90 flex-shrink"
          />
          <img
            src={solanaFoundation}
            alt="Solana Foundation"
            className="h-14 md:h-12 lg:h-16 xl:h-20 w-auto object-contain opacity-90 flex-shrink"
          />
          <a
            href="https://arena.colosseum.org/projects/explore/rei"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-100 opacity-90 flex-shrink"
          >
            <img
              src={colossium}
              alt="Colosseum Frontier"
              className="h-14 md:h-12 lg:h-16 xl:h-20 w-auto object-contain"
            />
          </a>
        </div>
      </div>
    </section>
  );
};
