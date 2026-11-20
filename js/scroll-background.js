/**
 * GOODSERVICE — SCROLL-DRIVEN BACKGROUND PHOTO CONTROLLER
 * Real workshop photos crossfade and parallax as user scrolls through sections:
 * 1. Hero (#hero) -> facade.webp (Street entrance & illuminated GoodService sign)
 * 2. Calculator (#calculator) -> repair.webp (Close-up hands repairing phone screen)
 * 3. Promotions (#promos) -> master.webp (Master at precision microscope workstation)
 * 4. Location (#location) -> interior.webp (Entrance corridor, door & Steve Jobs quote)
 * 5. Reviews (#reviews) -> facade.webp / master.webp
 */

(function () {
  'use strict';

  // Disabled by default to display the light studio red background (can be toggled in Customizer)
  window.GS_DISABLE_BG_SCROLL = true;

  const SECTION_MAP = [
    { sectionId: 'hero', layerId: 'bgPhotoHero' },
    { sectionId: 'calculator', layerId: 'bgPhotoCalc' },
    { sectionId: 'promos', layerId: 'bgPhotoPromos' },
    { sectionId: 'location', layerId: 'bgPhotoLocation' },
    { sectionId: 'reviews', layerId: 'bgPhotoReviews' }
  ];

  let currentActiveSection = 'hero';
  let ticking = false;

  function initScrollBackground() {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial trigger
    updateScrollBackground();
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollBackground();
        ticking = false;
      });
      ticking = true;
    }
  }

  function getActiveSection(currentY) {
    const scrollY = (typeof currentY === 'number') ? currentY : (window.pageYOffset || document.documentElement.scrollTop);
    const viewCenter = scrollY + window.innerHeight * 0.42;

    let active = 'hero';

    for (const item of SECTION_MAP) {
      const el = document.getElementById(item.sectionId);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (viewCenter >= top && viewCenter < top + height) {
          active = item.sectionId;
          break;
        }
      }
    }

    // Edge-case: if scrolled to the very bottom, activate the last section
    if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 60) {
      active = SECTION_MAP[SECTION_MAP.length - 1].sectionId;
    }

    return active;
  }

  function updateScrollBackground(explicitScrollY) {
    if (window.GS_DISABLE_BG_SCROLL) return;

    const scrollY = (typeof explicitScrollY === 'number') 
      ? explicitScrollY 
      : (window.pageYOffset || document.documentElement.scrollTop);
    const activeSection = getActiveSection(scrollY);

    // Switch active layer if changed
    if (activeSection !== currentActiveSection) {
      currentActiveSection = activeSection;

      const activeItem = SECTION_MAP.find(i => i.sectionId === activeSection);
      const targetLayerId = activeItem ? activeItem.layerId : 'bgPhotoHero';

      document.querySelectorAll('.bg-photo-layer').forEach(layer => {
        if (layer.id === targetLayerId) {
          layer.classList.add('active');
        } else {
          layer.classList.remove('active');
        }
      });
    }

    // Parallax movement for the active layer
    const activeItem = SECTION_MAP.find(i => i.sectionId === currentActiveSection);
    if (!activeItem) return;

    const layer = document.getElementById(activeItem.layerId);
    const sectionEl = document.getElementById(currentActiveSection);

    if (layer && sectionEl) {
      const sectionTop = sectionEl.offsetTop;
      const relativeOffset = scrollY - sectionTop;
      // Smooth vertical parallax travel: -45px to +45px with subpixel float precision
      const parallaxY = Math.max(-45, Math.min(45, relativeOffset * -0.07));
      layer.style.transform = `translate3d(0, ${parallaxY.toFixed(2)}px, 0) scale(1.06)`;
    }
  }

  // Expose global updater for Customizer
  window.GS_UPDATE_BG_SCROLL = updateScrollBackground;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollBackground);
  } else {
    initScrollBackground();
  }
})();
