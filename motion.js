import {
  animate,
  scroll,
} from "https://cdn.jsdelivr.net/npm/motion@13.4.4/+esm";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const prefersMobileVideo = window.matchMedia(
  "(max-width: 768px), (pointer: coarse)",
);
const root = document.documentElement;
const video = document.querySelector(".scroll-backdrop__video");
const sectionTargets = [
  document.querySelector(".hero-section"),
  document.querySelector(".about-section"),
  document.querySelector(".spots-section"),
  document.querySelector(".howitworks-section"),
  document.querySelector(".race-section"),
  document.querySelector(".guide-section"),
  document.querySelector(".final-slide-wrap"),
].filter(Boolean);

if (!prefersReducedMotion.matches && video) {
  root.classList.add("motion-ready");

  const frameDuration = 1 / 24;
  let activeObjectUrl = "";
  let duration = 0;
  let targetProgress = 0;
  let smoothedTime = 0;
  let lastFrameTime = 0;
  let animationFrame = 0;
  let destroyed = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const targetTime = () => {
    const playableDuration = Math.max(0, duration - frameDuration);
    return targetProgress * playableDuration;
  };

  const markVideoReady = () => {
    root.classList.add("video-ready");
  };

  const renderFrame = (timestamp) => {
    animationFrame = 0;
    if (destroyed || !duration) return;

    const elapsed = lastFrameTime
      ? clamp((timestamp - lastFrameTime) / 1000, 0, 0.1)
      : frameDuration;
    lastFrameTime = timestamp;

    const destination = targetTime();
    const smoothing = 1 - Math.exp(-elapsed * 18);
    smoothedTime += (destination - smoothedTime) * smoothing;

    if (
      !video.seeking &&
      Math.abs(video.currentTime - smoothedTime) >= frameDuration * 0.7
    ) {
      video.currentTime = clamp(smoothedTime, 0, duration - frameDuration);
    }

    if (
      video.seeking ||
      Math.abs(destination - smoothedTime) >= frameDuration * 0.25 ||
      Math.abs(video.currentTime - destination) >= frameDuration
    ) {
      animationFrame = requestAnimationFrame(renderFrame);
    }
  };

  const requestFrame = () => {
    if (!animationFrame) {
      lastFrameTime = 0;
      animationFrame = requestAnimationFrame(renderFrame);
    }
  };

  video.addEventListener("loadedmetadata", () => {
    duration = Number.isFinite(video.duration) ? video.duration : 0;
    smoothedTime = targetTime();
    video.currentTime = smoothedTime;
    requestFrame();
  });

  video.addEventListener("loadeddata", markVideoReady, { once: true });
  video.addEventListener("seeked", () => {
    markVideoReady();
    requestFrame();
  });

  const source = prefersMobileVideo.matches
    ? video.dataset.mobileSrc
    : video.dataset.desktopSrc;
  video.dataset.activeSource = source;

  fetch(source)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Video request failed: ${response.status}`);
      }
      return response.blob();
    })
    .then((blob) => {
      if (destroyed) return;
      activeObjectUrl = URL.createObjectURL(blob);
      video.src = activeObjectUrl;
      video.preload = "auto";
      video.load();
    })
    .catch(() => {
      if (destroyed) return;
      video.src = source;
      video.preload = "auto";
      video.load();
    });

  const stopScrubTracking = scroll((progress) => {
    targetProgress = clamp(progress, 0, 1);
    requestFrame();
  });

  const progressAnimation = animate(
    ".scroll-progress__bar",
    { scaleX: [0, 1] },
    { duration: 1, ease: "linear" },
  );
  const stopProgressTracking = scroll(progressAnimation, {
    trackContentSize: true,
  });

  const parallaxCleanups = [];
  if (!prefersMobileVideo.matches) {
    sectionTargets.forEach((section) => {
      const content =
        section.querySelector(":scope > .container") ||
        section.querySelector(".hero-center-content") ||
        section.querySelector(".cta-trust-grid");

      if (!content) return;

      const parallaxAnimation = animate(
        content,
        { y: [18, -18] },
        { duration: 1, ease: "linear" },
      );

      parallaxCleanups.push(
        scroll(parallaxAnimation, {
          target: section,
          offset: ["start end", "end start"],
        }),
      );
    });
  }

  const primeVideo = () => {
    if (!duration) return;
    video
      .play()
      .then(() => {
        video.pause();
        video.currentTime = targetTime();
      })
      .catch(() => {});
  };
  window.addEventListener("pointerdown", primeVideo, { once: true, passive: true });
  window.addEventListener("touchstart", primeVideo, { once: true, passive: true });

  window.addEventListener(
    "pagehide",
    () => {
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      stopScrubTracking();
      stopProgressTracking();
      parallaxCleanups.forEach((cleanup) => cleanup());
      video.removeAttribute("src");
      video.load();
      if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    },
    { once: true },
  );
}
