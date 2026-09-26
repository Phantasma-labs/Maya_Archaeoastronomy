import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ModelAsset, StairwaySpec } from '../../core/types/lesson.types';
import { isStrayEdge } from '../../core/utils/edges';
import { stairFootprintContains } from '../../core/utils/stairs';

/** The pyramid's body mesh in Lesson01_Layout (three strips the dot from "Pyramid.Base"). */
const PYRAMID_BODY_MESH = 'PyramidBase';
/** Extra width beside a worn ramp whose edges are hidden — covers its balustrades and the eroded scraps of their foot blocks. */
const HIDE_MARGIN = 2.2;

/** Copy of an edge geometry without the segments for which `shouldDrop(a, b)` (world-space endpoints) is true. */
function withoutSegments(
  source: THREE.BufferGeometry,
  matrixWorld: THREE.Matrix4,
  shouldDrop: (a: THREE.Vector3, b: THREE.Vector3) => boolean
): THREE.BufferGeometry {
  const pos = source.getAttribute('position');
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const kept: number[] = [];
  for (let i = 0; i + 1 < pos.count; i += 2) {
    a.fromBufferAttribute(pos, i).applyMatrix4(matrixWorld);
    b.fromBufferAttribute(pos, i + 1).applyMatrix4(matrixWorld);
    if (!shouldDrop(a, b)) {
      kept.push(
        pos.getX(i),
        pos.getY(i),
        pos.getZ(i),
        pos.getX(i + 1),
        pos.getY(i + 1),
        pos.getZ(i + 1)
      );
    }
  }
  const filtered = new THREE.BufferGeometry();
  filtered.setAttribute('position', new THREE.Float32BufferAttribute(kept, 3));
  return filtered;
}

interface BlueprintEdgesProps {
  asset: ModelAsset;
  color: string;
  opacity: number;
  /** Edges are drawn where adjacent faces differ by more than this angle. */
  thresholdDeg?: number;
  /** Higher threshold for organic meshes (the serpent heads) so they don't scribble. */
  organicThresholdDeg?: number;
  /**
   * Stairways whose mesh geometry is eroded: the pyramid body's edges inside
   * their footprint are hidden (BlueprintStairs draws a clean outline instead).
   * Must be a stable reference — a new array rebuilds every edge geometry.
   */
  hideEdgesInside?: StairwaySpec[];
  /**
   * Azimuth (radians) of the monument's main axis. When set, the pyramid body's
   * long edges that run near-but-not-on an axis are hidden as mesh noise
   * (see `isStrayEdge`).
   */
  axisAzimuth?: number;
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
  organicThresholdDeg = 55,
  hideEdgesInside = [],
  axisAzimuth
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
    const edgeGeometries: THREE.BufferGeometry[] = [];

    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const organic = mesh.name.startsWith('Snake');
      let edgesGeometry: THREE.BufferGeometry = new THREE.EdgesGeometry(
        mesh.geometry,
        organic ? organicThresholdDeg : thresholdDeg
      );
      if (
        mesh.name === PYRAMID_BODY_MESH &&
        (hideEdgesInside.length > 0 || axisAzimuth !== undefined)
      ) {
        const filtered = withoutSegments(edgesGeometry, mesh.matrixWorld, (a, b) => {
          const insideWornStair = hideEdgesInside.some(
            (z) =>
              stairFootprintContains(z, a.x, a.z, HIDE_MARGIN) &&
              stairFootprintContains(z, b.x, b.z, HIDE_MARGIN)
          );
          const stray =
            axisAzimuth !== undefined && isStrayEdge(b.x - a.x, b.y - a.y, b.z - a.z, axisAzimuth);
          return insideWornStair || stray;
        });
        edgesGeometry.dispose();
        edgesGeometry = filtered;
      }
      edgeGeometries.push(edgesGeometry);

      const lines = new THREE.LineSegments(edgesGeometry, lineMaterial);
      lines.applyMatrix4(mesh.matrixWorld);
      const occluder = new THREE.Mesh(mesh.geometry, fillMaterial);
      occluder.applyMatrix4(mesh.matrixWorld);
      group.add(lines, occluder);
    });

    return { group, lineMaterial, fillMaterial, edgeGeometries };
  }, [gltf.scene, color, opacity, thresholdDeg, organicThresholdDeg, hideEdgesInside, axisAzimuth]);

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
