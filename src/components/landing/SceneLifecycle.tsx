/** Reports rendered frames independently of media and caches stable shadows. GPU loss is
 * observed by LandingScene's DOM host, which exists before renderer initialization.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { cacheRoomShadows } from './shadowCache';

export function SceneLifecycle({ onReady }: {
  onReady: () => void;
}) {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const signalled = useRef(false);

  useEffect(() => cacheRoomShadows(scene, gl), [scene, gl]);

  useFrame(() => {
    // R3F callbacks run before rendering: the previous frame must have actually drawn.
    if (!signalled.current && gl.info.render.frame > 1) {
      signalled.current = true;
      onReady();
    }
  });
  return null;
}
