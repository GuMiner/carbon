(() => {
  // js/index.ts
  var themeKey = "carbonTheme";
  var themeToggle = "themeToggle";
  var isDarkMode = null;
  function toggleTheme() {
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "light");
      window.localStorage.setItem(themeKey, "1");
      document.getElementById(themeToggle).textContent = "Dark Mode";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      window.localStorage.setItem(themeKey, "0");
      document.getElementById(themeToggle).textContent = "Light Mode";
    }
    isDarkMode = !isDarkMode;
  }
  window.toggleTheme = toggleTheme;
  window.addEventListener("load", () => {
    var buttonTitle = "Dark Mode";
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      isDarkMode = true;
      buttonTitle = "Light Mode";
    } else {
      isDarkMode = false;
    }
    document.getElementById(themeToggle).textContent = buttonTitle;
    var theme = window.localStorage.getItem(themeKey);
    if (theme == "0" && !isDarkMode || theme == "1" && isDarkMode) {
      toggleTheme();
    }
  });
})();
//# sourceMappingURL=index.js.map
