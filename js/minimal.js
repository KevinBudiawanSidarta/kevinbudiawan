/* ==========================================================================
   Minimal theme — perilaku bersama untuk semua halaman.
   Tiap blok dijaga (guard) sehingga aman dipakai di halaman yang tidak
   memiliki elemen terkait.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* Scroll memakai perilaku native browser (scroll-behavior: smooth di CSS
     sudah menangani anchor link seperti #gallery). Dulu di sini ada Lenis
     (smooth/inertia scroll), tapi dilepas karena terasa delay saat scroll
     cepat — native scroll langsung 1:1 mengikuti wheel/trackpad. */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Nav hover: teks menggulung ke atas ----
     Tiap link dibungkus mask + track berisi dua salinan teks, sehingga
     saat hover salinan kedua naik menggantikan yang pertama.
     Dibangun di sini agar markup HTML tetap bersih. */
  document.querySelectorAll('.m-nav a').forEach((link) => {
    const label = link.textContent.trim();
    if (!label || link.querySelector('.m-nav__mask')) return;

    const mask = document.createElement('span');
    mask.className = 'm-nav__mask';

    const track = document.createElement('span');
    track.className = 'm-nav__track';

    const first = document.createElement('span');
    first.textContent = label;

    const second = document.createElement('span');
    second.textContent = label;
    second.setAttribute('aria-hidden', 'true');

    track.append(first, second);
    mask.append(track);
    link.replaceChildren(mask);
  });

  /* ---- Transisi antar halaman ----
     Klik link internal ke halaman .html: body diberi kelas .is-leaving
     (fade out via CSS), lalu setelah animasinya selesai baru berpindah.
     Halaman tujuan otomatis fade in lewat animasi CSS di <body>. */
  const LEAVE_MS = 350;

  const isPageLink = (a) => {
    if (a.target && a.target !== '_self') return false;      // buka tab baru
    if (a.hasAttribute('download')) return false;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return false;         // anchor di halaman ini
    if (/^(mailto|tel|javascript):/i.test(href)) return false;

    const url = new URL(a.href, location.href);
    if (url.protocol !== location.protocol || url.host !== location.host) return false;
    if (!/\.html?$/i.test(url.pathname)) return false;       // hanya halaman situs
    if (url.pathname === location.pathname && url.hash) return false;
    return true;
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // biarkan buka tab baru
    const a = e.target.closest('a[href]');
    if (!a || !isPageLink(a)) return;

    e.preventDefault();
    const go = () => { location.href = a.href; };
    if (reduceMotion) { go(); return; }

    document.body.classList.add('is-leaving');
    setTimeout(go, LEAVE_MS);
  });

  /* Kembali lewat tombol Back (bfcache): pastikan body tidak tertinggal pudar */
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.body.classList.remove('is-leaving');
  });

  /* ---- Mobile nav ---- */
  const toggle = document.getElementById('navtoggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => nav.classList.remove('is-open'));
    });
  }

  /* ---- Hairline on scroll ---- */
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- Judul hero: efek mengetik dari kiri ke kanan ----
     Tiap huruf dijadikan span yang awalnya disembunyikan (bukan dihapus),
     jadi lebar barisnya sudah final sejak awal. Karena judulnya rata
     tengah, teks terisi dari kiri ke kanan, bukan melebar dari tengah. */
  const heroTitle = document.querySelector('.m-hero h1');
  if (heroTitle) {
    const sub = heroTitle.querySelector('em');
    const firstNode = heroTitle.firstChild;
    const name = firstNode && firstNode.nodeType === 3 ? firstNode.textContent.trim() : '';

    if (name) {
      /* teks utuh tetap terbaca pembaca layar lewat aria-label */
      heroTitle.setAttribute('aria-label', sub ? name + '. ' + sub.textContent.trim() : name);

      const line = document.createElement('span');
      line.className = 'm-type';
      line.setAttribute('aria-hidden', 'true');

      const steps = [];
      name.split('').forEach((ch) => {
        if (ch === ' ') {
          /* spasi dibiarkan teks biasa supaya baris tetap bisa berpindah
             baris di layar sempit */
          const space = document.createTextNode(' ');
          line.appendChild(space);
          steps.push({ node: space, isChar: false });
          return;
        }
        const span = document.createElement('span');
        span.className = 'm-type__ch';
        span.textContent = ch;
        line.appendChild(span);
        steps.push({ node: span, isChar: true });
      });

      const caret = document.createElement('span');
      caret.className = 'm-type__caret';
      line.insertBefore(caret, line.firstChild);

      heroTitle.replaceChildren(line);
      if (sub) heroTitle.appendChild(sub);

      if (reduceMotion) {
        caret.remove();
        steps.forEach((s) => { if (s.isChar) s.node.classList.add('is-on'); });
        if (sub) sub.classList.add('is-visible');
      } else {
        heroTitle.classList.add('is-typing');
        let i = 0;
        const type = () => {
          if (i >= steps.length) {
            if (sub) sub.classList.add('is-visible');
            return;
          }
          const step = steps[i];
          if (step.isChar) step.node.classList.add('is-on');
          step.node.after(caret);
          i += 1;
          /* jeda sedikit acak supaya terasa seperti diketik tangan */
          setTimeout(type, 55 + Math.random() * 45);
        };
        setTimeout(type, 350);
      }
    }
  }

  /* ---- Stagger otomatis ----
     Anggota sebuah grup (galeri, chip, tool, dll.) diberi data-reveal
     dengan jeda bertingkat supaya muncul berurutan, bukan serentak.
     Dilakukan di sini agar markup HTML tetap bersih. */
  const staggerGroups = [
    { items: '.m-gallery button', step: 55, unwrap: '.m-gallery' },
    { items: '.m-projects .m-project', step: 90 },
    { items: '.m-stack span', step: 45 },
    { items: '.m-chips span', step: 45 },
    { items: '.m-tools .m-tool', step: 70 },
    { items: '.m-rows .m-row', step: 80 },
    { items: '.m-meta div', step: 55 },
    { items: '.m-slots .m-slot', step: 80 },
  ];

  staggerGroups.forEach(({ items, step, unwrap }) => {
    /* lepaskan reveal dari kontainer agar tidak dobel animasi */
    if (unwrap) {
      document.querySelectorAll(unwrap).forEach((box) => {
        box.removeAttribute('data-reveal');
        box.removeAttribute('data-delay');
      });
    }
    document.querySelectorAll(items).forEach((el, i) => {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', '');
      el.setAttribute('data-delay', String(i * step));
    });
  });

  /* ---- Reveal on scroll ---- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.getAttribute('data-delay')) || 0;
        setTimeout(() => el.classList.add('is-visible'), delay);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---- Footer year ---- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Gallery lightbox (experience.html) ---- */
  const items = Array.prototype.slice.call(document.querySelectorAll('.m-gallery button'));
  const lightbox = document.getElementById('lightbox');
  if (items.length && lightbox) {
    const lbImg = document.getElementById('lightboxImg');
    const lbCap = document.getElementById('lightboxCap');
    let current = 0;

    const openAt = (i) => {
      current = (i + items.length) % items.length;
      const img = items[current].querySelector('img');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      lbCap.textContent = items[current].dataset.caption || img.alt || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    items.forEach((item, i) => item.addEventListener('click', () => openAt(i)));
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', () => openAt(current - 1));
    document.getElementById('lightboxNext').addEventListener('click', () => openAt(current + 1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') openAt(current + 1);
      if (e.key === 'ArrowLeft') openAt(current - 1);
    });
  }

  /* ---- Project detail panel (projects.html) ---- */
  const panel = document.getElementById('pdetail');
  const detailBtns = document.querySelectorAll('[data-project]');
  if (panel && detailBtns.length && window.projectDetails) {
    const details = window.projectDetails;

    const fillList = (el, arr) => {
      el.innerHTML = '';
      arr.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        el.appendChild(li);
      });
    };

    const openPanel = (id) => {
      const d = details[id];
      if (!d) return;

      document.getElementById('pdBadge').textContent = d.badge;
      document.getElementById('pdTitle').textContent = d.title;
      document.getElementById('pdDesc').textContent = d.desc;
      document.getElementById('pdRole').textContent = d.role;
      document.getElementById('pdStatus').textContent = d.status;
      document.getElementById('pdPeriod').textContent = d.period;
      document.getElementById('pdChallenge').textContent = d.challenge;
      document.getElementById('pdLimitations').textContent = d.limitations;

      fillList(document.getElementById('pdMethod'), d.method);
      fillList(document.getElementById('pdContribution'), d.contribution);
      fillList(document.getElementById('pdOutcome'), d.outcome);

      const statsEl = document.getElementById('pdStats');
      statsEl.innerHTML = '';
      d.stats.forEach(s => {
        const box = document.createElement('div');
        box.className = 'm-pstat';
        box.innerHTML = '<span class="k">' + s.k + '</span><b>' + s.v + '</b><span class="sub">' + s.sub + '</span>';
        statsEl.appendChild(box);
      });

      const repo = document.getElementById('pdRepoLink');
      if (d.repo && d.repo !== '#') {
        repo.href = d.repo;
        repo.style.display = '';
      } else {
        repo.style.display = 'none';
      }

      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closePanel = () => {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    detailBtns.forEach(btn => {
      btn.addEventListener('click', () => openPanel(btn.dataset.project));
    });
    document.getElementById('pdetailClose').addEventListener('click', closePanel);
    document.getElementById('pdBack').addEventListener('click', (e) => { e.preventDefault(); closePanel(); });
    panel.addEventListener('click', (e) => { if (e.target === panel) closePanel(); });
    document.addEventListener('keydown', (e) => {
      if (panel.classList.contains('is-open') && e.key === 'Escape') closePanel();
    });
  }

});
