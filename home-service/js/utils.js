// Add this function at the beginning of your <script> tags in HTML files
// OR create a js/ui.js and link it.

function showModernAlert(message, title = "提示", type = "info") { // type can be 'info', 'success', 'error', 'warning'
    // Remove existing alert if any to prevent stacking
    const existingAlert = document.getElementById('modernAlertOverlay');
    if (existingAlert) {
        existingAlert.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'modernAlertOverlay';
    overlay.className = 'modern-alert-overlay';

    const alertBox = document.createElement('div');
    alertBox.className = 'modern-alert-box';

    // Optional Icon
    const alertIcon = document.createElement('i');
    alertIcon.className = 'fas alert-icon'; // Font Awesome icon
    switch(type) {
        case 'success':
            alertIcon.classList.add('fa-check-circle', 'success');
            break;
        case 'error':
            alertIcon.classList.add('fa-times-circle', 'error');
            break;
        case 'warning':
            alertIcon.classList.add('fa-exclamation-triangle', 'warning');
            break;
        case 'info':
        default:
            alertIcon.classList.add('fa-info-circle', 'info'); // Default or info
            break;
    }
    alertBox.appendChild(alertIcon);


    const alertTitle = document.createElement('h3');
    alertTitle.className = 'alert-title'; // Added class
    alertTitle.textContent = title;

    const alertMessage = document.createElement('p');
    alertMessage.className = 'alert-message'; // Added class
    alertMessage.innerHTML = message; // Use innerHTML to allow simple HTML like <br> or <strong>

    const closeButton = document.createElement('button');
    closeButton.className = 'modern-alert-button';
    closeButton.textContent = '确定';

    closeButton.onclick = function() {
        overlay.classList.remove('visible');
        // Remove from DOM after transition
        overlay.addEventListener('transitionend', function(e) {
            if (e.propertyName === 'opacity' && !overlay.classList.contains('visible')) {
                overlay.remove();
            }
        });
    };

    alertBox.appendChild(alertTitle);
    alertBox.appendChild(alertMessage);
    alertBox.appendChild(closeButton);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay); // Append to body to ensure it covers everything

    // Trigger reflow to apply initial styles (opacity: 0, transform: scale(0.9))
    // before adding 'visible' class for the transition to work.
    void overlay.offsetWidth;

    overlay.classList.add('visible');
    closeButton.focus(); // For accessibility
}