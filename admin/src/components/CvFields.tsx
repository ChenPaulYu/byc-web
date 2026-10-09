/** Optional CV content fields, using the existing editor's immutable update contract. */
import React from 'react';
import type { CvLink, CvLinkKind } from '../../../src/types/cv';

const inputClass = 'w-full min-w-0 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300';

export function CvTextField({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return <label className="block text-xs font-medium text-neutral-500">{label}<input className={`${inputClass} mt-1 font-normal text-neutral-900`} value={value ?? ''} onChange={event => onChange(event.target.value)} /></label>;
}

export function CvBulletFields({ value = [], onChange }: { value?: string[]; onChange: (value: string[]) => void }) {
  return <div className="mt-3">
    <div className="flex justify-between mb-2"><span className="text-xs text-neutral-500">Description bullets</span><button type="button" className="text-xs text-neutral-500" onClick={() => onChange([...value, ''])}>+ Add bullet</button></div>
    {value.map((text, i) => <div key={i} className="flex gap-2 mb-2"><input aria-label={`Description bullet ${i + 1}`} className={inputClass} value={text} onChange={event => onChange(value.map((item, j) => j === i ? event.target.value : item))} /><button type="button" aria-label={`Remove bullet ${i + 1}`} className="px-2 text-neutral-400 hover:text-red-500" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button></div>)}
  </div>;
}

export function CvLinkFields({ value = [], onChange }: { value?: CvLink[]; onChange: (value: CvLink[]) => void }) {
  const update = (i: number, patch: Partial<CvLink>) => onChange(value.map((link, j) => j === i ? { ...link, ...patch } : link));
  return <fieldset className="mt-3"><legend className="text-xs text-neutral-500">Resource links</legend>
    {value.map((link, i) => <div key={i} className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_auto] gap-2 mt-2">
      <select aria-label={`Link ${i + 1} icon`} className={inputClass} value={link.kind} onChange={event => update(i, { kind: event.target.value as CvLinkKind })}>
        <option value="paper">Paper</option><option value="code">Code</option><option value="demo">Demo</option><option value="video">Video</option><option value="website">Website</option>
      </select>
      <input aria-label={`Link ${i + 1} URL`} className={inputClass} value={link.url} placeholder="https://… or /papers/…" onChange={event => update(i, { url: event.target.value })} />
      <input aria-label={`Link ${i + 1} label`} className={inputClass} value={link.label ?? ''} placeholder="Accessible label (optional)" onChange={event => update(i, { label: event.target.value })} />
      <button type="button" aria-label={`Remove link ${i + 1}`} className="px-2 text-neutral-400 hover:text-red-500" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
    </div>)}
    <button type="button" className="mt-2 text-xs text-neutral-500" onClick={() => onChange([...value, { kind: 'website', url: '' }])}>+ Add link</button>
  </fieldset>;
}
