# Blog

Personal portfolio and blog for Nikita Pochaev (@po4yka).

## Tech Stack

- [Astro](https://astro.build/) 6 + [React](https://react.dev/) 19 (islands architecture)
- [TypeScript](https://www.typescriptlang.org/) 6.0 (strict)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Radix UI](https://www.radix-ui.com/) primitives (dialog, sonner)
- [MUI](https://mui.com/) (Material UI icons and components)
- [Motion](https://motion.dev/) for animations
- [MDX](https://mdxjs.com/) for blog content
- [Zustand](https://zustand.docs.pmnd.rs/) for client-side state (visitor preferences)
- [TanStack Query](https://tanstack.com/query) for server state management
- [Zod](https://zod.dev/) for API input validation
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [D1](https://developers.cloudflare.com/d1/) for hosting and database
- [React Router](https://reactrouter.com/) 7 (admin SPA)
- [Vitest](https://vitest.dev/) for testing

## Getting Started

```sh
npm install
npm run dev
```

Other available scripts:

```sh
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run test      # Run tests (Vitest)
npm run test:watch # Run tests in watch mode
```

### Environment

Copy the example environment file and fill in values:

```sh
cp .env.example .env
```

### Local D1 Database

The admin panel requires a Cloudflare D1 database. For local development:

```sh
# Create the local database
wrangler d1 execute blog-db --local --file=db/schema.sql
wrangler d1 execute blog-db --local --file=db/seed.sql
```

### Deployment

The site deploys to Cloudflare Workers via GitHub Actions CI/CD.

On push to `main`, the pipeline runs lint, tests, and build, then deploys using `wrangler deploy` with the Astro-generated `dist/server/wrangler.json`.

Required GitHub secrets:

- `CLOUDFLARE_API_TOKEN` -- Cloudflare API token with Workers Scripts Edit + D1 Edit permissions
- `CLOUDFLARE_ACCOUNT_ID` -- Cloudflare account ID

Required Cloudflare environment variables (set in Workers dashboard):

- `ADMIN_PASSWORD` -- password for admin panel authentication

## Project Structure

```
src/
  __tests__/        # Unit tests (API routes, lib modules)
  components/       # React islands + shared UI components
    ui/             # UI primitives (dialog, sonner, utils)
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
    validation.ts   # Zod schemas for API input
    motion.ts       # Motion utilities
  types/
    index.ts        # Shared TypeScript interfaces
  pages/
    api/            # Astro API routes (SSR)
      auth/login.ts
      admin/        # CRUD endpoints: posts, projects, roles, categories, settings
      github/repos.ts
    blog/           # Blog pages (static, content collections)
    admin/          # Admin catch-all (SSR, React Router SPA)
    experience.astro
    projects.astro
    settings.astro
    404.astro
  layouts/          # Astro layouts (MainLayout, BaseHead, ThemeScript)
  content/          # Astro content collections (blog MDX)
  styles/           # Global styles, theme, fonts
db/
  schema.sql        # D1 database schema (6 tables)
  seed.sql          # Seed data from hardcoded defaults
docs/
  Guidelines.md     # Design system guidelines
  design/           # Design direction documents
scripts/            # Skill/tooling update scripts
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

### CI/CD

GitHub Actions (`.github/workflows/ci-cd.yml`):

1. **CI** (all branches): lint, test, build
2. **Deploy** (main only): build + `wrangler deploy` using Astro-generated worker config

### State Management

| Store | Library | Persistence | Scope |
|-------|---------|-------------|-------|
| Visitor preferences | Zustand | localStorage | Theme, motion, font size |
| Admin data | TanStack Query | Cloudflare D1 | Blog posts, projects, roles, settings |

### API Routes

All under `/api/`, served via Cloudflare Workers:

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
