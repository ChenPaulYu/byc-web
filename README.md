# Bo-Yu Chen | Creative Technologist Portfolio

This is the personal website and portfolio of Bo-Yu Chen, a Creative Technologist specializing in AI Music, HCI, and Web Audio.

## 🚀 Features

- **Interactive 3D Landing Scene**: A custom-built MPC-style interface using React Three Fiber and Three.js.
- **Web Audio Integration**: Playable pads with synthesized sounds using Tone.js.
- **Responsive Design**: Clean, minimal aesthetic built with Tailwind CSS.
- **Project Showcase**: Filterable list of research, engineering, and creative projects.
- **Modern Tech Stack**: Built with React 19, Vite, and TypeScript.

## 📁 Project Structure

The codebase is organized following modern web development best practices:

```text
.
├── public/                # Static assets (3D models, videos, metadata)
│   ├── model.glb          # 3D Avatar model
│   ├── animation.mp4      # Background/Landing animation
│   └── metadata.json      # Site metadata
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   │   ├── LandingScene.tsx # Main 3D interactive scene
│   │   ├── Layout.tsx     # Main page wrapper
│   │   └── NavBar.tsx     # Navigation component
│   ├── pages/             # Page components (Home, About, Projects, CV)
│   ├── styles/            # CSS and styling
│   │   └── index.css      # Global styles and Tailwind directives
│   ├── App.tsx            # Main application component & Routing
│   ├── index.tsx          # Application entry point
│   ├── constants.ts       # Global constants and project data
│   └── types.ts           # TypeScript type definitions
├── index.html             # HTML entry point
├── package.json           # Project dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository (if you haven't already).
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```
The site will be available at `http://localhost:3000`.

### Building for Production

To create a production build:
```bash
npm run build
```
The optimized files will be in the `dist/` directory.

## 🎨 Technologies Used

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **3D Rendering**: [Three.js](https://threejs.org/), [@react-three/fiber](https://github.com/pmndrs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei)
- **Audio**: [Tone.js](https://tonejs.github.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router](https://reactrouter.com/)

## 📄 License

This project is private and for personal use.
