# Blog

Personal portfolio and blog for Nikita Pochaev (@po4yka).

## Tech Stack

- [Astro](https://astro.build/) 6 + [React](https://react.dev/) 18 (islands architecture)
- [TypeScript](https://www.typescriptlang.org/) 5.7 (strict)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- [Motion](https://motion.dev/) for animations
- [MDX](https://mdxjs.com/) for blog content
- [Zustand](https://zustand.docs.pmnd.rs/) for client-side state (visitor preferences)
- [TanStack Query](https://tanstack.com/query) for server state management
- [Cloudflare Pages](https://pages.cloudflare.com/) + [D1](https://developers.cloudflare.com/d1/) for hosting and database
- [React Router](https://reactrouter.com/) 7 (admin SPA)

## Getting Started

```sh
npm install
npm run dev
```

### Local D1 Database

The admin panel requires a Cloudflare D1 database. For local development:

```sh
# Create the local database
wrangler d1 execute blog-db --local --file=db/schema.sql
wrangler d1 execute blog-db --local --file=db/seed.sql

# Set admin password as a secret
wrangler secret put ADMIN_PASSWORD
```

After creating the remote database with `wrangler d1 create blog-db`, update `database_id` in `wrangler.toml`.

## Project Structure

```
src/
  components/       # React islands + shared UI components
    ui/             # shadcn/ui primitives (60+ components)
    blogData.ts     # Static blog post data
    projectsData.ts # Static project data
    experienceData.ts
  admin/            # Admin SPA (React Router)
    api.ts          # Typed API client with auth
    contexts/       # AuthContext provider
    hooks/          # TanStack Query hooks (useAdminQueries, useAuth, useGitHubRepos)
    components/     # AdminLayout, AdminRoot
    pages/          # Dashboard, BlogEdit, Projects, Experience, Settings
    routes.ts       # React Router configuration
  stores/
    settingsStore.ts # Zustand store for visitor preferences (theme, motion, fontSize)
  lib/
    db.ts           # D1 data access layer (typed queries)
    auth.ts         # Token-based session auth
  pages/
    api/            # Astro API routes (SSR)
      auth/login.ts
      admin/        # CRUD endpoints: posts, projects, roles, categories, settings
      github/repos.ts
    blog/           # Blog pages (static, content collections)
    admin/          # Admin catch-all (SSR, React Router SPA)
  layouts/          # Astro layouts (MainLayout, BaseHead, ThemeScript)
  content/          # Astro content collections (blog MDX)
  styles/           # Global styles, theme, fonts
db/
  schema.sql        # D1 database schema (6 tables)
  seed.sql          # Seed data from hardcoded defaults
docs/
  Guidelines.md     # Design system guidelines
  design/           # Design direction documents
```

## Architecture

### Public Pages (Static)

All visitor-facing pages are prerendered at build time. React islands hydrate with `client:load` or `client:visible` for interactivity (animations, theme toggle, blog filtering).

### Admin Panel (SSR)

The admin panel at `/admin/*` is a React SPA served via Cloudflare Workers. It uses:

- **TanStack Query** for data fetching and mutations against the API
- **Cloudflare D1** (SQLite) for persistent storage
- **Token-based auth** with sessions stored in D1 (24h expiry)
- **React Router** for client-side navigation

### State Management

| Store | Library | Persistence | Scope |
|-------|---------|-------------|-------|
| Visitor preferences | Zustand | localStorage | Theme, motion, font size |
| Admin data | TanStack Query | Cloudflare D1 | Blog posts, projects, roles, settings |

### API Routes

All under `/api/`, served as Cloudflare Workers (SSR):

- `POST /api/auth/login` -- authenticate, receive session token
- `GET/POST /api/admin/posts` -- list/create blog posts
- `GET/PUT/DELETE /api/admin/posts/:slug` -- single post operations
- `GET/POST /api/admin/projects` -- list/create projects
- `DELETE /api/admin/projects/:id` -- delete project
- `GET/POST /api/admin/roles` -- list/create roles
- `DELETE /api/admin/roles/:id` -- delete role
- `GET/POST /api/admin/categories` -- list/add categories
- `DELETE /api/admin/categories/:name` -- remove category
- `GET/PUT /api/admin/settings` -- site settings
- `GET /api/github/repos` -- proxy to GitHub API for project imports

## License

[MIT](LICENSE)
