// Swap from light to dark mode on-demand
var isDarkMode: boolean | null = null;
function toggleTheme() {
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'light')
        window.localStorage.setItem("lithiumTheme", "1");

        document.getElementById("themeToggle")!.textContent = "Dark Mode";
    } else {
        document.documentElement.setAttribute('data-theme', 'dark')
        window.localStorage.setItem("lithiumTheme", "0");

        document.getElementById("themeToggle")!.textContent = "Light Mode";
    }

    isDarkMode = !isDarkMode;
}
(window as any).toggleTheme = toggleTheme;

window.addEventListener('load', () =>
{    
    // Figure out the current theme for the button text
    var buttonTitle = "Dark Mode";
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDarkMode = true;
        buttonTitle = "Light Mode";
    } else {
        isDarkMode = false;
    }
    document.getElementById("themeToggle")!.textContent = buttonTitle;

    var theme = window.localStorage.getItem("lithiumTheme")
    if ((theme == "0" && !isDarkMode) || (theme == "1" && isDarkMode))
    {
        // Use saved settings to reset theme
        toggleTheme();
    }
});
