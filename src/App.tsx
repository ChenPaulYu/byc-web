import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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

// Redirect old /#/ hash URLs to new clean URLs
const HashRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      const path = window.location.hash.slice(1); // Remove #
      navigate(path, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-[200px]">
      <div className="h-1 rounded bg-neutral-100 overflow-hidden">
        <div className="h-full bg-neutral-800 rounded animate-progress" />
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <HashRedirect />
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
