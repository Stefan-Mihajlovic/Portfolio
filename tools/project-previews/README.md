# Extension portfolio covers

These covers showcase the actual extension interfaces, with only the product name and icon outside the UI. Each has its own composition: a dark blue audio console with an enlarged EQ detail, a pink palette workspace with the real picker floating above it, and a light violet type specimen with the Font Pirate detail panel. Poppins comes from the extension UI; Switzer is used for the small product signature. Instrument Serif is used for the Font Pirate specimen. The palette workspace is presentation context, not an additional extension screen.

- Tab Volume Manager: current local extension HTML/CSS, volume and equalizer panels. Presentation state uses a YouTube tab at 125% and a sample six-band EQ curve. Scripts are disabled during capture; no extension data or settings are modified.
- Palette Pilot: current local extension HTML/CSS/JS, using isolated browser storage with a sample palette. The extension's own localhost preview enables its Pro presentation state. No live license or account data is used.
- Font Pirate: existing authentic font-detail capture from `font-pirate/assets/`.

`capture-uis.cjs` reads the sibling `Tab-Volume-Manager` and `PalettePilot` repositories without editing them. Its output is checked in so covers can be rendered without those repositories. The composition is in `extension-covers.html`; `render-covers.cjs` produces the final 1672 × 941 WebP assets. Old illustration covers are preserved for comparison.

Run the portfolio server on port 4173, then use Node with Playwright and Sharp available:

```sh
node tools/project-previews/capture-uis.cjs
node tools/project-previews/render-covers.cjs
```
