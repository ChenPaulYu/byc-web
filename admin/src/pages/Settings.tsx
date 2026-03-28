import React, { useEffect, useState } from 'react';
import { getConfig, updateConfig, type ContentConfig, getGitHubHistoryUrl } from '../api';

const defaultConfig: ContentConfig = {
  site: { title: '', description: '', author: '', url: '' },
  about: { source: '', social: {} },
  projects: [],
  blog: [],
  news: [],
};

const Settings: React.FC = () => {
  const [config, setConfig] = useState<ContentConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getConfig()
      .then((data) => setConfig(data))
      .catch((err) => alert(`Failed to load settings: ${err}`))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(`Failed to save: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const setSite = (field: keyof ContentConfig['site'], value: string) =>
    setConfig({ ...config, site: { ...config.site, [field]: value } });

  const setSocial = (field: string, value: string) =>
    setConfig({ ...config, about: { ...config.about, social: { ...config.about.social, [field]: value || undefined } } });

  if (loading) return <div className="p-4 md:p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">Site Settings</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 animate-fade-in">Saved!</span>}
          {getGitHubHistoryUrl('') && (
            <a
              href={getGitHubHistoryUrl('public/content.config.json')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              History
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-4">Site</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Title</label>
              <input
                type="text"
                value={config.site.title}
                onChange={(e) => setSite('title', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="My Site"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Description</label>
              <input
                type="text"
                value={config.site.description}
                onChange={(e) => setSite('description', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="A short description of the site"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Author</label>
              <input
                type="text"
                value={config.site.author}
                onChange={(e) => setSite('author', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">URL</label>
              <input
                type="text"
                value={config.site.url}
                onChange={(e) => setSite('url', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-4">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Email</label>
              <input
                type="text"
                value={(config.about.social?.email as string) || ''}
                onChange={(e) => setSocial('email', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">GitHub</label>
              <input
                type="text"
                value={(config.about.social?.github as string) || ''}
                onChange={(e) => setSocial('github', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">LinkedIn</label>
              <input
                type="text"
                value={(config.about.social?.linkedin as string) || ''}
                onChange={(e) => setSocial('linkedin', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Twitter</label>
              <input
                type="text"
                value={(config.about.social?.twitter as string) || ''}
                onChange={(e) => setSocial('twitter', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="https://twitter.com/username"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
