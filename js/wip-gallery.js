(() => {
  const gallery = document.querySelector("[data-wip-gallery]");
  if (!gallery) return;

  const viewport = gallery.querySelector(".wipCarousel-viewport");
  const track = gallery.querySelector(".wipCarousel-track");
  const cards = Array.from(track.querySelectorAll(".wipCard"));
  const prevBtn = gallery.querySelector(".wipCarousel-prev");
  const nextBtn = gallery.querySelector(".wipCarousel-next");

  if (!viewport || !track || cards.length < 2) return;

  const BREAKPOINT_COMPACT = "(max-width: 53.125rem)";
  const CARD_RATIO = 820 / 1100;
  const PREVIEW_SCALE = 0.5;
  const TRANSITION_MS = 520;
  const WHEEL_LOCK_MS = 360;
  const WHEEL_THRESHOLD = 10;
  const LAST_INDEX = cards.length - 1;

  let currentIndex = 0;
  let isAnimating = false;
  let wheelLocked = false;
  let animationTimer = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const canGoPrev = () => currentIndex > 0;
  const canGoNext = () => currentIndex < LAST_INDEX;

  function setCardState(card, { x, scale, opacity, z, pointer = "none" }) {
    card.style.setProperty("--card-x", `${x}px`);
    card.style.setProperty("--card-scale", String(scale));
    card.style.opacity = String(opacity);
    card.style.zIndex = String(z);
    card.style.pointerEvents = pointer;
  }

  function getMetrics() {
    const viewportWidth = viewport.clientWidth;
    const isCompact = window.matchMedia(BREAKPOINT_COMPACT).matches;

    let mainWidth;
    let previewWidth;
    let gap;
    let mainX;
    let rightStart;
    let leftX;
    let hiddenLeftX;

    if (isCompact) {
      const sidePeek = clamp(viewportWidth * 0.04, 16, 26);
      mainX = clamp(viewportWidth * 0.06, 18, 28);
      mainWidth = viewportWidth - mainX * 2;
      previewWidth = mainWidth * PREVIEW_SCALE;
      gap = 0;
      leftX = sidePeek - previewWidth;
      rightStart = viewportWidth - sidePeek;
      hiddenLeftX = leftX - previewWidth;
    } else {
      mainWidth = clamp(viewportWidth * 0.56, 320, 720);
      previewWidth = mainWidth * PREVIEW_SCALE;
      gap = clamp(viewportWidth * 0.018, 14, 24);
      mainX = clamp(viewportWidth * 0.06, 28, 110);
      rightStart = mainX + mainWidth + gap;
      leftX = mainX - previewWidth - gap;
      hiddenLeftX = leftX - previewWidth - gap;
    }

    const cardHeight = mainWidth * CARD_RATIO;

    viewport.style.setProperty("--wip-card-width", `${mainWidth}px`);
    viewport.style.setProperty("--wip-card-height", `${cardHeight}px`);
    viewport.style.setProperty("--wip-main-x", `${mainX}px`);
    viewport.style.setProperty("--wip-main-width", `${mainWidth}px`);

    const overlayLeft = clamp(
      rightStart - gap * 0.5,
      viewportWidth * 0.54,
      viewportWidth - 200
    );
    gallery.style.setProperty("--wip-overlay-left", `${overlayLeft}px`);

    return { previewWidth, gap, mainX, rightStart, leftX, hiddenLeftX };
  }

  function syncZoomState() {
    cards.forEach((card, index) => {
      const img = card.querySelector("img");
      const isActive = index === currentIndex;

      card.classList.toggle("is-active", isActive);

      if (!img) return;

      if (isActive) {
        img.removeAttribute("data-nozoom");
        img.setAttribute("tabindex", "0");
      } else {
        img.setAttribute("data-nozoom", "");
        img.setAttribute("tabindex", "-1");
      }
    });
  }

  function updateButtons() {
    prevBtn.disabled = !canGoPrev();
    nextBtn.disabled = !canGoNext();
    prevBtn.setAttribute("aria-disabled", String(!canGoPrev()));
    nextBtn.setAttribute("aria-disabled", String(!canGoNext()));
  }

  function render({ immediate = false } = {}) {
    const { previewWidth, gap, mainX, rightStart, leftX, hiddenLeftX } = getMetrics();

    track.classList.toggle("is-no-transition", immediate);

    cards.forEach((card, index) => {
      if (index === currentIndex) {
        setCardState(card, {
          x: mainX,
          scale: 1,
          opacity: 1,
          z: 5,
          pointer: "auto"
        });
        return;
      }

      if (index === currentIndex - 1) {
        setCardState(card, {
          x: leftX,
          scale: PREVIEW_SCALE,
          opacity: 0.5,
          z: 4
        });
        return;
      }

      if (index < currentIndex - 1) {
        const hiddenOrder = currentIndex - index - 2;
        setCardState(card, {
          x: hiddenLeftX - hiddenOrder * (previewWidth + gap),
          scale: PREVIEW_SCALE,
          opacity: 0.5,
          z: 1
        });
        return;
      }

      const order = index - currentIndex - 1;
      setCardState(card, {
        x: rightStart + order * (previewWidth + gap),
        scale: PREVIEW_SCALE,
        opacity: 0.5,
        z: Math.max(3 - order, 1)
      });
    });

    syncZoomState();
    updateButtons();

    if (immediate) {
      requestAnimationFrame(() => {
        track.classList.remove("is-no-transition");
      });
    }
  }

  function goTo(nextIndex) {
    if (isAnimating) return;

    const targetIndex = clamp(nextIndex, 0, LAST_INDEX);
    if (targetIndex === currentIndex) return;

    isAnimating = true;
    currentIndex = targetIndex;
    render();

    window.clearTimeout(animationTimer);
    animationTimer = window.setTimeout(() => {
      isAnimating = false;
    }, TRANSITION_MS);
  }

  function next() {
    if (canGoNext()) goTo(currentIndex + 1);
  }

  function prev() {
    if (canGoPrev()) goTo(currentIndex - 1);
  }

  function handleWheel(event) {
    if (document.body.classList.contains("lightbox-open")) return;

    const activeImg = track.querySelector(".wipCard.is-active img");
    if (!activeImg) return;

    const rect = activeImg.getBoundingClientRect();
    const insideActive =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!insideActive) return;

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (Math.abs(delta) < WHEEL_THRESHOLD) return;
    if (delta > 0 && !canGoNext()) return;
    if (delta < 0 && !canGoPrev()) return;
    if (wheelLocked || isAnimating) return;

    event.preventDefault();
    wheelLocked = true;

    delta > 0 ? next() : prev();

    window.setTimeout(() => {
      wheelLocked = false;
    }, WHEEL_LOCK_MS);
  }

  function handleKeydown(event) {
    if (document.body.classList.contains("lightbox-open")) return;

    if (event.key === "ArrowRight" && canGoNext()) {
      event.preventDefault();
      next();
    }

    if (event.key === "ArrowLeft" && canGoPrev()) {
      event.preventDefault();
      prev();
    }
  }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  viewport.addEventListener("wheel", handleWheel, { passive: false });
  viewport.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", () => render({ immediate: true }));

  render({ immediate: true });
})();