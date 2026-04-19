import {useLocation} from 'react-router';
import {getLenis} from '~/components/global/SmoothScroll';

const LINKS = [
  {label: 'Bestsellers', anchorId: 'section-bestsellers'},
  {label: 'Collections', anchorId: 'section-categories'},
  {label: 'Lookbook', anchorId: 'section-lookbook'},
  {label: 'About', anchorId: 'section-about'},
];

export function SideRail() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  if (!isHome) return null;

  function scrollTo(anchorId: string) {
    const el = document.getElementById(anchorId);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(el, {offset: 0, duration: 1.4});
    } else {
      el.scrollIntoView({behavior: 'smooth'});
    }
  }

  return (
    <div
      className="at-side-rail"
      style={{
        position: 'fixed',
        left: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        pointerEvents: 'auto',
      }}
    >
      {LINKS.map(({label, anchorId}) => (
        <button
          key={anchorId}
          onClick={() => scrollTo(anchorId)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.52rem',
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--at-accent-bright)',
            opacity: 0.5,
            transition: 'opacity 0.22s ease, transform 0.22s ease',
            textAlign: 'left',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.opacity = '1';
            el.style.transform = 'translateX(7px)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.opacity = '0.5';
            el.style.transform = 'translateX(0)';
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
