document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission with AJAX to prevent full page reload
    const forms = document.querySelectorAll('form[action*="toggle_feedback"]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e: Event) {
            e.preventDefault();
            
            const feedbackId = this.action.split('/').pop();
            const statusElement = document.getElementById(`status-${feedbackId}`);
            const button = this.querySelector('button');
            
            fetch(this.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(() => {
                // Toggle the status display
                if (statusElement?.textContent?.trim() === 'Open') {
                    statusElement.textContent = 'Resolved';
                    button!.textContent = 'Mark Unresolved';
                    button!.className = 'btn btn-resolved';
                } else {
                    statusElement!.textContent = 'Open';
                    button!.textContent = 'Mark Resolved';
                    button!.className = 'btn btn-open';
                }
            })
            .catch(error => console.error('Error:', error));
        });
    });
});