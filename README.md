# byc-web

Personal portfolio website for Bo-Yu Chen — Researcher // Engineer // Creator.

## Features

- **Interactive 3D MPC Controller** — Playable music production interface with configurable pads, samples, and loop
- **Admin Dashboard** — Full CMS at `/admin` for managing all content from the browser
- **Config-Driven Content** — Blog, projects, news, CV, and site settings editable without touching code
- **Markdown Everything** — All content in markdown files with YAML frontmatter
- **Mobile Optimized** — Responsive design with touch controls
- **SEO Ready** — Open Graph, Twitter Cards, per-page titles, favicon

## Quick Start

### Development

```bash
npm install

# Start the public site (http://localhost:3000)
npm run dev

# Start the admin dashboard (http://localhost:3001 + API on :3002)
npm run admin

# Build for production (builds both public site and admin)
npm run build

# Generate CV PDF
npm run build:cvpdf
```

### Admin Dashboard

The admin dashboard lets you manage all site content:

| Section | What you can do |
|---------|----------------|
| **Blog** | Create, edit, delete posts. Toggle draft/published, pin posts |
| **Projects** | Create, edit, delete. Set category, importance, links |
| **News** | Create, edit, delete announcements, updates, events |
| **About** | Edit the about page markdown |
| **CV** | Edit all CV sections, toggle visibility, add custom sections |
| **Settings** | Site title, description, social links |
| **Images** | Upload, browse, copy paths, delete images |
| **MPC Assets** | Configure pad assignments, BPM, loop, upload samples/model/video |

**Local:** `npm run admin` → http://localhost:3001

**Deployed:** https://boyuchen.dev/admin (password protected)

### Deployment (Vercel)

The site is deployed on Vercel. Both the public site and admin dashboard deploy together.

**Environment variables for Vercel:**

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ADMIN_PASSWORD` | No | Admin login password (default: `byc123`) |
| `VITE_GITHUB_TOKEN` | Yes (for deployed admin) | GitHub classic token with `repo` scope |
| `VITE_GITHUB_OWNER` | No | GitHub username (default: `ChenPaulYu`) |
| `VITE_GITHUB_REPO` | No | Repository name (default: `byc-web`) |
| `VITE_GITHUB_BRANCH` | No | Branch name (default: `main`) |
| `VITE_VERCEL_DEPLOY_HOOK` | No | Deploy hook URL — adds a "Deploy Site" button to admin sidebar |

## Project Structure

```
byc-web/
├── public/
│   ├── content.config.json       # Content registry
│   ├── cv.config.json            # CV data
│   ├── mpc.config.json           # MPC pad/loop/BPM config
│   ├── favicon.svg               # MPC favicon
│   ├── og-image.png              # Social sharing image
│   └── content/
│       ├── about.md              # About page
│       ├── projects/             # Project markdown files
│       ├── blog/                 # Blog post markdown files
│       └── news/                 # News/update markdown files
├── src/                          # Public site
│   ├── components/
│   │   ├── LandingScene.tsx      # 3D MPC interface
│   │   ├── MarkdownRenderer.tsx  # Markdown display
│   │   └── NavBar.tsx            # Navigation
│   ├── pages/                    # Route pages
│   └── utils/
│       └── contentLoader.ts      # Content loading
├── admin/                        # Admin dashboard (separate Vite app)
│   └── src/
│       ├── App.tsx               # Dashboard shell + auth gate
│       ├── api.ts                # API switcher (local/GitHub)
│       ├── local-api.ts          # Express API client
│       ├── github-api.ts         # GitHub Contents API client
│       ├── components/           # Sidebar, editor, table, toolbar
│       └── pages/                # Dashboard pages
├── server/                       # Local API server (dev only)
│   ├── index.ts                  # Express entry point
│   ├── routes.ts                 # REST endpoints
│   └── storage/                  # Storage abstraction
│       ├── adapter.ts            # Interface
│       └── local.ts              # Filesystem implementation
└── scripts/
    └── render-cv-pdf.mjs         # Playwright PDF generator
```

## Content Management

### Using the Dashboard (Recommended)

Visit `/admin` to manage content visually. Changes on the deployed version commit directly to GitHub and trigger auto-deploy.

### Manual Editing

All content is in `public/content/` as markdown with YAML frontmatter. See [docs/content-guide.md](./docs/content-guide.md) for details.

### Content Ordering

- **Projects**: `pinned` → `importance` (0-10) → alphabetical
- **Blog**: `pinned` → newest date → alphabetical
- **News**: newest date first

## Tech Stack

- **React 19** + TypeScript + Vite 6
- **React Three Fiber** — 3D graphics with Three.js
- **Tailwind CSS** — Utility-first styling
- **Tone.js** — Web Audio framework
- **Express** — Admin API server (local dev)
- **GitHub Contents API** — Remote content editing (deployed)

## License

© 2025 Bo-Yu Chen. All rights reserved.
