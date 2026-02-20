(() => {
  const storageKey = "ui-theme";
  const prefersDark = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  const getInitialTheme = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
    return prefersDark() ? "dark" : "light";
  };

  const setTheme = (theme, btn) => {
    document.body.dataset.theme = theme;
    document.documentElement.dataset.theme = theme;
    if (btn) {
      const isDark = theme === "dark";
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }
  };

  const buildToggle = () => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-live", "polite");
    btn.innerHTML = `
      <svg class="icon icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M21 14.5A9.5 9.5 0 0 1 9.5 3a9 9 0 1 0 11.5 11.5Z"/>
      </svg>
      <svg class="icon icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-16a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Zm9-9a1 1 0 0 1-1 1h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1ZM6 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1Zm12.36-6.36a1 1 0 0 1 0 1.41l-1.41 1.42a1 1 0 0 1-1.41-1.42l1.41-1.41a1 1 0 0 1 1.41 0ZM8.46 17.54a1 1 0 0 1 0 1.41l-1.41 1.41a1 1 0 0 1-1.41-1.41l1.41-1.41a1 1 0 0 1 1.41 0Zm9.9 1.41a1 1 0 0 1-1.41 0l-1.41-1.41a1 1 0 1 1 1.41-1.41l1.41 1.41a1 1 0 0 1 0 1.41ZM7.05 8.46a1 1 0 0 1-1.41 0L4.22 7.05A1 1 0 1 1 5.64 5.64l1.41 1.41a1 1 0 0 1 0 1.41Z"/>
      </svg>
    `;
    return btn;
  };

  const init = () => {
    const btn = document.querySelector("[data-theme-toggle]") || buildToggle();
    if (!btn.isConnected) document.body.append(btn);

    const initial = getInitialTheme();
    setTheme(initial, btn);

    btn.addEventListener("click", () => {
      const next = document.body.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(storageKey, next);
      setTheme(next, btn);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
