import React, { useEffect, useState, useRef } from 'react';
import { getMpcAssets, uploadSample, deleteSample, uploadModel, uploadVideo, type MpcAssets as MpcAssetsType } from '../api';

const MpcAssets: React.FC = () => {
  const [assets, setAssets] = useState<MpcAssetsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      setAssets(await getMpcAssets());
    } catch (err) {
      console.error('Failed to load MPC assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleUploadSample = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('sample');
    try {
      await uploadSample(file);
      await fetchAssets();
    } catch (err) { alert(`Upload failed: ${err}`); }
    finally { setUploading(null); if (sampleInputRef.current) sampleInputRef.current.value = ''; }
  };

  const handleDeleteSample = async (filename: string) => {
    if (!window.confirm(`Delete sample "${filename}"?`)) return;
    try {
      await deleteSample(filename);
      await fetchAssets();
    } catch (err) { alert(`Delete failed: ${err}`); }
  };

  const handleUploadModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('model');
    try {
      await uploadModel(file);
      await fetchAssets();
    } catch (err) { alert(`Upload failed: ${err}`); }
    finally { setUploading(null); if (modelInputRef.current) modelInputRef.current.value = ''; }
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('video');
    try {
      await uploadVideo(file);
      await fetchAssets();
    } catch (err) { alert(`Upload failed: ${err}`); }
    finally { setUploading(null); if (videoInputRef.current) videoInputRef.current.value = ''; }
  };

  if (loading) return <div className="p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <h2 className="text-2xl font-bold text-neutral-900 mb-8">MPC Assets</h2>

      {/* Audio Samples */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Audio Samples</h3>
          <div>
            <input ref={sampleInputRef} type="file" accept=".wav,.mp3,.ogg" onChange={handleUploadSample} className="hidden" />
            <button
              onClick={() => sampleInputRef.current?.click()}
              disabled={uploading === 'sample'}
              className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors"
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
              <div key={filename} className="flex items-center justify-between px-4 py-2.5 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🎵</span>
                  <span className="text-sm text-neutral-700">{filename}</span>
                </div>
                <button
                  onClick={() => handleDeleteSample(filename)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
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
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">3D Avatar Model</h3>
          <div>
            <input ref={modelInputRef} type="file" accept=".glb,.gltf" onChange={handleUploadModel} className="hidden" />
            <button
              onClick={() => modelInputRef.current?.click()}
              disabled={uploading === 'model'}
              className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors"
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
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Background Video</h3>
          <div>
            <input ref={videoInputRef} type="file" accept=".mp4,.webm" onChange={handleUploadVideo} className="hidden" />
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading === 'video'}
              className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors"
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
