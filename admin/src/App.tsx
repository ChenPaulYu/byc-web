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

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'byc123';

const LoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem('byc-admin-auth') === 'true';
  });

  if (authenticated) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('byc-admin-auth', 'true');
      setAuthenticated(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <h1 className="text-lg font-bold text-neutral-900 mb-1">BYC Admin</h1>
        <p className="text-xs text-neutral-400 mb-6">Enter password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 mb-3"
        />
        <button
          type="submit"
          className="w-full px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors"
        >
          Sign In
        </button>
        {error && <p className="text-xs text-red-500 mt-2 text-center">Incorrect password</p>}
      </form>
    </div>
  );
};

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LoginGate>
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
    </LoginGate>
  );
};

export default App;
