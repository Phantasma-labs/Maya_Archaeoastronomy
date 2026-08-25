import { useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';

/**
 * Evict a lesson's GLB + equirect-sky assets from the drei caches when the
 * component unmounts (i.e. on lesson route change). Without this, each visited
 * lesson leaves its textures resident — at ~8.4 MB decoded per panorama plus
 * the PMREM result, the 3D stack's GPU memory grows unbounded as the user
 * moves through the catalog (TECH_DEBT L6).
 *
 * Both useGLTF and useTexture return the SAME cached promise/handle, so a
 * subsequent visit to the same lesson re-fetches — this is desired: the
 * PMREMs (which SceneEnvironment caches separately) get rebuilt in ~1 frame,
 * and the GLB decodes in the time it takes for the loading screen to fade out.
 *
 * Usage: place at the top of LessonPage (the route component), passing the
 * models[] urls and the skyTimeline[].url strings. Effect cleanup fires on
 * unmount OR when the url list reference changes (a lesson switch).
 */
export function useLessonAssetCleanup(
  gltfUrls: readonly string[],
  equirectUrls: readonly string[]
): void {
  useEffect(() => {
    return () => {
      gltfUrls.forEach((url) => useGLTF.clear(url));
      equirectUrls.forEach((url) => useTexture.clear(url));
    };
  }, [gltfUrls, equirectUrls]);
}
