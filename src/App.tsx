import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import News from './pages/News';
import CV from './pages/CV';
// Chat temporarily disabled
// import Chat from './pages/Chat';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Chat page temporarily disabled */}
        {/* <Route path="/chat" element={<Chat />} /> */}

        {/* Other pages with Layout */}
        <Route path="*" element={
          <Layout>
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
          </Layout>
        } />
      </Routes>
    </Router>
  );
};

export default App;