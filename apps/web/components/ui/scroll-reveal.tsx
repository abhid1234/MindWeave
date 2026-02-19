'use client';

import { useEffect, useRef, useState } from 'react';

type Animation = 'fade-up' | 'fade-in' | 'scale-in';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: Animation;
  delay?: number;
}

const animationClass: Record<Animation, string> = {
  'fade-up': 'animate-fade-up',
  'fade-in': 'animate-fade-in',
  'scale-in': 'animate-scale-in',
};

export function ScrollReveal({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setPrefersReducedMotion(true);
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={`${isVisible ? animationClass[animation] : 'opacity-0'} ${className}`}
      style={isVisible && delay > 0 ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
    >
      {children}
    </div>
  );
}
