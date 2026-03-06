// js/lang-toggle.js
(() => {
  const KEY = "site_lang";
  const html = document.documentElement;
  const btn = document.getElementById("langToggle");

  function apply(lang) {
    const next = (lang === "zh") ? "zh" : "en";
    html.dataset.lang = next;
    html.lang = next;
    try { localStorage.setItem(KEY, next); } catch (e) {}

    if (btn) {
      btn.setAttribute("aria-label", next === "en" ? "Switch to Chinese" : "Switch to English");
    }
  }

  const saved = (() => {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  })();

  const init =
    saved ||
    (navigator.language && navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en");

  apply(init);

  if (btn) {
    btn.addEventListener("click", () => {
      apply(html.dataset.lang === "en" ? "zh" : "en");
    });
  }
})();