# Markdown Guide

Quick reference for writing content on the site.

## Basic Formatting

| Syntax | Result |
|--------|--------|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `` `code` `` | `code` |
| `[link](url)` | [link](url) |
| `![alt](image-url)` | Image |

## Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
```

## Lists

```markdown
- Unordered item
- Another item

1. Ordered item
2. Another item
```

## Blockquote

```markdown
> This is a quote
```

## Code Block

````markdown
```javascript
const hello = 'world';
```
````

## Horizontal Rule

```markdown
---
```

## Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

## Custom Components

| Syntax | Result |
|--------|--------|
| `::audio[/path/to/file.wav]` | Interactive waveform audio player |
| `::announcement[Your text]` | Blue announcement badge |
| YouTube URL on its own line | Embedded YouTube player |

## Images

Upload images via the admin dashboard (Images section), then reference them:

```markdown
![Description](/images/my-photo.jpg)
```

## Frontmatter

Every content file starts with YAML frontmatter:

```markdown
---
title: "My Post Title"
date: "2026-01-15"
tags: ["tag1", "tag2"]
---

Content starts here...
```

### Blog Post Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Post title |
| `date` | string | Publish date (YYYY-MM-DD) |
| `category` | string | Category name |
| `tags` | array | Tag list |
| `pinned` | boolean | Pin to top |
| `draft` | boolean | Hide from public |
| `updated` | string | Last updated date |

### Project Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Project title |
| `date` | string | Date (YYYY-MM-DD) |
| `year` | string | Display year |
| `category` | string | Research / Engineering / Creative |
| `role` | string | Your role |
| `tags` | array | Tag list |
| `cover` | string | Cover image path |
| `pinned` | boolean | Pin to top |
| `importance` | number | Priority (0–10) |
| `links` | array | External links |

### News Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | News title |
| `date` | string | Date (YYYY-MM-DD) |
| `type` | string | update / release / announcement / event |
| `url` | string | Optional external link |
