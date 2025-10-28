/* =========================
   script.js — Interactions & effects (extendido)
   ========================= */

/* Helper: select multiple */
const $ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));

/* 1) Intersection Observer para animaciones de entrada (suave) */
const panels = $('[data-animate]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });
panels.forEach(p => observer.observe(p));

/* 2) Menú móvil */
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('nav');
menuToggle.addEventListener('click', () => {
  nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(nav.classList.contains('open')));
});

/* 3) Tema persistente */
const themeToggle = document.getElementById('theme-toggle');
const rootBody = document.body;
const THEME_KEY = 'hf_theme';
(function applySavedTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light') rootBody.classList.add('light-theme');
  else rootBody.classList.remove('light-theme');
})();
themeToggle.addEventListener('click', () => {
  rootBody.classList.toggle('light-theme');
  const isLight = rootBody.classList.contains('light-theme');
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
  themeToggle.setAttribute('aria-pressed', String(isLight));
});

/* 4) Buscador que filtra secciones (y TOC) */
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  panels.forEach(panel => {
    const text = panel.innerText.toLowerCase();
    panel.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
  // actualizar TOC: ocultar enlaces cuyo destino no esté visible
  const tocLinks = $('#toc-list a');
  tocLinks.forEach(a => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    a.style.display = (target.style.display === 'none') ? 'none' : '';
  });
});

/* 5) TOC highlight (sección visible) */
const tocLinks = $('#toc-list a');
const sectionMap = tocLinks.map(a => document.querySelector(a.getAttribute('href')));
const tocObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      tocLinks.forEach(l => l.classList.remove('active'));
      const link = tocLinks.find(a => a.getAttribute('href') === `#${entry.target.id}`);
      if (link) link.classList.add('active');
    }
  });
}, { threshold: 0.45 });
sectionMap.forEach(s => { if (s) tocObserver.observe(s); });

/* 6) Smooth scroll for internal links */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (ev) => {
    const href = a.getAttribute('href');
    if (href.length > 1) {
      ev.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (nav.classList.contains('open')) nav.classList.remove('open');
    }
  });
});

/* 7) Canvas particles (holographic dots + lines) */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
let particles = [];
function resizeCanvas(){
  if (!canvas) return;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

if (ctx) {
  let PARTICLE_COUNT = Math.max(40, Math.floor((canvas.width * canvas.height) / 90000));
  class Particle {
    constructor(){ this.reset(); }
    reset(){
      this.x = Math.random()*canvas.width;
      this.y = Math.random()*canvas.height;
      this.vx = (Math.random()-0.5)*0.3;
      this.vy = (Math.random()-0.5)*0.3;
      this.size = 0.6 + Math.random()*1.8;
      this.alpha = 0.18 + Math.random()*0.5;
    }
    move(){ this.x += this.vx; this.y += this.vy;
      if (this.x < -20 || this.x > canvas.width+20 || this.y < -20 || this.y > canvas.height+20) this.reset();
    }
    draw(){ ctx.beginPath(); ctx.fillStyle = `rgba(125,211,252,${this.alpha})`; ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill(); }
  }
  function initParticles(){
    PARTICLE_COUNT = Math.max(40, Math.floor((canvas.width * canvas.height) / 90000));
    particles = [];
    for (let i=0;i<PARTICLE_COUNT;i++) particles.push(new Particle());
  }
  initParticles();

  function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const g = ctx.createRadialGradient(canvas.width*0.15, canvas.height*0.1, 0, canvas.width*0.5, canvas.height*0.5, Math.max(canvas.width, canvas.height));
    g.addColorStop(0, 'rgba(10,20,30,0.06)'); g.addColorStop(1, 'rgba(10,20,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);

    particles.forEach(p => { p.move(); p.draw(); });

    for (let i=0;i<particles.length;i++){
      for (let j=i+1;j<particles.length;j++){
        const a=particles[i], b=particles[j]; const dx=a.x-b.x, dy=a.y-b.y; const dist=Math.hypot(dx,dy);
        if (dist < 110) {
          ctx.beginPath();
          const alpha = 0.08 * (1 - dist/110);
          ctx.strokeStyle = `rgba(125,211,252,${alpha})`;
          ctx.lineWidth = 0.8; ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  // regenerate on big resize
  let lastArea = canvas.width * canvas.height;
  setInterval(() => {
    const area = canvas.width * canvas.height;
    if (Math.abs(area - lastArea)/Math.max(1,lastArea) > 0.25) { initParticles(); lastArea = area; }
  }, 1500);
}

/* 8) Prefer reduced motion */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced) {
  document.querySelectorAll('*').forEach(n => { n.style.transition = 'none'; });
}

/* 9) Accessibility: tab focus */
document.addEventListener('keydown', (e) => { if (e.key === 'Tab') document.documentElement.classList.add('show-focus'); });

/* 10) Gallery: lazy-load images, tooltip on hover */
const galleryCards = $('.gallery-card');
const tooltip = document.getElementById('gallery-tooltip');

function loadImage(img){
  if (!img) return;
  const src = img.getAttribute('data-src');
  if (!src) return;
  img.src = src;
  img.onload = () => img.classList.add('loaded');
  img.removeAttribute('data-src');
}

// lazy load initial visible images
function lazyLoadGallery(){
  galleryCards.forEach(card => {
    const img = card.querySelector('img');
    if (!img) return;
    const rect = card.getBoundingClientRect();
    if (rect.top < innerHeight + 200) loadImage(img);
  });
}
window.addEventListener('scroll', lazyLoadGallery);
window.addEventListener('resize', lazyLoadGallery);
lazyLoadGallery();

// tooltip behavior
galleryCards.forEach(card => {
  card.addEventListener('mouseenter', (e) => {
    const title = card.getAttribute('data-title') || '';
    const desc = card.getAttribute('data-desc') || '';
    tooltip.innerHTML = `<strong style="display:block;margin-bottom:6px;color:#dff6ff;">${title}</strong><div style="font-size:0.92rem;color:#bfefff;">${desc}</div>`;
    tooltip.style.display = 'block';
    positionTooltip(e);
  });
  card.addEventListener('mousemove', (e) => positionTooltip(e));
  card.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
});

// position tooltip near cursor but inside viewport
function positionTooltip(e){
  const padding = 12;
  const w = tooltip.offsetWidth || 280;
  const h = tooltip.offsetHeight || 80;
  let x = e.clientX + 20;
  let y = e.clientY - 20;
  if (x + w + padding > window.innerWidth) x = e.clientX - w - 20;
  if (y - h < 0) y = e.clientY + 20;
  tooltip.style.left = `${x}px`; tooltip.style.top = `${y}px`;
}

/* 11) Smooth reveal reset on search clear */
searchInput.addEventListener('search', (e) => {
  if (!e.target.value) panels.forEach(p => p.style.display = '');
});

/* 12) Small UX improvements */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', () => { if (nav.classList.contains('open')) nav.classList.remove('open'); });
});

/* End of script.js */

