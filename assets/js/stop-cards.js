document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".stop-cards-grid");
  const dotsWrap = document.querySelector(".stop-cards-dots");
  if (!track || !dotsWrap) return;

  const cards = [...track.querySelectorAll(".stop-card")];

  const dots = cards.map((card, i) => {
    const dot = document.createElement("button");
    dot.className = "stop-cards-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir a la parada ${i + 1}`);
    dot.addEventListener("click", () =>
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    );
    dotsWrap.appendChild(dot);
    return dot;
  });

  function setActiveDot(index) {
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  }

  function collapseAllExcept(keep) {
    cards.forEach((card) => {
      if (card !== keep) card.classList.remove("expanded");
    });
  }

  cards.forEach((card) => {
    card.querySelector(".stop-card-photo").addEventListener("click", () => {
      const wasExpanded = card.classList.contains("expanded");
      collapseAllExcept(card);
      card.classList.toggle("expanded", !wasExpanded);
    });
  });

  let scrollTimer;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const trackRect = track.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;
      let closest = 0;
      let closestDist = Infinity;
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - centerX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setActiveDot(closest);
      collapseAllExcept(cards[closest]);
    }, 120);
  });

  setActiveDot(0);
});
