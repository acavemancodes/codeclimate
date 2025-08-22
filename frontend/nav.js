// Register popup handling
const openPopupBtn = document.getElementById('openPopup');
const closePopupBtn = document.getElementById('closePopup');
const popupOverlay = document.getElementById('popupOverlay');
const registerForm = document.getElementById('registerForm');

if (openPopupBtn && popupOverlay) {
  openPopupBtn.addEventListener('click', function(e) {
    e.preventDefault();
    popupOverlay.style.display = 'flex';
  });
}

if (closePopupBtn && popupOverlay) {
  closePopupBtn.addEventListener('click', function() {
    popupOverlay.style.display = 'none';
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let username = document.getElementById('username').value;
    alert("Registration Successful!\nWelcome, " + username + "!");
    popupOverlay.style.display = 'none';
    registerForm.reset();
  });
}

// Navigation handling
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();

    const sectionId = this.getAttribute('data-section');

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.style.display = 'none';
    });

    // Show selected section
    document.getElementById(sectionId).style.display = 'block';

    // Initialize Ace editor only once
    if (sectionId === 'contests' && !window.aceInitialized) {
      ace.edit("editor", {
        theme: "ace/theme/monokai",
        mode: "ace/mode/javascript"
      });
      window.aceInitialized = true;
    }
  });
});
