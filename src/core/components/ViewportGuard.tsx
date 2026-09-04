import React, { useEffect, useState } from 'react';

/**
 * Minimum interactive viewport (Viewport & UI Scaling spec): below either
 * dimension the experience is NOT rendered — a dedicated incompatible-screen
 * message replaces the whole app instead. These are CSS pixels (window
 * inner size), independent of devicePixelRatio.
 */
const MIN_WIDTH = 960;
const MIN_HEIGHT = 540;

/** True when the current window meets the 960×540 floor. */
const isSupported = () => window.innerWidth >= MIN_WIDTH && window.innerHeight >= MIN_HEIGHT;

interface ViewportGuardProps {
  children: React.ReactNode;
}

/**
 * ViewportGuard — app-root gate for the interactive experience.
 *
 * The experience is authored in a fixed 1280×720 design space and uniformly
 * scaled down to a 0.75× minimum (see ViewportScaler, which sits inside the
 * lesson route). Below that the composition cannot stay usable, so instead
 * of scaling it further the whole app is replaced by the incompatible-screen
 * message. The gate sits ABOVE the routes in App.tsx, so on an unsupported
 * viewport the children (including the lazy-loaded three/R3F lesson chunk)
 * never even render — the 3D stack is never imported.
 *
 * State is seeded from the window size on first render (no flash of the app
 * followed by the message) and re-checked on every window resize; the
 * message shows while unsupported, then the app mounts as soon as the user
 * grows the window back past the floor.
 *
 * This guard applies to the whole application (landing + lessons) per spec:
 * the lesson is the "interactive experience", and the responsive landing
 * page is gated alongside it for consistency.
 */
export const ViewportGuard: React.FC<ViewportGuardProps> = ({ children }) => {
  const [supported, setSupported] = useState<boolean>(() => isSupported());

  useEffect(() => {
    const onResize = () => setSupported(isSupported());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!supported) {
    // Deliberately plain viewport-flow layout — NOT the 1280×720 design
    // space. This screen must stay readable at any unsupported size, so it
    // centers in the real viewport, wraps its text, and scrolls rather than
    // clipping if the window is tiny. Copy is verbatim from the spec.
    return (
      <div className="min-h-screen w-full bg-maya-bg text-maya-text flex flex-col items-center justify-center px-6 py-10 text-center">
        <h1 className="font-serif text-xl font-bold text-maya-cream mb-3">
          Screen size not supported
        </h1>
        <p className="text-sm text-maya-textDim max-w-md leading-relaxed">
          This interactive experience requires a minimum viewport of{' '}
          <strong className="text-maya-text">960 × 540 pixels</strong>.
          <br />
          Please use a larger screen or increase the browser window size.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
