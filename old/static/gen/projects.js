(() => {
  // js/projects.ts
  document.addEventListener("DOMContentLoaded", function() {
    const forms = document.querySelectorAll('form[action*="toggle_feedback"]');
    forms.forEach((form) => {
      form.addEventListener("submit", function(e) {
        e.preventDefault();
        const feedbackId = this.action.split("/").pop();
        const statusElement = document.getElementById(`status-${feedbackId}`);
        const button = this.querySelector("button");
        fetch(this.action, {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest"
          }
        }).then(() => {
          if (statusElement?.textContent?.trim() === "Open") {
            statusElement.textContent = "Resolved";
            button.textContent = "Mark Unresolved";
            button.className = "btn btn-resolved";
          } else {
            statusElement.textContent = "Open";
            button.textContent = "Mark Resolved";
            button.className = "btn btn-open";
          }
        }).catch((error) => console.error("Error:", error));
      });
    });
    const messageForms = document.querySelectorAll('form[action*="toggle_message"]');
    messageForms.forEach((form) => {
      form.addEventListener("submit", function(e) {
        e.preventDefault();
        const messageId = this.action.split("/").pop();
        const messageRow = document.getElementById(`message-${messageId}`);
        fetch(this.action, {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest"
          }
        }).then(() => {
          if (messageRow) {
            messageRow.classList.add("hidden");
          }
        }).catch((error) => console.error("Error:", error));
      });
    });
  });
})();
//# sourceMappingURL=projects.js.map
