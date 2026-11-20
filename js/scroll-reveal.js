(() => {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = document.querySelectorAll('.calc-island, .promos-section .section-headline-center, .process-grid .promo-glass-card, .location-section .section-headline-center, .location-glass-box, .reviews-section .section-headline-center, .reviews-grid, .site-footer');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('scroll-reveal-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -24px 0px', threshold: 0.02 });
  targets.forEach(target => {
    const rect = target.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;
    target.classList.add('scroll-reveal');
    observer.observe(target);
  });
})();
