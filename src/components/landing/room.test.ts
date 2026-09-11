import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createRoom, ROOM, setCeilingLamp } from './room';
import { CEILING_LAMP_NAME, WALL_SWITCH_NAME, isLightSwitch } from './roomFinish';

test('daylight palette keeps the room envelope light and the original equipment contrast', () => {
  const luminance = (hex: string) => {
    const color = new THREE.Color(hex);
    return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  };
  assert.ok(luminance(ROOM.plaster) > 0.75);
  assert.ok(luminance(ROOM.skyHorizon) > 0.8);
  assert.ok(luminance(ROOM.plaster) > luminance(ROOM.metal) * 5);
  assert.ok(ROOM.lighting.daylight > ROOM.lighting.bounce);
  assert.ok(ROOM.lighting.lamp < 20, 'lamp is an accent, not the dominant warm wash');
});

test('architectural finish has a ceiling fixture and batched joints without adding real-time lights', () => {
  const floor = -18;
  const room = createRoom(floor, -2);
  try {
    room.updateMatrixWorld(true);
    assert.ok(room.getObjectByName('studio-architectural-reveal'));
    const ray = new THREE.Raycaster(new THREE.Vector3(0, floor + ROOM.height - 3, 6), new THREE.Vector3(0, 1, 0));
    const hit = ray.intersectObjects(room.children)[0];
    assert.ok(hit && hit.distance < 2.5, 'fixture sits below the ceiling plane');
    assert.equal(hit.object.name, CEILING_LAMP_NAME);
    assert.ok(room.children.every(child => !(child instanceof THREE.Light)));
    const wall = room.getObjectByName('studio-plaster') as THREE.Mesh;
    assert.ok((wall.material as THREE.MeshStandardMaterial).bumpScale <= 0.015);
  } finally { room.dispose(); }
});

test('ceiling lamp switches off and back on without rebuilding the room or changing other materials', () => {
  const room = createRoom(-18, -2);
  try {
    const lens = room.getObjectByName(CEILING_LAMP_NAME) as THREE.Mesh;
    const material = lens.material as THREE.MeshStandardMaterial;
    const geometry = lens.geometry;
    const siblings = room.children.filter(child => child !== lens).map(child => (child as THREE.Mesh).material);
    assert.equal(material.emissiveIntensity, 1);
    setCeilingLamp(room, false);
    assert.equal(material.emissiveIntensity, 0);
    setCeilingLamp(room, true);
    assert.equal(material.emissiveIntensity, 1);
    assert.equal(lens.geometry, geometry);
    assert.deepEqual(room.children.filter(child => child !== lens).map(child => (child as THREE.Mesh).material), siblings);
  } finally { room.dispose(); }
});

test('only the existing door-side wall switch is a lighting control, not the ceiling diffuser', () => {
  const room = createRoom(-18, -2);
  try {
    room.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(0.3, -3, 30), new THREE.Vector3(0, 0, 1));
    const hit = ray.intersectObjects(room.children)[0];
    assert.equal(hit.object.name, WALL_SWITCH_NAME);
    assert.ok(isLightSwitch(hit.object.name));
    assert.equal(isLightSwitch(CEILING_LAMP_NAME), false);
    assert.equal(isLightSwitch('studio-plaster'), false);
  } finally { room.dispose(); }
});

test('room architecture is finite, batched and grounded on the supplied floor', () => {
  const room = createRoom(-18, -2);
  try {
    assert.equal(room.name, 'blue-hour-room');
    assert.ok(room.children.length <= 32);
    let triangles = 0;
    room.children.forEach(child => {
      assert.ok(child instanceof THREE.Mesh);
      const positions = child.geometry.getAttribute('position');
      assert.ok([...positions.array].every(Number.isFinite));
      triangles += positions.count / 3;
    });
    assert.ok(triangles < 25000, `room has ${triangles} triangles`);
    const bounds = new THREE.Box3().setFromObject(room);
    assert.ok(bounds.min.y >= -18.81 && bounds.min.y <= -18.79);
    assert.ok(bounds.max.x - bounds.min.x >= ROOM.width);
  } finally { room.dispose(); }
});

test('the window is an opening in the wall, not an image covering solid plaster', () => {
  const room = createRoom(-18, -2);
  room.updateMatrixWorld(true);
  try {
    const solids = room.children.filter(child => !((child as THREE.Mesh).material instanceof THREE.MeshBasicMaterial));
    const ray = (y: number) => new THREE.Raycaster(new THREE.Vector3(-16, y, 0), new THREE.Vector3(-1, 0, 0), 0, 8);
    assert.equal(ray(2).intersectObjects(solids).length, 0);
    assert.ok(ray(-13).intersectObjects(solids).length > 0);
    assert.equal(ray(2).intersectObjects(room.children).length, 0, 'no billboard seals the window');
  } finally { room.dispose(); }
});

test('the visitor is enclosed by a floor, ceiling and four walls away from the window', () => {
  const room = createRoom(-18, -2);
  room.updateMatrixWorld(true);
  try {
    const architecture = room.children.filter(child => !child.userData.exterior);
    for (const direction of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(0, 8, 28), new THREE.Vector3(...direction));
      assert.ok(ray.intersectObjects(architecture).length > 0, `missing enclosure in ${direction}`);
    }
  } finally { room.dispose(); }
});

test('exterior has separated closed volumes rather than a window-sized billboard', () => {
  const room = createRoom(-18, -2);
  room.updateMatrixWorld(true);
  try {
    const exterior = room.children.filter(child => child.userData.exterior);
    assert.ok(exterior.length >= 3);
    for (const child of exterior) {
      const bounds = new THREE.Box3().setFromObject(child);
      assert.ok(bounds.max.x < -ROOM.width / 2 - 3, 'keep exterior clear of window');
      assert.ok(bounds.max.x - bounds.min.x > 1, 'all batches have actual depth');
      assert.equal(child.castShadow, false, 'exterior adds no shadow workload');
    }
    const near = exterior.find(child => child.name === 'exterior-near')!;
    const fromRoom = new THREE.Raycaster(new THREE.Vector3(-24, -8, 0), new THREE.Vector3(-1, 0, 0));
    const fromOutside = new THREE.Raycaster(new THREE.Vector3(-45, -8, 0), new THREE.Vector3(1, 0, 0));
    assert.ok(fromRoom.intersectObject(near).length > 0);
    assert.ok(fromOutside.intersectObject(near).length > 0, 'buildings have backs, not just front faces');
  } finally { room.dispose(); }
});

test('independent room instances release their geometry and material batches', () => {
  const a = createRoom(-18, -2), b = createRoom(-18, -2);
  let geometries = 0, materials = 0;
  a.children.forEach(child => {
    const mesh = child as THREE.Mesh;
    mesh.geometry.addEventListener('dispose', () => geometries++);
    (mesh.material as THREE.Material).addEventListener('dispose', () => materials++);
  });
  assert.notEqual((a.children[0] as THREE.Mesh).geometry, (b.children[0] as THREE.Mesh).geometry);
  a.dispose();
  assert.equal(geometries, a.children.length);
  assert.equal(materials, a.children.length);
  b.dispose();
});

test('Taipei landmark is a distant solid tower with a slender spire', () => {
  const room = createRoom(-18, -2);
  try {
    const tower = room.getObjectByName('exterior-taipei-101') as THREE.Mesh;
    assert.ok(tower?.userData.exterior);
    const bounds = new THREE.Box3().setFromObject(tower);
    assert.ok(bounds.max.x < -80, 'landmark stays behind the neighborhood');
    assert.ok(bounds.max.z - bounds.min.z > 6, 'not a flat skyline card');
    assert.ok(bounds.max.y - bounds.min.y > 50, 'tiered tower includes its spire');
    const vertices = tower.geometry.getAttribute('position');
    const sectionWidth = (low: number, high: number) => {
      const xs: number[] = [];
      for (let i = 0; i < vertices.count; i++)
        if (vertices.getY(i) > low && vertices.getY(i) < high) xs.push(vertices.getX(i));
      assert.ok(xs.length > 0);
      return Math.max(...xs) - Math.min(...xs);
    };
    assert.ok(sectionWidth(-3, -1) > sectionWidth(25, 27), 'upper bamboo sections narrow overall');
    assert.ok(room.getObjectByName('exterior-taipei-101-trim'), 'crown, ribs and medallions have independent trim');
    room.updateMatrixWorld(true);
    const eye = new THREE.Vector3(7, 8, 21);
    const center = bounds.getCenter(new THREE.Vector3());
    for (const y of [18, 26, 37]) {
      const direction = new THREE.Vector3(center.x, y, center.z).sub(eye).normalize();
      const hit = new THREE.Raycaster(eye, direction).intersectObjects(room.children)[0];
      assert.ok(hit?.object.name.startsWith('exterior-taipei-101'), `tower at height ${y} is hidden by the window or neighbors`);
    }
    assert.equal(tower.castShadow, false);
  } finally { room.dispose(); }
});

test('refined surfaces keep lighting response and curtains remain physically folded', () => {
  const room = createRoom(-18, -2);
  try {
    for (const name of ['exterior-near', 'exterior-middle', 'exterior-far', 'studio-plaster', 'studio-walnut']) {
      const mesh = room.getObjectByName(name) as THREE.Mesh;
      assert.ok(mesh.material instanceof THREE.MeshStandardMaterial, `${name} must respond to light`);
    }
    const curtain = room.getObjectByName('window-linen') as THREE.Mesh;
    const bounds = new THREE.Box3().setFromObject(curtain);
    assert.ok(bounds.max.x - bounds.min.x > 0.25, 'folds have depth rather than a flat curtain image');
    const wall = room.getObjectByName('studio-plaster') as THREE.Mesh;
    assert.equal(wall.receiveShadow, false, 'painted broad light is not covered by hard equipment shadows');
  } finally { room.dispose(); }
});

test('Taipei neighbors mix tile colors and retain dimensional rooftop details', () => {
  const room = createRoom(-18, -2);
  try {
    const cream = room.getObjectByName('exterior-near') as THREE.Mesh;
    const brick = room.getObjectByName('exterior-near-brick') as THREE.Mesh;
    assert.ok(cream && brick);
    assert.notEqual((cream.material as THREE.MeshStandardMaterial).color.getHex(),
      (brick.material as THREE.MeshStandardMaterial).color.getHex());
    const roof = room.getObjectByName('exterior-roof') as THREE.Mesh;
    assert.ok(roof?.userData.exterior);
    assert.equal(roof.castShadow, false);
    const bounds = new THREE.Box3().setFromObject(roof);
    assert.ok(bounds.max.x - bounds.min.x > 4, 'awnings and rooftop rooms have real depth');
  } finally { room.dispose(); }
});
