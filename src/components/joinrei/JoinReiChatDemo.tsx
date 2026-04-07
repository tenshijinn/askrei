import { useState, useEffect } from 'react';
import { ScrollFadeIn } from './ScrollFadeIn';

const chatMessages = [
  { role: 'rei', text: 'Hey! I found a task that matches your skills. Interested?' },
  { role: 'talent', text: 'What is it?' },
  { role: 'rei', text: 'Community activation for a DAO. Short scope. Paid in SOL.' },
  { role: 'talent', text: "I'm in. Send me the details." },
];

export const JoinReiChatDemo = () => {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (isInView && visibleMessages < chatMessages.length) {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages, isInView]);

  return (
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] py-20">
      <div className="container mx-auto px-8 lg:px-16">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-primary text-center mb-4">
            How it works
          </h2>
        </ScrollFadeIn>

        <ScrollFadeIn delay={200}>
          <div 
            className="max-w-3xl mx-auto mt-12"
            ref={(el) => {
              if (el) {
                const observer = new IntersectionObserver(([entry]) => {
                  if (entry.isIntersecting) setIsInView(true);
                }, { threshold: 0.3 });
                observer.observe(el);
              }
            }}
          >
            <div className="rei-terminal rounded-2xl overflow-hidden border-[0.5px] border-white/10">
              <div className="p-8 space-y-6 min-h-[400px]">
                {chatMessages.slice(0, visibleMessages).map((msg, index) => (
                  <div key={index} className="animate-fade-in">
                    <div className="flex items-start gap-4">
                      <span className={`btn-manga text-xs px-3 py-1 shrink-0 ${
                        msg.role === 'rei' 
                          ? 'btn-manga-primary' 
                          : 'btn-manga-outline'
                      }`}>
                        {msg.role === 'rei' ? 'Rei' : 'Talent'}
                      </span>
                      <p className="text-cream font-mono text-lg pt-0.5">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {isInView && visibleMessages < chatMessages.length && (
                  <div className="flex items-center gap-4">
                    <span className="btn-manga btn-manga-outline text-xs px-3 py-1">
                      {chatMessages[visibleMessages].role === 'rei' ? 'Rei' : 'Talent'}
                    </span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button 
                className="btn-manga btn-manga-primary flex items-center gap-3 px-8 py-3"
                onClick={() => window.location.href = '/rei'}
              >
                Promote Task
              </button>
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
};