// Aura website: an iPhone 15 Pro Max in 3D, running Aura's radar. Drag to turn it, tap people on the
// screen, wave, and see what people are up for. Three.js loads only when this section comes into view.
// Without WebGL (or if Three.js can't load), the same live screen is shown flat.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js';

const box = document.getElementById('phone3d');
if (box) start();

function start() {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- the screen, drawn on a normal 2D canvas ----------
  const CW = 700, CH = 1490;
  const sc = document.createElement('canvas');
  sc.width = CW; sc.height = CH;
  const ctx = sc.getContext('2d');

  const PAL = {
    dating: { bg: '#1a0b13', surface: '#26111d', surface2: '#341827', line: '#4a2338', fg: '#fdeef4', muted: '#d0a3b8', faint: '#a87e92', accent: '#ff4f7b', accentInk: '#2b0412', blush: '#ffadc8', blushInk: '#3d0a1f', radar1: '#2e1222', radar2: '#1f0c17' },
    vibing: { bg: '#0a1226', surface: '#121d38', surface2: '#1a2747', line: '#26365f', fg: '#eef3ff', muted: '#a9b8de', faint: '#8490b2', accent: '#4f8cff', accentInk: '#03102b', blush: '#ffd23f', blushInk: '#2e2300', radar1: '#142045', radar2: '#0d1730' },
  };
  const GEN = { indie: '#52d69a', electronic: '#e45cff', pop: '#ff7eb6', rock: '#ff4d5e', jazz: '#f2c14e' };
  const GENRE = {
    ro: { indie: 'Indie', electronic: 'Electronică', pop: 'Pop', rock: 'Rock', jazz: 'Jazz' },
    en: { indie: 'Indie', electronic: 'Electronic', pop: 'Pop', rock: 'Rock', jazz: 'Jazz' },
  };
  const T = {
    ro: { up: '☕ O cafea', sub: 'Atinge pe cineva ca să-i vezi piesa', here: '5 persoane în cameră', live: 'Bluetooth · activ',
      playing: (n) => `${n.toUpperCase()} ASCULTĂ`, wave: 'Salută', waved: 'Ai salutat', chat: 'Scrie-i',
      back: (n) => `${n} ți-a răspuns la salut!`, tabs: ['Radar', 'Mesaje', 'Profil'], you: 'Tu' },
    en: { up: '☕ Coffee', sub: 'Tap someone to see their song', here: '5 people in the room', live: 'Bluetooth · live',
      playing: (n) => `${n.toUpperCase()} IS PLAYING`, wave: 'Wave', waved: 'Waved', chat: 'Chat',
      back: (n) => `${n} waved back!`, tabs: ['Radar', 'Chats', 'Profile'], you: 'You' },
  };
  const people = [
    { n: 'Ioana', age: 24, g: 'indie', a: -0.9, r: 0.42, song: 'Motion Sickness', artist: 'Phoebe Bridgers', d: '2–5 m' },
    { n: 'Vlad', age: 27, g: 'electronic', a: 0.5, r: 0.78, song: 'Delilah', artist: 'Fred again..', d: '5–10 m' },
    { n: 'Maria', age: 23, g: 'pop', a: 2.2, r: 0.55, song: 'Houdini', artist: 'Dua Lipa', d: '1–2 m' },
    { n: 'Andrei', age: 26, g: 'rock', a: 3.4, r: 0.82, song: 'Do I Wanna Know?', artist: 'Arctic Monkeys', d: '5–10 m' },
    { n: 'Sara', age: 25, g: 'jazz', a: 4.6, r: 0.66, song: 'Feeling Good', artist: 'Nina Simone', d: '2–5 m' },
  ];
  const DISPLAY = '"Bricolage Grotesque", system-ui, sans-serif';
  const BODY = '"Atkinson Hyperlegible", system-ui, sans-serif';

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k, al = 1) => {
    const A = hex(a), B = hex(b);
    return `rgba(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')},${al})`;
  };

  const k = 1; // the app's blue (the brand pink is PAL.dating, used only at sign-in)
  let sel = 0;              // the person shown in the cards
  const waved = new Set();  // who you waved at
  let toast = null;         // { text, t0 }
  let burst = null;         // { x, y, t0 }
  const spots = [];         // where each person is drawn (for taps)
  const R = 285, cx = CW / 2, cy = 640;
  const seg = { x: CW - 44 - 260, y: 158, w: 260, h: 66 };
  const waveBtn = { x: CW - 70 - 150, y: 1202, w: 150, h: 56 };
  const lang = () => (root.lang === 'en' ? 'en' : 'ro');

  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function draw(t) {
    const L = T[lang()];
    const C = (key, al) => mix(PAL.dating[key], PAL.vibing[key], k, al ?? 1);
    const spin = reduce ? 0 : t;
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.fillStyle = C('bg'); ctx.fillRect(0, 0, CW, CH);
    const glow = ctx.createRadialGradient(cx, cy, 50, cx, cy, 700);
    glow.addColorStop(0, C('accent', 0.1)); glow.addColorStop(1, C('accent', 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, CW, CH);

    // status bar and Dynamic Island
    ctx.fillStyle = C('fg'); ctx.font = `700 32px ${BODY}`; ctx.textBaseline = 'middle';
    ctx.fillText('9:41', 74, 66);
    for (let i = 0; i < 4; i++) ctx.fillRect(500 + i * 13, 76 - i * 7 - 8, 9, 8 + i * 7);
    ctx.strokeStyle = C('fg', 0.6); ctx.lineWidth = 2.5; rr(575, 52, 54, 27, 8); ctx.stroke();
    ctx.fillRect(580, 57, 40, 17); ctx.fillRect(631, 60, 4, 11);
    ctx.fillStyle = '#000'; rr(cx - 118, 28, 236, 72, 36); ctx.fill();

    // header and what I'm up for
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C('fg'); ctx.font = `800 62px ${DISPLAY}`; ctx.fillText('aura', 44, 205);
    ctx.fillStyle = C('muted'); ctx.font = `400 25px ${BODY}`; ctx.fillText(L.sub, 46, 250);
    ctx.fillStyle = C('blush'); rr(seg.x, seg.y, seg.w, seg.h, 33); ctx.fill();
    ctx.font = `700 26px ${BODY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C('blushInk'); ctx.fillText(L.up, seg.x + seg.w / 2, seg.y + 34);

    // radar
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    rg.addColorStop(0, C('radar1')); rg.addColorStop(1, C('radar2'));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C('line'); ctx.lineWidth = 2;
    for (const f of [0.33, 0.66, 1]) { ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, Math.PI * 2); ctx.stroke(); }
    if (!reduce) {
      const sw = (t * 1.1) % (Math.PI * 2);
      const cg = ctx.createConicGradient(sw - Math.PI * 0.6, cx, cy);
      cg.addColorStop(0, C('accent', 0)); cg.addColorStop(0.299, C('accent', 0.38));
      cg.addColorStop(0.3, C('accent', 0)); cg.addColorStop(1, C('accent', 0));
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C('accent', 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sw) * R, cy + Math.sin(sw) * R); ctx.stroke();
      for (let i = 0; i < 2; i++) {
        const p = (t / 2.6 + i * 0.5) % 1;
        ctx.strokeStyle = C('accent', (1 - p) * 0.5); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, 30 + p * R, 0, Math.PI * 2); ctx.stroke();
      }
    }
    const yg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 70);
    yg.addColorStop(0, C('accent', 0.55)); yg.addColorStop(1, C('accent', 0));
    ctx.fillStyle = yg; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C('accent'); ctx.beginPath(); ctx.arc(cx, cy, 27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C('accentInk'); ctx.font = `800 19px ${BODY}`; ctx.fillText(L.you, cx, cy + 1);

    people.forEach((p, i) => {
      const a = p.a + Math.sin(spin * 0.25 + i) * 0.08, r = R * (p.r + Math.sin(spin * 0.6 + i * 2) * 0.03);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r + Math.sin(spin * 1.3 + i) * 4;
      spots[i] = { x, y };
      const col = GEN[p.g], beat = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * (2 + i * 0.3) + i);
      const g2 = ctx.createRadialGradient(x, y, 20, x, y, 62 + beat * 14);
      g2.addColorStop(0, col + 'aa'); g2.addColorStop(1, col + '00');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y, 78, 0, Math.PI * 2); ctx.fill();
      if (i === sel) { ctx.strokeStyle = C('fg', 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 41, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = C('surface2'); ctx.beginPath(); ctx.arc(x, y, 31, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = C('fg'); ctx.font = `800 27px ${DISPLAY}`; ctx.fillText(p.n[0], x, y + 1);
      ctx.fillStyle = i === sel ? C('fg') : C('muted'); ctx.font = `700 21px ${BODY}`; ctx.fillText(p.n, x, y + 54);
    });
    ctx.textAlign = 'left';

    // people count and Bluetooth chip
    ctx.fillStyle = C('fg'); ctx.font = `800 33px ${DISPLAY}`; ctx.textBaseline = 'alphabetic';
    ctx.fillText(L.here, 44, 992);
    ctx.font = `700 21px ${BODY}`;
    const lw = ctx.measureText(L.live).width + 62;
    ctx.fillStyle = C('surface2'); rr(CW - 44 - lw, 952, lw, 50, 25); ctx.fill();
    ctx.fillStyle = '#7fe0b0'; ctx.globalAlpha = reduce ? 1 : 0.6 + 0.4 * Math.sin(t * 4);
    ctx.beginPath(); ctx.arc(CW - 44 - lw + 26, 977, 8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = C('muted'); ctx.textBaseline = 'middle'; ctx.fillText(L.live, CW - 44 - lw + 44, 978);

    // the chosen person's song
    const p = people[sel];
    ctx.fillStyle = C('surface'); rr(44, 1025, CW - 88, 130, 28); ctx.fill();
    const ag = ctx.createLinearGradient(68, 1045, 158, 1135);
    ag.addColorStop(0, GEN[p.g]); ag.addColorStop(1, C('accent'));
    ctx.fillStyle = ag; rr(68, 1045, 90, 90, 18); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = `800 46px ${BODY}`; ctx.textAlign = 'center'; ctx.fillText('♪', 113, 1092);
    ctx.textAlign = 'left';
    ctx.fillStyle = C('faint'); ctx.font = `700 20px ${BODY}`; ctx.fillText(L.playing(p.n), 180, 1062);
    ctx.fillStyle = C('fg'); ctx.font = `800 31px ${DISPLAY}`; ctx.fillText(p.song, 180, 1097);
    ctx.fillStyle = C('muted'); ctx.font = `400 24px ${BODY}`; ctx.fillText(p.artist, 180, 1129);
    for (let i = 0; i < 4; i++) {
      const h = reduce ? 30 : 16 + Math.abs(Math.sin(t * 5 + i * 1.7)) * 38;
      ctx.fillStyle = C('blush'); rr(570 + i * 18, 1090 - h / 2, 10, h, 5); ctx.fill();
    }

    // the chosen person, with Wave
    ctx.fillStyle = C('surface'); rr(44, 1175, CW - 88, 110, 28); ctx.fill();
    ctx.fillStyle = C('surface2'); ctx.beginPath(); ctx.arc(110, 1230, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GEN[p.g]; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = C('fg'); ctx.font = `800 28px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(p.n[0], 110, 1231);
    ctx.textAlign = 'left'; ctx.font = `800 28px ${DISPLAY}`; ctx.fillText(`${p.n}, ${p.age}`, 166, 1215);
    ctx.fillStyle = C('muted'); ctx.font = `400 23px ${BODY}`; ctx.fillText(`${GENRE[lang()][p.g]} · ${p.d}`, 166, 1251);
    const done = waved.has(sel);
    ctx.fillStyle = done ? C('surface2') : C('accent'); rr(waveBtn.x, waveBtn.y, waveBtn.w, waveBtn.h, 28); ctx.fill();
    ctx.fillStyle = done ? C('muted') : C('accentInk'); ctx.font = `800 24px ${BODY}`; ctx.textAlign = 'center';
    ctx.fillText(done ? L.chat : L.wave, waveBtn.x + waveBtn.w / 2, waveBtn.y + 29);
    ctx.textAlign = 'left';

    // tab bar
    const ty = CH - 165;
    ctx.fillStyle = C('bg'); ctx.fillRect(0, ty, CW, 165);
    ctx.fillStyle = C('line'); ctx.fillRect(0, ty, CW, 2);
    L.tabs.forEach((name, i) => {
      const x = CW / 6 + (i * CW) / 3, col = i === 0 ? C('fg') : C('faint');
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3.5;
      if (i === 0) {
        ctx.beginPath(); ctx.arc(x, ty + 45, 17, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, ty + 45, 6, 0, Math.PI * 2); ctx.fill();
      }
      if (i === 1) {
        rr(x - 19, ty + 30, 38, 28, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 8, ty + 58); ctx.lineTo(x - 14, ty + 68); ctx.lineTo(x + 2, ty + 58); ctx.stroke();
        if (waved.size) {
          ctx.fillStyle = C('accent'); ctx.beginPath(); ctx.arc(x + 21, ty + 28, 13, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = C('accentInk'); ctx.font = `800 17px ${BODY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(waved.size), x + 21, ty + 29); ctx.fillStyle = col;
        }
      }
      if (i === 2) {
        ctx.beginPath(); ctx.arc(x, ty + 36, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, ty + 68, 18, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      }
      ctx.font = `700 21px ${BODY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(name, x, ty + 100);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = C('fg', 0.85); rr(cx - 115, CH - 30, 230, 10, 5); ctx.fill();

    // music notes when someone waves back
    if (burst) {
      const e = (t - burst.t0) / 1.6;
      if (e > 1) burst = null;
      else for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2 + i, dist = 40 + e * (120 + (i % 4) * 30);
        const x = burst.x + Math.cos(ang) * dist, y = burst.y + Math.sin(ang) * dist - e * 80;
        ctx.globalAlpha = 1 - e; ctx.fillStyle = i % 2 ? C('accent') : C('blush');
        ctx.font = `800 40px ${BODY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i % 2 ? '♪' : '♫', x, y);
      }
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
    // a notice that drops down from the top, like in the app
    if (toast) {
      const e = t - toast.t0;
      if (e > 3) toast = null;
      else {
        const drop = Math.min(1, e / 0.35, (3 - e) / 0.35);
        const y = 120 - 90 * (1 - drop);
        ctx.globalAlpha = drop; ctx.fillStyle = C('surface2'); rr(44, y, CW - 88, 84, 26); ctx.fill();
        ctx.strokeStyle = C('accent', 0.6); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = C('fg'); ctx.font = `700 26px ${BODY}`; ctx.textBaseline = 'middle'; ctx.fillText(toast.text, 74, y + 43);
        ctx.globalAlpha = 1;
      }
    }
  }

  // ---------- what a tap on the screen does (x, y in screen pixels) ----------
  let now = 0;
  function tap(x, y) {
    if (x >= waveBtn.x && x <= waveBtn.x + waveBtn.w && y >= waveBtn.y && y <= waveBtn.y + waveBtn.h) { wave(); return true; }
    for (let i = 0; i < spots.length; i++) {
      if (Math.hypot(x - spots[i].x, y - spots[i].y) < 55) { sel = i; return true; }
    }
    return false;
  }
  function wave() {
    if (waved.has(sel)) return;
    const who = sel;
    waved.add(who);
    setTimeout(() => {
      toast = { text: T[lang()].back(people[who].n), t0: now };
      const s = spots[who] || { x: cx, y: cy };
      burst = { x: s.x, y: s.y, t0: now };
    }, 900);
  }
  // Keyboard: arrows pick a person, Enter or space waves.
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') sel = (sel + 1) % people.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') sel = (sel + people.length - 1) % people.length;
    else if (e.key === 'Enter' || e.key === ' ') wave();
    else return;
    e.preventDefault();
  });

  // Only animate while the section is on screen.
  let visible = false, booted = false, loop = null;
  const io = new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible && !booted) { booted = true; boot(); }
  }, { rootMargin: '200px' });
  io.observe(box);

  // No WebGL at all: show the screen flat (nothing to retry). WebGL but Three.js didn't arrive:
  // say why (offline or a loading error) and offer Retry. Coming back online retries by itself.
  let tries = 0, loading = false;
  async function boot() {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { buildFlat(); return; }
    if (loading) return;
    loading = true;
    showState('loading');
    try {
      // A new address on each retry, so the browser doesn't reuse the failed attempt.
      // Give up after 15 seconds (a slow or stuck connection) instead of loading forever.
      const THREE = await Promise.race([
        import(tries++ ? `${THREE_URL}?retry=${tries}` : THREE_URL),
        new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 15000)),
      ]);
      hideState();
      build3d(THREE);
    } catch (e) {
      showState(navigator.onLine === false ? 'offline' : 'error');
    } finally {
      loading = false;
    }
  }
  addEventListener('online', () => { if (box.dataset.state === 'offline') boot(); });

  const STATE = {
    ro: { loading: 'Se încarcă telefonul 3D…', offline: 'Ești offline.', offlineSub: 'Telefonul 3D are nevoie de internet. Se încarcă singur când revine conexiunea.',
      error: 'Telefonul 3D nu s-a putut încărca.', errorSub: 'Poate fi o problemă de conexiune. Mai încearcă o dată.', retry: 'Încearcă din nou',
      lost: 'Telefonul 3D s-a oprit.', lostSub: 'Browserul a oprit grafica 3D. O pornim din nou?' },
    en: { loading: 'Loading the 3D phone…', offline: "You're offline.", offlineSub: 'The 3D phone needs an internet connection. It loads by itself when you are back online.',
      error: "The 3D phone couldn't load.", errorSub: 'It may be a connection problem. Give it another try.', retry: 'Try again',
      lost: 'The 3D phone stopped.', lostSub: 'The browser paused the 3D graphics. Start it again?' },
  };
  let panel = null;
  function showState(kind) {
    box.dataset.state = kind;
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'stage-state';
      panel.setAttribute('role', 'status');
      box.appendChild(panel);
    }
    const render = () => {
      const S = STATE[lang()];
      const title = kind === 'loading' ? S.loading : kind === 'offline' ? S.offline : kind === 'lost' ? S.lost : S.error;
      const sub = kind === 'offline' ? S.offlineSub : kind === 'lost' ? S.lostSub : kind === 'error' ? S.errorSub : '';
      panel.innerHTML = '';
      const b = document.createElement('b'); b.textContent = title; panel.appendChild(b);
      if (sub) { const p = document.createElement('p'); p.textContent = sub; panel.appendChild(p); }
      if (kind !== 'loading') {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn primary small'; btn.textContent = S.retry;
        btn.addEventListener('click', () => (kind === 'lost' ? restart() : boot()));
        panel.appendChild(btn);
      }
    };
    render();
    panel.hidden = false;
    panel.dataset.kind = kind;
    panel.render = render; // re-drawn when the language changes
  }
  function hideState() {
    delete box.dataset.state;
    if (panel) panel.hidden = true;
  }
  new MutationObserver(() => { if (panel && !panel.hidden && panel.render) panel.render(); })
    .observe(root, { attributes: true, attributeFilter: ['lang'] });

  let restart = () => {};

  // ---------- fallback: the screen alone, still tappable ----------
  function buildFlat() {
    box.classList.add('flat');
    sc.className = 'flat-screen';
    box.appendChild(sc);
    sc.addEventListener('click', (e) => {
      const r = sc.getBoundingClientRect();
      tap(((e.clientX - r.left) / r.width) * CW, ((e.clientY - r.top) / r.height) * CH);
    });
    const t0 = performance.now();
    loop = () => {
      requestAnimationFrame(loop);
      if (!visible) return;
      now = (performance.now() - t0) / 1000;
      draw(now);
    };
    loop();
    box.classList.add('ready');
  }

  // ---------- the 3D phone ----------
  function build3d(THREE) {
    const canvas = document.createElement('canvas');
    box.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    camera.position.set(0, 0, 38);

    // studio reflections for the titanium
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x1b1b1f);
    const panel = (w, h, c, x, y, z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    panel(30, 8, 0xffffff, 0, 20, 10); panel(8, 30, 0xdddddd, -22, 0, 6); panel(8, 30, 0x999999, 22, 0, -6);
    panel(30, 30, 0x444448, 0, -20, 0); panel(20, 10, 0xffffff, 0, 5, -22);
    scene.environment = pmrem.fromScene(env, 0.04).texture;

    // iPhone 15 Pro Max: 7.76 × 15.99 × 0.825 cm (1 unit = 1 cm)
    const W = 7.76, H = 15.99, D = 0.825;
    const shape = (w, h, r) => {
      const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    };
    const flat = (s) => {
      const g = new THREE.ShapeGeometry(s, 32);
      g.computeBoundingBox();
      const b = g.boundingBox, p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++)
        uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
      return g;
    };
    const phone = new THREE.Group();
    scene.add(phone);
    const titanium = new THREE.MeshStandardMaterial({ color: 0x9a948c, metalness: 0.95, roughness: 0.32 });
    const bev = 0.14;
    const body = new THREE.ExtrudeGeometry(shape(W - bev * 2, H - bev * 2, 1.0), {
      depth: D - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 8, curveSegments: 32,
    });
    body.translate(0, 0, -(D - bev * 2) / 2);
    phone.add(new THREE.Mesh(body, titanium));
    const glass = new THREE.Mesh(flat(shape(W - 0.14, H - 0.14, 1.08)),
      new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.05, metalness: 0.2, clearcoat: 1 }));
    glass.position.z = D / 2 + 0.002; phone.add(glass);
    const back = new THREE.Mesh(flat(shape(W - 0.2, H - 0.2, 1.05)),
      new THREE.MeshPhysicalMaterial({ color: 0x8b8781, roughness: 0.55, metalness: 0.1, clearcoat: 0.3 }));
    back.position.z = -D / 2 - 0.002; back.rotation.y = Math.PI; phone.add(back);

    // camera module, top-left seen from the back
    const cam = new THREE.Group();
    cam.position.set(W / 2 - 0.42 - 1.8, H / 2 - 0.42 - 1.85, -D / 2);
    phone.add(cam);
    const bump = new THREE.ExtrudeGeometry(shape(3.5, 3.6, 0.95), { depth: 0.08, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 24 });
    bump.translate(0, 0, -0.13);
    cam.add(new THREE.Mesh(bump, new THREE.MeshPhysicalMaterial({ color: 0x8f8a84, roughness: 0.15, metalness: 0.3, clearcoat: 1 })));
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x8a857e, metalness: 1, roughness: 0.25 });
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x050608, roughness: 0.02, metalness: 0.5, clearcoat: 1 });
    const innerMat = new THREE.MeshPhysicalMaterial({ color: 0x1a2a55, roughness: 0.05, metalness: 0.8, clearcoat: 1, emissive: 0x0a1030, emissiveIntensity: 0.6 });
    const lens = (x, y) => {
      const g = new THREE.Group(); g.position.set(x, y, -0.13);
      [[0.74, 0.28, ringMat], [0.6, 0.3, lensMat], [0.26, 0.31, innerMat]].forEach(([r, h, m]) => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48), m);
        c.rotation.x = Math.PI / 2; c.position.z = -0.14; g.add(c);
      });
      cam.add(g);
    };
    lens(0.82, 0.88); lens(0.82, -0.88); lens(-0.85, 0);
    const dot = (x, y, r, c, e) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.04, 32),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, emissive: c, emissiveIntensity: e }));
      m.rotation.x = Math.PI / 2; m.position.set(x, y, -0.16); cam.add(m);
    };
    dot(-0.95, 1.22, 0.24, 0xf3e7c8, 0.15); dot(-0.95, -1.22, 0.22, 0x111111, 0); dot(-0.2, 1.4, 0.07, 0x222222, 0);

    // buttons, USB-C port, speaker holes
    const btn = (side, y, len) => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, len, 6, 12), titanium);
      m.scale.set(0.7, 1, 1.4); m.position.set(side * (W / 2 + 0.01), y, 0); phone.add(m);
    };
    btn(-1, 4.75, 0.5); btn(-1, 3.3, 0.9); btn(-1, 2.0, 0.9); btn(1, 3.0, 1.55);
    const black = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const port = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.65, 6, 12), black);
    port.rotation.z = Math.PI / 2; port.position.set(0, -H / 2 - 0.005, 0); port.scale.set(1, 1, 0.7); phone.add(port);
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), black);
      h.rotation.x = Math.PI / 2; h.position.set(s * (0.75 + i * 0.16), -H / 2 - 0.006, 0); phone.add(h);
    }

    // the live screen
    const tex = new THREE.CanvasTexture(sc);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screen = new THREE.Mesh(flat(shape(W - 0.46, H - 0.46, 0.9)), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    screen.position.z = D / 2 + 0.004; phone.add(screen);

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const key = new THREE.DirectionalLight(0xffffff, 1); key.position.set(6, 10, 12); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-10, -4, -8); scene.add(rim);

    function size() {
      const w = box.clientWidth, h = box.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Fit the whole phone (with a little room to turn) on any screen shape.
      const half = Math.tan((camera.fov * Math.PI) / 360);
      camera.position.z = Math.max(17.6 / 2 / half, 9.6 / 2 / (half * camera.aspect));
      camera.updateProjectionMatrix();
    }
    size();
    const resizer = new ResizeObserver(size);
    resizer.observe(box);

    // Drag sideways to turn the phone (all the way round to see the back); vertical drags scroll the page.
    let yaw = -0.35, pitch = 0, vel = 0, dragging = false, lastX = 0, lastY = 0, startX = 0, startY = 0, idle = 0;
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true; lastX = startX = e.clientX; lastY = startY = e.clientY; vel = 0;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      vel = dx * 0.01; yaw += vel;
      pitch = Math.max(-0.5, Math.min(0.5, pitch + dy * 0.004));
      idle = now;
    });
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    canvas.addEventListener('pointerup', (e) => {
      dragging = false;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) return;
      const r = canvas.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObject(screen)[0];
      if (hit && hit.uv && tap(hit.uv.x * CW, (1 - hit.uv.y) * CH)) idle = now;
    });
    canvas.addEventListener('pointercancel', () => { dragging = false; });

    // If the browser takes the 3D graphics away (low memory, GPU reset), say so and offer Retry.
    let alive = true;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      alive = false;
      showState('lost');
    });
    restart = () => {
      alive = false;
      resizer.disconnect();
      renderer.dispose();
      canvas.remove();
      hideState();
      build3d(THREE);
    };

    const t0 = performance.now();
    loop = () => {
      if (!alive) return;
      requestAnimationFrame(loop);
      if (!visible) return;
      now = (performance.now() - t0) / 1000;
      if (!dragging) {
        yaw += vel; vel *= 0.94;
        // after a few quiet seconds, turn slowly back to the front and sway gently
        if (now - idle > 4 && Math.abs(vel) < 0.002) {
          const front = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2;
          const sway = reduce ? -0.3 : -0.3 + Math.sin(now * 0.35) * 0.35;
          yaw += (front + sway - yaw) * 0.02;
          pitch += (0 - pitch) * 0.03;
        }
      }
      phone.rotation.set(pitch, yaw, 0);
      phone.position.y = reduce ? 0 : Math.sin(now * 0.9) * 0.2;
      draw(now);
      tex.needsUpdate = true;
      renderer.render(scene, camera);
    };
    loop();
    box.classList.add('ready');
  }
}
