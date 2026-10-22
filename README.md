<h1>
  <img src="images/logo.png" alt="SM logo" width="36" height="36" align="absmiddle">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/readme-name-dark.svg">
    <img src="images/readme-name-light.svg" alt="Stefan Mihajlovic" width="320" height="44" align="absmiddle">
  </picture>
</h1>

I'm a web designer and developer based in Belgrade, combining UI/UX design and frontend development to create websites, digital products, and browser extensions.

Design came first; development gave me a way to bring those ideas to life. I enjoy taking projects from the first concept to the final detail, and I'm currently studying at the Faculty of Organizational Sciences in Belgrade.

[Explore my portfolio](https://stefanmihajlovic.com/)

## Local preview

Run `python3 -m http.server 4173` and open `http://localhost:4173`.
The portfolio uses static HTML, `portfolio.css`, `portfolio.js`, vendored Lenis, and the original Spinners star tiles. Product microsites retain their own assets.

The [design investigation](docs/design-research.md) records 41 reviewed references and the decisions behind the layout. Background films can be regenerated with `tools/generate-motion.py` (Python, NumPy, Pillow and imageio-ffmpeg). Browser checks are in `tools/check-portfolio.cjs` and require Playwright; use `PORTFOLIO_BROWSER` to choose an installed Chromium browser. The contact endpoint runs on Netlify; the local static server cannot send messages.
