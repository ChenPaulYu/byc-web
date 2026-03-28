import React, { useEffect, useState } from 'react';
import { getCvConfig, updateCvConfig, hasZhCv, getZhCvConfig, saveZhCvConfig, getGitHubHistoryUrl } from '../api';

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
  const [zhConfig, setZhConfig] = useState<CvConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);

  useEffect(() => {
    Promise.all([
      getCvConfig(),
      hasZhCv(),
    ])
      .then(([data, zh]) => {
        setConfig(data as unknown as CvConfig);
        setHasZh(zh);
      })
      .catch((err) => alert(`Failed to load CV config: ${err}`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (lang === 'zh' && hasZh && !zhConfig) {
      getZhCvConfig()
        .then((data) => setZhConfig(data as unknown as CvConfig))
        .catch(() => { /* new zh config, will copy from EN on save */ });
    }
    if (lang === 'zh' && !hasZh && !zhConfig && config) {
      // Start from a copy of EN config
      setZhConfig({ ...config });
    }
  }, [lang, hasZh, config]);

  const activeConfig = lang === 'zh' ? (zhConfig ?? config) : config;
  const setActiveConfig = (c: CvConfig) => {
    if (lang === 'zh') setZhConfig(c);
    else setConfig(c);
  };

  const handleSave = async () => {
    if (!activeConfig) return;
    setSaving(true);
    try {
      if (lang === 'zh') {
        await saveZhCvConfig(activeConfig as unknown as Record<string, unknown>);
      } else {
        await updateCvConfig(activeConfig as unknown as Record<string, unknown>);
      }
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

  if (loading) return <div className="p-4 md:p-8 text-neutral-400">Loading...</div>;
  if (!activeConfig) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">CV</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 animate-fade-in">Saved!</span>}
          {getGitHubHistoryUrl('') && (
            <a
              href={getGitHubHistoryUrl('public/cv.config.json')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              History
            </a>
          )}
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex items-center gap-2 mb-6">
        <div className="inline-flex items-center border border-neutral-200 rounded-md text-xs overflow-hidden">
          <button type="button" onClick={() => setLang('en')} className={`px-3 py-1.5 transition-colors ${lang === 'en' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>EN</button>
          <button type="button" onClick={() => { setLang('zh'); if (!hasZh) setHasZh(true); }} className={`px-3 py-1.5 transition-colors ${lang === 'zh' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>ZH</button>
        </div>
        {lang === 'zh' && !hasZh && <span className="text-xs text-neutral-400">Creating Chinese version</span>}
      </div>

      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" value={activeConfig.header.name} onChange={(e) => setActiveConfig({ ...activeConfig, header: { ...activeConfig.header, name: e.target.value } })} className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Tagline</label>
          <input type="text" value={activeConfig.header.tagline} onChange={(e) => setActiveConfig({ ...activeConfig, header: { ...activeConfig.header, tagline: e.target.value } })} className={inputClass} />
        </div>
      </div>

      {/* Education */}
      <SectionHeader
        title="Education"
        onAdd={() => setActiveConfig({ ...activeConfig, education: [...activeConfig.education, { school: '', degree: '', duration: '', location: '' }] })}
        visible={activeConfig.visibility?.education}
        onToggle={() => setActiveConfig({ ...activeConfig, visibility: { ...(activeConfig.visibility || {}), education: !(activeConfig.visibility?.education !== false) } })}
      />
      {activeConfig.education.map((edu, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setActiveConfig({ ...activeConfig, education: removeItem(activeConfig.education, i) })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelClass}>School</label><input type="text" value={edu.school} onChange={(e) => setActiveConfig({ ...activeConfig, education: updateField(activeConfig.education, i, 'school', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Degree</label><input type="text" value={edu.degree} onChange={(e) => setActiveConfig({ ...activeConfig, education: updateField(activeConfig.education, i, 'degree', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Duration</label><input type="text" value={edu.duration} onChange={(e) => setActiveConfig({ ...activeConfig, education: updateField(activeConfig.education, i, 'duration', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Location</label><input type="text" value={edu.location} onChange={(e) => setActiveConfig({ ...activeConfig, education: updateField(activeConfig.education, i, 'location', e.target.value) })} className={inputClass} /></div>
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
            onAdd={() => setActiveConfig({ ...activeConfig, [key]: [...activeConfig[key], { company: '', role: '', duration: '', location: '', description: [''] }] })}
            visible={activeConfig.visibility?.[key]}
            onToggle={() => setActiveConfig({ ...activeConfig, visibility: { ...(activeConfig.visibility || {}), [key]: !(activeConfig.visibility?.[key] !== false) } })}
          />
          {activeConfig[key].map((exp: Experience, i: number) => (
            <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
              <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setActiveConfig({ ...activeConfig, [key]: removeItem(activeConfig[key], i) })} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div><label className={labelClass}>Company / Lab</label><input type="text" value={exp.company} onChange={(e) => setActiveConfig({ ...activeConfig, [key]: updateField(activeConfig[key], i, 'company', e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>Role</label><input type="text" value={exp.role} onChange={(e) => setActiveConfig({ ...activeConfig, [key]: updateField(activeConfig[key], i, 'role', e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>Duration</label><input type="text" value={exp.duration} onChange={(e) => setActiveConfig({ ...activeConfig, [key]: updateField(activeConfig[key], i, 'duration', e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>Location</label><input type="text" value={exp.location} onChange={(e) => setActiveConfig({ ...activeConfig, [key]: updateField(activeConfig[key], i, 'location', e.target.value) })} className={inputClass} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Description bullets</label>
                  <button type="button" onClick={() => {
                    const updated = [...activeConfig[key]];
                    updated[i] = { ...updated[i], description: [...updated[i].description, ''] };
                    setActiveConfig({ ...activeConfig, [key]: updated });
                  }} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">+ Add bullet</button>
                </div>
                {exp.description.map((desc: string, j: number) => (
                  <div key={j} className="flex gap-2 mb-2">
                    <input type="text" value={desc} onChange={(e) => {
                      const updated = [...activeConfig[key]];
                      const newDesc = [...updated[i].description];
                      newDesc[j] = e.target.value;
                      updated[i] = { ...updated[i], description: newDesc };
                      setActiveConfig({ ...activeConfig, [key]: updated });
                    }} className={inputClass} placeholder="Bullet point..." />
                    <button type="button" onClick={() => {
                      const updated = [...activeConfig[key]];
                      updated[i] = { ...updated[i], description: updated[i].description.filter((_: string, k: number) => k !== j) };
                      setActiveConfig({ ...activeConfig, [key]: updated });
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
        onAdd={() => setActiveConfig({ ...activeConfig, publications: [...activeConfig.publications, { title: '', authors: '', venue: '', year: '', acceptanceRate: '' }] })}
        visible={activeConfig.visibility?.publications}
        onToggle={() => setActiveConfig({ ...activeConfig, visibility: { ...(activeConfig.visibility || {}), publications: !(activeConfig.visibility?.publications !== false) } })}
      />
      {activeConfig.publications.map((pub, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setActiveConfig({ ...activeConfig, publications: removeItem(activeConfig.publications, i) })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelClass}>Title</label><input type="text" value={pub.title} onChange={(e) => setActiveConfig({ ...activeConfig, publications: updateField(activeConfig.publications, i, 'title', e.target.value) })} className={inputClass} /></div>
            <div className="col-span-2"><label className={labelClass}>Authors (HTML ok)</label><input type="text" value={pub.authors} onChange={(e) => setActiveConfig({ ...activeConfig, publications: updateField(activeConfig.publications, i, 'authors', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Venue</label><input type="text" value={pub.venue} onChange={(e) => setActiveConfig({ ...activeConfig, publications: updateField(activeConfig.publications, i, 'venue', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Year</label><input type="text" value={pub.year} onChange={(e) => setActiveConfig({ ...activeConfig, publications: updateField(activeConfig.publications, i, 'year', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Acceptance Rate</label><input type="text" value={pub.acceptanceRate || ''} onChange={(e) => setActiveConfig({ ...activeConfig, publications: updateField(activeConfig.publications, i, 'acceptanceRate', e.target.value || undefined) })} className={inputClass} placeholder="e.g. 25%" /></div>
          </div>
        </div>
      ))}

      {/* Theses */}
      <SectionHeader
        title="Thesis"
        onAdd={() => setActiveConfig({ ...activeConfig, theses: [...activeConfig.theses, { title: '', authors: '', institution: '', year: '' }] })}
        visible={activeConfig.visibility?.theses}
        onToggle={() => setActiveConfig({ ...activeConfig, visibility: { ...(activeConfig.visibility || {}), theses: !(activeConfig.visibility?.theses !== false) } })}
      />
      {activeConfig.theses.map((thesis, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setActiveConfig({ ...activeConfig, theses: removeItem(activeConfig.theses, i) })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelClass}>Title</label><input type="text" value={thesis.title} onChange={(e) => setActiveConfig({ ...activeConfig, theses: updateField(activeConfig.theses, i, 'title', e.target.value) })} className={inputClass} /></div>
            <div className="col-span-2"><label className={labelClass}>Authors (HTML ok)</label><input type="text" value={thesis.authors} onChange={(e) => setActiveConfig({ ...activeConfig, theses: updateField(activeConfig.theses, i, 'authors', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Institution</label><input type="text" value={thesis.institution} onChange={(e) => setActiveConfig({ ...activeConfig, theses: updateField(activeConfig.theses, i, 'institution', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Year</label><input type="text" value={thesis.year} onChange={(e) => setActiveConfig({ ...activeConfig, theses: updateField(activeConfig.theses, i, 'year', e.target.value) })} className={inputClass} /></div>
          </div>
        </div>
      ))}

      {/* Awards */}
      <SectionHeader
        title="Awards"
        onAdd={() => setActiveConfig({ ...activeConfig, awards: [...activeConfig.awards, { title: '', venue: '', year: '', detail: '' }] })}
        visible={activeConfig.visibility?.awards}
        onToggle={() => setActiveConfig({ ...activeConfig, visibility: { ...(activeConfig.visibility || {}), awards: !(activeConfig.visibility?.awards !== false) } })}
      />
      {activeConfig.awards.map((award, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3"><span className="text-xs text-neutral-400">#{i + 1}</span><RemoveBtn onClick={() => setActiveConfig({ ...activeConfig, awards: removeItem(activeConfig.awards, i) })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={labelClass}>Title</label><input type="text" value={award.title} onChange={(e) => setActiveConfig({ ...activeConfig, awards: updateField(activeConfig.awards, i, 'title', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Venue</label><input type="text" value={award.venue} onChange={(e) => setActiveConfig({ ...activeConfig, awards: updateField(activeConfig.awards, i, 'venue', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Year</label><input type="text" value={award.year} onChange={(e) => setActiveConfig({ ...activeConfig, awards: updateField(activeConfig.awards, i, 'year', e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Detail</label><input type="text" value={award.detail || ''} onChange={(e) => setActiveConfig({ ...activeConfig, awards: updateField(activeConfig.awards, i, 'detail', e.target.value || undefined) })} className={inputClass} placeholder="Optional" /></div>
          </div>
        </div>
      ))}

      {/* Reviewer */}
      <SectionHeader
        title="Reviewer"
        onAdd={() => setActiveConfig({ ...activeConfig, reviewer: [...activeConfig.reviewer, { venue: '', years: '' }] })}
        visible={activeConfig.visibility?.reviewer}
        onToggle={() => setActiveConfig({ ...activeConfig, visibility: { ...(activeConfig.visibility || {}), reviewer: !(activeConfig.visibility?.reviewer !== false) } })}
      />
      {activeConfig.reviewer.map((rev, i) => (
        <div key={i} className="flex gap-3 mb-2 items-end">
          <div className="flex-1"><label className={labelClass}>Venue</label><input type="text" value={rev.venue} onChange={(e) => setActiveConfig({ ...activeConfig, reviewer: updateField(activeConfig.reviewer, i, 'venue', e.target.value) })} className={inputClass} /></div>
          <div className="w-32"><label className={labelClass}>Years</label><input type="text" value={rev.years} onChange={(e) => setActiveConfig({ ...activeConfig, reviewer: updateField(activeConfig.reviewer, i, 'years', e.target.value) })} className={inputClass} /></div>
          <RemoveBtn onClick={() => setActiveConfig({ ...activeConfig, reviewer: removeItem(activeConfig.reviewer, i) })} />
        </div>
      ))}

      {/* Custom Sections */}
      <div className="flex items-center justify-between mb-3 mt-8">
        <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Custom Sections</h3>
        <button type="button" onClick={() => {
          const id = `custom-${Date.now()}`;
          setActiveConfig({ ...activeConfig, customSections: [...(activeConfig.customSections || []), { id, title: 'New Section', visible: true, items: [] }] });
        }} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">+ Add Section</button>
      </div>

      {(activeConfig.customSections || []).map((section, si) => (
        <div key={section.id} className="border border-neutral-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between mb-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={section.title}
                onChange={(e) => {
                  const updated = [...activeConfig.customSections];
                  updated[si] = { ...updated[si], title: e.target.value };
                  setActiveConfig({ ...activeConfig, customSections: updated });
                }}
                className="text-sm font-semibold border-none focus:outline-none focus:ring-0 p-0 bg-transparent text-neutral-900"
                placeholder="Section title"
              />
              <button type="button" onClick={() => {
                const updated = [...activeConfig.customSections];
                updated[si] = { ...updated[si], visible: !updated[si].visible };
                setActiveConfig({ ...activeConfig, customSections: updated });
              }} className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${section.visible ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-400'}`}>
                {section.visible ? 'Visible' : 'Hidden'}
              </button>
            </div>
            <button type="button" onClick={() => {
              setActiveConfig({ ...activeConfig, customSections: activeConfig.customSections.filter((_, i) => i !== si) });
            }} className="text-xs text-neutral-400 hover:text-red-500 transition-colors">Delete Section</button>
          </div>

          {section.items.map((item, ii) => (
            <div key={ii} className="flex gap-2 mb-2">
              <input type="text" value={item.text} onChange={(e) => {
                const updated = [...activeConfig.customSections];
                const items = [...updated[si].items];
                items[ii] = { ...items[ii], text: e.target.value };
                updated[si] = { ...updated[si], items };
                setActiveConfig({ ...activeConfig, customSections: updated });
              }} className={inputClass} placeholder="Item text" />
              <input type="text" value={item.detail || ''} onChange={(e) => {
                const updated = [...activeConfig.customSections];
                const items = [...updated[si].items];
                items[ii] = { ...items[ii], detail: e.target.value || undefined };
                updated[si] = { ...updated[si], items };
                setActiveConfig({ ...activeConfig, customSections: updated });
              }} className={`${inputClass} w-40`} placeholder="Detail (optional)" />
              <button type="button" onClick={() => {
                const updated = [...activeConfig.customSections];
                updated[si] = { ...updated[si], items: updated[si].items.filter((_, k) => k !== ii) };
                setConfig({ ...config, customSections: updated });
              }} className="text-neutral-400 hover:text-red-500 px-2 transition-colors">×</button>
            </div>
          ))}
          <button type="button" onClick={() => {
            const updated = [...activeConfig.customSections];
            updated[si] = { ...updated[si], items: [...updated[si].items, { text: '', detail: '' }] };
            setActiveConfig({ ...activeConfig, customSections: updated });
          }} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors mt-1">+ Add item</button>
        </div>
      ))}
    </div>
  );
};

export default CvEdit;
