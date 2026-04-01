import {useEffect, useState} from 'react';
import {SmoothScroll} from './SmoothScroll';
import {BackgroundJourney} from './BackgroundJourney';
import {ChromeCursor} from './ChromeCursor';
import {GrainOverlay} from './GrainOverlay';
import {ScrollProgress} from './ScrollProgress';

function ClientOnly({children}: {children: React.ReactNode}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

// Standalone overlay component -- does NOT wrap or affect the Hydrogen provider tree.
// Rendered once inside Layout's <body> as a sibling to the main app content.
export function GlobalEffects() {
  return (
    <ClientOnly>
      <SmoothScroll />
      <BackgroundJourney />
      <ChromeCursor />
      <GrainOverlay />
      <ScrollProgress />
    </ClientOnly>
  );
}
