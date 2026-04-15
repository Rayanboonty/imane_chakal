/* ════════════════════════════════════════════════════════
   IMANE CHAKAL PHOTOGRAPHY — main.js v2
   Apple-grade interactions: cursor · 3D tilt · parallax ·
   smooth scroll · settings · gallery · reviews · upload
════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────
   GALLERY CONFIG
───────────────────────────────────── */
const GALLERY = [
  {
    label: 'Show Jumping',
    index: '01',
    imgPath: 'imgs/🏆+@abs_sporthorses+sur+le+toit+du+championnat+!La+finale+senior+a+tenu+toutes+ses+promesses…+et.jpg',
    desc: 'Capturing the raw power and priceless grace of the equestrian world through the lens of natural light.',
  },
  {
    label: 'Tbourida',
    index: '02',
    imgPath: 'imgs/new_p1.jpg',
    desc: 'The ancient Moroccan equestrian tradition — power, pride, and the thunder of hooves in unison.',
  },
  {
    label: 'Portraits',
    index: '03',
    imgPath: 'imgs/Airbrush-image-extender.jpeg',
    desc: 'Intimate close-ups that reveal the soul behind the strength — natural light only, always.',
  },
];

/* ─────────────────────────────────────
   STATE
───────────────────────────────────── */
let currentVariant = 0;
let reviewIndex = 0;
let smoothScrollOn = true;
let scrollResist = 0.85;
let parallaxDepth = 0.6;    // 0.2 – 1.0 (parallax intensity)
let animSpeed = 1.0;    // transition multiplier
let canvasZoomOn = true;   // canvas zoom enabled
let imagesLoaded = 0;
const totalImages = GALLERY.length;
const preloadedImgs = {};

/* ─────────────────────────────────────
   DOM REFS
───────────────────────────────────── */
const preloader = document.getElementById('preloader');
const preBar = document.getElementById('preBar');
const prePct = document.getElementById('prePct');
const site = document.getElementById('site');
const canvas = document.getElementById('scrollCanvas');
const ctx = canvas.getContext('2d');
const spacer = document.getElementById('scrollSpacer');
const heroTilt = document.getElementById('heroTiltLayer');
const heroLeft = document.getElementById('heroLeft');
const heroRight = document.getElementById('heroRight');
const scrollHint = document.getElementById('scrollHint');

/* ════════════════════════════════════════════════════════
   1. PRELOADER
════════════════════════════════════════════════════════ */
function preloadImages() {
  GALLERY.forEach(v => {
    const img = new Image();
    img.onload = img.onerror = () => {
      imagesLoaded++;
      preloadedImgs[v.imgPath] = img.complete ? img : null;
      const pct = Math.round((imagesLoaded / totalImages) * 100);
      preBar.style.width = pct + '%';
      prePct.textContent = pct + '%';
      if (imagesLoaded >= totalImages) setTimeout(finishPreload, 600);
    };
    img.src = v.imgPath;
  });
}

function finishPreload() {
  preloader.classList.add('done');
  site.classList.remove('hidden');
  requestAnimationFrame(() => {
    site.classList.add('visible');
    initAll();
  });
}

/* ════════════════════════════════════════════════════════
   2. INIT ALL
════════════════════════════════════════════════════════ */
function initAll() {
  initCanvas();
  initSmoothScroll();
  initCursor();
  initNav();
  initHero3DTilt();
  initGalleryNav();
  initParallaxSections();
  initScrollReveal();
  initCounters();
  initReviews();
  initSettings();
  initBookingForm();
  initMagnetic();
  initImageZoom();
}

/* ════════════════════════════════════════════════════════
   3. SCROLL-DRIVEN CANVAS
════════════════════════════════════════════════════════ */
let heroImg = null;
let targetProgress = 0;
let lerpProgress = 0;
const LERP = 0.07;

function initCanvas() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  loadCanvasImage(GALLERY[currentVariant].imgPath, drawNextFrame);
  window.addEventListener('scroll', onScroll, { passive: true });
  requestAnimationFrame(canvasLoop);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (heroImg) drawFrame(lerpProgress);
}

function loadCanvasImage(src, cb) {
  if (preloadedImgs[src]) {
    heroImg = preloadedImgs[src];
    if (cb) cb();
    return;
  }
  const img = new Image();
  img.onload = () => { heroImg = img; if (cb) cb(); };
  img.onerror = () => { heroImg = null; drawFallback(); };
  img.src = src;
}

function drawNextFrame() { drawFrame(lerpProgress); }

function drawFrame(progress) {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (!heroImg) { drawFallback(); return; }

  /* Zoom in as you scroll */
  const scale = canvasZoomOn ? (1.0 + progress * 0.42) : 1.05;

  /* Parallax vertical drift */
  const driftY = progress * H * 0.14;

  /* Fit image to cover canvas, then apply zoom */
  const imgAR = heroImg.naturalWidth / heroImg.naturalHeight;
  const cnvAR = W / H;
  let dw, dh;
  if (imgAR > cnvAR) {
    dh = H * scale;
    dw = dh * imgAR;
  } else {
    dw = W * scale;
    dh = dw / imgAR;
  }
  const x = (W - dw) / 2;
  const y = (H - dh) / 2 - driftY;

  /* Brightness grows as we approach */
  const brightness = 0.50 + progress * 0.32;
  ctx.filter = `brightness(${brightness}) contrast(1.06)`;
  ctx.drawImage(heroImg, x, y, dw, dh);
  ctx.filter = 'none';

  /* Subtle white vignette flash near scroll end */
  if (progress > 0.88) {
    const alpha = (progress - 0.88) / 0.12;
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.22})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawFallback() {
  const W = canvas.width, H = canvas.height;
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, '#1a1a1a');
  g.addColorStop(1, '#080808');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function canvasLoop() {
  const diff = targetProgress - lerpProgress;
  if (Math.abs(diff) > 0.0003) {
    lerpProgress += diff * LERP;
    drawFrame(lerpProgress);
  }
  requestAnimationFrame(canvasLoop);
}

function onScroll() {
  const maxScroll = spacer.offsetHeight;
  targetProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
  updateHeroFade(targetProgress);
}

/* Fade all hero overlay elements as user scrolls through the spacer */
function updateHeroFade(progress) {
  // Start fading at 5% scroll, fully gone by 28%
  const fadeOut = Math.max(0, Math.min(1, 1 - (progress - 0.05) / 0.23));

  if (heroLeft) heroLeft.style.opacity = fadeOut;
  if (heroRight) heroRight.style.opacity = fadeOut;

  const fc1 = document.getElementById('floatCard1');
  const fc2 = document.getElementById('floatCard2');
  if (fc1) fc1.style.opacity = fadeOut;
  if (fc2) fc2.style.opacity = fadeOut;

  if (scrollHint) scrollHint.style.opacity = progress > 0.04 ? '0' : '1';
}

/* ════════════════════════════════════════════════════════
   4. SMOOTH INERTIAL SCROLL
════════════════════════════════════════════════════════ */
let scrollTarget = 0;
let scrollCurrent = 0;
let scrollTicking = false;

function initSmoothScroll() {
  scrollTarget = window.scrollY;
  scrollCurrent = window.scrollY;

  // On desktop, we intercept wheel for smooth inertia scroll.
  // On mobile touch, we allow native momentum scrolling to prevent jitter and scroll lock.
  window.addEventListener('wheel', onWheel, { passive: false });
}

function onWheel(e) {
  if (!smoothScrollOn) return;
  e.preventDefault();
  nudgeScroll(e.deltaY * scrollResist);
}

function nudgeScroll(delta) {
  const maxS = document.body.scrollHeight - window.innerHeight;
  scrollTarget = Math.max(0, Math.min(maxS, scrollTarget + delta));
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(smoothStep);
  }
}

function smoothStep() {
  const diff = scrollTarget - scrollCurrent;
  if (Math.abs(diff) < 0.5) {
    scrollCurrent = scrollTarget;
    window.scrollTo(0, scrollCurrent);
    scrollTicking = false;
    return;
  }
  scrollCurrent += diff * 0.10;
  window.scrollTo(0, scrollCurrent);
  const prog = Math.max(0, Math.min(1, scrollCurrent / spacer.offsetHeight));
  targetProgress = prog;
  updateHeroFade(prog);
  requestAnimationFrame(smoothStep);
}

/* ════════════════════════════════════════════════════════
   5. CUSTOM CURSOR
════════════════════════════════════════════════════════ */
function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  (function ringLoop() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(ringLoop);
  })();

  /* Hover state on interactive elements */
  const hoverEls = document.querySelectorAll(
    'a, button, .gnav-item, .spec-card, .review-card, .stat-card, .strip-img, .sp-color, .rc-dot, label'
  );
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ════════════════════════════════════════════════════════
   6. TOP NAV SCROLL STATE
════════════════════════════════════════════════════════ */
function initNav() {
  const nav = document.getElementById('topNav');
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 80);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ════════════════════════════════════════════════════════
   7. HERO 3D TILT (mouse move)
════════════════════════════════════════════════════════ */
function initHero3DTilt() {
  let lTiltX = 0, lTiltY = 0;
  let tTiltX = 0, tTiltY = 0;

  document.getElementById('hero').addEventListener('mousemove', e => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    tTiltX = (e.clientY - cy) / cy * -15 * parallaxDepth;
    tTiltY = (e.clientX - cx) / cx * 15 * parallaxDepth;
  });

  document.getElementById('hero').addEventListener('mouseleave', () => {
    tTiltX = 0;
    tTiltY = 0;
  });

  /* Parallax depth per element */
  const depthEls = document.querySelectorAll('[data-depth]');

  (function tiltLoop() {
    lTiltX += (tTiltX - lTiltX) * 0.08;
    lTiltY += (tTiltY - lTiltY) * 0.08;

    heroTilt.style.transform =
      `perspective(900px) rotateX(${lTiltX}deg) rotateY(${lTiltY}deg)`;

    depthEls.forEach(el => {
      const d = parseFloat(el.dataset.depth || 0.5);
      const tx = lTiltY * d * 6 * parallaxDepth;
      const ty = lTiltX * d * 6 * parallaxDepth;
      el.style.transform = `translate3d(${tx}px, ${ty}px, ${d * 40}px)`;
    });

    /* Float cards extra movement */
    const fc1 = document.getElementById('floatCard1');
    const fc2 = document.getElementById('floatCard2');
    if (fc1) fc1.style.transform = `translate3d(${lTiltY * 8 * parallaxDepth}px, ${lTiltX * -8 * parallaxDepth}px, 60px)`;
    if (fc2) fc2.style.transform = `translate3d(${lTiltY * -12 * parallaxDepth}px, ${lTiltX * 12 * parallaxDepth}px, 80px)`;

    requestAnimationFrame(tiltLoop);
  })();
}

/* ════════════════════════════════════════════════════════
   8. GALLERY VARIANT NAV
════════════════════════════════════════════════════════ */
function initGalleryNav() {
  document.getElementById('gnavNext').addEventListener('click', () => shiftVariant(1));
  document.getElementById('gnavPrev').addEventListener('click', () => shiftVariant(-1));
  document.querySelectorAll('.gnav-item').forEach((el, i) => {
    el.addEventListener('click', () => applyVariant(i));
  });
}

function shiftVariant(dir) {
  applyVariant((currentVariant + dir + GALLERY.length) % GALLERY.length);
}

function applyVariant(idx) {
  if (idx === currentVariant) return;
  currentVariant = idx;
  const v = GALLERY[idx];

  /* Fade out hero content */
  heroLeft.style.transition = 'opacity 0.38s ease, transform 0.38s ease';
  heroLeft.style.opacity = '0';
  heroLeft.style.transform = 'translateY(-52%) translateX(-16px)';

  const idxEl = document.getElementById('galleryIndex');
  idxEl.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
  idxEl.style.opacity = '0';
  idxEl.style.transform = 'translateY(10px)';

  /* Load new image with a cross-fade */
  loadCanvasImage(v.imgPath, () => {
    /* nothing — canvasLoop will pick it up */
  });

  setTimeout(() => {
    document.getElementById('heroDesc').textContent = v.desc;
    idxEl.textContent = v.index;

    document.querySelectorAll('.gnav-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });

    heroLeft.style.opacity = '1';
    heroLeft.style.transform = 'translateY(-52%) translateX(0)';
    idxEl.style.opacity = '0.07';
    idxEl.style.transform = 'translateY(0)';
  }, 400);
}

/* ════════════════════════════════════════════════════════
   9. PARALLAX SCROLL SECTIONS
════════════════════════════════════════════════════════ */
function initParallaxSections() {
  const imgs = document.querySelectorAll('.parallax-img');

  function updateParallax() {
    const vy = window.scrollY;
    imgs.forEach(img => {
      const rect = img.closest('.parallax-img-wrap, #booking')?.getBoundingClientRect();
      if (!rect) return;
      const speed = parseFloat(img.dataset.speed || 0.3);
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      img.style.transform = `translateY(${offset}px) scale(1.06)`;
    });
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();
}

/* ════════════════════════════════════════════════════════
   10. SCROLL REVEAL
════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const els = document.querySelectorAll(
    '.reveal-up, .reveal-scale, .reveal-stagger'
  );

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  /* Stagger spec cards */
  document.querySelectorAll('.spec-card').forEach((c, i) => {
    c.style.transitionDelay = `${i * 0.1}s`;
  });

  els.forEach(el => io.observe(el));
}

/* ════════════════════════════════════════════════════════
   11. NUMBER COUNTERS
════════════════════════════════════════════════════════ */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      animateCounter(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const dur = 1800;
  const start = performance.now();

  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = Math.round(ease * target);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ════════════════════════════════════════════════════════
   12. REVIEWS CAROUSEL
════════════════════════════════════════════════════════ */
function initReviews() {
  const track = document.getElementById('reviewsTrack');
  const dots = document.querySelectorAll('.rc-dot');
  let cardW = 400 + 24; // card width + gap

  function recalcCardW() {
    const c = track.querySelector('.review-card');
    if (c) cardW = c.offsetWidth + 24;
  }

  function goTo(idx) {
    reviewIndex = ((idx % 4) + 4) % 4;
    recalcCardW();
    track.style.transform = `translateX(-${reviewIndex * cardW}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === reviewIndex));
  }

  document.getElementById('rcNext').addEventListener('click', () => goTo(reviewIndex + 1));
  document.getElementById('rcPrev').addEventListener('click', () => goTo(reviewIndex - 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  /* Auto-advance */
  setInterval(() => goTo(reviewIndex + 1), 5500);

  /* Drag/swipe */
  let dragStart = null;
  track.addEventListener('pointerdown', e => { dragStart = e.clientX; });
  track.addEventListener('pointerup', e => {
    if (dragStart === null) return;
    const diff = dragStart - e.clientX;
    if (Math.abs(diff) > 40) goTo(reviewIndex + (diff > 0 ? 1 : -1));
    dragStart = null;
  });

  window.addEventListener('resize', recalcCardW);
}

/* ════════════════════════════════════════════════════════
   13. SETTINGS PANEL
════════════════════════════════════════════════════════ */
function initSettings() {
  const panel = document.getElementById('settingsPanel');
  const backdrop = document.getElementById('spBackdrop');
  const settingsBtn = document.getElementById('settingsBtn');
  const spClose = document.getElementById('spClose');
  const darkCheck = document.getElementById('darkCheck');
  const grainCheck = document.getElementById('grainCheck');
  const smoothCheck = document.getElementById('smoothCheck');
  const speedSlider = document.getElementById('scrollSpeedSlider');
  const grainEl = document.getElementById('grainEl');

  /* ── Open / close ── */
  const openPanel = () => panel.classList.add('open');
  const closePanel = () => panel.classList.remove('open');
  settingsBtn.addEventListener('click', openPanel);
  spClose.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);

  /* ── Dark mode ── */
  darkCheck.addEventListener('change', () => {
    document.documentElement.dataset.theme = darkCheck.checked ? 'dark' : 'light';
  });

  /* ── Grain ── */
  grainCheck.addEventListener('change', () => {
    if (grainEl) grainEl.style.display = grainCheck.checked ? '' : 'none';
  });

  /* ── Smooth scroll ── */
  smoothCheck.addEventListener('change', () => {
    smoothScrollOn = smoothCheck.checked;
    if (!smoothScrollOn) { scrollTarget = window.scrollY; scrollCurrent = window.scrollY; }
  });

  /* ── Scroll speed ── */
  speedSlider.addEventListener('input', () => {
    scrollResist = 0.55 + parseInt(speedSlider.value, 10) * 0.045;
  });

  /* ── Parallax intensity ── */
  const parallaxSlider = document.getElementById('parallaxSlider');
  if (parallaxSlider) parallaxSlider.addEventListener('input', () => {
    parallaxDepth = 0.2 + parseInt(parallaxSlider.value, 10) * 0.08;
  });

  /* ── Animation speed ── */
  const animSlider = document.getElementById('animSpeedSlider');
  if (animSlider) animSlider.addEventListener('input', () => {
    animSpeed = 0.4 + parseInt(animSlider.value, 10) * 0.12;
    document.documentElement.style.setProperty('--ease-out-dur', `${0.35 / animSpeed}s`);
  });

  /* ── Custom cursor toggle ── */
  const cursorCheck = document.getElementById('cursorCheck');
  if (cursorCheck) cursorCheck.addEventListener('change', () => {
    document.getElementById('cursor').style.display = cursorCheck.checked ? '' : 'none';
    document.body.style.cursor = cursorCheck.checked ? 'none' : '';
  });

  /* ── Blur effects toggle ── */
  const blurCheck = document.getElementById('blurCheck');
  if (blurCheck) blurCheck.addEventListener('change', () => {
    document.documentElement.style.setProperty('--blur-sm', blurCheck.checked ? 'blur(10px)' : 'none');
    document.documentElement.style.setProperty('--blur-md', blurCheck.checked ? 'blur(20px)' : 'none');
    document.documentElement.style.setProperty('--blur-lg', blurCheck.checked ? 'blur(40px)' : 'none');
    document.documentElement.style.setProperty('--blur-xl', blurCheck.checked ? 'blur(80px)' : 'none');
  });

  /* ── Float cards toggle ── */
  const floatCheck = document.getElementById('floatCheck');
  if (floatCheck) floatCheck.addEventListener('change', () => {
    const fc1 = document.getElementById('floatCard1');
    const fc2 = document.getElementById('floatCard2');
    const vis = floatCheck.checked ? '' : 'none';
    if (fc1) fc1.style.display = vis;
    if (fc2) fc2.style.display = vis;
  });

  /* ── Canvas zoom toggle ── */
  const zoomCheck = document.getElementById('zoomCheck');
  if (zoomCheck) zoomCheck.addEventListener('change', () => {
    canvasZoomOn = zoomCheck.checked;
  });

  /* ── Accent color swatches ── */
  document.querySelectorAll('.sp-color').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sp-color').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.color;
      document.documentElement.style.setProperty('--accent', color);
      /* Use data-rgb if available (avoids DOM color parse hack) */
      if (btn.dataset.rgb) {
        document.documentElement.style.setProperty('--accent-rgb', btn.dataset.rgb);
      } else {
        const tmp = document.createElement('div');
        tmp.style.color = color;
        document.body.appendChild(tmp);
        const rgb = window.getComputedStyle(tmp).color.match(/\d+/g).slice(0, 3).join(',');
        document.body.removeChild(tmp);
        document.documentElement.style.setProperty('--accent-rgb', rgb);
      }
    });
  });

  /* Photo upload */
  initUpload();
}

/* ════════════════════════════════════════════════════════
   14. PHOTO UPLOAD
════════════════════════════════════════════════════════ */
function initUpload() {
  const zone = document.getElementById('spUploadZone');
  const input = document.getElementById('spFileInput');
  const grid = document.getElementById('spUploadGrid');

  function handleFiles(files) {
    [...files].forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.classList.add('sp-thumb');
        img.alt = file.name;

        /* Zoom on click */
        img.addEventListener('click', () => openLightbox(e.target.result));
        grid.appendChild(img);

        /* Entry animation */
        img.style.opacity = '0';
        img.style.transform = 'scale(0.8)';
        requestAnimationFrame(() => {
          img.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)';
          img.style.opacity = '1';
          img.style.transform = 'scale(1)';
        });
      };
      reader.readAsDataURL(file);
    });
  }

  input.addEventListener('change', () => handleFiles(input.files));

  /* Drag-and-drop */
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
}

/* Simple lightbox for uploads */
function openLightbox(src) {
  const lb = document.createElement('div');
  lb.style.cssText = `
    position:fixed;inset:0;z-index:9998;
    background:rgba(0,0,0,0.92);
    backdrop-filter:blur(20px);
    display:flex;align-items:center;justify-content:center;
    cursor:zoom-out;animation:lbFade 0.3s ease;
  `;
  const style = document.createElement('style');
  style.textContent = '@keyframes lbFade{from{opacity:0}to{opacity:1}}';
  document.head.appendChild(style);

  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = `
    max-width:90vw;max-height:90vh;
    object-fit:contain;border-radius:20px;
    box-shadow:0 32px 80px rgba(0,0,0,0.8);
    animation:lbPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
  `;
  style.textContent += '@keyframes lbPop{from{transform:scale(0.85)}to{transform:scale(1)}}';

  lb.appendChild(img);
  lb.addEventListener('click', () => { lb.style.opacity = '0'; lb.style.transition = 'opacity 0.25s'; setTimeout(() => { lb.remove(); style.remove(); }, 250); });
  document.body.appendChild(lb);
}

/* ════════════════════════════════════════════════════════
   15. MAGNETIC BUTTONS
════════════════════════════════════════════════════════ */
function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el => {
    const strength = parseFloat(el.dataset.magnetStrength || 0.35);

    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px) scale(1.04)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)';
      el.style.transform = '';
      setTimeout(() => el.style.transition = '', 500);
    });
  });
}

/* ════════════════════════════════════════════════════════
   16. IMAGE ZOOM ON HOVER (strip images)
════════════════════════════════════════════════════════ */
function initImageZoom() {
  /* The strip images already handle this via CSS + transform
     Here we add a lens-zoom overlay effect */
  document.querySelectorAll('.strip-img').forEach(img => {
    img.addEventListener('mousemove', e => {
      const rect = img.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${px}% ${py}%`;
    });
    img.addEventListener('mouseleave', () => {
      img.style.transformOrigin = 'center center';
    });
  });
}

/* ════════════════════════════════════════════════════════
   17. BOOKING FORM
════════════════════════════════════════════════════════ */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  const success = document.getElementById('formSuccess');
  const btn = document.getElementById('submitBtn');

  form.addEventListener('submit', e => {
    e.preventDefault();
    btn.textContent = 'SENDING…';
    btn.style.opacity = '0.7';

    setTimeout(() => {
      form.style.transition = 'opacity 0.35s ease';
      form.style.opacity = '0';
      setTimeout(() => {
        form.classList.add('hidden');
        success.classList.remove('hidden');
      }, 350);
    }, 1500);
  });

  /* Input focus ring animation */
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('focus', () => {
      el.parentElement.style.transform = 'scale(1.01)';
    });
    el.addEventListener('blur', () => {
      el.parentElement.style.transform = '';
    });
  });
}

/* ════════════════════════════════════════════════════════
   18. KEYBOARD SHORTCUTS
════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('settingsPanel').classList.remove('open');
  }
  /* Arrow keys for gallery */
  if (e.key === 'ArrowRight') shiftVariant(1);
  if (e.key === 'ArrowLeft') shiftVariant(-1);
});

/* ════════════════════════════════════════════════════════
   19. SMOOTH ANCHOR LINKS
════════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();

    const targetY = target.getBoundingClientRect().top + window.scrollY;
    scrollTarget = targetY;
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(smoothStep);
    }
  });
});
/* ════════════════════════════════════════════════════════
   20. 3D CAMERA ANIMATIONS (SPIN & SNAP-SMALL)
════════════════════════════════════════════════════════ */
const cameraModel = document.querySelector("#scroll-camera");

if (cameraModel) {
  const startSize = 280;     // Starts very small/far away
  const zoomIntensity = 200; // How much it grows in the middle
  let autoSpin = 0;          // Base rotation for the spin effect

  // 1. Initial Reveal
  const cameraObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  cameraObserver.observe(cameraModel);

  // 2. The Animation Loop
  function updateCamera() {
    const rect = cameraModel.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.top < windowHeight && rect.bottom > 0) {
      // Progress from 0 (top of screen) to 1 (bottom of screen)
      let progress = (windowHeight - rect.top) / (windowHeight + rect.height);
      progress = Math.max(0, Math.min(1, progress));

      // --- THE SPIN LOGIC ---
      // We add a base 'autoSpin' that increases over time, 
      // but we combine it with scroll progress so it feels reactive.
      autoSpin += 0.5;
      const rotation = autoSpin + (progress * 360);

      // --- THE ZOOM LOGIC ---
      // Uses a steep curve so it stays small, pops big in the center, 
      // and gets small again very quickly as you scroll away.
      const centerFocus = 1 - Math.pow((progress * 2) - 1, 6);

      const distance = startSize - (centerFocus * zoomIntensity);

      cameraModel.cameraOrbit = `${rotation}deg 75deg ${distance}%`;
    }
    requestAnimationFrame(updateCamera);
  }

  // Start the animation loop
  requestAnimationFrame(updateCamera);
}
/* ════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════ */
preloadImages();
