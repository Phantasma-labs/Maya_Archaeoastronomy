import React, { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { AtmosphereSample, EnvironmentConfig } from '../types/lesson.types';

interface SceneEnvironmentProps {
  config: EnvironmentConfig;
  sample: AtmosphereSample;
}

/**
 * SceneEnvironment — Atmosphere Timeline sky + IBL (ADR-001).
 *
 * Visible sky: TWO stacked inverted-sphere skydomes —
 *   dome A (renderOrder -1000) shows keyframes[sample.indexA], fully opaque.
 *   dome B (renderOrder  -999) shows keyframes[sample.indexB] with material
 *   opacity = sample.mix (hidden entirely when mix ≈ 0, so exactly on a
 *   keyframe only one dome draws).
 * Crossfading is plain alpha blending — no custom shaders.
 *
 * CRITICAL: dome B is the only TRANSPARENT object in the scene, so
 * three.js bucketing draws it in the transparent pass AFTER all opaque
 * geometry — renderOrder -999 only sorts within the transparent list.
 * It must therefore keep depth testing enabled: the models write depth,
 * dome A does not, so dome B blends over the sky region but is occluded
 * by floor/layout/trees. depthTest=false made it alpha-blend across the
 * whole viewport instead — the "geometry dissolves toward the next sky
 * during sweeps" regression.
 *
 * IBL: a scene can bind only one envmap, so scene.environment follows the
 * DOMINANT keyframe (A below mix 0.5, B at/above) while
 * scene.environmentIntensity follows the continuously interpolated
 * iblIntensity. The directional sun dominates scene lighting, which makes
 * the single envmap swap at the midpoint imperceptible.
 *
 * All timeline textures are loaded up front via useTexture([...urls]) —
 * Suspense covers the wait — so dragging the Atmosphere Timeline never
 * hits the network mid-scrub.
 *
 * The visible sky is a skydome mesh rather than scene.background because
 * the timeline needs shared UV framing (scale/panY), which three's
 * background path does not expose. Framing is baked into texture.matrix
 * with matrixAutoUpdate disabled:
 *   u' = (u - 0.5) / scale + 0.5
 *   v' = (v - 0.5) / scale + 0.5 + panY
 * Wrap modes are ClampToEdgeWrapping — the panorama zooms, never tiles.
 * Rotation is applied to both domes (visible sky) and
 * scene.environmentRotation (IBL reflections) from the same config field.
 * Sky brightness `intensity` tints both dome materials (MeshBasicMaterial
 * multiplies map by color) — independent from IBL.
 */
export const SceneEnvironment: React.FC<SceneEnvironmentProps> = ({ config, sample }) => {
  const { scene } = useThree();
  const urls = useMemo(() => config.skyTimeline.map((k) => k.url), [config.skyTimeline]);
  const textures = useTexture(urls);

  // Per-texture one-time setup + shared framing matrix. Defensive guards:
  // non-finite / non-positive scale → 1; non-finite panY → 0.
  useEffect(() => {
    const s =
      typeof config.scale === 'number' && Number.isFinite(config.scale) && config.scale > 0
        ? config.scale
        : 1;
    const py =
      typeof config.panY === 'number' && Number.isFinite(config.panY) ? config.panY : 0;

    textures.forEach((texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.matrixAutoUpdate = false;
      texture.matrix.set(
        1 / s, 0,     0.5 - 0.5 / s,        // u' column
        0,     1 / s, 0.5 - 0.5 / s + py,   // v' column (panY in v translation)
        0,     0,     1
      );
      texture.needsUpdate = true;
    });
  }, [textures, config.scale, config.panY]);

  // IBL binding: dominant-keyframe envmap + interpolated intensity +
  // shared rotation. Cleanup restores pristine scene state on unmount.
  useEffect(() => {
    const envTexture = textures[sample.mix < 0.5 ? sample.indexA : sample.indexB];
    scene.environment = envTexture;
    scene.environmentIntensity = sample.iblIntensity;
    scene.environmentRotation.set(
      config.rotation[0],
      config.rotation[1],
      config.rotation[2]
    );

    return () => {
      scene.environment = null;
      scene.environmentIntensity = 1;
      scene.environmentRotation.set(0, 0, 0);
    };
  }, [textures, scene, sample.indexA, sample.indexB, sample.mix, sample.iblIntensity, config.rotation]);

  // Skydome brightness tint, shared by both domes (memoized to avoid
  // re-allocating a Color every render).
  const tint = useMemo(
    () =>
      new THREE.Color().setScalar(
        typeof config.intensity === 'number' ? Math.max(0, config.intensity) : 1
      ),
    [config.intensity]
  );

  // Hide the visible sky while keeping IBL bound (config toggle).
  if (config.backgroundEnabled === false) return null;

  const textureA = textures[sample.indexA];
  const textureB = textures[sample.indexB];

  return (
    <>
      {/* Dome A — opaque base sky (keyframe indexA) */}
      <mesh
        renderOrder={-1000}
        frustumCulled={false}
        rotation={config.rotation}
      >
        <sphereGeometry args={[500, 64, 32]} />
        <meshBasicMaterial
          map={textureA}
          color={tint}
          side={THREE.BackSide}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* Dome B — crossfade layer (keyframe indexB), alpha = sample.mix */}
      <mesh
        renderOrder={-999}
        frustumCulled={false}
        rotation={config.rotation}
        visible={sample.mix > 0.001}
      >
        <sphereGeometry args={[500, 64, 32]} />
        <meshBasicMaterial
          map={textureB}
          color={tint}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
          fog={false}
          transparent
          opacity={sample.mix}
        />
      </mesh>
    </>
  );
};
