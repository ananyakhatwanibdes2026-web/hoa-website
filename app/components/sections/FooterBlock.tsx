import {useState, useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FOOTER_LINKS = {
  shop: [
    {label: 'All Jewellery', href: '/collections/all'},
    {label: 'Edge Collection', href: '/collections/edge'},
    {label: 'Sculpt Collection', href: '/collections/sculpt'},
    {label: 'Elite Collection', href: '/collections/elite'},
    {label: 'New Arrivals', href: '/collections/new'},
  ],
  support: [
    {label: 'Contact Us', href: '/pages/contact'},
    {label: 'Shipping & Returns', href: '/policies/shipping-policy'},
    {label: 'FAQ', href: '/pages/faq'},
    {label: 'Care Guide', href: '/pages/care'},
    {label: 'Size Guide', href: '/pages/size-guide'},
  ],
  explore: [
    {label: 'Our Story', href: '/pages/about'},
    {label: 'Lookbook', href: '/pages/lookbook'},
    {label: 'Campaign', href: '/pages/campaign'},
    {label: 'Sustainability', href: '/pages/sustainability'},
    {label: 'Press', href: '/pages/press'},
  ],
};

export default function FooterBlock() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const arcRef1 = useRef<SVGPathElement>(null!);
  const arcRef2 = useRef<SVGPathElement>(null!);
  const ghostRef = useRef<HTMLDivElement>(null!);
  const footerRef = useRef<HTMLElement>(null!);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const ctx = gsap.context(() => {
      // ── Arc path draw-in ───────────────────────────────────────────────────
      [arcRef1.current, arcRef2.current].forEach((path, i) => {
        if (!path) return;
        const len = path.getTotalLength();
        gsap.set(path, {strokeDasharray: len, strokeDashoffset: len});
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 2.2 + i * 0.4,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: footer,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
        });
      });

      // ── Ghost AN slow drift ────────────────────────────────────────────────
      if (ghostRef.current) {
        gsap.fromTo(
          ghostRef.current,
          {opacity: 0, y: 20},
          {
            opacity: 1,
            y: 0,
            duration: 1.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: footer,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          },
        );
        // Subtle parallax on ghost AN while scrolling through footer
        gsap.to(ghostRef.current, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: footer,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      }
    }, footer);

    return () => ctx.revert();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  return (
    <>
      <style>{`
        .tf-footer {
          position: relative;
          z-index: 2;
          background: #000000;
          overflow: hidden;
        }

        /* SVG arc container */
        .tf-footer-arcs {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          pointer-events: none;
        }

        /* Ghost "AN" watermark */
        .tf-ghost-logo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(160px, 28vw, 380px);
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.022);
          pointer-events: none;
          user-select: none;
          line-height: 1;
          white-space: nowrap;
          will-change: transform;
        }

        .tf-footer-inner {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: clamp(80px, 10vw, 120px) clamp(24px, 5vw, 80px) 0;
        }

        .tf-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr 1.6fr;
          gap: clamp(20px, 3vw, 48px);
          padding-bottom: clamp(48px, 6vw, 80px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .tf-footer-col-heading {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: rgba(148, 175, 228, 0.72);
          margin: 0 0 24px;
        }

        .tf-footer-brand-name {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(22px, 2.8vw, 32px);
          font-weight: 300;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.92);
          margin: 0 0 12px;
        }

        .tf-footer-brand-tagline {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.06em;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.32);
          margin: 0 0 28px;
          max-width: 220px;
        }

        .tf-footer-socials {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .tf-footer-social-link {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.38);
          text-decoration: none;
          transition: color 0.24s ease, letter-spacing 0.3s ease;
        }

        .tf-footer-social-link:hover {
          color: rgba(205, 218, 250, 0.92);
          letter-spacing: 0.18em;
        }

        .tf-footer-nav-link {
          display: block;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 300;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.44);
          text-decoration: none;
          margin-bottom: 14px;
          transition: color 0.22s ease, transform 0.22s ease;
          transform-origin: left center;
        }

        .tf-footer-nav-link:hover {
          color: rgba(255, 255, 255, 0.88);
          transform: translateX(4px);
        }

        /* Newsletter */
        .tf-newsletter-desc {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 300;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.32);
          margin: 0 0 20px;
        }

        .tf-newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tf-newsletter-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-radius: 2px;
          padding: 11px 14px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.82);
          outline: none;
          transition: border-color 0.24s ease, background 0.24s ease;
          box-sizing: border-box;
        }

        .tf-newsletter-input::placeholder {
          color: rgba(255, 255, 255, 0.22);
        }

        .tf-newsletter-input:focus {
          border-color: rgba(128, 168, 228, 0.48);
          background: rgba(128, 168, 228, 0.05);
        }

        .tf-newsletter-btn {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(148, 175, 228, 0.45);
          border-radius: 2px;
          padding: 11px 14px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(148, 175, 228, 0.82);
          cursor: pointer;
          transition: background 0.24s ease, color 0.24s ease, border-color 0.24s ease;
        }

        .tf-newsletter-btn:hover {
          background: rgba(148, 175, 228, 0.10);
          border-color: rgba(148, 175, 228, 0.75);
          color: rgba(200, 218, 252, 0.95);
        }

        .tf-newsletter-success {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 300;
          color: rgba(148, 205, 172, 0.82);
          letter-spacing: 0.06em;
        }

        /* Bottom bar */
        .tf-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0 28px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .tf-footer-copyright {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.18);
        }

        .tf-footer-policy-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .tf-footer-policy-link {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.18);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .tf-footer-policy-link:hover {
          color: rgba(255, 255, 255, 0.48);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .tf-footer-grid {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 32px;
          }
        }

        @media (max-width: 640px) {
          .tf-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 28px 20px;
          }
          .tf-footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <footer className="tf-footer" ref={footerRef}>
        {/* Steel-blue arc lines at the top edge -- draw in on scroll */}
        <svg
          className="tf-footer-arcs"
          viewBox="0 0 1440 90"
          height="90"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            ref={arcRef1}
            d="M -60 90 Q 720 -20 1500 90"
            stroke="rgba(148,175,228,0.18)"
            strokeWidth="1"
            fill="none"
          />
          <path
            ref={arcRef2}
            d="M -60 90 Q 720 -56 1500 90"
            stroke="rgba(100,140,215,0.10)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Ghost "AN" watermark */}
        <div className="tf-ghost-logo" ref={ghostRef} aria-hidden="true">
          AN
        </div>

        <div className="tf-footer-inner">
          <div className="tf-footer-grid">
            {/* Col 1: Brand + socials */}
            <div>
              <p className="tf-footer-brand-name">House of An</p>
              <p className="tf-footer-brand-tagline">
                Contemporary luxury jewellery.
                <br />
                Sculpted for the refined rebellion.
              </p>
              <div className="tf-footer-socials">
                <a
                  href="https://instagram.com"
                  className="tf-footer-social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
                <a
                  href="https://pinterest.com"
                  className="tf-footer-social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pinterest
                </a>
                <a
                  href="https://twitter.com"
                  className="tf-footer-social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
              </div>
            </div>

            {/* Col 2: Shop */}
            <div>
              <p className="tf-footer-col-heading">Shop</p>
              {FOOTER_LINKS.shop.map((link) => (
                <a key={link.href} href={link.href} className="tf-footer-nav-link">
                  {link.label}
                </a>
              ))}
            </div>

            {/* Col 3: Support */}
            <div>
              <p className="tf-footer-col-heading">Support</p>
              {FOOTER_LINKS.support.map((link) => (
                <a key={link.href} href={link.href} className="tf-footer-nav-link">
                  {link.label}
                </a>
              ))}
            </div>

            {/* Col 4: Explore */}
            <div>
              <p className="tf-footer-col-heading">Explore</p>
              {FOOTER_LINKS.explore.map((link) => (
                <a key={link.href} href={link.href} className="tf-footer-nav-link">
                  {link.label}
                </a>
              ))}
            </div>

            {/* Col 5: Newsletter */}
            <div>
              <p className="tf-footer-col-heading">Stay in the Loop</p>
              <p className="tf-newsletter-desc">
                New drops, behind-the-scenes, and stories
                from the atelier -- straight to your inbox.
              </p>
              {subscribed ? (
                <p className="tf-newsletter-success">
                  You&apos;re on the list. Welcome to the rebellion.
                </p>
              ) : (
                <form className="tf-newsletter-form" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    className="tf-newsletter-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-label="Email address for newsletter"
                  />
                  <button type="submit" className="tf-newsletter-btn">
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="tf-footer-bottom">
            <span className="tf-footer-copyright">
              &copy; {new Date().getFullYear()} House of An. All rights reserved.
            </span>
            <div className="tf-footer-policy-links">
              <a href="/policies/privacy-policy" className="tf-footer-policy-link">
                Privacy Policy
              </a>
              <a href="/policies/refund-policy" className="tf-footer-policy-link">
                Refund Policy
              </a>
              <a href="/policies/terms-of-service" className="tf-footer-policy-link">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
