# rochussen.xyz

Personal website of Adam Rochussen, hosted on GitHub Pages at
[rochussen.xyz](https://rochussen.xyz) (the custom domain lives in `CNAME`).

Retro-arcade theme. Built with **Jekyll**, which GitHub Pages runs for you
automatically: when you push a change, the live site rebuilds in a minute or two.
There is nothing to compile by hand for text or layout changes.

---

## ✏️ How to change the words on the site

**All the text lives in one folder: [`_data/`](_data/).** You never have to touch
the HTML to reword something. Open the file for the page you want, change the
text between the quotes (or after the colon), save, and commit. Each file is
commented to tell you what's what.

| If you want to change… | Edit this file |
| --- | --- |
| Your name, the top menu, your links, the footer | [`_data/site.yml`](_data/site.yml) |
| **Home page** — the big intro, the "about" paragraphs, the three cards, news, essays, the donor/investor boxes, the photo captions | [`_data/home.yml`](_data/home.yml) |
| **Research page** — the lab blurb, each research "theme" card, collaborations, the venture box | [`_data/research.yml`](_data/research.yml) |
| **Publications page** — papers, plain-language summaries, theses, talks | [`_data/publications.yml`](_data/publications.yml) |
| **CV page *and* the downloadable PDF** (one source for both) | [`_data/cv.yml`](_data/cv.yml) |

### Worked examples

- **Change the homepage intro sentence:** open `_data/home.yml`, find `hero:` near
  the top, edit the `lede:` text.
- **Add a news item:** in `_data/home.yml` find `news:` and copy one of the
  `- date_label: …` blocks.
- **Add a paper:** in `_data/publications.yml` find `articles:` and copy an
  existing `- id: …` block. The `tags:` line controls which filter buttons it
  appears under (`first`, `immunology`, `metascience`, `review`). Then also add a
  short version to the `publications:` list in `_data/cv.yml` and
  [rebuild the PDF](#-rebuilding-the-pdf-cv).
- **Fix a typo in an "about" paragraph:** `_data/home.yml` → `about:` →
  `paragraphs:`.

A few values contain small bits of HTML (like `<a href="…">a link</a>` or
`<em>italics</em>`). You can edit the words inside them; just keep the angle-
bracket tags intact.

### AI-generated summaries

The plain-language summaries on the Publications page were drafted by an AI model
from each paper's abstract, and are labelled "✦ AI-generated". If you rewrite one
yourself in `_data/publications.yml`, change its `ai: true` to `ai: false` to drop
the label.

---

## 🗂 What's where (for when you want to change more than words)

```
_data/            ← ALL TEXT (see table above)
_includes/        ← reused chunks: head, header, footer, the research "theme" card
_layouts/         ← the page shell (default.html)
index.html        ← home page   }
research.html     ← research     }  these are templates — they pull their
publications.html ← publications }  words from _data/ and lay them out
cv.html           ← CV           }
404.html          ← not-found page (with a mini "Game Over" joke)
assets/css/site.css   ← the whole arcade look (dark cabinet + Game Boy light theme)
assets/js/site.js     ← interactions + the hidden mini-game (see below)
assets/fonts/     ← self-hosted fonts (Press Start 2P + DM Sans)
assets/img/       ← portrait, photos, social card, icons
assets/img/sprites/   ← the pixel-art creatures (T-cell, cancer cell, coin, heart)
assets/cv/        ← the generated CV PDF
_build/           ← scripts that make the PDF and images (NOT part of the website)
```

## 🎨 Themes

Two themes, toggled by the sun/moon button in the header:

- **Dark** (default): arcade-cabinet black with neon cyan.
- **Light**: Game Boy DMG green.

Colours are defined once at the top of `assets/css/site.css` (the `:root` and
`html[data-theme="light"]` blocks) if you ever want to tweak them.

## 🕹 The mini-game

There's a small original arcade game, **Immuno Defender** (a T-cell shooting
cancer cells). Launch it with the **▶ Play** button in the homepage hero, or with
the Konami code (↑ ↑ ↓ ↓ ← → ← → B A) on any page. It's all in
`assets/js/site.js` and uses no third-party code.

---

## 🖨 Rebuilding the PDF CV

The CV PDF is generated from `_data/cv.yml` (same text as the web CV), so edit
there, then regenerate:

```bash
npm install --no-save playwright
npx playwright install chromium
node _build/build-cv.js          # US Letter (default)
node _build/build-cv.js --a4     # or A4
```

This writes `assets/cv/Adam_Rochussen_CV.pdf`. If the page count changes, update
the `pdf_meta:` line in `_data/cv.yml` (it's the little "3 pages" note by the
download button).

The social-share image (`assets/img/og.jpg`) and the touch icon are rebuilt with
`node _build/build-images.js`.

## 🔧 Running the site locally (optional)

You only need this to preview before pushing; GitHub builds it for you anyway.

```bash
bundle install          # once (needs Ruby + the github-pages gem)
bundle exec jekyll serve # then open http://localhost:4000
```
