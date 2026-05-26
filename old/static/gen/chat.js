(() => {
  // js/chat.ts
  document.addEventListener("DOMContentLoaded", () => {
    const chatOutput = document.getElementById("chatOutput");
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const pendingCountElement = document.getElementById("pendingCount");
    let jobQueue = [];
    function addMessage(text, isUser) {
      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${isUser ? "user" : "bot"}`;
      messageDiv.textContent = text;
      chatOutput.appendChild(messageDiv);
      chatOutput.scrollTop = chatOutput.scrollHeight;
    }
    function updateJobCount(count, userCount) {
      pendingCountElement.textContent = `${userCount.toString()} pending, ${count.toString()} total for all users`;
    }
    async function fetchJobCount() {
      try {
        const response = await fetch("/jobs/count");
        const data = await response.json();
        updateJobCount(data.pendingJobs, data.pendingUserJobs);
      } catch (error) {
        console.error("Error fetching job count:", error);
      }
    }
    async function pollJobStatus(jobId) {
      try {
        const response = await fetch(`/jobs/${jobId}`);
        const jobData = await response.json();
        if (jobData.status === "PASS" || jobData.status === "FAIL") {
          jobQueue = jobQueue.filter((id) => id !== jobId);
          addMessage(`Job ${jobId} ${jobData.status}`, false);
          addMessage(`Job details: ${JSON.stringify(jobData)}`, false);
        } else {
          addMessage(`Job ${jobId} still pending...`, false);
        }
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
      }
    }
    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message) return;
      addMessage(message, true);
      messageInput.value = "";
      try {
        const response = await fetch("/jobs/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message })
        });
        const data = await response.json();
        if (data.jobId) {
          addMessage(`Job ${data.jobId} submitted. Waiting for a reply...`, false);
          jobQueue.push(data.jobId);
        } else {
          addMessage("Error: Could not get response", false);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        addMessage("Error: Could not send message", false);
      }
    }
    setInterval(() => {
      jobQueue.forEach((jobId) => {
        pollJobStatus(jobId);
      });
    }, 5e3);
    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    fetchJobCount();
    setInterval(fetchJobCount, 1e4);
  });
})();
//# sourceMappingURL=chat.js.map
