import React, { useEffect, useState } from 'react';
import { getCvConfig, updateCvConfig } from '../api';

interface Education { school: string; degree: string; duration: string; location: string; }
interface Experience { company: string; role: string; duration: string; location: string; description: string[]; }
interface Publication { title: string; authors: string; venue: string; year: string; acceptanceRate?: string; }
interface Thesis { title: string; authors: string; institution: string; year: string; }
interface Award { title: string; venue: string; year: string; detail?: string; }
interface ReviewerEntry { venue: string; years: string; }
interface CustomSectionItem { text: string; detail?: string; }
interface CustomSection { id: string; title: string; visible: boolean; items: CustomSectionItem[]; }

interface CvConfig {
  header: { name: string; tagline: string };
  education: Education[];
  workExperience: Experience[];
  researchExperience: Experience[];
  teachingExperience: Experience[];
  publications: Publication[];
  theses: Thesis[];
  awards: Award[];
  reviewer: ReviewerEntry[];
  visibility: Record<string, boolean>;
  customSections: CustomSection[];
}

const SectionHeader: React.FC<{ title: string; onAdd: () => void; visible?: boolean; onToggle?: () => void }> = ({ title, onAdd, visible, onToggle }) => (
  <div className="flex items-center justify-between mb-3 mt-8 first:mt-0">
    <div className="flex items-center gap-3">
      <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">{title}</h3>
      {onToggle !== undefined && (
        <button type="button" onClick={onToggle} className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${visible !== false ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-400'}`}>
          {visible !== false ? 'Visible' : 'Hidden'}
        </button>
      )}
    </div>
    <button type="button" onClick={onAdd} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">+ Add</button>
  </div>
);

const RemoveBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} className="text-xs text-neutral-400 hover:text-red-500 transition-colors">Remove</button>
);

const inputClass = "w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300";
const labelClass = "block text-xs font-medium text-neutral-400 tracking-wide mb-1";

const CvEdit: React.FC = () => {
  const [config, setConfig] = useState<CvConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCvConfig()
      .then((data) => setConfig(data as unknown as CvConfig))
      .catch((err) => alert(`Failed to load CV config: ${err}`))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await updateCvConfig(config as unknown as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { alert(`Save failed: ${err}`); }
    finally { setSaving(false); }
  };

  const updateField = <T,>(arr: T[], index: number, field: keyof T, value: T[keyof T]): T[] => {
    const copy = [...arr];
    copy[index] = { ...copy[index], [field]: value };
    return copy;
  };

  const removeItem = <T,>(arr: T[], index: number): T[] => arr.filter((_, i) => i !== index);

  if (loading) return <div className="p-8 text-neutral-400">Loading...</div>;
  if (!config) return null;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">CV</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" value={config.header.name} onChange={(e) => setConfig({ ...config, header: { ...config.header, name: e.target.value } })} className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Tagline</label>
          <input type="text" value={config.header.tagline} onChange={(e) => setConfig({ ...config, header: { ...config.header, tagline: e.target.value } })} className={inputClass} />
        </div>
      </div>

      {/* Education */}
      <SectionHeader
        title="Education"
        onAdd={() => setConfig({ ...config, education: [...config.education, { school: '', degree: '', duration: '', location: '' }] })}
        visible={config.visibility?.education}
        onToggle={() => setConfig({ ...config, visibility: { ...(config.visibility || {}), education: !(config.visibility?.education !== false) } })}
      />
      {config.education.map((edu, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setConfig({ ...config, education: removeItem(config.education, i) })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelClass}>School</label><input type="text" value={edu.school} onChange={(e) => setConfig({ ...config, education: updateField(config.education, i, 'school', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Degree</label><input type="text" value={edu.degree} onChange={(e) => setConfig({ ...config, education: updateField(config.education, i, 'degree', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Duration</label><input type="text" value={edu.duration} onChange={(e) => setConfig({ ...config, education: updateField(config.education, i, 'duration', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Location</label><input type="text" value={edu.location} onChange={(e) => setConfig({ ...config, education: updateField(config.education, i, 'location', e.target.value) })} className={inputClass} /></div>
          </div>
        </div>
      ))}

      {/* Experience sections - reusable pattern */}
      {([
        { key: 'workExperience' as const, title: 'Work Experience' },
        { key: 'researchExperience' as const, title: 'Research Experience' },
        { key: 'teachingExperience' as const, title: 'Teaching Experience' },
      ]).map(({ key, title }) => (
        <React.Fragment key={key}>
          <SectionHeader
            title={title}
            onAdd={() => setConfig({ ...config, [key]: [...config[key], { company: '', role: '', duration: '', location: '', description: [''] }] })}
            visible={config.visibility?.[key]}
            onToggle={() => setConfig({ ...config, visibility: { ...(config.visibility || {}), [key]: !(config.visibility?.[key] !== false) } })}
          />
          {config[key].map((exp: Experience, i: number) => (
            <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
              <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setConfig({ ...config, [key]: removeItem(config[key], i) })} /></div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className={labelClass}>Company / Lab</label><input type="text" value={exp.company} onChange={(e) => setConfig({ ...config, [key]: updateField(config[key], i, 'company', e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>Role</label><input type="text" value={exp.role} onChange={(e) => setConfig({ ...config, [key]: updateField(config[key], i, 'role', e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>Duration</label><input type="text" value={exp.duration} onChange={(e) => setConfig({ ...config, [key]: updateField(config[key], i, 'duration', e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>Location</label><input type="text" value={exp.location} onChange={(e) => setConfig({ ...config, [key]: updateField(config[key], i, 'location', e.target.value) })} className={inputClass} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Description bullets</label>
                  <button type="button" onClick={() => {
                    const updated = [...config[key]];
                    updated[i] = { ...updated[i], description: [...updated[i].description, ''] };
                    setConfig({ ...config, [key]: updated });
                  }} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">+ Add bullet</button>
                </div>
                {exp.description.map((desc: string, j: number) => (
                  <div key={j} className="flex gap-2 mb-2">
                    <input type="text" value={desc} onChange={(e) => {
                      const updated = [...config[key]];
                      const newDesc = [...updated[i].description];
                      newDesc[j] = e.target.value;
                      updated[i] = { ...updated[i], description: newDesc };
                      setConfig({ ...config, [key]: updated });
                    }} className={inputClass} placeholder="Bullet point..." />
                    <button type="button" onClick={() => {
                      const updated = [...config[key]];
                      updated[i] = { ...updated[i], description: updated[i].description.filter((_: string, k: number) => k !== j) };
                      setConfig({ ...config, [key]: updated });
                    }} className="text-neutral-400 hover:text-red-500 px-2 transition-colors">×</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}

      {/* Publications */}
      <SectionHeader
        title="Publications"
        onAdd={() => setConfig({ ...config, publications: [...config.publications, { title: '', authors: '', venue: '', year: '', acceptanceRate: '' }] })}
        visible={config.visibility?.publications}
        onToggle={() => setConfig({ ...config, visibility: { ...(config.visibility || {}), publications: !(config.visibility?.publications !== false) } })}
      />
      {config.publications.map((pub, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setConfig({ ...config, publications: removeItem(config.publications, i) })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelClass}>Title</label><input type="text" value={pub.title} onChange={(e) => setConfig({ ...config, publications: updateField(config.publications, i, 'title', e.target.value) })} className={inputClass} /></div>
            <div className="col-span-2"><label className={labelClass}>Authors (HTML ok)</label><input type="text" value={pub.authors} onChange={(e) => setConfig({ ...config, publications: updateField(config.publications, i, 'authors', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Venue</label><input type="text" value={pub.venue} onChange={(e) => setConfig({ ...config, publications: updateField(config.publications, i, 'venue', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Year</label><input type="text" value={pub.year} onChange={(e) => setConfig({ ...config, publications: updateField(config.publications, i, 'year', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Acceptance Rate</label><input type="text" value={pub.acceptanceRate || ''} onChange={(e) => setConfig({ ...config, publications: updateField(config.publications, i, 'acceptanceRate', e.target.value || undefined) })} className={inputClass} placeholder="e.g. 25%" /></div>
          </div>
        </div>
      ))}

      {/* Theses */}
      <SectionHeader
        title="Thesis"
        onAdd={() => setConfig({ ...config, theses: [...config.theses, { title: '', authors: '', institution: '', year: '' }] })}
        visible={config.visibility?.theses}
        onToggle={() => setConfig({ ...config, visibility: { ...(config.visibility || {}), theses: !(config.visibility?.theses !== false) } })}
      />
      {config.theses.map((thesis, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setConfig({ ...config, theses: removeItem(config.theses, i) })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelClass}>Title</label><input type="text" value={thesis.title} onChange={(e) => setConfig({ ...config, theses: updateField(config.theses, i, 'title', e.target.value) })} className={inputClass} /></div>
            <div className="col-span-2"><label className={labelClass}>Authors (HTML ok)</label><input type="text" value={thesis.authors} onChange={(e) => setConfig({ ...config, theses: updateField(config.theses, i, 'authors', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Institution</label><input type="text" value={thesis.institution} onChange={(e) => setConfig({ ...config, theses: updateField(config.theses, i, 'institution', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Year</label><input type="text" value={thesis.year} onChange={(e) => setConfig({ ...config, theses: updateField(config.theses, i, 'year', e.target.value) })} className={inputClass} /></div>
          </div>
        </div>
      ))}

      {/* Awards */}
      <SectionHeader
        title="Awards"
        onAdd={() => setConfig({ ...config, awards: [...config.awards, { title: '', venue: '', year: '', detail: '' }] })}
        visible={config.visibility?.awards}
        onToggle={() => setConfig({ ...config, visibility: { ...(config.visibility || {}), awards: !(config.visibility?.awards !== false) } })}
      />
      {config.awards.map((award, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setConfig({ ...config, awards: removeItem(config.awards, i) })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Title</label><input type="text" value={award.title} onChange={(e) => setConfig({ ...config, awards: updateField(config.awards, i, 'title', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Venue</label><input type="text" value={award.venue} onChange={(e) => setConfig({ ...config, awards: updateField(config.awards, i, 'venue', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Year</label><input type="text" value={award.year} onChange={(e) => setConfig({ ...config, awards: updateField(config.awards, i, 'year', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Detail</label><input type="text" value={award.detail || ''} onChange={(e) => setConfig({ ...config, awards: updateField(config.awards, i, 'detail', e.target.value || undefined) })} className={inputClass} placeholder="Optional" /></div>
          </div>
        </div>
      ))}

      {/* Reviewer */}
      <SectionHeader
        title="Reviewer"
        onAdd={() => setConfig({ ...config, reviewer: [...config.reviewer, { venue: '', years: '' }] })}
        visible={config.visibility?.reviewer}
        onToggle={() => setConfig({ ...config, visibility: { ...(config.visibility || {}), reviewer: !(config.visibility?.reviewer !== false) } })}
      />
      {config.reviewer.map((rev, i) => (
        <div key={i} className="flex gap-3 mb-2 items-end">
          <div className="flex-1"><label className={labelClass}>Venue</label><input type="text" value={rev.venue} onChange={(e) => setConfig({ ...config, reviewer: updateField(config.reviewer, i, 'venue', e.target.value) })} className={inputClass} /></div>
          <div className="w-32"><label className={labelClass}>Years</label><input type="text" value={rev.years} onChange={(e) => setConfig({ ...config, reviewer: updateField(config.reviewer, i, 'years', e.target.value) })} className={inputClass} /></div>
          <RemoveBtn onClick={() => setConfig({ ...config, reviewer: removeItem(config.reviewer, i) })} />
        </div>
      ))}

      {/* Custom Sections */}
      <div className="flex items-center justify-between mb-3 mt-8">
        <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Custom Sections</h3>
        <button type="button" onClick={() => {
          const id = `custom-${Date.now()}`;
          setConfig({ ...config, customSections: [...(config.customSections || []), { id, title: 'New Section', visible: true, items: [] }] });
        }} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">+ Add Section</button>
      </div>

      {(config.customSections || []).map((section, si) => (
        <div key={section.id} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={section.title}
                onChange={(e) => {
                  const updated = [...config.customSections];
                  updated[si] = { ...updated[si], title: e.target.value };
                  setConfig({ ...config, customSections: updated });
                }}
                className="text-sm font-semibold border-none focus:outline-none focus:ring-0 p-0 bg-transparent text-neutral-900"
                placeholder="Section title"
              />
              <button type="button" onClick={() => {
                const updated = [...config.customSections];
                updated[si] = { ...updated[si], visible: !updated[si].visible };
                setConfig({ ...config, customSections: updated });
              }} className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${section.visible ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-400'}`}>
                {section.visible ? 'Visible' : 'Hidden'}
              </button>
            </div>
            <button type="button" onClick={() => {
              setConfig({ ...config, customSections: config.customSections.filter((_, i) => i !== si) });
            }} className="text-xs text-neutral-400 hover:text-red-500 transition-colors">Delete Section</button>
          </div>

          {section.items.map((item, ii) => (
            <div key={ii} className="flex gap-2 mb-2">
              <input type="text" value={item.text} onChange={(e) => {
                const updated = [...config.customSections];
                const items = [...updated[si].items];
                items[ii] = { ...items[ii], text: e.target.value };
                updated[si] = { ...updated[si], items };
                setConfig({ ...config, customSections: updated });
              }} className={inputClass} placeholder="Item text" />
              <input type="text" value={item.detail || ''} onChange={(e) => {
                const updated = [...config.customSections];
                const items = [...updated[si].items];
                items[ii] = { ...items[ii], detail: e.target.value || undefined };
                updated[si] = { ...updated[si], items };
                setConfig({ ...config, customSections: updated });
              }} className={`${inputClass} w-40`} placeholder="Detail (optional)" />
              <button type="button" onClick={() => {
                const updated = [...config.customSections];
                updated[si] = { ...updated[si], items: updated[si].items.filter((_, k) => k !== ii) };
                setConfig({ ...config, customSections: updated });
              }} className="text-neutral-400 hover:text-red-500 px-2 transition-colors">×</button>
            </div>
          ))}
          <button type="button" onClick={() => {
            const updated = [...config.customSections];
            updated[si] = { ...updated[si], items: [...updated[si].items, { text: '', detail: '' }] };
            setConfig({ ...config, customSections: updated });
          }} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors mt-1">+ Add item</button>
        </div>
      ))}
    </div>
  );
};

export default CvEdit;
