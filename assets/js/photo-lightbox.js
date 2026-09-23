/* ============================================
   PHOTO GRID — native-scroll CoverFlow carousel (mobile) + FLIP lightbox
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".photo-grid");
  const overlay = document.getElementById("photoLightbox");
  if (!grid || !overlay) return;

  // -------------------------------------------------
  // 1. CoverFlow visual layer. Scrolling, momentum and snapping are all
  //    native (CSS scroll-snap, same as walks.html's stop cards) — this
  //    code only READS the scroll position and paints tilt/scale/fade/blur
  //    from it. It never moves the scroll itself.
  //
  //    Only active while .photo-grid is laid out as the mobile carousel
  //    (CSS: @media max-width:640px — keep in sync). At wider widths it is
  //    a plain 2-column grid, and a rotateY on a grid cell skews it.
  // -------------------------------------------------
  const mq = window.matchMedia("(max-width: 640px)");
  let carouselMode = mq.matches;

  const MAX_ANGLE = 12;
  const MAX_SCALE_DROP = 0.03;
  const MAX_OPACITY_DROP = 0.3;
  const MAX_BLUR = 3; // px, at the furthest tilt (n = ±1)
  const SETTLE_DEBOUNCE_MS = 120;

  function clearTiltStyles() {
    grid.querySelectorAll(".photo-grid-item").forEach((item) => {
      item.style.transform = "";
      item.style.opacity = "";
      item.style.filter = "";
      item.classList.remove("is-current");
    });
  }

  const updateTilt = () => {
    if (!carouselMode) return;
    const items = [...grid.querySelectorAll(".photo-grid-item")];
    if (!items.length) return;

    const gridRect = grid.getBoundingClientRect();
    const mid = gridRect.left + gridRect.width / 2;
    const half = gridRect.width / 2;

    // All reads first, then all writes — interleaving them forces a style
    // recalculation per card on every scroll frame.
    const offsets = items.map((item) => {
      const r = item.getBoundingClientRect();
      return r.left + r.width / 2 - mid;
    });

    let closest = 0;
    offsets.forEach((raw, i) => {
      if (Math.abs(raw) < Math.abs(offsets[closest])) closest = i;

      const n = Math.max(-1, Math.min(1, raw / half));
      // Positive rotateY recedes the right edge (verified empirically) —
      // a card right of center needs a positive angle to fan its outer
      // edge away, matching a real CoverFlow.
      const blur = Math.abs(n) * MAX_BLUR;
      items[i].style.transform = `rotateY(${n * MAX_ANGLE}deg) scale(${1 - Math.abs(n) * MAX_SCALE_DROP})`;
      items[i].style.opacity = 1 - Math.abs(n) * MAX_OPACITY_DROP;
      items[i].style.filter = blur > 0.05 ? `blur(${blur}px)` : "";
    });

    items.forEach((item, i) => item.classList.toggle("is-current", i === closest));
  };

  // True while the carousel is scrolling or gliding — taps are ignored
  // until it settles.
  let isMoving = false;
  let settleTimer = null;
  let rafId = null;

  function requestTiltFrame() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateTilt();
      rafId = null;
    });
  }

  grid.addEventListener(
    "scroll",
    () => {
      isMoving = true;
      requestTiltFrame();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        isMoving = false;
      }, SETTLE_DEBOUNCE_MS);
    },
    { passive: true },
  );

  window.addEventListener("resize", requestTiltFrame);

  function setCarouselMode(matches) {
    carouselMode = matches;
    if (carouselMode) {
      updateTilt();
    } else {
      clearTiltStyles();
    }
  }
  mq.addEventListener("change", (e) => setCarouselMode(e.matches));
  setCarouselMode(mq.matches);

  // -------------------------------------------------
  // 2. FLIP lightbox
  //    Opens: grow out of the clicked thumbnail's own position.
  //    Closes: fade out — triggered by a second click, the backdrop,
  //    Escape, or a wheel scroll in either direction.
  // -------------------------------------------------
  const OVERLAY_FADE_MS = 350;
  const frame = document.getElementById("photoLightboxFrame");
  const bigImg = document.getElementById("photoLightboxImg");
  const title = document.getElementById("photoLightboxTitle");
  const desc = document.getElementById("photoLightboxDesc");

  let originItem = null;
  let cleanupTimer = null;
  let wheelArmTimer = null;

  function deltaFrom(rect) {
    const target = frame.getBoundingClientRect();
    const scaleX = rect.width / target.width;
    const scaleY = rect.height / target.height;
    const dx = rect.left + rect.width / 2 - (target.left + target.width / 2);
    const dy = rect.top + rect.height / 2 - (target.top + target.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
  }

  function open(item) {
    clearTimeout(cleanupTimer);
    originItem = item;

    const img = item.querySelector("img");
    bigImg.src = img.src;
    bigImg.alt = img.alt;
    title.textContent = item.dataset.title || "";
    desc.textContent = item.dataset.desc || "";

    frame.classList.remove("revealed");
    frame.style.transition = "none";
    frame.style.transform = "translate(0, 0) scale(1)";
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const startRect = item.getBoundingClientRect();
    frame.style.transform = deltaFrom(startRect);
    frame.getBoundingClientRect(); // force reflow before re-enabling transition
    frame.style.transition = "";
    requestAnimationFrame(() => {
      frame.style.transform = "translate(0, 0) scale(1)";
    });

    setTimeout(() => frame.classList.add("revealed"), 250);

    document.addEventListener("keydown", onKeydown);
    clearTimeout(wheelArmTimer);
    wheelArmTimer = setTimeout(() => {
      document.addEventListener("wheel", onWheel, { passive: false });
    }, 1450);
  }

  function close() {
    if (!overlay.classList.contains("open")) return;

    clearTimeout(wheelArmTimer);
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("wheel", onWheel);

    clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      frame.classList.remove("revealed");
      originItem = null;
    }, OVERLAY_FADE_MS);
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
  }

  function onWheel(e) {
    e.preventDefault();
    if (Math.abs(e.deltaY) < 15) return;
    close();
  }

  grid.querySelectorAll(".photo-grid-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (carouselMode) {
        if (isMoving) return; // still gliding — ignore the tap
        if (!item.classList.contains("is-current")) return; // side card — no-op
      }
      open(item);
    });
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  frame.addEventListener("click", close);
});
