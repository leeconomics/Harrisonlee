# Harry Lee — Personal Site

Built with Next.js. Deployed on Vercel.

## Setup

```bash
npm install
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

```
pages/
  index.js          — entry point
  api/generate.js   — server-side Anthropic API proxy
components/
  PersonalSite.jsx  — main site component
styles/
  globals.css       — Tailwind base + global resets
memos/              — markdown files for each memo (add here when deploying content)
```

## Deploying to Vercel

1. Push to GitHub
2. Connect repo at vercel.com
3. Add ANTHROPIC_API_KEY as an environment variable in Vercel dashboard
4. Deploy — automatic on every push to main
