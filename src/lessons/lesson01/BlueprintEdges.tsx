import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ModelAsset } from '../../core/types/lesson.types';

interface BlueprintEdgesProps {
  asset: ModelAsset;
  color: string;
  opacity: number;
  /** Edges are drawn where adjacent faces differ by more than this angle. */
  thresholdDeg?: number;
  /** Higher threshold for organic meshes (the serpent heads) so they don't scribble. */
  organicThresholdDeg?: number;
}

/**
 * Blueprint outline of a model: only hard edges (no triangle diagonals) drawn
 * over a black occluder, so lines behind front faces are hidden and the
 * monument reads as a clean architectural line drawing. Built from the cached
 * GLTF without mutating it; the occluder shares the cached geometry (never
 * disposed here), the edge geometries and materials are ours to dispose.
 */
export const BlueprintEdges: React.FC<BlueprintEdgesProps> = ({
  asset,
  color,
  opacity,
  thresholdDeg = 10,
  organicThresholdDeg = 55
}) => {
  const gltf = useGLTF(asset.url);

  const built = useMemo(() => {
    const group = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false
    });
    // polygonOffset pushes the fill slightly back so coplanar edge lines win
    // the depth test instead of z-fighting with it.
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: '#000000',
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      toneMapped: false
    });
    const edgeGeometries: THREE.EdgesGeometry[] = [];

    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const organic = mesh.name.startsWith('Snake');
      const edgesGeometry = new THREE.EdgesGeometry(
        mesh.geometry,
        organic ? organicThresholdDeg : thresholdDeg
      );
      edgeGeometries.push(edgesGeometry);

      const lines = new THREE.LineSegments(edgesGeometry, lineMaterial);
      lines.applyMatrix4(mesh.matrixWorld);
      const occluder = new THREE.Mesh(mesh.geometry, fillMaterial);
      occluder.applyMatrix4(mesh.matrixWorld);
      group.add(lines, occluder);
    });

    return { group, lineMaterial, fillMaterial, edgeGeometries };
  }, [gltf.scene, color, opacity, thresholdDeg, organicThresholdDeg]);

  useEffect(
    () => () => {
      built.lineMaterial.dispose();
      built.fillMaterial.dispose();
      built.edgeGeometries.forEach((g) => g.dispose());
    },
    [built]
  );

  return (
    <primitive
      object={built.group}
      position={asset.position || [0, 0, 0]}
      rotation={asset.rotation || [0, 0, 0]}
      scale={asset.scale || [1, 1, 1]}
    />
  );
};
