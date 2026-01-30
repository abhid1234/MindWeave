'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;

    const handleScroll = () => {
      setVisible(main.scrollTop > 300);
    };

    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const main = document.getElementById('main-content');
    main?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-24 right-4 lg:bottom-8 z-40 rounded-full bg-primary p-2.5 text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
