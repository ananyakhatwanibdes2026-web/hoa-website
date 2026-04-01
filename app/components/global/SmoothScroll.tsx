import {useEffect} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Module-level singleton so other components can access lenis imperatively
// via useLenis() without needing React context (avoids wrapping Hydrogen providers)
let lenisInstance: InstanceType<
  typeof import('lenis')['default']
> | null = null;

export function getLenis() {
  return lenisInstance;
}

export function useLenis() {
  return lenisInstance;
}

export function SmoothScroll() {
  useEffect(() => {
    // Dynamic import keeps lenis out of the SSR bundle entirely
    import('lenis').then(({default: Lenis}) => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
      });

      lenisInstance = lenis;

      // Sync GSAP ScrollTrigger with Lenis scroll position
      lenis.on('scroll', ScrollTrigger.update);

      const rafCallback = (time: number) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(rafCallback);
      gsap.ticker.lagSmoothing(0);

      // Store cleanup refs on the lenis object so the return fn can reach them
      (lenis as any)._gsapRafCallback = rafCallback;
    });

    return () => {
      if (lenisInstance) {
        const cb = (lenisInstance as any)._gsapRafCallback;
        if (cb) gsap.ticker.remove(cb);
        lenisInstance.destroy();
        lenisInstance = null;
      }
    };
  }, []);

  return null;
}
