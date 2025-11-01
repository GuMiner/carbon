import "../scss/gen/chat.css";

document.addEventListener('DOMContentLoaded', () => {
    const chatOutput = document.getElementById('chatOutput')!;
    const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
    const sendButton = document.getElementById('sendButton')!;

    // Function to add a message to the chat
    function addMessage(text: string, isUser: boolean) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.textContent = text;
        chatOutput.appendChild(messageDiv);
        chatOutput.scrollTop = chatOutput.scrollHeight;
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
            const response = await fetch('/projects/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            
            // Add bot response to chat
            if (data.response) {
                addMessage(data.response, false);
            } else {
                addMessage('Error: Could not get response', false);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addMessage('Error: Could not send message', false);
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});