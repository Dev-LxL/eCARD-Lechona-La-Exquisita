'use strict';
(() => {
  const video = document.getElementById('esencia-video-sandra');
  if (!video) return;

  let visible = false;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  function update() {
    if (!visible || document.hidden) {
      video.pause();
      return;
    }

    const result = video.play();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {
        // Si el navegador bloquea autoplay,
        // el visitante puede usar los controles.
      });
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].intersectionRatio >= 0.35;
      update();
    }, {threshold:[0,0.35,0.6]});

    observer.observe(video);
  } else {
    visible = true;
    update();
  }

  document.addEventListener('visibilitychange', update);
})();
