import React from 'react';
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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 ml-56">
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
