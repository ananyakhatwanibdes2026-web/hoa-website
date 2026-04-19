import {useState, useEffect} from 'react';

const LINES = [
  'Contemporary Luxury',
  'Recycled Silver',
  'Made in India',
  'Est. 2024',
  'House of An',
];

export function AmbientTicker() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % LINES.length);
        setVisible(true);
      }, 500);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="at-ambient-ticker"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        padding: '2.2rem 2.5rem',
        zIndex: 88,
        mixBlendMode: 'color-dodge',
        pointerEvents: 'none',
        maskImage: 'linear-gradient(to top, white 0%, white 65%, transparent 88%)',
        WebkitMaskImage: 'linear-gradient(to top, white 0%, white 65%, transparent 88%)',
      }}
    >
      {LINES.map((line, i) => (
        <div
          key={line}
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.55rem',
            letterSpacing: '0.30em',
            textTransform: 'uppercase',
            color: 'rgba(140, 170, 255, 0.88)',
            lineHeight: 2.2,
            opacity: i === activeIndex ? (visible ? 1 : 0) : 0.18,
            transition: 'opacity 0.5s ease',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}
