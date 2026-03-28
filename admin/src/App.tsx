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

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
    <p className="text-sm text-neutral-400 mt-2">Coming soon.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 ml-60">
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
            <Route path="/images" element={<Placeholder title="Images" />} />
            <Route path="/mpc" element={<Placeholder title="MPC Assets" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
