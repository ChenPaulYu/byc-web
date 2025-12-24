# byc-web

Personal portfolio website for Bo-Yu Chen — Creative Technologist, Researcher, Engineer.

## Features

- **Interactive MPC Controller** - 3D music production interface built with React Three Fiber
- **Markdown Blog System** - Write posts in markdown with frontmatter support
- **Project Showcase** - Display projects with detailed case studies
- **Chat Interface** - AI-powered chat with Easter egg mechanics
- **Minimal Design** - Calm, poetic aesthetic inspired by Bear Blog

## Tech Stack

- **React 19** + TypeScript
- **Vite** - Fast build tool
- **React Three Fiber** - 3D graphics with Three.js
- **Tailwind CSS** - Utility-first styling
- **Tone.js** - Web Audio framework
- **React Router** - Client-side routing

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/          # Route pages
├── content/        # Markdown content
│   ├── blog/      # Blog posts
│   └── projects/  # Project case studies
└── public/         # Static assets
```

## Development

The site uses HashRouter for GitHub Pages compatibility. The interactive MPC on the landing page features:
- Keyboard controls (1-4, Q-R, A-F, Z-V)
- Audio synthesis with Tone.js
- Real-time 3D rendering
- Responsive design

## License

© 2025 Bo-Yu Chen. All rights reserved.
