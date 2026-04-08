# po4yka.dev

Personal site, blog, and apps portfolio. Astro 6 with React islands for the public side, a full React SPA behind passkey auth for the admin, all running on Cloudflare Workers + D1.

## Architecture

Public pages are prerendered at build time. React only hydrates where interactivity is needed via `client:load` or `client:visible` directives -- the bundle stays small and the public site has no runtime server.

Content lives in two canonical forms: MDX files for blog posts, JSON for projects and experience. A build step runs `scripts/generate-all-data.ts` before every Astro build, which produces static TypeScript modules for the frontend and `db/seed.sql` for D1. Editing content means editing source files, not generated output.

The admin panel at `/admin/*` is an SSR catch-all that mounts a React Router + TanStack Query SPA. All mutations go through `withAdmin()`, a route wrapper that handles auth, CSRF, and Zod validation in one place. Auth is passkey-first via WebAuthn, with a password fallback controlled by an env flag.

### Content pipeline

```mermaid
flowchart LR
    subgraph Sources
        MDX["MDX posts\nsrc/content/blog/"]
        JSON["JSON files\nprojects.json\nexperience.json"]
    end

    GEN["generate-all-data.ts"]

    subgraph Outputs
        TS["Static TS modules\nblogData.ts\nprojectsData.ts\nexperienceData.ts"]
        SQL["db/seed.sql"]
    end

    MDX --> GEN
    JSON --> GEN
    GEN --> TS
    GEN --> SQL
    TS -->|import at build time| ASTRO["Astro pages"]
    SQL -->|wrangler d1 execute| D1["Cloudflare D1"]
```

### Request flow

```mermaid
flowchart TB
    REQ["Request"]

    REQ -->|"/, /blog/*, /projects/*"| STATIC["Prerendered HTML\n+ React islands"]
    REQ -->|"/admin/*"| SSR["SSR catch-all"]
    REQ -->|"/api/*"| API["Astro API endpoints"]

    SSR --> SPA["React SPA\nreact-router + TanStack Query"]
    SPA -->|fetch| API

    API --> GUARD{"withAdmin()\nauth + validation"}
    GUARD -->|authenticated| D1["Cloudflare D1"]
    GUARD -->|rejected| ERR["401 / 403"]

    subgraph Auth
        PASSKEY["Passkey / WebAuthn"] -->|primary| SESSION["Session cookie\nD1 admin_sessions"]
        PASSWORD["Password"] -->|fallback| SESSION
    end

    GUARD -.->|requireAuth| SESSION
```

### CI/CD

```mermaid
flowchart LR
    PUSH["git push"] --> CI

    subgraph CI["GitHub Actions"]
        L["lint"] --> T["test + coverage"]
        T --> B["build"]
        B --> E["Playwright e2e"]
        E --> LH["Lighthouse CI"]
    end

    LH -->|"main only"| DEPLOY["wrangler deploy\nCloudflare Workers"]
```

## Development

```sh
cp .env.example .env
npm install
npm run dev
```

The dev server proxies Cloudflare bindings via `platformProxy`. For the admin panel you also need a local D1 database:

```sh
wrangler d1 execute blog-db --local --file=db/schema.sql
wrangler d1 execute blog-db --local --file=db/seed.sql
```

If you add or edit content files, regenerate the data pipeline outputs before building:

```sh
npm run generate:all
```

## Deployment

Pushes to `main` trigger CI (lint, tests, build, e2e, Lighthouse) and then deploy via `wrangler deploy` using the Astro-generated `dist/server/wrangler.json`. Required GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. The `ADMIN_PASSWORD` env var is set in the Cloudflare Workers dashboard.

## License

[MIT](LICENSE)
