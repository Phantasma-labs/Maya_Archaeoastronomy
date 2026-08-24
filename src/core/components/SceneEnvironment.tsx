import React, { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EnvironmentConfig } from '../types/lesson.types';

interface SceneEnvironmentProps {
  config: EnvironmentConfig;
}

/**
 * SceneEnvironment — feeds a single equirectangular texture to the scene.
 *
 *   1. scene.environment          — IBL / PBR reflections   (config.iblIntensity)
 *   2. <skydome> inverted sphere  — visible sky-dome        (config.intensity)
 *
 * The visible sky-dome is rendered as an inverted `MeshBasicMaterial`
 * sphere wrapped around the camera. The Dev Panel's Scale slider
 * drives `texture.matrix` — a smooth UV-space zoom that anchors at
 * the panorama's center. Values <1 zoom in (tighter view of a smaller
 * portion of the panorama); values >1 zoom out (more of the panorama
 * compressed into view). The texture never tiles — wrap modes are
 * `ClampToEdgeWrapping`, so the edges stretch cleanly when zooming
 * beyond the [0,1] UV range.
 *
 * Note: Three.js's native `scene.background = texture` path (and
 * `scene.backgroundIntensity` / `scene.backgroundRotation`) does not
 * expose UV scale or a smooth zoom, which is why a skydome mesh is
 * required. We therefore do NOT use `scene.background` for the
 * texture — instead we render an inverted sphere, and we emulate the
 * legacy `intensity` brightness by tinting `material.color`.
 *
 * Rotation is applied in two places that share the same config field:
 *   - The skydome mesh's own rotation (visible sky)
 *   - scene.environmentRotation (IBL reflections)
 */
export const SceneEnvironment: React.FC<SceneEnvironmentProps> = ({ config }) => {
  const { scene } = useThree();
  const texture = useTexture(config.url);

  // Skydome mesh + material refs (so we can mutate them directly).
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  // One-time texture configuration: equirectangular sampling for IBL
  // and clamp wrap modes so the skydome never tiles (the Dev Panel
  // Scale slider should zoom, not repeat the panorama).
  useMemo(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
  }, [texture]);

  // Apply texture scale + vertical pan via texture.matrix (no tiling).
  //
  // Implementation: `texture.matrix` is the 3×3 transform that Three.js's
  // standard fragment shader applies to UVs before sampling. We disable
  // `matrixAutoUpdate` so Three.js doesn't overwrite our matrix from
  // repeat/offset/rotation every frame.
  //
  // `scale` here means "fraction of UV space shown":
  //   - 1.0 → panorama fills the dome once (no transform)
  //   - <1.0 → less UV space shown → tighter, zoomed-in view
  //   - >1.0 → more UV space shown → wider, zoomed-out view
  //
  // `panY` shifts the panorama vertically (UV-space V-axis). Positive
  // values move the panorama up, exposing lower-V content in the
  // visible dome (i.e. the horizon drops). Applied AFTER the zoom
  // so the pan distance is in pre-zoom UV units — moving 1 unit of
  // panY shows an entire panorama-height of offset.
  //
  // The combined transform is:
  //   u' = (u - 0.5) / scale + 0.5
  //   v' = (v - 0.5) / scale + 0.5 + panY
  //
  // Defensive guards: missing / non-finite / non-positive scale → 1;
  // missing / non-finite panY → 0.
  useEffect(() => {
    const rawScale = config.scale;
    const s =
      typeof rawScale === 'number' && Number.isFinite(rawScale) && rawScale > 0
        ? rawScale
        : 1;

    const rawPanY = config.panY;
    const py =
      typeof rawPanY === 'number' && Number.isFinite(rawPanY) ? rawPanY : 0;

    texture.matrixAutoUpdate = false;
    texture.matrix.set(
      1 / s, 0,     0.5 - 0.5 / s + 0,        // u' column
      0,     1 / s, 0.5 - 0.5 / s + py,       // v' column (panY in v translation)
      0,     0,     1
    );
    texture.needsUpdate = true;
  }, [texture, config.scale, config.panY]);

  // Sky brightness: emulate the legacy `scene.backgroundIntensity` by
  // tinting the skydome material's color (MeshBasicMaterial multiplies
  // the map by this color). This keeps the `intensity` config field
  // working as before even though we no longer use `scene.background`.
  useEffect(() => {
    const i = typeof config.intensity === 'number' ? config.intensity : 1;
    if (materialRef.current) {
      materialRef.current.color.setScalar(Math.max(0, i));
      materialRef.current.needsUpdate = true;
    }
  }, [config.intensity]);

  // Background-enabled toggle: hide the skydome mesh when disabled but
  // keep the IBL binding intact so PBR reflections still sample the envmap.
  const backgroundOn = config.backgroundEnabled !== false;

  // 1. Bind texture as the scene IBL/PBR environment
  // 2. Apply IBL intensity & rotation to the scene
  useEffect(() => {
    scene.environment = texture;

    // IBL contribution strength (drives PBR reflections).
    // iblIntensity = 0 still samples the envmap (Three.js multiplies by 0),
    // matching user expectation of a "soft off" slider at the zero end.
    scene.environmentIntensity = config.iblIntensity ?? 0;

    // Match IBL reflection rotation to the dome rotation.
    if (config.rotation) {
      scene.environmentRotation.set(
        config.rotation[0],
        config.rotation[1],
        config.rotation[2]
      );
    }

    return () => {
      scene.environment = null;
      scene.environmentIntensity = 1;
      scene.environmentRotation.set(0, 0, 0);
    };
  }, [texture, scene, config.iblIntensity, config.rotation]);

  // Cleanup: make sure no stale native scene.background is left dangling
  // from an earlier version of this component. (No-op if already null.)
  useEffect(() => {
    return () => {
      scene.background = null;
      scene.backgroundIntensity = 1;
      scene.backgroundRotation.set(0, 0, 0);
    };
  }, [scene]);

  if (!backgroundOn) return null;

  // Inverted sphere skydome — camera sits inside it (BackSide), depthWrite
  // off so it never occludes geometry, depthTest off so foreground draws
  // on top reliably. 500-unit radius comfortably covers the Lesson 01
  // plaza footprint at the configured camera position.
  //
  // The Dev Panel's Scale slider drives `texture.matrix`, which the
  // standard MeshBasicMaterial sampler consults before sampling. This
  // gives a smooth UV zoom (no tiling) anchored at the panorama's
  // center — exactly the behaviour the user expects from a Scale slider.
  return (
    <mesh
      ref={meshRef}
      // Render first so transparent/foreground geometry draws on top
      // without depth conflicts.
      renderOrder={-1000}
      frustumCulled={false}
      rotation={
        config.rotation
          ? (config.rotation as [number, number, number])
          : [0, 0, 0]
      }
    >
      <sphereGeometry args={[500, 64, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
        fog={false}
        // Initial tint; the effect above keeps this in sync with config.intensity.
        color={
          new THREE.Color().setScalar(
            typeof config.intensity === 'number' ? config.intensity : 1
          )
        }
      />
    </mesh>
  );
};