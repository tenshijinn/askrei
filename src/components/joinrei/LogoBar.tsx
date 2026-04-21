import arubaito from '@/assets/joinrei/logo-bar-arubaito.png';
import ignyte from '@/assets/joinrei/logo-bar-ignyte.png';
import solanaFoundation from '@/assets/joinrei/logo-bar-solana-foundation.png';
import colossium from '@/assets/joinrei/logo-bar-colossium.png';

export const LogoBar = () => {
  return (
    <section className="w-full bg-black border-y border-primary/10 py-6 lg:py-8">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="flex items-center justify-around gap-6 md:gap-10 flex-wrap">
          <img
            src={arubaito}
            alt="Arubaito - Private Members Network Club"
            className="h-10 md:h-12 lg:h-14 w-auto object-contain opacity-90"
          />
          <img
            src={ignyte}
            alt="IGNYTE - 1 of 15 Shortlisted / 3000 Applicants"
            className="h-10 md:h-12 lg:h-14 w-auto object-contain opacity-90"
          />
          <img
            src={solanaFoundation}
            alt="Solana Foundation"
            className="h-10 md:h-12 lg:h-14 w-auto object-contain opacity-90"
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
              className="h-10 md:h-12 lg:h-14 w-auto object-contain"
            />
          </a>
        </div>
      </div>
    </section>
  );
};
