# Local preview validation — 4 October 2026

- Product renamed Font Pirate. Purple accent restored. Icon Composer `.icon` source opened, adjusted and exported; current icons come from that export.
- Official Google Fonts catalog contains 1,950 unique families. Search combines category and favorites. Lazy preview loading verified in Edge with Instrument Serif and multiple sans/mono/display faces. Scrolling loaded the next batch beyond the initial 30; search found Zilla Slab near the end of the alphabet.
- “Identify font” context-menu command captured selected page text and its Bricolage Grotesque CSS values, then opened the side panel. “Pick a font…” also started the picker from the context menu and captured the clicked heading. Page scan and drill-down were checked.
- Catalog → body role → pairing retained 16px body sizing. Saving and reopening Instrument + Inter worked.
- 14 automated tests passed, including complete catalog, filtering, supported font-weight URL construction, CSS/JSON exports, import validation and concurrent storage operations.
- Package includes catalog.js and fonts.json; every ZIP member matched the source. Every local page asset reference exists.
- Actual Edge screenshots: catalog.jpg, font-detail.jpg, pairing.jpg and inspector.jpg. No recreated UI.
- Website visually checked on desktop and at 440×956 emulated mobile size. Gallery click and arrow-key navigation worked. Download ZIP copied to the page.
- Live /type-pilot/ and /font-pirate/ both returned HTTP 404. No pushes or deployments made. Portfolio index and sitemap do not advertise the draft.
- Local preview: http://127.0.0.1:8766/font-pirate/

## Known scope
The catalog is a bundled snapshot; the update script refreshes it. Remote font previews require network/cache. Non-Google site fonts may fall back locally. Identification reads the CSS stack, not image lettering or per-glyph font fallback. Selecting multiple styles identifies the start of the selection. Browser-protected pages and inaccessible frames cannot be inspected. Repository URL and development folder remain TypePilot to keep the installed extension identity and history stable.
