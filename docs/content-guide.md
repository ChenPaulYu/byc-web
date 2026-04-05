# Content Management Guide

## Admin Dashboard (Recommended)

The easiest way to manage content:

- **Local:** `npm run admin` → http://localhost:3001
- **Deployed:** https://boyuchen.dev/admin (password protected)

The dashboard provides visual editors for all content types with live markdown preview, image upload, and more.

## Content Structure

```
public/
├── content.config.json       # Content registry (which items are enabled)
├── cv.config.json            # CV data
├── mpc.config.json           # MPC pad/loop/BPM config
├── papers/                   # Self-hosted PDFs (only non-arxiv papers)
└── content/
    ├── about.md              # About page
    ├── projects/             # Project markdown files + assets
    ├── blog/                 # Blog post markdown files
    └── news/                 # News items (displayed on About page)
```

## Asset Guidelines

### Images
- **Compress before committing.** Use `ffmpeg` or similar to resize images to max 1600px width and reasonable quality (q:v 4).
- **Logos and icons** should be resized to ~100px — never commit full-resolution logos (they can be >1MB).
- **Preferred formats:** JPG for photos, SVG for diagrams, PNG for logos with transparency.
- **Target size:** Individual images should be under 250KB. A project's total image assets should stay under 2MB.

### Videos
- **Never commit video files to git.** Host on YouTube or Vimeo and embed via link.
- In markdown, use a YouTube URL on its own line to auto-embed, or use the title attribute for a Figure/Video toggle:
  ```
  ![Caption text](/path/to/image.jpg "https://youtu.be/xxx")
  ```

### Papers (PDFs)
- **Use arxiv links** for papers available on arxiv — do not self-host.
- **Only self-host** papers not on arxiv (e.g., camera-ready versions before proceedings are published).
- **Compress with Ghostscript** before committing: `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress -dNOPAUSE -dBATCH -sOutputFile=out.pdf in.pdf`
- Store in `public/papers/` with lowercase, hyphen-separated names (e.g., `chi2026-fluebricks.pdf`).

### What NOT to commit
- `docs/content/` — raw research assets (LaTeX source, full-res figures, raw videos). Gitignored.
- `.DS_Store` files
- `node_modules/`, `dist/`
- `.env` files

## Adding Content Manually

### New Project

1. Create `public/content/projects/my-project.md` with frontmatter
2. Add `{"slug": "my-project", "enabled": true}` to the `projects` array in `content.config.json`
3. Add a corresponding entry in `src/constants.ts` `PROJECTS` array for the gallery card
4. Place project assets in `public/content/projects/my-project/` (compress first)

### New Blog Post

1. Create `public/content/blog/my-post.md` with frontmatter
2. Add `{"slug": "my-post", "enabled": true}` to the `blog` array in `content.config.json`

### New News Item

1. Create `public/content/news/my-news.md` with frontmatter
2. Add `{"slug": "my-news", "enabled": true}` to the `news` array in `content.config.json`

### Update About Page

Edit `public/content/about.md` directly. No config changes needed.

## Content Ordering

- **Projects:** pinned → importance (0–10) → alphabetical
- **Blog:** pinned → newest date → alphabetical
- **News:** newest date first

## Language Support

Add a Chinese version by creating a `.zh.md` file alongside the English one:

- `about.zh.md` — Chinese about page
- `blog/my-post.zh.md` — Chinese version of a blog post
- `cv.config.zh.json` — Chinese CV

The language toggle appears automatically when a Chinese version exists.

## See Also

- [markdown-guide.md](./markdown-guide.md) — Markdown syntax and custom components
- [README.md](../README.md) — Project overview and setup
