/* ============================================
   PHOTO GRID — continuous CoverFlow + FLIP lightbox
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".photo-grid");
  const overlay = document.getElementById("photoLightbox");
  if (!grid || !overlay) return;

  // -------------------------------------------------
  // 1. Continuous CoverFlow tilt (works on every viewport)
  // -------------------------------------------------
  const MAX_ANGLE = 38; // degrees
  const MAX_SCALE_DROP = 0.18;
  const MAX_OPACITY_DROP = 0.4;

  // Make sure the grid itself has 3-D context (add this once in CSS too)
  grid.style.perspective = "1200px";
  grid.style.perspectiveOrigin = "50% 50%";

  const updateTilt = () => {
    const items = [...grid.querySelectorAll(".photo-grid-item")];
    if (!items.length) return;

    // Use getBoundingClientRect so padding / gaps never break the math
    const gridRect = grid.getBoundingClientRect();
    const mid = gridRect.left + gridRect.width / 2;
    const half = gridRect.width / 2;

    let closest = null;
    let closestDist = Infinity;

    items.forEach((item) => {
      const r = item.getBoundingClientRect();
      const itemMid = r.left + r.width / 2;
      const raw = itemMid - mid;
      const n = Math.max(-1, Math.min(1, raw / half)); // -1 … 1

      // Positive rotateY = right edge recedes (classic CoverFlow)
      const angle = n * MAX_ANGLE;
      const scale = 1 - Math.abs(n) * MAX_SCALE_DROP;
      const opacity = 1 - Math.abs(n) * MAX_OPACITY_DROP;

      item.style.transform = `rotateY(${angle}deg) scale(${scale})`;
      item.style.opacity = opacity;
      item.style.zIndex = Math.round(100 - Math.abs(n) * 50);

      const dist = Math.abs(raw);
      if (dist < closestDist) {
        closestDist = dist;
        closest = item;
      }
    });

    items.forEach((i) => i.classList.toggle("is-current", i === closest));
  };

  // -------------------------------------------------
  // 2. Smooth drag / momentum (pointer events)
  // -------------------------------------------------
  let isDragging = false;
  let startX = 0;
  let startScroll = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let dragDistance = 0;
  let rafId = null;

  const onPointerDown = (e) => {
    if (e.button !== 0) return; // left button only
    isDragging = true;
    dragDistance = 0;
    grid.classList.add("dragging");
    startX = e.clientX;
    startScroll = grid.scrollLeft;
    lastX = e.clientX;
    lastT = performance.now();
    velocity = 0;
    grid.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const now = performance.now();
    const dt = Math.max(now - lastT, 8);
    const dx = e.clientX - startX;

    // Target position (with reduced sensitivity)
    const target = startScroll - dx * 0.56;

    // Lerp toward the target → creates the “stuck / heavy” feeling
    grid.scrollLeft += (target - grid.scrollLeft) * 0.21; // 0.2–0.35 feels good

    dragDistance += Math.abs(e.clientX - lastX);
    velocity = (e.clientX - lastX) / dt;
    lastX = e.clientX;
    lastT = now;

    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        updateTilt();
        rafId = null;
      });
    }
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    grid.classList.remove("dragging");
    grid.releasePointerCapture?.(e.pointerId);

    // Momentum – scale velocity into a sensible distance
    const momentum = Math.max(-180, Math.min(180, velocity * 200));
    if (Math.abs(momentum) > 12) {
      grid.scrollBy({ left: -momentum, behavior: "smooth" });
    }
    // Final tilt after momentum settles
    setTimeout(updateTilt, 320);
  };

  grid.addEventListener("pointerdown", onPointerDown);
  grid.addEventListener("pointermove", onPointerMove);
  grid.addEventListener("pointerup", onPointerUp);
  grid.addEventListener("pointercancel", onPointerUp);
  grid.addEventListener("pointerleave", onPointerUp);

  // Native scroll (trackpad, mouse-wheel, keyboard) also drives the tilt
  grid.addEventListener(
    "scroll",
    () => {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          updateTilt();
          rafId = null;
        });
      }
    },
    { passive: true },
  );

  // Initial layout + resize
  updateTilt();
  window.addEventListener("resize", updateTilt);

  // -------------------------------------------------
  // 3. Original FLIP lightbox (kept almost unchanged)
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
    frame.style.transform = "translate(0,0) scale(1)";
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const startRect = item.getBoundingClientRect();
    frame.style.transform = deltaFrom(startRect);
    frame.getBoundingClientRect(); // force reflow
    frame.style.transition = "";
    requestAnimationFrame(() => {
      frame.style.transform = "translate(0,0) scale(1)";
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

  // Click only opens if the user didn’t drag
  grid.querySelectorAll(".photo-grid-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (dragDistance > 12) return;
      open(item);
    });
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  frame.addEventListener("click", close);
});
