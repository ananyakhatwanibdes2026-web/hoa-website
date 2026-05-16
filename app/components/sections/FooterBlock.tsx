export default function FooterBlock() {
  const year = new Date().getFullYear();

  return (
    <>
      <style>{`
        .tf-footer {
          position: relative;
          z-index: 2;
          background: #000000;
        }

        .tf-footer-inner {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: clamp(56px, 7vw, 96px) clamp(24px, 5vw, 48px) 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
        }

        .tf-footer-brand {
          text-align: center;
        }

        .tf-footer-brand-name {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(22px, 2.6vw, 30px);
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
          margin: 0;
        }

        .tf-footer-socials {
          display: flex;
          gap: 32px;
          justify-content: center;
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

        .tf-footer-divider {
          width: 100%;
          height: 1px;
          background: rgba(148, 175, 228, 0.18);
          margin: 4px 0;
        }

        .tf-footer-bottom {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .tf-footer-copyright {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.22);
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
          color: rgba(255, 255, 255, 0.22);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .tf-footer-policy-link:hover {
          color: rgba(255, 255, 255, 0.55);
        }

        @media (max-width: 640px) {
          .tf-footer-bottom {
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
        }
      `}</style>

      <footer className="tf-footer">
        <div className="tf-footer-inner">
          <div className="tf-footer-brand">
            <p className="tf-footer-brand-name">House of An</p>
            <p className="tf-footer-brand-tagline">
              Contemporary luxury jewellery.
              <br />
              Sculpted for the refined rebellion.
            </p>
          </div>

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

          <div className="tf-footer-divider" />

          <div className="tf-footer-bottom">
            <span className="tf-footer-copyright">
              &copy; {year} House of An. All rights reserved.
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
