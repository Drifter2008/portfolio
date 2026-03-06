// ===== Lightbox (Image Zoom) v5.1 =====
// Fix: caption keeps .lang-en/.lang-zh spans so only one language shows in overlay

(() => {
  const SELECTORS = {
    candidates: "figure img, img.zoomable",
    ignoreContainers: ".headerCover, [data-nozoom-container], .lightbox-overlay",
  };

  let overlayEl = null;
  let lastFocusedEl = null;

  function isZoomable(img) {
    if (!img || img.tagName !== "IMG") return false;

    if (img.hasAttribute("data-nozoom")) return false;
    if (img.classList.contains("nozoom")) return false;

    if (img.closest(SELECTORS.ignoreContainers)) return false;

    const link = img.closest("a");
    if (link && !img.hasAttribute("data-zoom")) return false;

    const src = img.currentSrc || img.src;
    return !!src;
  }

  function ensureImageClipWrapper(img) {
    if (img.parentElement && img.parentElement.classList.contains("zoom-clip")) return;

    const fig = img.closest("figure");
    if (!fig) {
      img.parentElement?.classList.add("zoom-clip");
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "zoom-clip";
    fig.insertBefore(wrapper, img);
    wrapper.appendChild(img);
  }

  function enhanceZoomableImages() {
    document.querySelectorAll(SELECTORS.candidates).forEach((img) => {
      if (!isZoomable(img)) return;

      ensureImageClipWrapper(img);

      img.classList.add("zoomable--enabled");

      if (!img.hasAttribute("tabindex")) img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
    });
  }

  // ✅ 关键修改：拿 figcaption 的 innerHTML（保留 .lang-en/.lang-zh 结构）
  function getCaptionHtmlFromFigure(img) {
    const fig = img.closest("figure");
    if (!fig) return "";
    const cap = fig.querySelector("figcaption");
    return (cap?.innerHTML || "").trim(); // keep spans!
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function openLightbox(img) {
    if (overlayEl) return;

    lastFocusedEl = document.activeElement;

    const src = img.currentSrc || img.src;
    const alt = img.alt || "";
    const captionHtml = getCaptionHtmlFromFigure(img);

    overlayEl = document.createElement("div");
    overlayEl.className = "lightbox-overlay";
    overlayEl.setAttribute("role", "dialog");
    overlayEl.setAttribute("aria-modal", "true");

    // ✅ 关键修改：caption 不再 escape 成纯文本，否则两种语言会拼一起
    overlayEl.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Close (Esc)">×</button>
      <div class="lightbox-inner">
        <img class="lightbox-img" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />
        ${captionHtml ? `<div class="lightbox-caption">${captionHtml}</div>` : ""}
      </div>
    `;

    document.body.appendChild(overlayEl);
    document.body.classList.add("lightbox-open");

    overlayEl.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });

    overlayEl.querySelector(".lightbox-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }

  function closeLightbox() {
    if (!overlayEl) return;
    overlayEl.remove();
    overlayEl = null;
    document.body.classList.remove("lightbox-open");
    lastFocusedEl?.focus?.();
  }

  document.addEventListener("click", (e) => {
    if (overlayEl) return;

    const img = e.target?.closest?.("img");
    if (!img || !isZoomable(img)) return;

    const link = img.closest("a");
    if (link) e.preventDefault();

    openLightbox(img);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlayEl) {
      e.preventDefault();
      closeLightbox();
      return;
    }

    if ((e.key === "Enter" || e.key === " ") && !overlayEl) {
      const active = document.activeElement;
      if (active && active.tagName === "IMG" && isZoomable(active)) {
        e.preventDefault();
        openLightbox(active);
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceZoomableImages);
  } else {
    enhanceZoomableImages();
  }
})();