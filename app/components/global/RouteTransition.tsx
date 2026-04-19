import {useNavigation} from 'react-router';
import {useEffect, useRef} from 'react';

export function RouteTransition() {
  const navigation = useNavigation();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    if (navigation.state === 'loading') {
      el.style.transition = 'opacity 0.25s ease-in';
      el.style.opacity = '1';
      el.style.pointerEvents = 'all';
    } else {
      el.style.transition = 'opacity 0.45s ease-out';
      el.style.opacity = '0';
      // Delay removing pointer events until after fade
      const t = setTimeout(() => {
        if (el) el.style.pointerEvents = 'none';
      }, 500);
      return () => clearTimeout(t);
    }
  }, [navigation.state]);

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#000000',
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
