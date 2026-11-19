#!/usr/bin/env python3
"""
Generate _build/cv-print.html from the SAME data the website uses
(_data/cv.yml + _data/site.yml), then build-cv.js renders it to PDF.

Run the whole chain with:   node _build/build-cv.js
(which calls this script first). You rarely run this directly.

The PDF is intentionally clean and professional — recruiters, funders and
investors read it — with only a small nod to the site's style.
"""
import html, pathlib, sys
try:
    import yaml
except ImportError:
    sys.exit("PyYAML needed: pip install pyyaml")

ROOT = pathlib.Path(__file__).resolve().parent.parent
cv = yaml.safe_load((ROOT / "_data/cv.yml").read_text())
site = yaml.safe_load((ROOT / "_data/site.yml").read_text())

def esc(s): return html.escape(str(s), quote=False)

# small pixel T-cell mark (nod to the site), inline
TMARK = ('<svg class="tmark" viewBox="0 0 11 11" shape-rendering="crispEdges" aria-hidden="true">'
         '<rect x="2" y="0" width="7" height="1" fill="#1f6f3a"/><rect x="1" y="1" width="9" height="1" fill="#1f6f3a"/>'
         '<rect x="0" y="2" width="11" height="7" fill="#2a8f52"/><rect x="1" y="9" width="9" height="1" fill="#1f6f3a"/>'
         '<rect x="2" y="10" width="7" height="1" fill="#1f6f3a"/>'
         '<rect x="3" y="3" width="2" height="2" fill="#fff"/><rect x="6" y="3" width="2" height="2" fill="#fff"/>'
         '<rect x="4" y="6" width="3" height="2" fill="#0e2714"/></svg>')

ICON = {
 "mail":'<path fill="none" stroke="currentColor" stroke-width="2" d="M3 5.5h18v13H3z"/><path fill="none" stroke="currentColor" stroke-width="2" d="m3.5 6 8.5 7 8.5-7"/>',
 "globe":'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
 "substack":'<path fill="currentColor" d="M22.5 8.2H1.5V5.4h21v2.8zM1.5 10.8V24L12 18.1 22.5 24V10.8H1.5zM22.5 0H1.5v2.8h21V0z"/>',
 "x":'<path fill="currentColor" d="M18.9 1.2h3.7l-8 9.2L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9ZM17.6 20.6h2L6.5 3.2H4.3Z"/>',
 "orcid":'<path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zM7.4 4.4c.5 0 .9.4.9.9s-.4 1-.9 1a1 1 0 0 1-.9-1c0-.5.4-.9.9-.9zm-.7 3h1.4v10H6.7V7.4zm3.5 0h3.9c3.7 0 5.3 2.7 5.3 5s-2 5-5.3 5h-3.9V7.4zm1.4 1.3v7.4h2.3c3.3 0 4-2.5 4-3.7 0-2-1.3-3.7-4.1-3.7h-2.2z"/>',
}
def icon(n): return f'<svg viewBox="0 0 24 24">{ICON[n]}</svg>'

def rows(items, fmt):
    return "".join(fmt(x) for x in items)

positions = rows(cv["positions"], lambda e:
    f'<div class="row"><p class="when">{esc(e["when"])}</p><div><h3>{esc(e["title"])}</h3>'
    f'<p class="where">{esc(e["where"])}</p>{f"<p class=\"desc\">{esc(e.get("detail"))}</p>" if e.get("detail") else ""}</div></div>')

education = rows(cv["education"], lambda e:
    f'<div class="cell"><h3>{esc(e["title"])}</h3><p class="where">{esc(e["where"].split(" · ")[0])}</p>'
    f'<p class="meta"><span>{esc(e["when"])}</span><span>{esc(e["where"].split(" · ")[1]) if " · " in e["where"] else ""}</span></p></div>')

awards = rows(cv["awards"], lambda a:
    f'<div class="award{ " new" if a.get("new") else "" }"><span class="yr">{esc(a["year"])}</span>'
    f'<h3>{esc(a["title"])}</h3><p>{esc(a["body"])}</p></div>')

patents = rows(cv["patents"], lambda e:
    f'<div class="row"><p class="when">{esc(e["when"])}</p><div><h3>{esc(e["title"])}</h3>'
    f'<p class="where">{esc(e["where"])}</p>{f"<p class=\"desc\">{esc(e.get("detail"))}</p>" if e.get("detail") else ""}</div></div>')

def pub_li(p):
    doi = p["doi"].replace("https://doi.org/", "")
    tag = '<span class="new-tag">New</span>' if p["year"] == "2026" else ""
    return f'<li>{p["cite"]} <a class="doi" href="{esc(p["doi"])}">doi:{esc(doi)}</a>{tag}</li>'
publications = rows(cv["publications"], pub_li)

talks = rows(cv["talks"], lambda e:
    f'<div class="row"><p class="when">{esc(e["when"])}</p><div><h3 class="t3">{esc(e["title"])}</h3>'
    f'<p class="where">{esc(e["where"])}</p></div></div>')

def teach(e):
    pts = "".join(f"<li>{esc(p)}</li>" for p in e.get("points", []))
    return (f'<div class="cell"><h3>{esc(e["title"])}</h3><p class="where">{esc(e["where"])}</p>'
            f'<p class="meta"><span>{esc(e["when"])}</span></p><ul class="bullets">{pts}</ul></div>')
teaching = rows(cv["teaching"], teach)

skills = rows(cv["skills"], lambda s: f'<dt>{esc(s["dt"])}</dt><dd>{esc(s["dd"])}</dd>')

def beyond_col(c):
    items = "".join(f"<li>{esc(i)}</li>" for i in c["items"])
    return f'<div class="cell"><h3>{esc(c["title"])}</h3><ul class="bullets">{items}</ul></div>'
beyond = rows(cv["beyond"], beyond_col)

profile = "".join(f"<p>{esc(p)}</p>" for p in cv["profile"])

HTML = f"""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<title>Adam Rochussen · Curriculum Vitae</title>
<meta name="author" content="Adam Rochussen">
<style>
  @font-face {{ font-family:"DM Sans"; font-weight:400; src:url("../assets/fonts/dmsans-normal-400-latin.woff2") format("woff2"); }}
  @font-face {{ font-family:"DM Sans"; font-weight:500; src:url("../assets/fonts/dmsans-normal-500-latin.woff2") format("woff2"); }}
  @font-face {{ font-family:"DM Sans"; font-weight:700; src:url("../assets/fonts/dmsans-normal-700-latin.woff2") format("woff2"); }}
  @font-face {{ font-family:"DM Sans"; font-style:italic; font-weight:400; src:url("../assets/fonts/dmsans-italic-400-latin.woff2") format("woff2"); }}
  :root{{ --ink:#17211a; --ink2:#3a463c; --muted:#6a776c; --accent:#1f6f3a; --rule:#dfe4da; }}
  *{{box-sizing:border-box}}
  html{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  @page{{ size:Letter; margin:0.5in 0.6in 0.6in; }}
  body{{margin:0;color:var(--ink);font:400 8.3pt/1.34 "DM Sans",sans-serif}}
  a{{color:inherit;text-decoration:none}} p{{margin:0}} ul{{margin:0;padding:0;list-style:none}}
  i,em{{font-style:italic}} b,strong{{font-weight:700}}
  .mast{{display:flex;align-items:flex-end;justify-content:space-between;gap:14pt;border-bottom:2.5pt solid var(--accent);padding-bottom:8pt}}
  .tmark{{width:20pt;height:20pt;vertical-align:-3pt;margin-right:7pt}}
  .name{{font-weight:700;font-size:25pt;letter-spacing:-.02em;line-height:1;margin:0}}
  .role{{margin-top:5pt;font-size:8.6pt;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:500}}
  .contacts{{text-align:right;font-size:7.7pt;color:var(--ink2);line-height:1.7}}
  .contacts a{{display:flex;align-items:center;gap:5pt;justify-content:flex-end}}
  .contacts svg{{width:8.5pt;height:8.5pt;color:var(--accent);flex:none}}
  section{{margin-top:7.5pt}}
  h2{{font-size:8.6pt;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);margin:0 0 5pt;padding-bottom:2.5pt;border-bottom:.8pt solid var(--rule);font-weight:700}}
  h3{{margin:0;font-size:9.4pt;font-weight:700}}
  h3.t3{{font-weight:500;font-size:9pt}}
  .where{{color:var(--accent);font-weight:500;font-size:8.2pt}}
  .meta{{color:var(--muted);font-size:7.8pt}} .meta span+span::before{{content:" · "}}
  .desc{{color:var(--ink2);margin-top:1.5pt}}
  .profile{{font-size:9pt;line-height:1.46;color:#223}}
  .profile p+p{{margin-top:4pt}}
  .row{{display:grid;grid-template-columns:0.95in 1fr;gap:9pt;padding:3pt 0;break-inside:avoid;border-top:.5pt solid var(--rule)}}
  .row:first-of-type{{border-top:0;padding-top:1pt}}
  .when{{font-size:7.6pt;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:500}}
  .grid3{{display:grid;grid-template-columns:repeat(3,1fr);gap:6pt 14pt}}
  .grid2{{display:grid;grid-template-columns:repeat(2,1fr);gap:7pt 14pt}}
  .cell{{break-inside:avoid}}
  .award{{position:relative;border:.7pt solid var(--rule);border-left:2.5pt solid var(--accent);padding:4.5pt 8pt;break-inside:avoid}}
  .award.new{{background:#f3f8ee}}
  .award .yr{{font-weight:700;color:var(--accent);font-size:8.4pt}}
  .award p{{color:var(--ink2);font-size:7.9pt;line-height:1.36;margin-top:1.5pt}}
  .bullets li{{position:relative;padding-left:9pt;margin-top:1pt;color:var(--ink2)}}
  .bullets li::before{{content:"";position:absolute;left:0;top:.5em;width:3pt;height:3pt;background:var(--accent)}}
  .pubs li{{position:relative;padding-left:11pt;margin-bottom:3pt;break-inside:avoid;color:var(--ink2)}}
  .pubs li::before{{content:"";position:absolute;left:1pt;top:.5em;width:3.4pt;height:3.4pt;background:var(--accent)}}
  .pubs b{{color:var(--ink)}} .pubs i{{font-style:italic}}
  .pubs .doi{{color:var(--accent)}}
  .new-tag{{font-size:6pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:var(--accent);padding:1pt 3pt;margin-left:3pt;border-radius:2pt}}
  .skills{{display:grid;grid-template-columns:1.1in 1fr;gap:3pt 10pt}}
  .skills dt{{font-weight:700;font-size:8.6pt}} .skills dd{{margin:0;color:var(--ink2)}}
  .sub{{font-weight:700;font-size:8.4pt;margin:6pt 0 3pt;color:var(--ink)}}
</style></head>
<body>
  <header class="mast">
    <div>
      <h1 class="name">{TMARK}Adam Rochussen</h1>
      <p class="role">Postdoctoral Fellow · Salk Institute for Biological Studies</p>
    </div>
    <div class="contacts">
      <a href="mailto:{esc(site['email'])}">{icon('mail')}{esc(site['email'])}</a>
      <a href="https://rochussen.xyz">{icon('globe')}rochussen.xyz</a>
      <a href="https://adam.rochussen.xyz">{icon('substack')}Fruit of Eden</a>
      <a href="https://x.com/AdamRochussen">{icon('x')}@AdamRochussen</a>
      <a href="https://orcid.org/0000-0001-9439-1206">{icon('orcid')}0000-0001-9439-1206</a>
    </div>
  </header>

  <section><h2>Profile</h2><div class="profile">{profile}</div></section>
  <section><h2>Research positions</h2>{positions}</section>
  <section><h2>Education</h2><div class="grid3">{education}</div></section>
  <section><h2>Honours, awards &amp; fellowships</h2><div class="grid2">{awards}</div></section>
  <section><h2>Patents &amp; translation</h2>{patents}</section>
  <section><h2>Publications</h2><ul class="pubs">{publications}</ul></section>
  <section><h2>Conference presentations</h2>{talks}</section>
  <section><h2>Teaching &amp; mentoring</h2><div class="grid3">{teaching}</div></section>
  <section><h2>Technical expertise</h2><dl class="skills">{skills}</dl></section>
  <section><h2>Beyond the lab</h2><div class="grid2">{beyond}</div></section>
</body></html>"""

out = ROOT / "_build/cv-print.html"
out.write_text(HTML)
print(f"Wrote {out.relative_to(ROOT)} ({len(HTML)} bytes)")
