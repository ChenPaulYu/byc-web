# Content Dashboard (CMS) — Design Spec

## Goal

Build a local-only CMS dashboard for managing the byc-web portfolio content (blog posts, projects, about page) without editing code or markdown files manually. The dashboard runs as a separate dev-only app with a clean storage abstraction layer for future extensibility.

## Scope

### v1 (this spec)

- Blog post management: create, edit, delete, draft toggle, insert images + YouTube
- Project management: create, edit, delete, enable toggle, insert images + YouTube
- About page editing
- Live markdown preview (tab toggle)
- Local dev server for reading/writing files
- Storage abstraction layer for future backend swaps

### v2 (future, not in this spec)

- News/Updates management
- Site settings editing (title, description, social links)
- Image gallery/upload browser
- Drag-and-drop content ordering
- MPC asset management (audio samples, 3D avatar, background video)

### Explicitly excluded

- GitHub API integration
- Database backend
- Authentication/user management (local-only, no auth needed)
- WYSIWYG editor (using plain markdown textarea)

---

## Architecture

### Overview

The dashboard consists of three parts:

1. **Admin UI** — a separate React app in `admin/` folder
2. **API Server** — an Express server for file I/O on `public/content/`
3. **Storage Adapter** — abstraction layer between the API and the filesystem

```
byc-web/
├── src/                    # Existing public site (unchanged)
├── admin/                  # New dashboard app
│   ├── src/
│   │   ├── App.tsx         # Router + sidebar layout
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ContentTable.tsx
│   │   │   ├── EditorForm.tsx
│   │   │   ├── MarkdownEditor.tsx
│   │   │   ├── PreviewPane.tsx
│   │   │   └── InsertToolbar.tsx
│   │   ├── pages/
│   │   │   ├── BlogList.tsx
│   │   │   ├── BlogEdit.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectEdit.tsx
│   │   │   └── AboutEdit.tsx
│   │   └── api.ts          # Client-side fetch calls to Express server
│   ├── index.html
│   └── vite.config.ts      # Separate Vite config, port 3001
├── server/                 # Local API server
│   ├── index.ts            # Express server, port 3002
│   ├── routes.ts           # REST route handlers
│   └── storage/
│       ├── adapter.ts      # StorageAdapter interface
│       └── local.ts        # LocalStorageAdapter (filesystem)
├── public/content/         # Shared content directory
└── public/content.config.json
```

### Startup

- `npm run admin` starts both the Express server (port 3002) and the admin Vite dev server (port 3001) concurrently
- The public site (`npm run dev`, port 3000) remains unchanged and independent

### Data flow

```
Admin UI (port 3001) → REST API (port 3002) → StorageAdapter → public/content/ filesystem
```

The public site reads the same `public/content/` files, so changes made in the dashboard are immediately visible when you refresh the public site dev server.

---

## Storage Abstraction

### Interface

```typescript
interface StorageAdapter {
  // Content files
  listFiles(type: 'blog' | 'projects'): Promise<string[]>;
  readFile(type: 'blog' | 'projects', slug: string): Promise<string>;
  writeFile(type: 'blog' | 'projects', slug: string, content: string): Promise<void>;
  deleteFile(type: 'blog' | 'projects', slug: string): Promise<void>;

  // About page
  readAbout(): Promise<string>;
  writeAbout(content: string): Promise<void>;

  // Config
  readConfig(): Promise<ContentConfig>;
  writeConfig(config: ContentConfig): Promise<void>;
}
```

### v1 Implementation: LocalStorageAdapter

- `listFiles('blog')` → reads filenames from `public/content/blog/`
- `readFile('blog', 'my-post')` → reads `public/content/blog/my-post.md`
- `writeFile('blog', 'my-post', content)` → writes `public/content/blog/my-post.md`
- `deleteFile('blog', 'my-post')` → deletes `public/content/blog/my-post.md`
- `readConfig()` → reads `public/content.config.json`
- `writeConfig(config)` → writes `public/content.config.json`

### Future adapters (v2+, not built now)

The same interface can be implemented by `SupabaseStorageAdapter`, `GitHubStorageAdapter`, etc. The admin UI and API routes remain unchanged — only the adapter is swapped.

---

## API Server Endpoints

Express server on port 3002. All endpoints return JSON.

### Content CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content/:type` | List all items (returns array of `{slug, metadata}`) |
| GET | `/api/content/:type/:slug` | Read single item (returns `{slug, metadata, content}`) |
| POST | `/api/content/:type` | Create new item (body: `{slug, metadata, content}`) |
| PUT | `/api/content/:type/:slug` | Update item (body: `{metadata, content}`) |
| DELETE | `/api/content/:type/:slug` | Delete item and remove from config |

`:type` is `blog` or `projects`.

On create/delete, the server automatically updates `content.config.json` to add/remove the slug entry.

### About Page

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/about` | Read about.md content |
| PUT | `/api/about` | Update about.md (body: `{content}`) |

### Config

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Read full content.config.json |
| PUT | `/api/config` | Update content.config.json |

---

## Dashboard UI

### Layout

- **Sidebar** (left, fixed): navigation links — Blog Posts, Projects, About
- **Main area** (right): content area changes based on selected section
- Sidebar collapses to icons on narrow screens

### List Pages (Blog Posts, Projects)

- Page header with section title + "New Post" / "New Project" button
- Table with columns:
  - **Blog**: Title, Date, Tags, Status (Draft/Published), Actions (Edit, Delete)
  - **Projects**: Title, Year, Category, Status (Enabled/Disabled), Actions (Edit, Delete)
- Click row or edit button → navigates to editor page
- Delete button → confirmation dialog → deletes file + removes from config
- Status toggle → updates frontmatter `draft` (blog) or config `enabled` (projects) inline

### Editor Page (shared layout, different fields)

**Top bar:**
- Back button (returns to list)
- Save button
- Delete button (with confirmation)

**Frontmatter form (structured fields):**

Blog post fields:
- Title (text input)
- Date (date picker)
- Category (text input)
- Tags (comma-separated text input)
- Pinned (checkbox)
- Draft (checkbox)

Project fields:
- Title (text input)
- Date (date picker)
- Year (text input)
- Category (select: Research / Engineering / Creative)
- Role (text input)
- Tags (comma-separated text input)
- Cover image URL (text input)
- Pinned (checkbox)
- Importance (number input, 0-10)
- Links (dynamic list: label + URL + icon type)

**Content area:**
- Tab toggle: "Edit" | "Preview"
- Edit mode: full-width textarea for markdown body
- Preview mode: rendered markdown using the existing `MarkdownRenderer` component from the main site
- Insert toolbar above textarea:
  - Image button: inserts `![alt](url)` template
  - YouTube button: inserts YouTube URL (auto-detected by existing remark plugin)
  - Heading button: inserts `## `
  - Bold button: wraps selection in `**`
  - List button: inserts `- `

### About Page

- Simple editor: textarea + preview toggle
- No frontmatter form
- Save button

### Creating New Content

- "New Post" / "New Project" button opens the editor with empty fields
- Slug is auto-generated from the title (lowercase, spaces → hyphens, strip special chars)
- On first save: creates the file + adds entry to config

---

## Styling

Matches the main site's minimal aesthetic:

- **Colors**: White background, neutral-900 text, neutral-200 borders, neutral-50 sidebar background
- **Typography**: Inter (body), Space Grotesk (monospace/code)
- **Components**: Clean bordered inputs, minimal outlined buttons, subtle hover states
- **Status badges**: Small pills — green for Published/Enabled, gray for Draft/Disabled
- **Spacing**: Consistent with main site's max-w-3xl content width
- **No external component libraries** — Tailwind utility classes only

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Admin UI | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS (shared config with main site) |
| API Server | Express + TypeScript |
| Markdown parsing | gray-matter (frontmatter) |
| Markdown preview | Reuse MarkdownRenderer from main site |
| Process management | concurrently (run Vite + Express together) |

---

## File Operations

### Create new blog post

1. User fills in frontmatter fields + markdown content
2. Slug auto-generated from title
3. Admin UI sends `POST /api/content/blog` with `{slug, metadata, content}`
4. Server assembles frontmatter YAML + body into a markdown string
5. Server writes to `public/content/blog/{slug}.md`
6. Server updates `content.config.json` to add `{slug, enabled: true}` to blog array

### Edit existing content

1. Admin UI loads content via `GET /api/content/:type/:slug`
2. Server reads markdown file, parses frontmatter with gray-matter
3. Returns `{slug, metadata, content}` as JSON
4. User edits fields/content
5. On save: `PUT /api/content/:type/:slug` with updated data
6. Server reassembles and overwrites the markdown file

### Delete content

1. User clicks delete, confirms in dialog
2. Admin UI sends `DELETE /api/content/:type/:slug`
3. Server deletes the markdown file
4. Server removes the slug entry from `content.config.json`

### Toggle status

1. For blog: updates `draft` field in frontmatter (inline PUT)
2. For projects: updates `enabled` field in `content.config.json` (inline config PUT)

---

## Error Handling

- File not found → 404 with error message
- Invalid slug (already exists on create) → 409 conflict
- File write failure → 500 with error message
- Admin UI shows toast notifications for success/error states
