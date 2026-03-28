import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

// Lazy-loaded pages
const About = lazy(() => import('./pages/About'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const News = lazy(() => import('./pages/News'));
const CV = lazy(() => import('./pages/CV'));

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-neutral-400 text-sm">Loading...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Other pages with Layout */}
        <Route path="*" element={
          <Layout>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:slug" element={<ProjectDetail />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/news" element={<News />} />
                <Route path="/cv" element={<CV />} />
              </Routes>
            </Suspense>
          </Layout>
        } />
      </Routes>
    </Router>
  );
};

export default App;
