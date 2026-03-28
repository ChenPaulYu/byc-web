import React, { useEffect, useState, useRef } from 'react';
import { listImages, uploadImage, deleteImage } from '../api';

const ImageGallery: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await listImages();
      setImages(data);
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadImage(file);
      await fetchImages();
    } catch (err) {
      alert(`Upload failed: ${err}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Delete "${filename}"?`)) return;
    try {
      await deleteImage(filename);
      await fetchImages();
    } catch (err) {
      alert(`Delete failed: ${err}`);
    }
  };

  const handleCopyPath = (filename: string) => {
    const path = `/images/${filename}`;
    navigator.clipboard.writeText(path);
    setCopied(filename);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Images</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <p className="text-sm">No images yet. Upload one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((filename) => (
            <div key={filename} className="border border-neutral-200 rounded-lg overflow-hidden group">
              <div className="aspect-square bg-neutral-100">
                <img
                  src={`/public/images/${filename}`}
                  alt={filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2">
                <p className="text-xs text-neutral-600 truncate mb-2" title={filename}>{filename}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopyPath(filename)}
                    className="flex-1 text-xs px-2 py-1 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded transition-colors"
                  >
                    {copied === filename ? 'Copied!' : 'Copy Path'}
                  </button>
                  <button
                    onClick={() => handleDelete(filename)}
                    className="text-xs px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
