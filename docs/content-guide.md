# Content Management Guide

This guide explains how to add and manage content in your portfolio site.

## Overview

All content is managed through:
1. **Markdown files** in `/public/content/`
2. **Configuration file** at `/public/content.config.json`

No code changes needed! Just add files and update the config.

## Admin Dashboard

The easiest way to manage content is via the admin dashboard:

- **Local:** Run `npm run admin` and visit http://localhost:3001
- **Deployed:** Visit https://boyuchen.dev/admin (password: configured via `VITE_ADMIN_PASSWORD`)

The dashboard provides a visual editor for all content types, with live markdown preview, image upload, and more. See the README for full details.

For manual editing, continue reading below.

## Directory Structure

```
public/
├── content.config.json          # Main configuration file
└── content/
    ├── about.md                 # About page content
    ├── projects/
    │   ├── project-1.md
    │   ├── project-2.md
    │   └── ...
    ├── blog/
    │   ├── post-1.md
    │   ├── post-2.md
    │   └── ...
    └── news/                    # Optional news/updates
        ├── update-1.md
        └── ...
```

## Adding New Content

### 1. Add a New Project

**Step 1:** Create a markdown file in `/public/content/projects/`

```markdown
---
title: "My Awesome Project"
date: "2024-01-15"
year: "2024"
category: "Research"  # Research, Engineering, or Creative
role: "Lead Developer"
tags: ["AI", "Music", "WebGL"]
cover: "/images/project-cover.jpg"
pinned: false        # Set true to pin to top
importance: 5        # Higher = shows first (0-10)
links:
  - label: "View Demo"
    url: "https://demo.example.com"
    icon: "demo"     # video, paper, code, demo
  - label: "GitHub"
    url: "https://github.com/..."
    icon: "code"
---

# Project Description

Your project description goes here in markdown format.

## Features

- Feature 1
- Feature 2

## Technical Details

More details about implementation...
```

**Step 2:** Add to config file (`/public/content.config.json`)

```json
{
  "projects": [
    {
      "slug": "my-awesome-project",
      "enabled": true
    }
  ]
}
```

That's it! Your project will now appear on the site.

### 2. Add a New Blog Post

**Step 1:** Create `/public/content/blog/my-post.md`

```markdown
---
title: "My Blog Post Title"
date: "2024-01-20"
updated: "2024-02-01"  # Optional: last updated date
category: "technology"
tags: ["react", "typescript", "web"]
pinned: false
draft: false   # Set true to hide from public
---

# Your Blog Content

Write your blog post here in markdown...
```

**Step 2:** Add to config

```json
{
  "blog": [
    {
      "slug": "my-post",
      "enabled": true
    }
  ]
}
```

### 3. Add News/Updates (Optional)

**Step 1:** Create `/public/content/news/announcement.md`

```markdown
---
title: "New Paper Published!"
date: "2024-01-25"
updated: "2024-02-01"  # Optional: last updated date
type: "announcement"  # update, release, announcement, event
url: "https://paper-link.com"  # Optional external link
---

Brief description of the news...
```

**Step 2:** Add to config

```json
{
  "news": [
    {
      "slug": "announcement",
      "enabled": true
    }
  ]
}
```

### 4. Update About Page

Simply edit `/public/content/about.md` - no config changes needed!

## Content Management Tips

### Reordering Content

Content order is determined by:
- **Projects**: `pinned` → `importance` → alphabetical
- **Blog**: `pinned` → newest date → alphabetical
- **News**: newest date first

### Hiding Content

Set `"enabled": false` in config to temporarily hide without deleting:

```json
{
  "projects": [
    {
      "slug": "old-project",
      "enabled": false  // Hidden but not deleted
    }
  ]
}
```

### Draft Blog Posts

Use `draft: true` in frontmatter to keep posts private:

```markdown
---
title: "Work in Progress"
draft: true  # Won't show publicly
---
```

## Site Configuration

Edit `/public/content.config.json` for site-wide settings:

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

## Quick Reference

| Content Type | Location | Slug Format | Config Section |
|--------------|----------|-------------|----------------|
| Project | `content/projects/slug.md` | kebab-case | `projects` |
| Blog Post | `content/blog/slug.md` | kebab-case | `blog` |
| News | `content/news/slug.md` | kebab-case | `news` |
| About | `content/about.md` | N/A | `about.source` |

## Example Workflow

### Adding a new project:

```bash
# 1. Create the file
touch public/content/projects/new-project.md

# 2. Edit with your content
# (add frontmatter and markdown content)

# 3. Update content.config.json
# Add {"slug": "new-project", "enabled": true} to projects array

# 4. Done! No build needed - just refresh the page
```

## Need Help?

- All content uses standard markdown syntax
- Frontmatter uses YAML format (between `---` lines)
- Slugs should be lowercase with hyphens (kebab-case)
- Dates should be YYYY-MM-DD format

Happy content creating! 🎉
