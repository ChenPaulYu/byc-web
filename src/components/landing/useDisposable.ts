/**
 * useDisposable — owns a GPU resource so that creating and freeing it stay symmetric.
 *
 * The obvious shape for a runtime-built texture or geometry is `useMemo` to make it and an effect
 * cleanup to dispose it. That shape is broken under React's StrictMode, which in development
 * mounts, unmounts and mounts again to surface exactly this class of bug: the cleanup runs and
 * frees the resource, but `useMemo` is not recomputed for the second mount, so the component comes
 * back holding something already disposed. In this project that emptied the entire homepage under
 * `npm run dev` while production builds were fine — every texture and geometry in the scene was
 * freed and never rebuilt.
 *
 * Creating inside the effect fixes it at the root rather than by turning StrictMode off: the
 * second mount runs the factory again and gets a live resource. The cost is one extra render, and
 * a null on the first, which every caller already handles because these were all optional before.
 *
 * Reads: nothing.
 */

import { useEffect, useState } from 'react';

export interface Disposable {
  dispose: () => void;
}

export function useDisposable<T extends Disposable>(create: () => T | null): T | null {
  const [resource, setResource] = useState<T | null>(null);

  useEffect(() => {
    const made = create();
    setResource(made);
    return () => {
      made?.dispose();
      setResource(null);
    };
    // The factory is intentionally not a dependency: these resources are built once per mount and
    // the closures that make them are recreated on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return resource;
}

/** Bundles several resources so a component that builds a set of them can hold one handle. */
export function bundle<T extends Record<string, Disposable>>(parts: T): T & Disposable {
  return {
    ...parts,
    dispose: () => Object.values(parts).forEach(part => part.dispose()),
  };
}
