import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ModelAsset } from '../types/lesson.types';

/**
 * Configure Drei's internal DRACOLoader to fetch the decoder from
 * /draco/ (the files there are copies of
 * three/examples/jsm/libs/draco/* that ship from public/draco/).
 *
 * This runs once at module load — Drei caches the path on its
 * lazily-created singleton DRACOLoader, and subsequent useGLTF /
 * useGLTF.preload calls with useDraco=true pick it up automatically.
 */
useGLTF.setDecoderPath('/draco/');

interface ModelLoaderProps {
  asset: ModelAsset;
}

/**
 * Reusable GLB Model Loader Component
 * - Leverages Drei's useGLTF with automatic caching and suspense
 * - Clones the scene graph so shared GLTF data is not mutated
 * - Applies shadow casting & receiving recursively to all meshes
 * - Filters out camera nodes so they are not rendered as geometry
 */
export const ModelLoader: React.FC<ModelLoaderProps> = ({ asset }) => {
  const gltf = useGLTF(asset.url);

  // Clone and configure scene — run once per loaded GLTF
  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);

    clone.traverse((child) => {
      // Remove camera nodes from the rendered geometry — they are purely data
      if ((child as THREE.Camera).isCamera) {
        child.visible = false;
        return;
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (asset.castShadow !== undefined) mesh.castShadow = asset.castShadow;
        if (asset.receiveShadow !== undefined) mesh.receiveShadow = asset.receiveShadow;

        // Material adjustment for glTF COLOR_0 (vertex color) attributes.
        //
        // Some Maya glTF assets (notably the trees canopy) declare
        // baseColorFactor [0.8, 0.8, 0.8, 1] and intend vertex colors
        // in COLOR_0 to carry the visible hue. For those meshes we:
        //   (a) flip vertexColors = true so the shader reads COLOR_0
        //   (b) neutralize baseColorFactor to white so the grey tint
        //       doesn't mute the vertex colors.
        //
        // CRITICAL: only enable vertexColors when the geometry
        // actually has a `color` attribute. WebGL2 defaults unbound
        // vertex attributes to (0, 0, 0, 1), so a stray USE_COLOR
        // shader define on a mesh without COLOR_0 multiplies
        // diffuseColor by black and the mesh renders invisible —
        // exactly the "everything went black" regression we hit
        // once already.
        if (mesh.material) {
          const colorAttr = mesh.geometry?.attributes?.color as
            | THREE.BufferAttribute
            | THREE.InterleavedBufferAttribute
            | undefined;
          const hasVertexColors =
            !!colorAttr &&
            (colorAttr.itemSize === 3 || colorAttr.itemSize === 4);

          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat: THREE.Material) => {
            const stdMat = mat as THREE.MeshStandardMaterial;

            if (hasVertexColors) {
              // Ensure the COLOR_0 buffer is fed to the shader as a
              // properly-formatted normalized attribute. Some DCCs
              // (Blender, Maya with FBX→glTF exporters) emit
              // non-normalized vertex color buffers, which cause the
              // shader to interpret values like 0.5 as near-black
              // post-sRGB conversion.
              if (colorAttr && 'normalized' in colorAttr && !(colorAttr as THREE.BufferAttribute).normalized) {
                (colorAttr as THREE.BufferAttribute).normalized = true;
              }

              if ('vertexColors' in stdMat) {
                stdMat.vertexColors = true;
              }
              if ('color' in stdMat && stdMat.color) {
                // Neutralize the grey baseColorFactor — vertex colors
                // now fully drive the visible color.
                stdMat.color.setRGB(1, 1, 1);
              }
            }
            mat.needsUpdate = true;
          });
        }
      }
    });

    return clone;
  }, [gltf.scene, asset.castShadow, asset.receiveShadow]);

  return (
    <primitive
      object={clonedScene}
      position={asset.position || [0, 0, 0]}
      rotation={asset.rotation || [0, 0, 0]}
      scale={asset.scale || [1, 1, 1]}
    />
  );
};

/**
 * Preload multiple GLB assets in parallel — call at module level outside components.
 * Leverages useGLTF's internal cache so assets are ready before Suspense activates.
 *
 * - `useDraco = true` makes Drei create a DRACOLoader and wire it into the
 *   internal GLTFLoader. The decoder path was configured at module load
 *   above via `useGLTF.setDecoderPath('/draco/')`.
 * - `useMeshOpt = false` — our assets aren't meshopt-compressed.
 */
export function preloadLessonModels(urls: string[]) {
  urls.forEach((url) => {
    useGLTF.preload(url, true, false);
  });
}
