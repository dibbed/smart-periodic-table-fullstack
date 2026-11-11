# GitHub Pages: static browser demo

Live URL (after enabling Pages): https://dibbed.github.io/smart-periodic-table-fullstack/

## Publishing

1. Open Repository Settings > Pages > Build and deployment.
2. Set **Source** to **GitHub Actions**. GitHub requires this one-time repository setting.
3. The `.github/workflows/deploy-pages.yml` workflow builds and deploys the page on every push to `main`; it can also be run manually from Actions.

## Static demo vs full-stack server

The Pages build sets `VITE_STATIC_DEMO=true` and `VITE_BASE_PATH=/smart-periodic-table-fullstack/`.
The browser loads the same canonical 118-element scientific snapshot from `data/elements.json`, bundled at build time, rather than requesting `/api/elements` from an unavailable server.
Element browsing, filtering, thermodynamic visualization, 3D atom rendering, client-side comparisons, quizzes and compound builder use the React client and do not require Express.
The standalone Node.js / Express / SQLite REST endpoints (`/api/*`) are **not** deployed to GitHub Pages. Host the backend separately if public REST APIs or persistent server operations are required.

For local/full-stack development, simply use `npm run dev` or `npm start` as before. The static mode is enabled only for the Pages build.
