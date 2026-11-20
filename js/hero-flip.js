(() => {
  const card = document.querySelector('.hero-flip-card');
  if (!card) return;
  let ticking = false;
  function update() {
    const distance = window.innerWidth <= 820 ? 240 : 360;
    const progress = Math.max(0, Math.min(1, window.scrollY / distance));
    card.style.setProperty('--hero-flip-angle', `${(progress * 180).toFixed(2)}deg`);
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
