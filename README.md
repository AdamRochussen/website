# rochussen.xyz

Personal website of Adam Rochussen, served by GitHub Pages at [rochussen.xyz](https://rochussen.xyz) (see `CNAME`).

Plain static HTML, CSS and JavaScript: no framework, no build step needed to publish. Edit a file, commit, and GitHub Pages deploys it.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Home: hero, Roots of Progress, about, three threads, news, essays, donor & investor contact |
| `research.html` | Research themes, collaborations, translation |
| `publications.html` | Articles (with filters, search, copy-citation and AI-generated plain-language summaries), theses, talks |
| `cv.html` | Web CV with a working **Download PDF** button |
| `404.html` | Not-found page |
| `assets/css/site.css` | The whole design system (art deco tokens, light & dark themes, components) |
| `assets/js/site.js` | Interactions: theme toggle, mobile menu, scroll reveal, filters, copy buttons, CV scrollspy |
| `assets/cv/Adam_Rochussen_CV.pdf` | The downloadable CV (generated, see below) |
| `assets/img/` | Portrait (WebP + JPEG sizes), icon sprite, sunburst & fan ornaments, social card |
| `assets/fonts/` | Self-hosted Bodoni Moda and Jost (SIL Open Font License) |
| `_build/` | Sources for generated files. Not published, because GitHub Pages ignores `_` folders |

## Common edits

- **Add a paper**: copy an `<article class="pub">` block in `publications.html`. The `data-tags` attribute
  (`first`, `immunology`, `metascience`, `review`) drives the filter chips, and their counts update automatically. Also add it
  to the Publications list in `cv.html` and in `_build/cv-print.html`, then rebuild the PDF.
- **News on the home page**: edit the `<ol class="news">` list in `index.html`.
- **Essays on the home page**: edit the `<div class="essays">` cards in `index.html`.
- **“Last updated”**: in the footer of each page.

### AI-generated summaries

Plain-language summaries on `publications.html` were drafted by an AI model (Claude) from each paper's published abstract.
They're labelled “✦ AI-generated” next to each summary and explained in a note at the bottom of the page.
If you rewrite a summary yourself, remove its `<span class="ai-mark">` label.

## Rebuilding the PDF CV

The PDF is rendered from `_build/cv-print.html` with headless Chromium (Playwright):

```bash
npm install --no-save playwright
npx playwright install chromium
node _build/build-cv.js          # US Letter
node _build/build-cv.js --a4     # or A4
```

If the page count or size changes, update the file details next to the download button in `cv.html`.

The social share card (`assets/img/og.jpg`) and Apple touch icon are rebuilt with `node _build/build-images.js`.
