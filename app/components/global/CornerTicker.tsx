const TICKER_TEXT =
  'RECYCLED SILVER  --  MADE IN MUMBAI  --  READY TO SHIP  --  EST. 2024  --  HOUSE OF AN  --  ';

export function CornerTicker() {
  return (
    <>
      <style>{`
        @keyframes at-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="at-corner-ticker"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: 0,
          width: '260px',
          overflow: 'hidden',
          zIndex: 88,
          mixBlendMode: 'color-dodge',
          pointerEvents: 'none',
          maskImage: 'linear-gradient(to left, white 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, white 55%, transparent 100%)',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            animation: 'at-ticker 22s linear infinite',
          }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.50rem',
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'rgba(140, 170, 255, 0.85)',
            }}
          >
            {TICKER_TEXT}
            {TICKER_TEXT}
          </span>
        </div>
      </div>
    </>
  );
}
