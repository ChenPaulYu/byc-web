/** Tracks the room's opaque directional-shadow inputs after world matrices have been updated.
 * Unsupported deforming/alpha-tested casters deliberately keep live shadows. The cache owns
 * snapshots only; removing scene objects also removes their snapshots.
 */
import * as THREE from 'three';

export function createShadowInvalidator() {
  const snapshots = new Map<THREE.Object3D, {
    matrix: THREE.Matrix4;
    values: unknown[];
    seen: number;
  }>();
  let generation = 0;

  return (scene: THREE.Scene, camera: THREE.Camera): boolean => {
    generation++;
    let changed = false;
    const track = (object: THREE.Object3D, values: unknown[]) => {
      const previous = snapshots.get(object);
      if (!previous || !previous.matrix.equals(object.matrixWorld)
        || values.length !== previous.values.length
        || values.some((value, index) => value !== previous.values[index])) {
        changed = true;
        snapshots.set(object, { matrix: object.matrixWorld.clone(), values, seen: generation });
      } else previous.seen = generation;
    };

    scene.traverseVisible(object => {
      if (!object.castShadow || !object.layers.test(camera.layers)) return;
      if (object instanceof THREE.DirectionalLight) {
        const shadow = object.shadow, lens = shadow.camera;
        object.target.updateWorldMatrix(true, false);
        track(object, [object.target.matrixWorld.elements[12], object.target.matrixWorld.elements[13],
          object.target.matrixWorld.elements[14], lens.left, lens.right, lens.top, lens.bottom,
          lens.near, lens.far, lens.zoom, shadow.mapSize.x, shadow.mapSize.y]);
        if (shadow.needsUpdate) changed = true;
      } else if (object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        const material = object.material;
        // These cases require their own deformation/texture clocks. Stay correct if future
        // scene additions use them instead of silently keeping an obsolete shadow.
        if (object instanceof THREE.SkinnedMesh || object instanceof THREE.InstancedMesh
          || object.morphTargetInfluences?.length || object.customDepthMaterial
          || Array.isArray(material) || material.alphaTest > 0 || material.alphaHash
          || (material as THREE.MeshStandardMaterial).displacementMap
          || material.clippingPlanes?.length) {
          changed = true;
          return;
        }
        const position = geometry.getAttribute('position');
        const positionVersion = position instanceof THREE.InterleavedBufferAttribute
          ? position.data.version : position?.version;
        track(object, [geometry, position, positionVersion, geometry.index, geometry.index?.version,
          geometry.drawRange.start, geometry.drawRange.count, material.visible, material.side,
          material.shadowSide, material.wireframe, object.frustumCulled]);
      } else {
        // Other light types, lines and points retain their renderer's normal behavior.
        changed = true;
      }
    });
    for (const [object, snapshot] of snapshots) {
      if (snapshot.seen !== generation) {
        snapshots.delete(object);
        changed = true;
      }
    }
    return changed;
  };
}

/** Run after Three updates matrices, before its shadow pass, without a second scene traversal
 * to update transforms. Restore the renderer and any pre-existing callback on unmount.
 */
export function cacheRoomShadows(scene: THREE.Scene, renderer: THREE.WebGLRenderer): () => void {
  const invalidated = createShadowInvalidator();
  const before = scene.onBeforeRender;
  const autoUpdate = renderer.shadowMap.autoUpdate;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const update: typeof scene.onBeforeRender = function (...args) {
    before.apply(this, args);
    renderer.shadowMap.needsUpdate ||= renderer.shadowMap.type !== THREE.PCFShadowMap
      || invalidated(scene, args[2]);
  };
  scene.onBeforeRender = update;
  return () => {
    if (scene.onBeforeRender === update) scene.onBeforeRender = before;
    renderer.shadowMap.autoUpdate = autoUpdate;
    renderer.shadowMap.needsUpdate = true;
  };
}
