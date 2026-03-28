import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BlogList from './pages/BlogList';
import BlogEdit from './pages/BlogEdit';

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-8">
    <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
    <p className="text-neutral-500 mt-2">Coming soon...</p>
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
            <Route path="/projects" element={<Placeholder title="Projects" />} />
            <Route path="/projects/new" element={<Placeholder title="New Project" />} />
            <Route path="/projects/:slug" element={<Placeholder title="Edit Project" />} />
            <Route path="/about" element={<Placeholder title="About" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
