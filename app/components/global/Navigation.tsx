import {useState, useEffect, useRef} from 'react';
import {Link, useLocation} from 'react-router';

const MENU_LINKS = [
  {label: 'Shop', to: '/collections/all'},
  {label: 'Collections', to: '/collections'},
  {label: 'About', to: '/about'},
  {label: 'Bag', to: '/cart'},
];

export function Navigation() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollRef = useRef(0);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setScrollProgress(y / maxScroll);
      setScrolled(y > 60);

      if (y > 200) {
        // Hide on scroll down, show on scroll up
        setVisible(y < lastScrollRef.current);
      } else {
        setVisible(true);
      }
      lastScrollRef.current = y;
    };

    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Coin spin: 2 full rotations across full-page scroll
  const coinAngle = scrollProgress * 720;
  // Distortion peaks at 90deg (edge-on), zero at 0/180deg (face-on)
  const glassScale = Math.abs(Math.sin((coinAngle * Math.PI) / 180)) * 56;
  const isSpinning = glassScale > 8;
  // Chromatic aberration shift in px, based on spin angle
  const caShift = Math.round(glassScale * 0.06);

  return (
    <>
      {/* SVG liquid glass filter -- always in DOM */}
      <svg
        aria-hidden="true"
        style={{
          position: 'fixed',
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <filter id="nav-glass" x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.002 0.008"
              numOctaves="1"
              seed="5"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={glassScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Nav bar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: '4.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1.5rem, 4vw, 3.5rem)',
          transition:
            'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease',
          transform: visible || menuOpen ? 'translateY(0)' : 'translateY(-100%)',
          background: scrolled ? 'rgba(8, 5, 20, 0.58)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
        }}
      >
        {/* Desktop left links */}
        <div
          className="nav-desktop-links"
          style={{display: 'flex', gap: '2.5rem', flex: 1}}
        >
          <NavLink to="/collections/all">Shop</NavLink>
          <NavLink to="/collections">Collections</NavLink>
        </div>


        {/* Right side */}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'flex-end',
          }}
        >
          <NavLink to="/about" className="nav-desktop-links">
            About
          </NavLink>
          {/* Desktop bag */}
          <Link
            to="/cart"
            className="nav-desktop-links"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.65rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--text-primary, #ffffff)',
              textDecoration: 'none',
              opacity: 0.7,
              transition: 'opacity 0.25s ease',
            }}
          >
            Bag
          </Link>
          {/* Mobile bag icon */}
          <Link
            to="/cart"
            className="nav-mobile-only"
            aria-label="Bag"
            style={{
              color: 'var(--text-primary, #fff)',
              textDecoration: 'none',
              lineHeight: 1,
              opacity: 0.85,
            }}
          >
            <BagIcon />
          </Link>
          {/* Hamburger -- mobile only */}
          <HamburgerButton
            open={menuOpen}
            onToggle={() => setMenuOpen((v) => !v)}
          />
        </div>
      </nav>

      {/* Full-screen menu overlay */}
      <FullScreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function NavLink({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      prefetch="intent"
      className={className}
      style={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.65rem',
        fontWeight: 400,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: 'var(--text-primary, #ffffff)',
        textDecoration: 'none',
        opacity: 0.7,
        transition: 'opacity 0.25s ease',
      }}
    >
      {children}
    </Link>
  );
}

function BagIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function HamburgerButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="nav-hamburger"
      onClick={onToggle}
      aria-label={open ? 'Close menu' : 'Open menu'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '5px',
        width: '34px',
        height: '34px',
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'block',
            height: '1px',
            width: i === 1 ? '65%' : '100%',
            background: 'var(--text-primary, #fff)',
            transformOrigin: 'center',
            transition: `transform 0.38s ease ${i === 1 ? '0s' : '0.04s'}, opacity 0.3s ease, width 0.3s ease`,
            opacity: i === 1 && open ? 0 : 1,
            transform:
              i === 0 && open
                ? 'translateY(6px) rotate(45deg)'
                : i === 2 && open
                  ? 'translateY(-6px) rotate(-45deg)'
                  : 'none',
          }}
        />
      ))}
    </button>
  );
}

function FullScreenMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99,
        background: 'rgba(5, 2, 14, 0.97)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(2rem, 8vw, 7rem)',
      }}
    >
      {MENU_LINKS.map(({label, to}, i) => (
        <Link
          key={to}
          to={to}
          onClick={onClose}
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 300,
            fontSize: 'clamp(2.2rem, 7vw, 5rem)',
            letterSpacing: '0.04em',
            lineHeight: 1.05,
            color: '#ffffff',
            textDecoration: 'none',
            padding: '0.3rem 0',
            opacity: open ? 1 : 0,
            transform: open ? 'translateX(0)' : 'translateX(-28px)',
            transition: `opacity 0.55s ease ${i * 0.07 + 0.06}s, transform 0.55s ease ${i * 0.07 + 0.06}s`,
          }}
        >
          {label}
          {/* Hairline underline that draws in */}
          <span
            style={{
              display: 'block',
              height: '1px',
              width: open ? '100%' : '0%',
              background: 'rgba(255,255,255,0.10)',
              transition: `width 0.55s ease ${i * 0.07 + 0.22}s`,
              marginTop: '0.25rem',
            }}
          />
        </Link>
      ))}

      {/* Footer detail */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(2rem, 5vw, 4rem)',
          left: 'clamp(2rem, 8vw, 7rem)',
          right: 'clamp(2rem, 8vw, 7rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          opacity: open ? 0.5 : 0,
          transition: `opacity 0.5s ease 0.42s`,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          Instagram &nbsp;&nbsp; Pinterest
        </span>
        <span
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 300,
            fontSize: '0.72rem',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          House of An
        </span>
      </div>
    </div>
  );
}
