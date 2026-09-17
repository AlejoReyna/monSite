# Alexis Reyna — Portfolio

- **Live:** https://www.alexisreyna.dev
- **Stack:** Next.js 16 (App Router, Webpack for local development) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion

A trilingual (EN/ES/ZH) portfolio built as a full-screen, swipe-driven "desktop." The home page is a sequence of panels you move through with the wheel or a swipe, each one a mini case study, plus a draggable AI chat terminal that answers questions about my work.

---

## Getting started

```bash
npm install
npm run dev -- --allow-server  # deliberate local startup; http://localhost:3000
```

Other scripts: `npm run build` → `npm start`, and `npm run lint`.

Local development uses Webpack with a 1536 MiB Node old-space limit and reduced
compilation parallelism. The limit applies to JavaScript old space, not total
RAM across native allocations and worker processes. Plain `npm run dev` exits
without starting Next; automatic preview configurations are disabled because
this 8 GB Mac has experienced system freezes. Agents must follow `AGENTS.md`
and must not start servers or builds without explicit authorization.

Path alias: `@/*` resolves to `src/*` (see `tsconfig.json`).

---

## SEO & social metadata

`src/app/layout.tsx` sets the global metadata for `https://www.alexisreyna.dev`:

- Canonical URL via `alternates.canonical`.
- Open Graph title, description, site name and a 1200×630 `og-image.png`.
- A single `<h1>` per page; panel wordmarks use `<h2>`.

Update `public/og-image.png` if you change the preview image.

### Environment variables

Create a `.env.local` with the keys for the features you want live. Everything renders without them, but the chat terminal and contact form need their backends:

| Variable | Used by | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | `/api/chat` | Default chat provider. |
| `CHAT_PROVIDER` | `/api/chat` | `openai` or `kimi`. Auto-detects `kimi` when a Moonshot key is present. |
| `MOONSHOT_API_KEY` / `KIMI_API_KEY` | `/api/chat` | Optional Kimi (Moonshot) provider. `KIMI_BASE_URL` / `KIMI_MODEL` override the defaults. |
| `NEXT_WEB3FORMS_KEY` | `/api/contact` | Web3Forms access key for the contact form. |

---

## Architecture

Top-level composition is intentionally thin — the home route just mounts the panel sequence:

```tsx
// src/app/page.tsx
export default function Home() {
  return (
    <main className="relative h-[100svh] overflow-hidden">
      <HeroCarouselSequence />
    </main>
  );
}
```

`src/app/layout.tsx` wraps every route with the language and navigation providers, the loaded fonts (Geist, Bebas Neue, Cormorant Garamond, Space Mono, Press Start 2P), PWA/iOS metadata, and `AppChrome` (the shared nav/status shell).

### Home panel sequence — `src/components/v3/hero-carousel-sequence.tsx`

A wheel/swipe-driven sequence that advances one panel at a time and tints the browser top bar per panel. On mobile, panels that overflow (like Plebes) absorb the swipe to scroll their own content before advancing.

| # | Panel | Component |
| --- | --- | --- |
| 0 | Inicio | `v2/hero-v2.tsx` — night-sky hero with the draggable AI chat terminal |
| 1 | This Cafetería | `this-cafeteria-gateway.tsx` |
| 2 | Plebes | `plebes-project-gateway.tsx` |
| 3 | NoNamedBot | `nonamedbot-gateway.tsx` |
| 4 | Wedding Service | `wedding-service-gateway.tsx` |
| 5 | Get in touch | `contact-gateway.tsx` — pixel-art contact panel |

### Other routes

- `/legacy` — the previous "PokeFolio" retro portfolio (`src/components/legacy/pokefolio/*`), with its own music context, projects, and about pages.
- `/historia` — a long-form narrative case study of the UANL/academic dashboard work.
- `/v3`, `/v3/preview` — work-in-progress editorial layouts.
- `/projects/[id]` — per-project detail route.
- `/oms` — redirects to `/historia`.

`AppChrome` hides the shared nav/status shell on `/historia` and `/legacy` (see `HIDE_CHROME_PREFIXES` in `src/components/app-chrome.tsx`).

### API routes

- `src/app/api/chat/route.ts` — powers the hero chat terminal. Resolves a provider (OpenAI by default, Kimi/Moonshot when configured) via `CHAT_PROVIDER`.
- `src/app/api/contact/route.ts` — forwards the contact form to Web3Forms.

---

## Internationalization (EN/ES/ZH)

Language state lives in `src/components/lang-context.tsx` (`useLanguage()` → `language`, `setLanguage`, `toggleLanguage`, `toggleWithFade`) and is persisted to `localStorage`. `LanguageFade` masks the swap with a short opacity transition. The app mounts in English first to avoid a post-hydration flip, and `<html lang>` is updated client-side to match the active language.

---

## Editing common things

- **Add/adjust a home panel:** edit the `PANELS` array and imports in `src/components/v3/hero-carousel-sequence.tsx`; each panel is its own `*-gateway.tsx` component with a colocated CSS module.
- **Project data:** `src/components/v3/data/` and `src/components/data/`.
- **Per-panel top-bar color:** `PANEL_THEME_COLORS` in `hero-carousel-sequence.tsx`.
- **Hero art:** lossless animated WebP at `public/coffee-desktop.webp`; the original `public/16.gif` is retained as source material. Mobile uses its existing smaller assets in `public/mobile/`.

---

## Notes

- Desktop artwork is served `unoptimized` to preserve animation. The lossless WebP is 64.8% smaller than the source GIF (5,992,350 vs 17,020,818 bytes), with identical visible pixels, transparency and animation timing. This reduces download size; decoded memory and runtime performance have not been measured.
- Recreate it with `gif2webp -m 4 public/16.gif -o public/coffee-desktop.webp` (lossless by default; no multithreading requested).
- Panels use `100svh` and gesture handling tuned for mobile; test scroll-vs-advance behavior on a real device when changing panel heights.
