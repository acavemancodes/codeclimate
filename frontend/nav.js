// Register popup handling
const openPopupBtn = document.getElementById("openPopup");
const closePopupBtn = document.getElementById("closePopup");
const popupOverlay = document.getElementById("popupOverlay");
const registerForm = document.getElementById("registerForm");

if (openPopupBtn && popupOverlay) {
  openPopupBtn.addEventListener("click", function (e) {
    e.preventDefault();
    popupOverlay.style.display = "flex";
  });
}

if (closePopupBtn && popupOverlay) {
  closePopupBtn.addEventListener("click", function () {
    popupOverlay.style.display = "none";
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    let username = document.getElementById("username").value;
    alert("Registration Successful!\nWelcome, " + username + "!");
    popupOverlay.style.display = "none";
    registerForm.reset();
  });
}

// Navigation handling
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const sectionId = this.getAttribute("data-section");

    // Hide all sections
    document.querySelectorAll(".content-section").forEach((sec) => {
      sec.style.display = "none";
    });

    // Show selected section
    document.getElementById(sectionId).style.display = "block";

    // Initialize Ace editor only once
    if (sectionId === "contests" && !window.aceInitialized) {
      const aceEditor = ace.edit("editor", {
        theme: "ace/theme/monokai",
        mode: "ace/mode/python",
      });
      window.aceInitialized = true;

      const langMap = {
        71: "python",
        54: "c_cpp",
        50: "c_cpp",      // Added C
        62: "java",
        63: "javascript",
      };

      const langSel = document.getElementById("language");
      if (langSel) {
        langSel.addEventListener("change", function () {
          const mode = langMap[this.value] || "text";
          aceEditor.session.setMode("ace/mode/" + mode);
        });
      }

      const runBtn = document.getElementById("runBtn");
      if (runBtn) {
        runBtn.addEventListener("click", function () {
          const source_code = aceEditor.getValue();
          const language_id = langSel.value;

          fetch(
            "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": "7154fb5b03msh0ca3b89d144c208p190cfdjsn3cbb49bce032",
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
              },
              body: JSON.stringify({
                source_code: source_code,
                language_id: language_id,
              }),
            }
          )
            .then((response) => response.json())
            .then((data) => {
              document.getElementById("output").textContent =
                data.stdout ||
                data.stderr ||
                data.compile_output ||
                "No output";
            })
            .catch((err) => {
              document.getElementById("output").textContent = "Error: " + err;
            });
        });
      }
    }
  });
});
