/* ============================================
   PHOTO GRID — CoverFlow carousel (mobile) + FLIP lightbox
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".photo-grid");
  const overlay = document.getElementById("photoLightbox");
  if (!grid || !overlay) return;

  // -------------------------------------------------
  // 1. CoverFlow tilt — only while .photo-grid is actually laid out as
  //    the mobile carousel (CSS: @media max-width:640px). Must match
  //    that breakpoint exactly and stay reactive to it: at wider widths
  //    .photo-grid is a plain 2-column grid, and forcing a rotateY
  //    transform onto a multi-row grid cell is what produced the skewed,
  //    non-rectangular photos on iPad/landscape.
  // -------------------------------------------------
  const mq = window.matchMedia("(max-width: 640px)");
  let carouselMode = mq.matches;

  const MAX_ANGLE = 12;
  const MAX_SCALE_DROP = 0.03;
  const MAX_OPACITY_DROP = 0.3;
  const TAP_MOVE_THRESHOLD = 6; // px of finger travel before a gesture counts as a drag, not a tap
  const SETTLE_DEBOUNCE_MS = 140;

  function clearTiltStyles() {
    grid.querySelectorAll(".photo-grid-item").forEach((item) => {
      item.style.transform = "";
      item.style.opacity = "";
      item.classList.remove("is-current");
    });
  }

  function getClosestItem() {
    const items = [...grid.querySelectorAll(".photo-grid-item")];
    if (!items.length) return null;
    const gridRect = grid.getBoundingClientRect();
    const mid = gridRect.left + gridRect.width / 2;
    let closest = items[0];
    let closestDist = Infinity;
    items.forEach((item) => {
      const r = item.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - mid);
      if (dist < closestDist) {
        closestDist = dist;
        closest = item;
      }
    });
    return closest;
  }

  const updateTilt = () => {
    if (!carouselMode) return;
    const items = [...grid.querySelectorAll(".photo-grid-item")];
    if (!items.length) return;

    const gridRect = grid.getBoundingClientRect();
    const mid = gridRect.left + gridRect.width / 2;
    const half = gridRect.width / 2;

    let closest = null;
    let closestDist = Infinity;

    items.forEach((item) => {
      const r = item.getBoundingClientRect();
      const itemMid = r.left + r.width / 2;
      const raw = itemMid - mid;
      const n = Math.max(-1, Math.min(1, raw / half));

      // Positive rotateY recedes the right edge (verified empirically) —
      // a card right of center needs a positive angle to fan its outer
      // edge away, matching a real CoverFlow.
      const angle = n * MAX_ANGLE;
      const scale = 1 - Math.abs(n) * MAX_SCALE_DROP;
      const opacity = 1 - Math.abs(n) * MAX_OPACITY_DROP;

      item.style.transform = `rotateY(${angle}deg) scale(${scale})`;
      item.style.opacity = opacity;

      const dist = Math.abs(raw);
      if (dist < closestDist) {
        closestDist = dist;
        closest = item;
      }
    });

    items.forEach((i) => i.classList.toggle("is-current", i === closest));
  };

  // Explicit, guaranteed re-center rather than trusting CSS scroll-snap
  // alone — "click into place" every time a drag or scroll settles.
  function snapToClosest() {
    if (!carouselMode) return;
    const closest = getClosestItem();
    if (!closest) return;
    const gridRect = grid.getBoundingClientRect();
    const itemRect = closest.getBoundingClientRect();
    const delta =
      itemRect.left + itemRect.width / 2 - (gridRect.left + gridRect.width / 2);
    if (Math.abs(delta) > 0.5) {
      grid.scrollTo({ left: grid.scrollLeft + delta, behavior: "smooth" });
    }
  }

  // -------------------------------------------------
  // 2. Drag (direct 1:1 tracking — no artificial lag) + momentum
  // -------------------------------------------------
  let isDragging = false;
  // True from the first real bit of movement until scrolling fully
  // settles (drag OR native trackpad/momentum scroll) — taps are ignored
  // the whole time this is true, so swiping never pops the lightbox and
  // a tap can't land mid-glide either.
  let isMoving = false;
  let startX = 0;
  let startScroll = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let dragDistance = 0;
  let settleTimer = null;
  let rafId = null;

  function requestTiltFrame() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateTilt();
      rafId = null;
    });
  }

  function scheduleSettle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      isMoving = false;
      snapToClosest();
      updateTilt();
    }, SETTLE_DEBOUNCE_MS);
  }

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    isDragging = true;
    dragDistance = 0;
    startX = e.clientX;
    startScroll = grid.scrollLeft;
    lastX = e.clientX;
    lastT = performance.now();
    velocity = 0;
    grid.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const now = performance.now();
    const dt = Math.max(now - lastT, 8);
    dragDistance += Math.abs(e.clientX - lastX);

    if (dragDistance > TAP_MOVE_THRESHOLD) {
      if (!grid.classList.contains("dragging")) {
        grid.classList.add("dragging");
      }
      isMoving = true;
      e.preventDefault();
      grid.scrollLeft = startScroll - (e.clientX - startX);
    }

    velocity = (e.clientX - lastX) / dt;
    lastX = e.clientX;
    lastT = now;
    requestTiltFrame();
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    grid.classList.remove("dragging");
    grid.releasePointerCapture?.(e.pointerId);

    const momentum = Math.max(-260, Math.min(260, velocity * 300));
    if (Math.abs(momentum) > 15) {
      grid.scrollBy({ left: -momentum, behavior: "smooth" });
    }
    scheduleSettle();
  };

  grid.addEventListener("pointerdown", onPointerDown);
  grid.addEventListener("pointermove", onPointerMove);
  grid.addEventListener("pointerup", onPointerUp);
  grid.addEventListener("pointercancel", onPointerUp);
  grid.addEventListener("pointerleave", onPointerUp);

  // Native scroll (trackpad, mouse wheel, keyboard) also counts as
  // "moving" and drives the same tilt + settle-snap.
  grid.addEventListener(
    "scroll",
    () => {
      isMoving = true;
      requestTiltFrame();
      scheduleSettle();
    },
    { passive: true },
  );

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
  // 3. FLIP lightbox
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
      if (dragDistance > TAP_MOVE_THRESHOLD) return; // just released a drag
      if (carouselMode) {
        if (isMoving) return; // carousel still gliding — ignore the tap
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
