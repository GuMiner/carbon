import "../scss/gen/chat.css";

document.addEventListener('DOMContentLoaded', () => {
    const chatOutput = document.getElementById('chatOutput')!;
    const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
    const sendButton = document.getElementById('sendButton')!;
    const pendingCountElement = document.getElementById('pendingCount')!;

    // Queue to store job IDs
    let jobQueue: string[] = [];

    // Function to add a message to the chat
    function addMessage(text: string, isUser: boolean) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.textContent = text;
        chatOutput.appendChild(messageDiv);
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }

    // Function to update job count display
    function updateJobCount(count: number, userCount: number) {
        pendingCountElement.textContent = `${userCount.toString()} pending, ${count.toString()} total for all users`;
    }

    // Function to fetch and display job count
    async function fetchJobCount() {
        try {
            const response = await fetch('/jobs/count');
            const data = await response.json();
            updateJobCount(data.pendingJobs, data.pendingUserJobs);
        } catch (error) {
            console.error('Error fetching job count:', error);
        }
    }

    // Function to poll job status
    async function pollJobStatus(jobId: string) {
        try {
            const response = await fetch(`/jobs/${jobId}`);
            const jobData = await response.json();
            
            if (jobData.status === 'PASS' || jobData.status === 'FAIL') {
                // Remove job from queue
                jobQueue = jobQueue.filter(id => id !== jobId);
                
                // Add job result message
                addMessage(`Job ${jobId} ${jobData.status}`, false);
                
                // Stub for reading job JSON data
                // This would typically parse and display job details
                // For now, we'll just show a placeholder message
                addMessage(`Job details: ${JSON.stringify(jobData)}`, false);
            } else {
                addMessage(`Job ${jobId} still pending...`, false);
            }
        } catch (error) {
            console.error(`Error polling job ${jobId}:`, error);
        }
    }

    // Function to send a message
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, true);
        messageInput.value = '';

        try {
            // Send message to backend
            const response = await fetch('/jobs/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            
            // Add bot response to chat
            if (data.jobId) {
                addMessage(`Job ${data.jobId} submitted. Waiting for a reply...`, false);
                jobQueue.push(data.jobId);
            } else {
                addMessage('Error: Could not get response', false);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addMessage('Error: Could not send message', false);
        }
    }

    // Poll jobs every 5 seconds
    setInterval(() => {
        jobQueue.forEach(jobId => {
            pollJobStatus(jobId);
        });
    }, 5000);

    // Event listeners
    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Initialize job count
    fetchJobCount();
    setInterval(fetchJobCount, 10000);
});