# Extension portfolio covers

These covers showcase the actual extension interfaces, with only the product name and icon outside the UI. Each has its own composition: a dark blue audio console with an enlarged EQ detail, a pink palette workspace with the real picker floating above it, and a light violet type specimen with the Font Pirate detail panel. Poppins comes from the extension UI; Switzer is used for the small product signature. Instrument Serif is used for the Font Pirate specimen. The palette workspace is presentation context, not an additional extension screen.

- Tab Volume Manager: current local extension HTML/CSS, volume and equalizer panels. Presentation state uses a YouTube tab at 125% and a sample six-band EQ curve. Scripts are disabled during capture; no extension data or settings are modified.
- Palette Pilot: current local extension HTML/CSS/JS, using isolated browser storage with a sample palette. The extension's own localhost preview enables its Pro presentation state. No live license or account data is used.
- Font Pirate: existing authentic font-detail capture from `font-pirate/assets/`.

`capture-uis.cjs` reads the sibling `Tab-Volume-Manager` and `PalettePilot` repositories without editing them. Its output is checked in so covers can be rendered without those repositories. The composition is in `extension-covers.html`; `render-covers.cjs` produces the final 1672 × 941 WebP assets.

Run the portfolio server on port 4173, then use Node with Playwright and Sharp available:

```sh
node tools/project-previews/capture-uis.cjs
node tools/project-previews/render-covers.cjs
```

## Stefan’s Spinners

Three 1600 × 1000 WebP compositions:

- **Gallery / cover:** the original Chase S logo with generous clear space, three sparse circles of actual library spinners extending beyond the canvas edges, and the portfolio’s own star textures behind them.
- **Playground:** a restrained light panel with a Bloom preview, three small geometry variations, and an authentic capture of its customization controls.
- **Workflow:** a unified dark panel pairing a violet Orbit preview with a valid React usage example, against subtle portfolio star textures. The panel is a presentation composition, not a screenshot of an IDE.

`spinners-source/` contains the project's own compiled spinner CSS, catalog, original logo, and MIT license, copied from the sibling repository. The renderer uses the real CSS component geometry and freezes animations at deterministic times. These source files are only used to author the images, not loaded by portfolio pages. The Bloom controls are captured from https://spinners.stefanmihajlovic.com/ in isolated browser state; source project files are never edited.

The composition uses the local Cabinet Grotesk font. With the portfolio server running on port 4173 and Playwright/Sharp available:

```sh
node tools/project-previews/render-spinners.cjs
# Recompose checked-in assets without visiting the live site:
node tools/project-previews/render-spinners.cjs --compose-only
```
