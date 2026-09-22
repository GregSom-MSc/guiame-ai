/* ============================================
   PHOTO LIGHTBOX — guide.html's photo grid
   Opens: FLIP-grow out of the clicked thumbnail's own position (compute
   the scale/translate delta, apply it instantly, then animate to
   identity) — reads as "that photo" getting bigger, not a new element
   appearing.
   Closes: simple fade-out (overlay opacity → 0, which fades everything
   inside it, no rect math needed) — triggered by a second click, the
   backdrop, Escape, or a wheel scroll in either direction. Fading out
   instead of shrinking back also means closing never depends on the
   thumbnail's rect still being valid, so it works reliably at any moment.
   ============================================ */
document.addEventListener("DOMContentLoaded", function () {
  const grid = document.querySelector(".photo-grid");
  const overlay = document.getElementById("photoLightbox");
  if (!grid || !overlay) return;

  if (window.innerWidth <= 420) {
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let lastMoveX = 0;
    let lastMoveTime = 0;
    let lastVelocity = 0;

    const updateCurrentCard = () => {
      const items = [...grid.querySelectorAll(".photo-grid-item")];
      const midpoint = grid.scrollLeft + grid.clientWidth / 2;

      let closest = items[0];
      let closestDistance = Infinity;

      items.forEach((item) => {
        const itemMid = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(midpoint - itemMid);

        if (distance < closestDistance) {
          closestDistance = distance;
          closest = item;
        }
      });

      items.forEach((item) =>
        item.classList.toggle("is-current", item === closest),
      );
    };

    const pointerDown = (event) => {
      isDragging = true;
      grid.classList.add("dragging");
      startX = event.clientX;
      startScrollLeft = grid.scrollLeft;
      lastMoveX = event.clientX;
      lastMoveTime = performance.now();
      lastVelocity = 0;
      grid.setPointerCapture(event.pointerId);
    };

    const pointerMove = (event) => {
      if (!isDragging) return;

      const dx = event.clientX - startX;
      const now = performance.now();
      const dt = Math.max(now - lastMoveTime, 16);

      grid.scrollLeft = startScrollLeft - dx;
      lastVelocity = (event.clientX - lastMoveX) / dt;
      lastMoveX = event.clientX;
      lastMoveTime = now;
      updateCurrentCard();
    };

    const pointerUp = (event) => {
      if (!isDragging) return;

      isDragging = false;
      grid.classList.remove("dragging");
      grid.releasePointerCapture?.(event.pointerId);

      const momentum = Math.max(-260, Math.min(260, lastVelocity * 750));
      if (Math.abs(momentum) > 15) {
        grid.scrollBy({ left: momentum, behavior: "smooth" });
      }

      requestAnimationFrame(updateCurrentCard);
    };

    grid.addEventListener("pointerdown", pointerDown);
    grid.addEventListener("pointermove", pointerMove);
    grid.addEventListener("pointerup", pointerUp);
    grid.addEventListener("pointerleave", pointerUp);
    grid.addEventListener("pointercancel", pointerUp);
    grid.addEventListener("scroll", updateCurrentCard, { passive: true });
    requestAnimationFrame(updateCurrentCard);
  }

  const OVERLAY_FADE_MS = 350; // must match .photo-lightbox's opacity transition

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
    // Arm wheel-to-close only after the full reveal sequence (line, then
    // title, then description — about 1s end to end) has finished. A
    // trackpad or mouse wheel used to scroll down to the gallery can keep
    // firing momentum events well after the click that opened this, and
    // closing mid-reveal looked like the caption "disappearing" on its own.
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
    // Ignore faint deltas — trackpad momentum tapers off rather than
    // stopping cleanly, and small tail-end ticks shouldn't count as an
    // intentional "scroll to close." A real scroll gesture clears this.
    if (Math.abs(e.deltaY) < 15) return;
    close();
  }

  grid.querySelectorAll(".photo-grid-item").forEach((item) => {
    item.addEventListener("click", () => open(item));
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  frame.addEventListener("click", close);
});
