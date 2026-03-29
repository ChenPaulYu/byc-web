import React, { useEffect, useState, useRef } from 'react';
import { getMpcAssets, uploadSample, deleteSample, uploadModel, uploadVideo, getMpcConfig, updateMpcConfig, type MpcAssets as MpcAssetsType, type MpcConfig } from '../api';
import MpcTester from '../components/MpcTester';

const MpcAssets: React.FC = () => {
  const [assets, setAssets] = useState<MpcAssetsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [mpcConfig, setMpcConfig] = useState<MpcConfig | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [assetsData, configData] = await Promise.all([getMpcAssets(), getMpcConfig()]);
      setAssets(assetsData);
      setMpcConfig(configData);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveConfig = async () => {
    if (!mpcConfig) return;
    setConfigSaving(true);
    try {
      await updateMpcConfig(mpcConfig);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
    } catch (err) { alert(`Save failed: ${err}`); }
    finally { setConfigSaving(false); }
  };

  const handleUploadSample = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('sample');
    try {
      await uploadSample(file);
      await fetchAll();
    } catch (err) { alert(`Upload failed: ${err}`); }
    finally { setUploading(null); if (sampleInputRef.current) sampleInputRef.current.value = ''; }
  };

  const handleDeleteSample = async (filename: string) => {
    if (!window.confirm(`Delete sample "${filename}"?`)) return;
    try {
      await deleteSample(filename);
      await fetchAll();
    } catch (err) { alert(`Delete failed: ${err}`); }
  };

  const handleUploadModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('model');
    try {
      await uploadModel(file);
      await fetchAll();
    } catch (err) { alert(`Upload failed: ${err}`); }
    finally { setUploading(null); if (modelInputRef.current) modelInputRef.current.value = ''; }
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('video');
    try {
      await uploadVideo(file);
      await fetchAll();
    } catch (err) { alert(`Upload failed: ${err}`); }
    finally { setUploading(null); if (videoInputRef.current) videoInputRef.current.value = ''; }
  };

  if (loading) return <div className="p-4 md:p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <h2 className="text-xl font-semibold text-neutral-900 mb-8">MPC Assets</h2>

      {/* Pad Configuration */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Pad Configuration</h3>
          <div className="flex items-center gap-3">
            {configSaved && <span className="text-sm text-green-600 animate-fade-in">Saved!</span>}
            <button
              onClick={handleSaveConfig}
              disabled={configSaving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {configSaving ? 'Saving...' : 'Save Config'}
            </button>
          </div>
        </div>

        {mpcConfig && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">BPM</label>
                <input
                  type="number"
                  min={40}
                  max={200}
                  value={mpcConfig.bpm}
                  onChange={(e) => setMpcConfig({ ...mpcConfig, bpm: parseInt(e.target.value) || 78 })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 tracking-wide mb-1">Loop Sample</label>
                <select
                  value={mpcConfig.loop}
                  onChange={(e) => setMpcConfig({ ...mpcConfig, loop: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                >
                  <option value="">None</option>
                  {assets?.samples.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <MpcTester
              config={mpcConfig}
              samples={assets?.samples || []}
              onPadAssign={(key, sample) => {
                setMpcConfig({ ...mpcConfig, pads: { ...mpcConfig.pads, [key]: sample } });
              }}
              onPadClear={(key) => {
                const newPads = { ...mpcConfig.pads };
                delete newPads[key];
                setMpcConfig({ ...mpcConfig, pads: newPads });
              }}
            />
          </div>
        )}
      </section>

      {/* Audio Samples */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Audio Samples</h3>
          <div>
            <input ref={sampleInputRef} type="file" accept=".wav,.mp3,.ogg" onChange={handleUploadSample} className="hidden" />
            <button
              onClick={() => sampleInputRef.current?.click()}
              disabled={uploading === 'sample'}
              className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {uploading === 'sample' ? 'Uploading...' : 'Upload Sample'}
            </button>
          </div>
        </div>
        {assets?.samples.length === 0 ? (
          <p className="text-sm text-neutral-400">No samples uploaded.</p>
        ) : (
          <div className="space-y-2">
            {assets?.samples.map((filename) => (
              <div
                key={filename}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', filename);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="flex items-center justify-between px-4 py-2.5 border border-neutral-200 rounded-lg cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      const audio = new Audio(`/public/samples/${filename}`);
                      audio.play().catch(() => {});
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors shrink-0"
                    title="Preview"
                  >
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="#171717"><polygon points="0,0 10,6 0,12" /></svg>
                  </button>
                  <span className="text-sm text-neutral-700 truncate">{filename}</span>
                </div>
                <button
                  onClick={() => handleDeleteSample(filename)}
                  className="text-xs text-neutral-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3D Avatar Model */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">3D Avatar Model</h3>
          <div>
            <input ref={modelInputRef} type="file" accept=".glb,.gltf" onChange={handleUploadModel} className="hidden" />
            <button
              onClick={() => modelInputRef.current?.click()}
              disabled={uploading === 'model'}
              className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {uploading === 'model' ? 'Uploading...' : 'Replace Model'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border border-neutral-200 rounded-lg">
          <span className="text-lg">🧍</span>
          <span className="text-sm text-neutral-700">model.glb</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${assets?.hasModel ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {assets?.hasModel ? 'Present' : 'Missing'}
          </span>
        </div>
      </section>

      {/* Background Video */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Background Video</h3>
          <div>
            <input ref={videoInputRef} type="file" accept=".mp4,.webm" onChange={handleUploadVideo} className="hidden" />
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading === 'video'}
              className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {uploading === 'video' ? 'Uploading...' : 'Replace Video'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border border-neutral-200 rounded-lg">
          <span className="text-lg">🎬</span>
          <span className="text-sm text-neutral-700">animation.mp4</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${assets?.hasVideo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {assets?.hasVideo ? 'Present' : 'Missing'}
          </span>
        </div>
      </section>
    </div>
  );
};

export default MpcAssets;
