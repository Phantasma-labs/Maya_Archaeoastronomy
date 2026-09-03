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
 * hits the network mid-scrub. The urls come from sample.keyframes (the
 * ACTIVE timeline — a topic's own, or the lesson default), NOT from
 * config.skyTimeline: the sample and the texture array must index the
 * same keyframes or a topic-owned timeline would show the lesson
 * default's sky (e.g. Zenith step 2 rendering 02.webp instead of
 * 03.webp).
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
  // Textures index the SAMPLE's keyframes (the active timeline), not the
  // lesson default's — sample.indexA/B are indexes into the active timeline,
  // so the texture array must be built from the same keyframes or a
  // topic-owned timeline would render the wrong sky.
  const urls = useMemo(() => sample.keyframes.map((k) => k.url), [sample.keyframes]);
  const textures = useTexture(urls);

  // Reusable PMREM generator for both the per-keyframe caches and the on-the-fly
  // blended environment (the runtime IBL crossfade).
  const pmrem = useMemo(() => new THREE.PMREMGenerator(gl), [gl]);

  // Per-keyframe PMREM render targets — created once per sky on first visit so
  // sitting on a step never regenerates anything (no per-frame work at a
  // keyframe). Keyed by texture uuid, NOT by index: the active timeline can
  // change (topic switch) and reuse an index for a different sky (e.g. Zenith
  // step 2 puts 03before.webp at index 1 where Serpent Descent had 02.webp).
  // An index-keyed cache would serve the previous timeline's PMREM — the
  // "IBL doesn't match the sky at the end of the slider" regression.
  const keyframeRTsRef = useRef<Map<string, THREE.WebGLRenderTarget>>(new Map());
  // The transient blended-env render target + its canvas source, disposed on
  // swap. Carries the source texture uuids so a cached blend from a previous
  // timeline is never reused for a different pair of skies.
  const blendEnvRef = useRef<{
    keyA: string;
    keyB: string;
    mix: number;
    canvasTexture: THREE.CanvasTexture;
    rt: THREE.WebGLRenderTarget;
  } | null>(null);

  // Release every PMREM resource on unmount (keyframe caches, live blend).
  // The PMREMGenerator itself is intentionally NOT disposed here — StrictMode
  // double-invokes effect cleanups on mount (cleanup then re-run), and a
  // disposed PMREMGenerator cannot be reused by the re-run. The generator is
  // a singleton that lives for the component's lifetime and is freed with the
  // GL context on real teardown. The render targets we created above ARE
  // safely recreated on remount.
  //
  // The useTexture(equirect) call above caches via drei's texture cache, and
  // the panorama + its PMREM together cost ~16 MB per sky. LessonPage's
  // useLessonAssetCleanup() hook evicts these URLs on lesson change so the
  // next lesson doesn't accumulate resident textures (TECH_DEBT L6).
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
    const py = typeof config.panY === 'number' && Number.isFinite(config.panY) ? config.panY : 0;

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
        1 / s,
        0,
        0.5 - 0.5 / s, // u' column
        0,
        1 / s,
        0.5 - 0.5 / s + py, // v' column (panY in v translation)
        0,
        0,
        1
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

    // Per-keyframe PMREM, created once per sky on first visit. Keyed by the
    // texture's uuid (stable across timelines — drei caches textures by URL)
    // so a topic switch that reuses an index for a different sky can never
    // serve the previous timeline's environment.
    const getKeyframeEnv = (index: number): THREE.Texture => {
      const texture = textures[index];
      const key = texture.uuid;
      let rt = keyframeRTsRef.current.get(key);
      if (!rt) {
        rt = pmrem.fromEquirectangular(texture);
        keyframeRTsRef.current.set(key, rt);
      }
      return rt.texture;
    };

    // Composite A*(1-mix)+B*mix → PMREM. Throttled: reuse the last blend when
    // the mix moved <2% so a fast drag/sweep doesn't re-PMREM on every tick.
    const getBlendEnv = (aIdx: number, bIdx: number, m: number): THREE.Texture => {
      const keyA = textures[aIdx].uuid;
      const keyB = textures[bIdx].uuid;
      const prev = blendEnvRef.current;
      if (prev && prev.keyA === keyA && prev.keyB === keyB && Math.abs(prev.mix - m) < 0.02) {
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
      blendEnvRef.current = { keyA, keyB, mix: m, canvasTexture: canvasTex, rt };
      return rt.texture;
    };

    let env: THREE.Texture;
    if (mix < 0.001) env = getKeyframeEnv(indexA);
    else if (mix > 0.999) env = getKeyframeEnv(indexB);
    else env = getBlendEnv(indexA, indexB, mix);

    scene.environment = env;
    scene.environmentIntensity = iblIntensity;
    scene.environmentRotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);

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

  // Skydome brightness tint, shared by both domes. Mutate a single reusable
  // Color instance rather than allocating per render (TECH_DEBT L4). The tint
  // is memoized by config.intensity so it only re-mutates when the config
  // actually changes — a constant intensity does zero allocation per frame.
  const tintRef = useRef<THREE.Color>(new THREE.Color());
  const tint = useMemo(
    () =>
      tintRef.current.setScalar(
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
      <mesh renderOrder={-1000} frustumCulled={false} rotation={config.rotation}>
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
