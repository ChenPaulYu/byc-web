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
└── content/
    ├── about.md              # About page
    ├── projects/             # Project markdown files
    ├── blog/                 # Blog post markdown files
    └── news/                 # News items (displayed on About page)
```

## Adding Content Manually

### New Blog Post

1. Create `public/content/blog/my-post.md` with frontmatter
2. Add `{"slug": "my-post", "enabled": true}` to the `blog` array in `content.config.json`

### New Project

1. Create `public/content/projects/my-project.md` with frontmatter
2. Add `{"slug": "my-project", "enabled": true}` to the `projects` array in `content.config.json`

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
