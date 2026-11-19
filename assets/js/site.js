/* rochussen.xyz — interactions + a small arcade mini-game. No dependencies. */
(() => {
  const doc = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const ICONS = "/assets/img/icons.svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme ---------- */
  const themeMeta = $('meta[name="theme-color"]');
  const syncTheme = () => {
    const light = doc.dataset.theme === "light";
    if (themeMeta) themeMeta.content = light ? "#cdd9a4" : "#0e1018";
    $$("[data-theme-toggle]").forEach(b => { b.setAttribute("aria-pressed", String(light)); });
  };
  $$("[data-theme-toggle]").forEach(b => b.addEventListener("click", () => {
    const next = doc.dataset.theme === "light" ? "dark" : "light";
    const apply = () => { doc.dataset.theme = next; syncTheme(); };
    try { localStorage.setItem("theme", next); } catch (e) {}
    if (document.startViewTransition && !reduce) document.startViewTransition(apply); else apply();
  }));
  syncTheme();

  /* ---------- Header scroll + progress fallback ---------- */
  const header = $(".site-header");
  const bar = $(".scanbar i");
  const cssTimeline = window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()");
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 10);
    if (bar && !cssTimeline) {
      const max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    }
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menu = $("#mobile-menu"), menuBtn = $(".menu-toggle");
  if (menu && menuBtn) {
    $$("li", menu).forEach((li, i) => li.style.setProperty("--i", i));
    const setOpen = open => {
      menu.classList.toggle("is-open", open);
      menu.inert = !open; menu.setAttribute("aria-hidden", String(!open));
      menuBtn.setAttribute("aria-expanded", String(open));
      $("use", menuBtn).setAttribute("href", `${ICONS}#${open ? "i-close" : "i-menu"}`);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) { const a = $("a", menu); if (a) a.focus({ preventScroll: true }); }
    };
    menu.inert = true;
    menuBtn.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
    menu.addEventListener("click", e => { if (e.target.closest("a")) setOpen(false); });
    addEventListener("keydown", e => { if (e.key === "Escape" && menu.classList.contains("is-open")) { setOpen(false); menuBtn.focus(); } });
    matchMedia("(min-width: 901px)").addEventListener("change", e => { if (e.matches) setOpen(false); });
  }

  /* ---------- Hero entrance ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => doc.classList.add("is-loaded")));

  /* ---------- Scroll reveal ---------- */
  $$("[data-stagger]").forEach(g => $$(":scope > [data-reveal]", g).forEach((el, i) => el.style.setProperty("--i", i)));
  const reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add("is-in"));

  /* ---------- Toast + copy ---------- */
  let toastEl, toastT;
  const toast = (msg) => {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.innerHTML = `<svg class="icon" aria-hidden="true"><use href="${ICONS}#i-check"></use></svg><span></span>`;
    toastEl.querySelector("span").textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add("is-visible"));
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("is-visible"), 2500);
  };
  const copyText = async (t) => {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) { const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (_) {} ta.remove(); return ok; }
  };
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]"); if (!b) return;
    e.preventDefault();
    const ok = await copyText(b.dataset.copy);
    toast(ok ? (b.dataset.copyMsg || "Copied") : "Copy failed — select the text manually");
  });

  /* ---------- Publications filter + search ---------- */
  const pubList = $("[data-pub-list]");
  if (pubList) {
    const items = $$(".pub", pubList), chips = $$("[data-filter]"), search = $("#pub-search"), count = $("#result-count");
    let active = "all";
    chips.forEach(ch => { const f = ch.dataset.filter; const n = f === "all" ? items.length : items.filter(i => i.dataset.tags.split(" ").includes(f)).length; const c = $(".count", ch); if (c) c.textContent = n; });
    const apply = () => {
      const q = (search && search.value || "").trim().toLowerCase(); let shown = 0;
      items.forEach(it => {
        const tagOk = active === "all" || it.dataset.tags.split(" ").includes(active);
        const txtOk = !q || it.textContent.toLowerCase().includes(q);
        const show = tagOk && txtOk; it.hidden = !show; if (show) shown++;
      });
      if (count) count.textContent = shown === items.length ? `Showing all ${shown} articles` : `Showing ${shown} of ${items.length} articles`;
    };
    chips.forEach(ch => ch.addEventListener("click", () => { active = ch.dataset.filter; chips.forEach(c => c.setAttribute("aria-pressed", String(c === ch))); apply(); }));
    if (search) search.addEventListener("input", apply);
    apply();
  }

  /* ---------- CV scrollspy ---------- */
  const toc = $$(".toc a[href^='#']");
  if (toc.length && "IntersectionObserver" in window) {
    const map = new Map(toc.map(a => [a.getAttribute("href").slice(1), a]));
    const secs = [...map.keys()].map(id => document.getElementById(id)).filter(Boolean);
    const vis = new Set();
    const spy = new IntersectionObserver(es => {
      es.forEach(en => { if (en.isIntersecting) vis.add(en.target.id); else vis.delete(en.target.id); });
      const cur = secs.find(s => vis.has(s.id));
      if (cur) toc.forEach(a => a.classList.toggle("is-active", a === map.get(cur.id)));
    }, { rootMargin: `-${Math.round(innerHeight * .2)}px 0px -55% 0px` });
    secs.forEach(s => spy.observe(s));
  }

  /* ====================================================================
     IMMUNO DEFENDER — a tiny original arcade game (easter egg)
     Launch: the "▶ Play" button, or the Konami code.
     ==================================================================== */
  let gameAPI = null;
  const buildGame = () => {
    if (gameAPI) return gameAPI;
    const modal = document.createElement("div");
    modal.className = "game-modal"; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-label", "Immuno Defender mini-game");
    modal.innerHTML = `
      <div class="game-box">
        <div class="game-head">
          <span class="game-title">Immuno Defender</span>
          <span class="game-hud"><span>Score <b data-score>0</b></span><span>Hi <b data-hi>0</b></span><span>Lives <b data-lives>3</b></span></span>
          <button class="game-close" type="button" aria-label="Close game"><svg class="icon" aria-hidden="true"><use href="${ICONS}#i-close"></use></svg></button>
        </div>
        <div class="game-canvas-wrap">
          <canvas width="240" height="180"></canvas>
          <div class="game-overlay" data-overlay>
            <p data-msg>Immuno Defender</p>
            <p class="sub">Clear the cancer cells.<br>← → or A D to move · Space to fire<br>Tap / drag on touch</p>
            <button class="btn btn-key" type="button" data-start><span>Press start</span></button>
          </div>
        </div>
        <p class="game-foot">T-cell vs. tumour · esc to quit</p>
      </div>`;
    document.body.appendChild(modal);
    const cv = $("canvas", modal), ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    const overlay = $("[data-overlay]", modal), msg = $("[data-msg]", modal);
    const elScore = $("[data-score]", modal), elHi = $("[data-hi]", modal), elLives = $("[data-lives]", modal);
    const C = { bg: "#0a0c14", cell: "#36e0c6", cellsh: "#1fb9a2", foe: "#ff5d7e", foesh: "#d83f63", shot: "#ffcf3f", eye: "#0e1018", text: "#eef1ff" };
    let hi = 0; try { hi = +localStorage.getItem("immuno-hi") || 0; } catch (e) {}
    elHi.textContent = hi;

    let state = "idle", score = 0, lives = 3, raf = 0, last = 0;
    const player = { x: W / 2, y: H - 16, w: 16, h: 12, speed: 150, cool: 0 };
    let bullets = [], foes = [], foeDir = 1, foeSpeed = 14, wave = 1, flash = 0;
    const keys = {};

    function spawnWave() {
      foes = [];
      const cols = 6, rows = 3, gx = 30, gy = 22, ox = 24, oy = 26;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
        foes.push({ x: ox + c * gx, y: oy + r * gy, w: 16, h: 14, alive: true });
      foeDir = 1; foeSpeed = 14 + wave * 4;
    }
    function reset() { score = 0; lives = 3; wave = 1; bullets = []; player.x = W / 2; spawnWave(); sync(); }
    function sync() { elScore.textContent = score; elLives.textContent = lives; }

    function fire() { if (player.cool > 0) return; bullets.push({ x: player.x, y: player.y - 8, w: 3, h: 7 }); player.cool = .28; }

    function hit(a, b) { return Math.abs(a.x - (b.x)) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2; }

    function update(dt) {
      if (keys.left) player.x -= player.speed * dt;
      if (keys.right) player.x += player.speed * dt;
      player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));
      if (player.cool > 0) player.cool -= dt;
      if (keys.fire) fire();

      bullets.forEach(b => b.y -= 190 * dt);
      bullets = bullets.filter(b => b.y > -10);

      // move formation
      let minX = 999, maxX = -999, maxY = 0, live = 0;
      foes.forEach(f => { if (!f.alive) return; live++; minX = Math.min(minX, f.x); maxX = Math.max(maxX, f.x); maxY = Math.max(maxY, f.y); });
      if (live === 0) { wave++; spawnWave(); return; }
      let dx = foeDir * foeSpeed * dt;
      if (maxX + dx > W - 12 || minX + dx < 12) { foeDir *= -1; foes.forEach(f => f.y += 10); }
      else foes.forEach(f => { if (f.alive) f.x += dx; });

      // collisions
      foes.forEach(f => {
        if (!f.alive) return;
        for (let i = bullets.length - 1; i >= 0; i--) if (hit(f, bullets[i])) { f.alive = false; bullets.splice(i, 1); score += 10; flash = .08; break; }
      });
      if (maxY > H - 26) { loseLife(); }
      foes.forEach(f => { if (f.alive && hit(f, player)) loseLife(); });
      sync();
    }
    function loseLife() { lives--; if (lives <= 0) return end(false); bullets = []; spawnWave(); player.x = W / 2; }

    function px(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, w, h); }
    function drawCell(x, y) {
      px(x - 8, y - 6, 16, 12, C.cell); px(x - 8, y - 2, 16, 4, C.cellsh);
      px(x - 5, y - 4, 2, 2, C.eye); px(x + 3, y - 4, 2, 2, C.eye); px(x - 1, y + 1, 2, 2, C.eye);
    }
    function drawFoe(f) {
      const x = f.x, y = f.y;
      px(x - 8, y - 6, 16, 12, C.foe); px(x - 8, y + 2, 16, 2, C.foesh);
      px(x - 10, y - 4, 2, 3, C.foe); px(x + 8, y - 4, 2, 3, C.foe);
      px(x - 5, y - 3, 2, 2, C.eye); px(x + 3, y - 3, 2, 2, C.eye);
    }
    function draw() {
      ctx.fillStyle = flash > 0 ? "#141826" : C.bg; ctx.fillRect(0, 0, W, H);
      if (flash > 0) flash -= .016;
      // stars
      ctx.fillStyle = "rgba(210,220,255,.25)";
      for (let i = 0; i < 18; i++) ctx.fillRect((i * 53 % W), ((i * 97 + (performance.now() / 40)) % H), 1, 1);
      bullets.forEach(b => px(b.x - 1, b.y, 2, 7, C.shot));
      foes.forEach(f => { if (f.alive) drawFoe(f); });
      drawCell(player.x, player.y);
    }
    function loop(t) {
      const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
      if (state === "play") update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() { reset(); state = "play"; overlay.hidden = true; }
    function end(win) {
      state = "over";
      if (score > hi) { hi = score; try { localStorage.setItem("immuno-hi", hi); } catch (e) {} elHi.textContent = hi; }
      msg.innerHTML = win ? "You win!" : "Game over"; overlay.hidden = false;
      $("[data-start] span", modal).textContent = "Play again";
    }

    // input
    const kd = e => {
      if (!modal.classList.contains("is-open")) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "A", "D"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
      if (e.key === " " || e.key === "ArrowUp") keys.fire = true;
      if (e.key === "Escape") close();
    };
    const ku = e => { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false; if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false; if (e.key === " " || e.key === "ArrowUp") keys.fire = false; };
    addEventListener("keydown", kd); addEventListener("keyup", ku);
    // touch / pointer
    let dragging = false;
    const toCanvasX = clientX => { const r = cv.getBoundingClientRect(); return (clientX - r.left) / r.width * W; };
    cv.addEventListener("pointerdown", e => { if (state !== "play") return; dragging = true; player.x = toCanvasX(e.clientX); fire(); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => { if (dragging) player.x = toCanvasX(e.clientX); });
    cv.addEventListener("pointerup", () => dragging = false);

    const open = () => { modal.classList.add("is-open"); state = "idle"; overlay.hidden = false; msg.textContent = "Immuno Defender"; $("[data-start] span", modal).textContent = "Press start"; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); $("[data-start]", modal).focus(); };
    const close = () => { modal.classList.remove("is-open"); state = "idle"; cancelAnimationFrame(raf); keys.left = keys.right = keys.fire = false; };
    $(".game-close", modal).addEventListener("click", close);
    $("[data-start]", modal).addEventListener("click", start);
    modal.addEventListener("click", e => { if (e.target === modal) close(); });

    gameAPI = { open, close };
    return gameAPI;
  };

  $$("[data-play]").forEach(b => b.addEventListener("click", () => buildGame().open()));

  // Konami code
  const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let idx = 0;
  addEventListener("keydown", e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    idx = (k === seq[idx]) ? idx + 1 : (k === seq[0] ? 1 : 0);
    if (idx === seq.length) { idx = 0; buildGame().open(); }
  });
})();
