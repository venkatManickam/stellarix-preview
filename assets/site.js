// Stellarix site behaviour: header, mobile menu, hero slideshow, scroll reveals, process line, gallery viewer, enquiry form.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Header turns solid once the page scrolls.
  var hdr = $('.hdr');
  function onScroll() { hdr.classList.toggle('is-solid', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu.
  var burger = $('.burger'), menu = $('#menu');
  if (burger && menu) {
    menu.hidden = false;
    function setMenu(open) {
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      hdr.classList.toggle('is-solid', open || window.scrollY > 40);
    }
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // Hero slideshow: crossfade every 6 s (static first slide when motion is reduced).
  var slides = $$('.slide'), dots = $$('.hero-dots span');
  if (slides.length > 1 && !reduce) {
    var cur = 0;
    setInterval(function () {
      if (document.hidden) return;
      slides[cur].classList.remove('is-on'); dots[cur] && dots[cur].classList.remove('is-on');
      cur = (cur + 1) % slides.length;
      var img = slides[cur].querySelector('img'); img.loading = 'eager';
      slides[cur].classList.add('is-on'); dots[cur] && dots[cur].classList.add('is-on');
    }, 6000);
  }

  // Headings rise word by word: wrap each word (keeping <em> etc.) before the reveal observer starts.
  if (!reduce) {
    $$('.display.reveal, .statement.reveal').forEach(function (h) {
      var i = 0;
      (function walk(node) {
        [].slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var w = document.createElement('span'), inner = document.createElement('span');
              w.className = 'w'; inner.textContent = part; inner.style.setProperty('--i', i++); w.appendChild(inner); frag.appendChild(w);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      })(h);
      h.classList.add('split');
    });
  }

  // Reveal on scroll.
  var targets = $$('.reveal, .img-reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  // Process line fills as the section scrolls through the viewport.
  var proc = $('[data-progress]');
  if (proc && !reduce) {
    var tick = false;
    function prog() {
      var r = proc.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      proc.style.setProperty('--p', p.toFixed(3)); tick = false;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
    prog();
  } else if (proc) { proc.style.setProperty('--p', 1); }

  // One scroll loop: reading progress, header hide/show, hero depth, gentle parallax on photo frames.
  var bar = $('.progress'), hero = $('.hero'), slidesEl = $('.hero-slides'), heroIn = $('.hero-in'), lastY = window.scrollY, ticking = false;
  var par = reduce ? [] : $$('.feat-main, .feat-side .img-reveal, .exp-img, .proj-row-img, .page-head-img, .case-hero-img').map(function (el) {
    var bg = el.classList.contains('page-head-img') || el.classList.contains('case-hero-img');
    el.setAttribute('data-par', ''); return { el: el, k: bg ? 0.18 : -0.06, bg: bg };
  });
  function frame() {
    var y = window.scrollY, vh = window.innerHeight, max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.setProperty('--sp', max > 0 ? (y / max).toFixed(4) : 0);
    if (!document.body.classList.contains('menu-open')) {
      if (y > 400 && y > lastY + 4) hdr.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 400) hdr.classList.remove('is-hidden');
    }
    lastY = y;
    if (!reduce && hero && y < vh * 1.2) {
      slidesEl.style.setProperty('--hy', (y * 0.25).toFixed(1) + 'px');
      heroIn.style.setProperty('--ty', (y * 0.12).toFixed(1) + 'px');
      heroIn.style.setProperty('--to', Math.max(0, 1 - y / (vh * 0.75)).toFixed(3));
    }
    par.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var off = p.bg ? -r.top : (r.top + r.height / 2 - vh / 2);
      p.el.style.setProperty('--py', (off * p.k).toFixed(1) + 'px');
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener('resize', frame);
  frame();

  // Mouse-only touches: hero drifts with the pointer, buttons lean towards it.
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    if (hero) hero.addEventListener('mousemove', function (e) {
      var x = e.clientX / window.innerWidth - 0.5, yy = e.clientY / window.innerHeight - 0.5;
      slidesEl.style.setProperty('--mx', (x * -18).toFixed(1) + 'px'); slidesEl.style.setProperty('--my', (yy * -12).toFixed(1) + 'px');
    });
    $$('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  // Gallery viewer.
  var lb = $('#lb'), links = $$('.gal-grid a');
  if (lb && links.length && lb.showModal) {
    var i = 0, img = $('img', lb), cap = $('.lb-cap', lb);
    function show(n) {
      i = (n + links.length) % links.length;
      var t = links[i].querySelector('img').alt;
      img.src = links[i].href; img.alt = t; cap.textContent = t + '  (' + (i + 1) + ' / ' + links.length + ')';
    }
    links.forEach(function (a, n) { a.addEventListener('click', function (e) { e.preventDefault(); show(n); lb.showModal(); }); });
    $('.lb-x', lb).onclick = function () { lb.close(); };
    $('.lb-prev', lb).onclick = function () { show(i - 1); };
    $('.lb-next', lb).onclick = function () { show(i + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return; var d = e.changedTouches[0].clientX - x0;
      if (Math.abs(d) > 40) show(i + (d < 0 ? 1 : -1)); x0 = null;
    });
  }

  // Enquiry form: pre-filled WhatsApp message or email (no backend, nothing stored).
  var f = $('#enq');
  if (f) {
    var err = $('#err', f);
    function data() {
      var o = {}; new FormData(f).forEach(function (v, k) { o[k] = String(v).trim(); });
      if (!o.name || !o.phone) { err.textContent = 'Please enter your name and phone number.'; return null; }
      err.textContent = ''; return o;
    }
    function text(o) {
      return 'Enquiry from the Stellarix website\nName: ' + o.name + '\nPhone: ' + o.phone + '\nProject type: ' + o.type +
        '\nCity: ' + (o.city || '-') + '\nArea: ' + (o.area || '-') + '\n\n' + (o.message || '');
    }
    $$('[data-send]', f).forEach(function (b) {
      b.addEventListener('click', function () {
        var o = data(); if (!o) return;
        if (b.dataset.send === 'wa') window.open('https://wa.me/919363324477?text=' + encodeURIComponent(text(o)), '_blank', 'noopener');
        else location.href = 'mailto:stellarixdesignstudio@gmail.com?subject=' + encodeURIComponent('Project enquiry: ' + o.type) + '&body=' + encodeURIComponent(text(o));
      });
    });
    f.addEventListener('submit', function (e) { e.preventDefault(); });
  }
})();
