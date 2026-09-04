import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * 1280×720 is the canonical design reference for the lesson UI — the
 * proportions a designer authored against. Every lesson overlay is laid out
 * in that 1280×720 logical space and uniformly scaled to the live frame.
 */
const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;

interface ViewportScalerProps {
  children: React.ReactNode;
}

/**
 * ViewportScaler — wraps a DOM overlay layer in the 1280×720 design space
 * and scales it to fill a 16:9 host, preserving the authored composition at
 * every viewport (scale = min(hostW/1280, hostH/720)).
 *
 * Why this exists: the 3D canvas must NOT be CSS-scaled — R3F sizes to its
 * parent, so a scaled canvas renders at logical resolution and upscales into
 * the destination → blurry. The scaler therefore wraps ONLY the DOM overlay,
 * which sits in the frame above the full-frame canvas. Because the host IS
 * the viewport letterbox (width min(100%, 100vh·16/9), aspect 16/9), the
 * scaled box fills it exactly at every viewport: hostW/1280 ≡ hostH/720.
 * There is no minimum-scale floor: the ViewportGuard (app root) already
 * blocks every viewport below 960×540, so scale never drops below 0.75 —
 * the scaled box always fills the frame, never overhanging it.
 *
 * Pointer math inside the overlay stays correct because
 * getBoundingClientRect() follows CSS transforms while clientX is
 * screen-space — the ratio (clientX − rect.left) / rect.width is
 * scale-invariant, so sliders that convert a pointer X to a timeline
 * position need no changes.
 *
 * The host (and the scaled box) are pointer-events-none; interactive
 * elements inside the overlay re-enable pointer-events themselves, exactly
 * as the overlay root already does.
 */
export const ViewportScaler: React.FC<ViewportScalerProps> = ({ children }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Measure synchronously on first layout so the initial paint is already
  // at the correct scale (no pre-measure flash), then keep in sync via a
  // ResizeObserver — the frame resizes whenever the viewport does.
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      setScale(
        Math.min(host.clientWidth / DESIGN_WIDTH, host.clientHeight / DESIGN_HEIGHT)
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0 pointer-events-none">
      {/* The unscaled box is centered horizontally (left 50% − half width)
          and top-anchored; transform-origin 'top center' keeps it exactly
          centered and top-anchored at any scale. */}
      <div
        className="pointer-events-none absolute top-0"
        style={{
          left: '50%',
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          marginLeft: -DESIGN_WIDTH / 2,
          transform: `scale(${scale})`,
          transformOrigin: 'top center'
        }}
      >
        {children}
      </div>
    </div>
  );
};
