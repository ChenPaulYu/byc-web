import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BlogList from './pages/BlogList';
import BlogEdit from './pages/BlogEdit';
import ProjectList from './pages/ProjectList';
import ProjectEdit from './pages/ProjectEdit';
import AboutEdit from './pages/AboutEdit';
import NewsList from './pages/NewsList';
import NewsEdit from './pages/NewsEdit';
import Settings from './pages/Settings';
import ImageGallery from './pages/ImageGallery';
import MpcAssets from './pages/MpcAssets';
import CvEdit from './pages/CvEdit';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter basename="/admin">
      <div className="flex min-h-screen bg-white">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 md:ml-56 min-w-0">
          {/* Mobile header with hamburger */}
          <div className="md:hidden sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            </button>
            <span className="text-sm font-bold text-neutral-900">BYC Admin</span>
          </div>

          <Routes>
            <Route path="/" element={<Navigate to="/blog" replace />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogEdit />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:slug" element={<ProjectEdit />} />
            <Route path="/about" element={<AboutEdit />} />
            <Route path="/news" element={<NewsList />} />
            <Route path="/news/:slug" element={<NewsEdit />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/images" element={<ImageGallery />} />
            <Route path="/mpc" element={<MpcAssets />} />
            <Route path="/cv" element={<CvEdit />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
