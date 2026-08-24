import React, { useEffect, useMemo, useRef } from 'react';
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
 * IBL: a scene can bind only one envmap, so the two keyframe environments are
 * crossfaded (like the visible sky) by compositing their equirect textures
 * into a single texture (A*(1-mix)+B*mix) that is re-PMRem'd on the fly while
 * dragging between keyframes. Exactly on a keyframe the cached keyframe PMREM
 * is bound, so steady state does no per-frame work. scene.environmentIntensity
 * continues to lerp on top.
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
  const { scene, gl } = useThree();
  const urls = useMemo(() => config.skyTimeline.map((k) => k.url), [config.skyTimeline]);
  const textures = useTexture(urls);

  // Reusable PMREM generator for both the per-keyframe caches and the on-the-fly
  // blended environment (the runtime IBL crossfade).
  const pmrem = useMemo(() => new THREE.PMREMGenerator(gl), [gl]);

  // Per-keyframe PMREM render targets — created once on first visit so sitting
  // on a step never regenerates anything (no per-frame work at a keyframe).
  const keyframeRTsRef = useRef<Map<number, THREE.WebGLRenderTarget>>(new Map());
  // The transient blended-env render target + its canvas source, disposed on swap.
  const blendEnvRef = useRef<{
    indexA: number;
    indexB: number;
    mix: number;
    canvasTexture: THREE.CanvasTexture;
    rt: THREE.WebGLRenderTarget;
  } | null>(null);

  // Release every PMREM resource on unmount (keyframe caches, live blend).
  // NOTE: we deliberately do NOT call `pmrem.dispose()` here — React StrictMode
  // double-invokes effect cleanups on mount (cleanup then re-run), and a
  // disposed PMREMGenerator cannot be reused by the re-run. The render targets
  // we created above are safely recreated on remount; the generator itself is
  // a singleton that lives for the component's lifetime (freed with the GL
  // context on real teardown).
  useEffect(() => {
    return () => {
      keyframeRTsRef.current.forEach((rt) => rt.dispose());
      keyframeRTsRef.current.clear();
      if (blendEnvRef.current) {
        blendEnvRef.current.canvasTexture.dispose();
        blendEnvRef.current.rt.dispose();
        blendEnvRef.current = null;
      }
    };
  }, []);

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

  // IBL binding: crossfade the two keyframe environments like the visible sky
  // (same A*(1-mix)+B*mix math) instead of swapping the envmap at mix 0.5 —
  // that hard swap is what read as an "on/off" light switch. Exactly on a
  // keyframe we bind that keyframe's cached PMREM (no per-frame work); between
  // keyframes we composite the two equirects onto a canvas, PMREM it, and
  // dispose the previous blend. Shared rotation + lerped intensity stay.
  useEffect(() => {
    const { indexA, indexB, mix, iblIntensity } = sample;

    // Per-keyframe PMREM, created once on first visit.
    const getKeyframeEnv = (index: number): THREE.Texture => {
      let rt = keyframeRTsRef.current.get(index);
      if (!rt) {
        rt = pmrem.fromEquirectangular(textures[index]);
        keyframeRTsRef.current.set(index, rt);
      }
      return rt.texture;
    };

    // Composite A*(1-mix)+B*mix → PMREM. Throttled: reuse the last blend when
    // the mix moved <2% so a fast drag/sweep doesn't re-PMREM on every tick.
    const getBlendEnv = (aIdx: number, bIdx: number, m: number): THREE.Texture => {
      const prev = blendEnvRef.current;
      if (prev && prev.indexA === aIdx && prev.indexB === bIdx && Math.abs(prev.mix - m) < 0.02) {
        return prev.rt.texture;
      }
      // Dispose the previous transient blend (canvas source + render target).
      if (prev) {
        prev.canvasTexture.dispose();
        prev.rt.dispose();
      }
      const a = textures[aIdx].image as { width: number; height: number } & CanvasImageSource;
      const b = textures[bIdx].image as CanvasImageSource;
      const canvas = document.createElement('canvas');
      canvas.width = a.width;
      canvas.height = a.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Defensive: without a 2D context, fall back to the dominant keyframe env.
        return getKeyframeEnv(m < 0.5 ? aIdx : bIdx);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(a, 0, 0);
      ctx.globalAlpha = m;
      ctx.drawImage(b, 0, 0);
      ctx.globalAlpha = 1;

      const canvasTex = new THREE.CanvasTexture(canvas);
      canvasTex.mapping = THREE.EquirectangularReflectionMapping;
      canvasTex.colorSpace = THREE.SRGBColorSpace;
      const rt = pmrem.fromEquirectangular(canvasTex);
      blendEnvRef.current = { indexA: aIdx, indexB: bIdx, mix: m, canvasTexture: canvasTex, rt };
      return rt.texture;
    };

    let env: THREE.Texture;
    if (mix < 0.001) env = getKeyframeEnv(indexA);
    else if (mix > 0.999) env = getKeyframeEnv(indexB);
    else env = getBlendEnv(indexA, indexB, mix);

    scene.environment = env;
    scene.environmentIntensity = iblIntensity;
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
  }, [
    scene,
    textures,
    sample.indexA,
    sample.indexB,
    sample.mix,
    sample.iblIntensity,
    config.rotation,
    pmrem
  ]);

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
