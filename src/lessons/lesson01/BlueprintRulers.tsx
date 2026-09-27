import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TourRuler } from '../../core/types/lesson.types';
import { rulerSegments } from '../../core/utils/ruler';

interface BlueprintRulersProps {
  /** Rulers of the active tour step. Keep the reference stable (config data). */
  rulers: TourRuler[];
  color: string;
  /** 0..1 — see `tourSettle`. Rulers fade out while the camera sweeps. */
  opacity: number;
}

/**
 * Schematic count rulers of the active tour step (e.g. 52 ticks for the 52
 * panels per side), drawn as one LineSegments from the pure `rulerSegments`.
 * Purely derived from the tour position — no state, no per-frame work.
 */
export const BlueprintRulers: React.FC<BlueprintRulersProps> = ({ rulers, color, opacity }) => {
  const geometry = useMemo(() => {
    const positions = rulers.flatMap(rulerSegments);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, [rulers]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  if (rulers.length === 0 || opacity <= 0.01) return null;
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
};
