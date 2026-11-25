'use strict';

(() => {
  const root = document.getElementById('sandra-carousel');
  if (!root) return;

  const section = root.closest('section');
  const slides = Array.from(root.children)
    .filter(el => el.classList.contains('sandra-mixed-card'));

  const prev = section.querySelector('[data-sandra-prev]');
  const next = section.querySelector('[data-sandra-next]');
  const toggle = section.querySelector('[data-sandra-toggle]');
  const counter = section.querySelector('[data-sandra-count]');

  if (!slides.length || !prev || !next || !toggle || !counter) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let index = 0;
  let visible = false;
  let paused = reduced.matches;
  let timer = null;
  let generation = 0;

  const numberVisible = () =>
    innerWidth <= 700 ? 1 : innerWidth <= 1000 ? 2 : 3;

  const maxIndex = () =>
    Math.max(0, slides.length - numberVisible());

  function clearTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function stop() {
    clearTimer();
    for (const video of root.querySelectorAll('video')) {
      video.pause();
    }
  }

  function schedule(delay = 3000) {
    clearTimer();
    if (!visible || paused || document.hidden) return;
    timer = setTimeout(() => show(index + 1), delay);
  }

  function updatePosition() {
    const gap = parseFloat(getComputedStyle(root).columnGap) || 0;
    const step = slides[0].getBoundingClientRect().width + gap;
    const offset = index * step;

    slides.forEach(slide => {
      slide.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
    });

    counter.textContent =
      (index + 1) + '–' +
      Math.min(slides.length, index + numberVisible()) +
      ' / ' + slides.length;
  }

  function run() {
    generation++;
    const current = generation;
    stop();
    updatePosition();

    const count = numberVisible();

    slides.forEach((slide, i) => {
      const active = i >= index && i < index + count;
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });

    if (!visible || paused || document.hidden) return;

    const activeVideos = [];

    for (let i = index; i < Math.min(slides.length,index+count); i++) {
      const video = slides[i].querySelector('video');
      if (video) activeVideos.push(video);
    }

    if (!activeVideos.length) {
      schedule(3000);
      return;
    }

    const pending = new Set(activeVideos);

    function done(video) {
      if (generation !== current) return;
      pending.delete(video);
      if (pending.size === 0) schedule(350);
    }

    for (const video of activeVideos) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = false;

      try { video.currentTime = 0; } catch (_) {}

      video.addEventListener('ended', () => done(video), {once:true});
      video.addEventListener('error', () => done(video), {once:true});

      const promise = video.play();
      if (promise && promise.catch) {
        promise.catch(() => done(video));
      }
    }
  }

  function show(nextIndex) {
    index = nextIndex > maxIndex() ? 0 :
      nextIndex < 0 ? maxIndex() : nextIndex;
    run();
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));

  function updateToggle() {
    toggle.textContent = paused ? 'Reanudar' : 'Pausar';
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    updateToggle();
    run();
  });

  updateToggle();

  document.addEventListener('visibilitychange', run);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      const entry = entries[0];
      visible = entry.isIntersecting &&
        entry.intersectionRatio >= 0.3;
      run();
    }, {threshold:[0,0.3,0.6]}).observe(root);
  } else {
    visible = true;
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      index = Math.min(index,maxIndex());
      updatePosition();
    }).observe(root);
  } else {
    addEventListener('resize', updatePosition);
  }

  updatePosition();
  run();
})();
