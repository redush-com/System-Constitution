# EvoSpec Documentation — Deployment Guide

This guide explains how to deploy the EvoSpec DSL documentation website.

---

## Quick Start (5 minutes)

### Option A: Vercel (Recommended)

```bash
# 1. Install dependencies
cd website
npm install

# 2. Build locally to verify
npm run build

# 3. Deploy to Vercel
npx vercel
```

That's it! Vercel auto-detects Docusaurus and configures everything.

### Option B: GitHub Pages

```bash
# 1. Build the site
cd website
npm run build

# 2. Deploy to GitHub Pages
GIT_USER=<your-username> npm run deploy
```

---

## Detailed Setup

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git
- GitHub account
- (Optional) Vercel account

### Step 1: Initialize Docusaurus

```bash
# From repository root
npx create-docusaurus@latest website classic --typescript

# Or with pnpm
pnpm create docusaurus website classic --typescript
```

### Step 2: Configure Versioning

Edit `website/docusaurus.config.ts`:

```typescript
const config: Config = {
  title: 'EvoSpec DSL',
  tagline: 'Specification-driven software evolution',
  url: 'https://evospec.dev',
  baseUrl: '/',
  
  // Enable versioning
  docs: {
    lastVersion: 'current',
    versions: {
      current: {
        label: 'v1',
        path: 'v1',
      },
    },
  },
  
  themeConfig: {
    navbar: {
      items: [
        {
          type: 'docsVersionDropdown',
          position: 'right',
        },
      ],
    },
  },
};
```

### Step 3: Create Version

When releasing a new major version:

```bash
# Tag current docs as v1
npm run docusaurus docs:version 1.0

# This creates:
# - website/versioned_docs/version-1.0/
# - website/versioned_sidebars/version-1.0-sidebars.json
# - Updates website/versions.json
```

### Step 4: Project Structure

```
website/
├── docs/                      # Current (next) version docs
│   ├── spec/
│   ├── guides/
│   └── reference/
├── versioned_docs/
│   ├── version-1.0/          # v1.0 frozen docs
│   └── version-2.0/          # v2.0 frozen docs
├── src/
│   ├── components/
│   └── pages/
│       └── index.tsx         # Landing page
├── static/
│   ├── schema/               # JSON Schema files
│   │   └── v1/
│   └── llm/                  # LLM prompts
│       └── v1/
├── docusaurus.config.ts
├── sidebars.ts
└── package.json
```

---

## Deployment Platforms

### Vercel (Recommended)

**Pros:**
- Zero-config deployment
- Automatic preview deployments for PRs
- Built-in analytics
- Excellent performance

**Setup:**

1. Connect GitHub repo to Vercel
2. Set build settings:
   - Framework: Docusaurus 2
   - Root Directory: `website`
   - Build Command: `npm run build`
   - Output Directory: `build`

3. Configure domain:
   - Add `evospec.dev` in Vercel dashboard
   - Update DNS records

**vercel.json** (optional, in website/):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "docusaurus-2",
  "rewrites": [
    { "source": "/schema/:path*", "destination": "/schema/:path*" },
    { "source": "/llm/:path*", "destination": "/llm/:path*" }
  ]
}
```

### GitHub Pages

**Pros:**
- Free
- Integrated with repository
- No external service needed

**Setup:**

1. Edit `docusaurus.config.ts`:

```typescript
const config = {
  url: 'https://your-org.github.io',
  baseUrl: '/EvoSpec-DSL/',
  organizationName: 'your-org',
  projectName: 'EvoSpec-DSL',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,
};
```

2. Add GitHub Action (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'website/**'
      - 'docs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: website
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: website/package-lock.json
          
      - run: npm ci
      - run: npm run build
      
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website/build
```

3. Enable GitHub Pages in repo settings (source: `gh-pages` branch)

### Netlify

**Setup:**

1. Connect repo to Netlify
2. Configure:
   - Base directory: `website`
   - Build command: `npm run build`
   - Publish directory: `website/build`

**netlify.toml** (in repo root):

```toml
[build]
  base = "website"
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/docs"
  to = "/docs/v1"
  status = 302
```

---

## Custom Domain Setup

### DNS Configuration

For `evospec.dev`:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 (Vercel) |
| CNAME | www | cname.vercel-dns.com |

Or for GitHub Pages:

| Type | Name | Value |
|------|------|-------|
| CNAME | @ | your-org.github.io |

### SSL

- **Vercel/Netlify**: Automatic SSL via Let's Encrypt
- **GitHub Pages**: Automatic with custom domain

---

## Serving Static Assets

### JSON Schema Files

Place in `website/static/schema/`:

```
static/
└── schema/
    └── v1/
        ├── evospec.schema.json
        └── definitions/
            └── ...
```

Accessible at: `https://evospec.dev/schema/v1/evospec.schema.json`

### LLM Prompts

Place in `website/static/llm/`:

```
static/
└── llm/
    └── v1/
        ├── SYSTEM_PROMPT.md
        ├── SYSTEM_PROMPT.min.md
        └── examples/
            └── ...
```

Accessible at: `https://evospec.dev/llm/v1/SYSTEM_PROMPT.md`

---

## Version Management Workflow

### Creating a New Version

When releasing EvoSpec DSL v2:

```bash
# 1. Ensure current docs are complete
cd website

# 2. Create version snapshot
npm run docusaurus docs:version 1.0

# 3. Update docs/ for v2 development
# Edit docs/ files for new version

# 4. Update docusaurus.config.ts
# Add v2 to versions config
```

### Version URL Structure

| URL | Content |
|-----|---------|
| `/docs/` | Redirects to latest |
| `/docs/v1/` | Version 1 docs |
| `/docs/v2/` | Version 2 docs |
| `/docs/next/` | Development version |

---

## Search Setup (Algolia)

### Option 1: Algolia DocSearch (Free for OSS)

1. Apply at: https://docsearch.algolia.com/
2. Add to `docusaurus.config.ts`:

```typescript
themeConfig: {
  algolia: {
    appId: 'YOUR_APP_ID',
    apiKey: 'YOUR_SEARCH_API_KEY',
    indexName: 'evospec',
  },
},
```

### Option 2: Local Search

```bash
npm install @easyops-cn/docusaurus-search-local
```

```typescript
// docusaurus.config.ts
themes: [
  [
    '@easyops-cn/docusaurus-search-local',
    { hashed: true },
  ],
],
```

---

## Monitoring & Analytics

### Vercel Analytics

```typescript
// docusaurus.config.ts
scripts: [
  {
    src: '/_vercel/insights/script.js',
    defer: true,
  },
],
```

### Google Analytics

```bash
npm install @docusaurus/plugin-google-gtag
```

```typescript
// docusaurus.config.ts
plugins: [
  [
    '@docusaurus/plugin-google-gtag',
    { trackingID: 'G-XXXXXXXXXX' },
  ],
],
```

---

## Checklist

### Before First Deploy

- [ ] Configure `docusaurus.config.ts` with correct URLs
- [ ] Add favicon and logo to `static/img/`
- [ ] Write landing page (`src/pages/index.tsx`)
- [ ] Create initial documentation in `docs/`
- [ ] Add JSON Schema to `static/schema/`
- [ ] Add LLM prompts to `static/llm/`
- [ ] Test build locally (`npm run build`)
- [ ] Test serve locally (`npm run serve`)

### After Deploy

- [ ] Verify all pages load correctly
- [ ] Test version dropdown
- [ ] Verify schema files are accessible
- [ ] Verify LLM prompts are downloadable
- [ ] Set up custom domain
- [ ] Enable HTTPS
- [ ] Set up search
- [ ] Add analytics

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf website/.docusaurus website/build
npm run build
```

### Version Not Showing

Check `website/versions.json` contains the version.

### Static Files 404

Ensure files are in `website/static/`, not `static/`.

### Custom Domain Not Working

1. Verify DNS propagation: `dig evospec.dev`
2. Check SSL certificate status in platform dashboard
3. Clear browser cache
