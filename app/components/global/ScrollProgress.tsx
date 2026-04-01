import {useEffect, useState} from 'react';

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };

    window.addEventListener('scroll', handleScroll, {passive: true});
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '2px',
        width: `${progress * 100}%`,
        background:
          'linear-gradient(90deg, #b8860b, #daa520, #ffd700, #daa520, #b8860b)',
        zIndex: 9997,
        pointerEvents: 'none',
        transformOrigin: 'left',
      }}
    />
  );
}
