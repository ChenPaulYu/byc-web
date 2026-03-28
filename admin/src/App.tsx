import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BlogList from './pages/BlogList';
import BlogEdit from './pages/BlogEdit';
import ProjectList from './pages/ProjectList';
import ProjectEdit from './pages/ProjectEdit';
import AboutEdit from './pages/AboutEdit';

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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
