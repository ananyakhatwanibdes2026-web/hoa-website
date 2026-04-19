import {useEffect, useMemo, useState} from 'react';
import {useLocation} from 'react-router';
import {getLenis} from '~/components/global/SmoothScroll';

type Link = {
  label: string;
  targetIds: string[];
  scrollTo: string; // 'top' or a DOM id
};

const LINKS: Link[] = [
  {label: 'Home', targetIds: ['section-hero'], scrollTo: 'top'},
  {label: 'About', targetIds: ['section-about'], scrollTo: 'section-about'},
  {
    label: 'Bestsellers',
    targetIds: ['section-bs-title', 'section-bestsellers'],
    scrollTo: 'section-bs-title',
  },
  {
    label: 'Categories',
    targetIds: ['section-categories'],
    scrollTo: 'section-categories',
  },
  {label: 'The Why', targetIds: ['section-why'], scrollTo: 'section-why'},
  {
    label: 'Campaign',
    targetIds: ['section-campaign'],
    scrollTo: 'section-campaign',
  },
  {label: 'Lookbook', targetIds: ['section-lookbook'], scrollTo: 'section-lookbook'},
];

export function SideRail() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [activeLabel, setActiveLabel] = useState('Home');

  const idToLabel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const link of LINKS) {
      for (const id of link.targetIds) map[id] = link.label;
    }
    return map;
  }, []);

  useEffect(() => {
    if (!isHome) return;
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const nodes: Element[] = [];
    for (const id of Object.keys(idToLabel)) {
      const el = document.getElementById(id);
      if (el) nodes.push(el);
    }
    if (nodes.length === 0) return;

    let current = activeLabel;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const label = idToLabel[entry.target.id];
          if (label && label !== current) {
            current = label;
            setActiveLabel(label);
          }
        }
      },
      {rootMargin: '-45% 0px -45% 0px', threshold: 0},
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [isHome, idToLabel]);

  if (!isHome) return null;

  function handleClick(e: React.MouseEvent, target: string) {
    e.preventDefault();
    const lenis = getLenis();
    if (target === 'top') {
      if (lenis) lenis.scrollTo(0, {duration: 1.4});
      else window.scrollTo({top: 0, behavior: 'smooth'});
      return;
    }
    const el = document.getElementById(target);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, {offset: 0, duration: 1.4});
    else el.scrollIntoView({behavior: 'smooth'});
  }

  return (
    <nav
      className="at-side-rail"
      aria-label="Section navigation"
      style={{
        position: 'fixed',
        left: '32px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.6rem',
        pointerEvents: 'auto',
      }}
    >
      {LINKS.map(({label, scrollTo}) => {
        const isActive = label === activeLabel;
        const href = scrollTo === 'top' ? '#top' : `#${scrollTo}`;
        return (
          <a
            key={label}
            href={href}
            onClick={(e) => handleClick(e, scrollTo)}
            aria-current={isActive ? 'true' : undefined}
            style={{
              textDecoration: 'none',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: isActive ? 500 : 400,
              fontSize: isActive ? '0.98rem' : '0.82rem',
              letterSpacing: isActive ? '0.32em' : '0.28em',
              textTransform: 'uppercase',
              color: isActive ? '#ffffff' : 'var(--at-accent-bright)',
              opacity: isActive ? 1 : 0.48,
              transform: isActive ? 'translateX(16px)' : 'translateX(0)',
              transition:
                'opacity 0.28s ease, transform 0.28s ease, font-size 0.28s ease, letter-spacing 0.28s ease, color 0.28s ease, font-weight 0.28s ease, text-shadow 0.28s ease',
              textShadow: isActive
                ? '0 0 12px rgba(156,165,255,0.75), 0 0 28px rgba(156,165,255,0.35)'
                : 'none',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 1.1,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.opacity = '1';
              if (!isActive) el.style.transform = 'translateX(8px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.opacity = isActive ? '1' : '0.48';
              el.style.transform = isActive ? 'translateX(16px)' : 'translateX(0)';
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: isActive ? '22px' : '0px',
                marginRight: isActive ? '10px' : '0px',
                height: '1px',
                background: 'rgba(255,255,255,0.85)',
                boxShadow: '0 0 8px rgba(156,165,255,0.7)',
                opacity: isActive ? 1 : 0,
                transition:
                  'width 0.28s ease, margin-right 0.28s ease, opacity 0.28s ease',
              }}
            />
            {label}
          </a>
        );
      })}
    </nav>
  );
}
