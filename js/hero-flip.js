(() => {
  const frame = document.querySelector('.hero-image');
  const card = frame?.querySelector('.hero-flip-card');
  if (!card || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  let lastAngle;
  function update() {
    const distance = window.innerWidth <= 820 ? 240 : 360;
    const top = window.scrollY + frame.getBoundingClientRect().top;
    const start = Math.max(0, top - window.innerHeight * .28);
    const progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
    const angle = (progress * 180).toFixed(2);
    if (angle !== lastAngle) {
      card.style.setProperty('--hero-flip-angle', `${angle}deg`);
      lastAngle = angle;
    }
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
