// Aura website: Dating/Vibe colours, RO/EN, and sections that slide in as you scroll.
(function () {
  var root = document.documentElement;

  var TEXT = {
    ro: {
      title: 'Aura · Vezi muzica din cameră',
      description: 'Aura îți arată oamenii din aceeași cameră după muzica pe care o ascultă. Salută, vorbiți, deveniți prieteni. Dating și Vibe. Fără reclame, fără urmărire.',
      mail: 'Aura – acces timpuriu',
    },
    en: {
      title: 'Aura · See the music in the room',
      description: "See who's in the same room as you by the music they listen to. Wave, chat, become friends. Dating and Vibe. No ads, no tracking.",
      mail: 'Aura early access',
    },
  };
  var THEME = { dating: '#1a0b13', vibing: '#0a1226' };

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  // The sliding pill behind the chosen option of a switch.
  function placeKnob(seg) {
    var on = seg.querySelector('button[aria-pressed="true"]');
    var knob = seg.querySelector('.knob');
    if (!on || !knob) return;
    knob.style.width = on.offsetWidth + 'px';
    knob.style.transform = 'translateX(' + (on.offsetLeft - 3) + 'px)';
  }
  function press(seg, value) {
    seg.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.value === value));
    });
    placeKnob(seg);
  }

  var modeSeg = document.querySelector('[data-seg="mode"]');
  var langSeg = document.querySelector('[data-seg="lang"]');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function setMode(mode) {
    root.dataset.mode = mode;
    store('aura-site-mode', mode);
    if (themeMeta) themeMeta.setAttribute('content', THEME[mode]);
    if (modeSeg) press(modeSeg, mode);
  }

  function setLang(lang) {
    root.lang = lang;
    store('aura-lang', lang);
    store('aura-legal-lang', lang); // the legal page follows
    document.title = TEXT[lang].title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', TEXT[lang].description);
    var mail = document.getElementById('join-mail');
    if (mail) mail.href = 'mailto:anghel.c.c@protonmail.com?subject=' + encodeURIComponent(TEXT[lang].mail);
    if (langSeg) press(langSeg, lang);
    if (modeSeg) placeKnob(modeSeg); // button widths can change with the language
  }

  if (modeSeg) modeSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) setMode(b.dataset.value);
  });
  if (langSeg) langSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) setLang(b.dataset.value);
  });
  document.querySelectorAll('[data-set-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      setMode(b.dataset.setMode);
      document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
    });
  });

  setMode(root.dataset.mode === 'vibing' ? 'vibing' : 'dating');
  setLang(root.lang === 'en' ? 'en' : 'ro');
  // Fonts change the button widths once they arrive.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    if (modeSeg) placeKnob(modeSeg);
    if (langSeg) placeKnob(langSeg);
  });
  window.addEventListener('resize', function () {
    if (modeSeg) placeKnob(modeSeg);
    if (langSeg) placeKnob(langSeg);
  });

  // Sections slide in once, as they come into view.
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function (el) { io.observe(el); });
})();
