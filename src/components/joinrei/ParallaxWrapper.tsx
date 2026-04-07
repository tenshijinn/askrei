import { useRef, useEffect, useState, ReactNode } from 'react';

interface ParallaxWrapperProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxWrapper = ({ 
  children, 
  speed = 0.3,
  className = '' 
}: ParallaxWrapperProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrolled = (window.innerHeight - rect.top) * speed;
        setOffset(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div 
      ref={ref} 
      className={className}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
};