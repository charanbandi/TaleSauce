# TaleSauce landing page

The pitch site for TaleSauce, served by GitHub Pages.

A single static page: pixel-faithful Stardew/8-bit theme, no build step, no framework.
Plain HTML + CSS + a little vanilla JS.

```
site/
├─ index.html     → all sections (hero · pitch · chat · cast · brains · experience · under the hood · run it)
├─ styles.css     → the whole pixel theme (cream palette, pixel panels, animations, responsive)
├─ main.js        → scroll-reveal (IntersectionObserver) + copy-to-clipboard buttons
├─ favicon.svg    → hand-coded pixel tomato
└─ media/         → hero / cast / chat screenshots + the walk-to-desk GIF
```

## Preview locally

```bash
python3 -m http.server 4321 --directory site
# then open http://localhost:4321
```

## Deploy

Pushing changes under `site/` to `main` triggers `.github/workflows/deploy-pages.yml`,
which publishes this folder to GitHub Pages.

**One-time setup:** repo **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.

All asset paths are relative, so the page works correctly under the `/TaleSauce/` sub-path.
