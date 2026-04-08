import { ScrollFadeIn } from './ScrollFadeIn';

const demos = [
  {
    title: 'PROOF OF HUMANITY/TALENT',
    subtitle: 'Users Share Skills + On-Chain Experience',
    video: '/joinrei/1-rei-video.mp4',
  },
  {
    title: 'FIND TASKS MATCHED TO SKILLS',
    subtitle: 'Rei matches tasks to their skills.',
    video: '/joinrei/2-rei-video.mp4',
  },
  {
    title: 'POST TASKS | CHATBOT OR X',
    subtitle: 'Post + Pay from Chatbot or X',
    video: '/joinrei/3-rei-video.mp4',
  },
];

export const HomeDemoSection = () => {
  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {demos.map((demo, index) => (
            <ScrollFadeIn key={demo.title} delay={index * 150}>
              <div className="flex flex-col items-center text-center">
                <h3 className="text-xs md:text-sm font-light text-primary mb-1 tracking-wide whitespace-nowrap">
                  {demo.title}
                </h3>
                <p className="text-xs text-cream/70 font-mono mb-4 whitespace-nowrap">
                  {demo.subtitle}
                </p>
                <div className="w-full aspect-[552/816] rounded-2xl overflow-hidden border-[0.5px] border-white/10 bg-black">
                  <video
                    src={demo.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        <ScrollFadeIn delay={500}>
          <div className="flex justify-center mt-8">
            <button 
              className="btn-manga btn-manga-primary px-8 py-3"
              onClick={() => window.location.href = '/rei'}
            >
              Signup
            </button>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};
