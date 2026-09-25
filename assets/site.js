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
