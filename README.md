# byc-web

Personal portfolio website for Bo-Yu Chen — Creative Technologist, Researcher, Engineer.

## ✨ Features

- **Interactive 3D MPC Controller** - Music production interface with Web Audio API
- **Config-Driven Content** - Add projects/blog posts without touching code
- **Markdown Everything** - All content in easy-to-edit markdown files
- **Chat Interface** - AI-powered chat with hidden Easter egg mechanics
- **Mobile Optimized** - Touch controls, responsive design, zoom support
- **Minimal Aesthetic** - Calm, poetic design inspired by Bear Blog

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Adding Content (No Code Required!)

**Add a New Project:**
```bash
# 1. Create markdown file
touch public/content/projects/my-project.md

# 2. Add entry to public/content.config.json
{
  "projects": [
    {"slug": "my-project", "enabled": true}
  ]
}
```

**Add a New Blog Post:**
```bash
# 1. Create markdown file
touch public/content/blog/my-post.md

# 2. Update config
{
  "blog": [
    {"slug": "my-post", "enabled": true}
  ]
}
```

**Update About Page:**
```bash
# Simply edit this file - no config needed!
vim public/content/about.md
```

See [docs/content-guide.md](./docs/content-guide.md) for detailed documentation.

## 📁 Project Structure

```
byc-web/
├── public/
│   ├── content.config.json       # 📝 Main content configuration
│   └── content/
│       ├── about.md              # About page content
│       ├── projects/             # Project markdown files
│       │   ├── project-1.md
│       │   └── project-2.md
│       ├── blog/                 # Blog post markdown files
│       │   ├── post-1.md
│       │   └── post-2.md
│       └── news/                 # Optional news/updates
│           └── update-1.md
├── src/
│   ├── components/               # React components
│   │   ├── LandingScene.tsx     # 3D MPC interface
│   │   ├── EyeWidget.tsx        # Easter egg widget
│   │   └── MarkdownRenderer.tsx # Markdown display
│   ├── pages/                    # Route pages
│   │   ├── Home.tsx
│   │   ├── Projects.tsx
│   │   ├── Blog.tsx
│   │   └── Chat.tsx
│   └── utils/
│       └── contentLoader.ts      # Content loading logic
├── docs/
│   └── content-guide.md          # 📖 Detailed content guide
└── README.md                     # This file
```

## 🎯 Content Management

### Markdown Frontmatter Examples

**Project:**
```markdown
---
title: "My Awesome Project"
date: "2024-01-15"
year: "2024"
category: "Research"         # Research, Engineering, or Creative
role: "Lead Developer"
tags: ["AI", "Music", "WebGL"]
cover: "/images/cover.jpg"
pinned: false               # Pin to top
importance: 5               # Priority (0-10)
links:
  - label: "View Demo"
    url: "https://demo.com"
    icon: "demo"            # video, paper, code, demo
---

Your project description...
```

**Blog Post:**
```markdown
---
title: "My Blog Post"
date: "2024-01-20"
category: "technology"
tags: ["react", "typescript"]
pinned: false
draft: false               # Set true to hide
---

Your blog content...
```

**News/Update:**
```markdown
---
title: "New Release!"
date: "2024-01-25"
type: "announcement"        # update, release, announcement, event
url: "https://link.com"    # Optional
---

Brief description...
```

### Content Ordering

- **Projects**: `pinned` → `importance` → alphabetical
- **Blog**: `pinned` → newest date → alphabetical
- **News**: newest date first

### Quick Tips

```bash
# Hide content temporarily
{"slug": "old-project", "enabled": false}

# Pin to top
pinned: true

# Save as draft
draft: true
```

## 🛠️ Tech Stack

- **React 19** + TypeScript
- **Vite** - Lightning-fast build tool
- **React Three Fiber** - 3D graphics with Three.js
- **Tailwind CSS** - Utility-first styling
- **Tone.js** - Web Audio framework
- **React Router** - Client-side routing
- **gray-matter** - Frontmatter parsing
- **remark-gfm** - GitHub Flavored Markdown

## 🎮 Interactive Features

### 3D MPC Controller
- **Keyboard**: 1-4, Q-R, A-F, Z-V to play pads
- **Mouse**: Drag knobs to adjust parameters
- **Mobile**: Touch controls with pinch-to-zoom
- **Audio**: Real-time synthesis with Tone.js

### Eye Widget Easter Egg
- **Desktop**: Circle mouse around eye or stare for 10 seconds
- **Mobile**: Circle finger around eye or long-press for 3 seconds
- Unlocks hidden chat mode

## 🎨 Customization

### Site Configuration

Edit `public/content.config.json`:

```json
{
  "site": {
    "title": "Your Name",
    "description": "Your tagline",
    "author": "Your Name",
    "url": "https://your-site.com"
  },
  "about": {
    "source": "about.md",
    "social": {
      "email": "your@email.com",
      "github": "https://github.com/username",
      "linkedin": "https://linkedin.com/in/username",
      "twitter": "https://twitter.com/username"
    }
  }
}
```

### Styling

- Global styles: `src/index.css`
- Markdown styles: `.markdown-content` classes in `src/index.css`
- Tailwind config: `tailwind.config.js`

## 📱 Mobile Optimizations

- Responsive 3D scene scaling
- Touch-optimized navigation (larger tap targets)
- Pinch-to-zoom support for orbit controls
- Long-press Easter egg trigger (3s vs 10s desktop)
- Enhanced eye widget visibility

## 🚢 Deployment

The site is configured for static hosting (Vercel, Netlify, GitHub Pages):

```bash
# Build
npm run build

# Output directory
dist/
```

For GitHub Pages, the site uses `HashRouter` for compatibility.

## 📚 Documentation

- **[docs/content-guide.md](./docs/content-guide.md)** - Complete content management guide
- **TypeScript types** - See `src/utils/contentLoader.ts` for content interfaces

## 🤝 Contributing

This is a personal portfolio, but feel free to:
- Report issues
- Suggest features
- Fork for your own use

## 📄 License

© 2025 Bo-Yu Chen. All rights reserved.

---

**Built with ❤️ using React, Three.js, and Tone.js**
