# Mac Sound Manager — local landing redesign

Local review only. Do not commit or publish Portfolio.

## Research
Visually reviewed official homepages: [CleanShot](https://cleanshot.com/), [Screen Studio](https://screen.studio/), [Raycast](https://www.raycast.com/), [eqMac](https://eqmac.app/), [Dropover](https://dropoverapp.com/), [Shottr](https://shottr.cc/).
CleanShot and Screen Studio give the centered headline a short description and clear download action. Dropover makes native UI the main visual. Shottr carries its backdrop across the full hero. Raycast shows how a backdrop can establish identity, but its dark red treatment is not appropriate here. eqMac's actual controls are more informative than an invented hardware illustration, but its density is not the goal.

## Palette and type
Porcelain #f6f8fa, silver #e5ebf0, ink #17232e, cobalt #245cdb, cyan #008cae, amber #b56905. Keep the user's approved palette. Native charcoal is confined to the app mockups.
Cabinet Grotesk: 64–72px centered display heading and 40–48px section titles. System sans-serif: 17–19px body, 12–14px native UI and captions. No uppercase badges or decorative statistics.

## Composition
Full-bleed silver-blue satin backdrop through the entire opening. A compact navigation, one centered headline, one sentence, download button and small compatibility line. The centered main app preview follows immediately, showing actual product structure: horizontal app volumes and a darker EQ inspector. Below: two generous visual feature sections, one compact saved-settings row, a short download close and footer. Mobile stacks the app list and inspector; no tiny scaled desktop screenshot.

    [icon / name]                         [Features] [GitHub]
                   A volume knob
                   for every app.
                  One short sentence
                     [Download]
                   Compatibility
            [native Mac app window mockup]
    ~~~~~ full-width silver / blue background ~~~~~
    [short menu-bar copy]           [menu-bar popup]
    [EQ detail]                    [short EQ copy]
    [saved settings]               [three settings rows]
                      [download]
    [author]                              [release / source]

## Pre-build critique
Replaced the previous enormous split hero and invented mixing desk. Avoid equal-size feature cards, marketing slogans, testimonial placeholders, repeated CTAs in every section, and expansive FAQ copy. The memorable visual is the native product floating on a restrained full-width metallic backdrop. UI is drawn with HTML/CSS for sharp rendering and accessible, functional preview controls. Existing Icon Composer artwork remains unchanged. Only user-triggered state transitions; reduced motion supported.

## Verification and final critique
The opening now has a single centered message and download action, with the app as the dominant visual. Full-width satin folds stay in the approved silver-blue palette; the charcoal app gives them contrast. Below-the-fold scenes explain one feature each, with short copy instead of a card grid or long FAQ. The mobile preview stacks its panes to keep controls readable. App icons are local macOS application icons used within the product illustration; the Sound Manager icon is the existing Icon Composer artwork.

Build and portfolio/SEO checks passed. Manually checked desktop and 390px mobile layout, image loading, slider values, per-app EQ state, preset switching and power bypass. No horizontal overflow at 390px. This is a silent browser preview, not audio processing. No changes were committed or published.

## Static product photography revision
Replace every constructed UI with actual screenshots: the supplied main window and menu-bar capture, an EQ crop from the main window, and a fresh native settings capture. Keep their aspect ratios and use WebP for delivery. Keep the existing silver-blue backdrop and type scale. Remove demo caption and demo behavior entirely. Rewrite headings and paragraphs as natural descriptions, without staccato slogans. Match Font Pirate's compact floating navigation after scrolling, with a persistent download action; hidden navigation is inert. No app preferences are changed for the photography.

The current page uses only static product screenshots; all demo controls and state were removed. The original interactive-preview verification above describes the previous revision. The main and menu-bar shots are cropped from user-supplied app captures, and settings were captured directly from the native app.

## Footer refinement — corrected direction
The user rejected the literal fader illustration and dense closing section. Use an abstract, full-width background in the icon's cyan #53c6d6, cobalt #4864db and amber #efb64c over silver #e5ebf0 and porcelain #f6f8fa. Broad flowing translucent curves stay around the lower edge with a quiet center for readability. Keep Cabinet type and a compact, centered title, download button and compatibility line; no app icon, illustration, description or expandable instructions. Author, GitHub and release notes sit in one small bottom row. Mobile preserves the same hierarchy. The download icon remains in the sticky header. Static SVG background, no animation. Local review only.

The satin background behind the hero app screenshot now uses the same cyan, cobalt and amber palette as the approved abstract footer. Keep the existing folds, screenshot, layout and quiet heading area.

Hero cleanup: replace the shiny diagonal satin bands with the same smooth SVG waves used in the footer, at reduced opacity behind the app screenshot. Keep the title area plain and fade the artwork into the following section.

Hero motion refinement: a separate hero SVG uses broader, shallower curves while the approved footer artwork stays unchanged. The hero background drifts gently in a 24-second alternating loop, with extra edge coverage and no layout movement; reduced-motion preferences disable the animation. Remove the straight divider above the footer links.

Motion visibility adjustment: increase drift to ±6% horizontally and ±28px vertically over each 10-second leg. Start partway through the cycle so movement is visible immediately, and widen the artwork overscan to keep edges covered. Version the stylesheet URL to refresh cached previews.

Wave deformation revision: replace whole-image translation with inline SVG paths whose Bézier control points follow independent travelling waves. Cyan, blue and amber change curvature continuously on both sides, with a subtle silver layer beneath. Broad wavelengths keep slopes shallow. Pause updates while offscreen or the tab is hidden; reduced motion displays a still frame. Verified changing left/right geometry, mobile layout, reduced motion and offscreen pause on the user's port 5500. No layout translation or external animation dependency.

## Release notes and privacy pages
Added /mac-sound-manager/release-notes/ and /mac-sound-manager/privacy/ with the shared Cabinet/system type, restrained 720px reading column, app header, download action and compact colored footer. Landing footer links to both; the new pages link back to the app and each other. Release 0.3.2/date/content verified against the public GitHub Releases API and local CHANGELOG/README. Privacy content checked against SECURITY.md, Info.plist, AudioHardware, ProcessAudioRoute, MixerStore and AppAppearance: local audio processing, no recording/upload/analytics, running-app inventory and local preferences. Scope is the Mac app, with separate explanation for website/download requests and voluntary support messages. No claims of legal certification or invented older public releases. Built successfully; links/navigation, no-JS content and 320/390/1440px layouts checked; sitemap/SEO audit passes for 23 pages and 113 internal resources. All changes remain local.

## Readability and section parallax
Raised small text across all three pages: desktop brand 18px, navigation/buttons/footer 16px, compatibility and dates at least 15px, feature copy 18–19px, document body 17–18px. Compact mobile headers show “Download” visually while retaining “Download for Mac” as the accessible name. Section images shift by at most 28px on desktop and 12px on mobile in response to scroll; desktop text moves slightly in the opposite direction. Parent layouts stay fixed, updates are batched per animation frame, and reduced motion removes the offsets. Checked typography, header collisions, overflow, parallax response and reduced motion at 1440/768/390/320px; both document headers checked at 320px. Build passes.
