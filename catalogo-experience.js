'use strict';

(() => {
  const section = document.getElementById('catalogo');
  if (!section) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  // Activación progresiva: si JS falla, el contenido sigue visible.
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;

    section.classList.add('catalogo-visible');
    observer.disconnect();
  }, {threshold:0.08});

  const rect = section.getBoundingClientRect();
  const alreadyVisible = rect.top < innerHeight &&
    rect.bottom > 0;

  if (alreadyVisible) {
    section.classList.add('catalogo-visible');
  }

  document.documentElement.classList.add('catalogo-effects-ready');

  if (!alreadyVisible) observer.observe(section);
})();
