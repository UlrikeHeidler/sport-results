# Deploying to GitHub Pages

This project is configured to deploy the production `dist/` build to GitHub Pages using the `gh-pages` package.

Steps to deploy:

1. Ensure the repository `git` remote is set to `https://github.com/<owner>/sport-results.git` (replace `<owner>` if different).
2. Install dependencies (if not installed):

```bash
npm install
```

3. Build and deploy:

```bash
npm run deploy
```

This runs `npm run build` (via the `predeploy` script) and then publishes the `dist/` folder to the `gh-pages` branch.

Notes:
- The app `base` URL has been set to `/sport-results/` in `vite.config.js` so assets load correctly on GitHub Pages.
- The `homepage` field in `package.json` points to `https://UlrikeHeidler.github.io/sport-results` — update this if you deploy under a different owner or repo name.
- If you prefer to publish from the `docs/` folder on `main`/`master` instead of `gh-pages` branch, update the `deploy` script and build output accordingly.
