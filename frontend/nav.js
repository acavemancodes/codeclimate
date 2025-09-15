// Theme Management
let currentTheme = localStorage.getItem('theme') || 'light';

function initTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  updateThemeIcon();
  updateAceEditorTheme();
}

function updateThemeIcon() {
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
  }
}

function updateAceEditorTheme() {
  if (window.aceEditor) {
    const theme = currentTheme === 'light' ? 'ace/theme/github' : 'ace/theme/monokai';
    window.aceEditor.setTheme(theme);
  }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', initTheme);

// Theme toggle button event listener
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Auth UI bindings
  const loginBtn = document.getElementById('loginBtn');
  const overlay = document.getElementById('authOverlay');
  const authClose = document.getElementById('authClose');
  const tabs = document.querySelectorAll('#authOverlay .tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTitle = document.getElementById('authTitle');

  if (loginBtn && overlay) {
    loginBtn.addEventListener('click', () => {
      overlay.style.display = 'flex';
      switchAuthTab('login');
    });
  }
  if (authClose && overlay) {
    authClose.addEventListener('click', () => overlay.style.display = 'none');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
  }
  tabs.forEach(tab => tab.addEventListener('click', () => switchAuthTab(tab.getAttribute('data-tab'))));

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;
      const users = getUsersMap();
      const user = users[email];
      if (!user || !verifyPassword(user, password)) {
        alert('Invalid email or password');
        return;
      }
      setCurrentUser(email);
      overlay.style.display = 'none';
      refreshAuthHeader();
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const pw1 = document.getElementById('regPassword').value;
      const pw2 = document.getElementById('regPassword2').value;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { alert('Enter a valid email'); return; }
      if (pw1.length < 6) { alert('Password must be at least 6 characters'); return; }
      if (pw1 !== pw2) { alert('Passwords do not match'); return; }
      const users = getUsersMap();
      if (users[email]) { alert('Account already exists'); return; }
      users[email] = createUserRecord(email, pw1);
      setUsersMap(users);
      setCurrentUser(email);
      overlay.style.display = 'none';
      refreshAuthHeader();
    });
  }

  // Render header state at load
  refreshAuthHeader();

  function switchAuthTab(type) {
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === type));
    if (authTitle) authTitle.textContent = type === 'login' ? 'Login' : 'Register';
    if (loginForm) loginForm.style.display = type === 'login' ? 'flex' : 'none';
    if (registerForm) registerForm.style.display = type === 'register' ? 'flex' : 'none';
  }
});

// ---------------- AUTH STORAGE ----------------
function getUsersMap() {
  try { return JSON.parse(localStorage.getItem('cc_users') || '{}'); } catch { return {}; }
}
function setUsersMap(map) { localStorage.setItem('cc_users', JSON.stringify(map)); }
function getCurrentUserEmail() { return localStorage.getItem('cc_current_user') || null; }
function setCurrentUser(email) { localStorage.setItem('cc_current_user', email); }
function logoutCurrentUser() { localStorage.removeItem('cc_current_user'); }

function createUserRecord(email, password) {
  const salt = Math.random().toString(36).slice(2);
  const hash = simpleHash(password + salt);
  return {
    email,
    salt,
    hash,
    profile: { totalScore: 0, perQuestion: {} }
  };
}

function verifyPassword(user, password) {
  return user.hash === simpleHash(password + user.salt);
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return String(h);
}

// ---------------- AUTH HEADER UI ----------------
function refreshAuthHeader() {
  const email = getCurrentUserEmail();
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;
  const parent = loginBtn.parentElement;
  if (!parent) return;
  // Remove any existing state chips
  const old = parent.querySelector('.auth-state');
  if (old) old.remove();
  const oldLogout = parent.querySelector('#logoutBtn');
  if (oldLogout) oldLogout.remove();

  if (email) {
    loginBtn.style.display = 'none';
    const chip = document.createElement('span');
    chip.className = 'auth-state';
    chip.textContent = email;
    chip.style.padding = '6px 10px';
    chip.style.border = '1px solid var(--border-light)';
    chip.style.borderRadius = '999px';
    chip.style.background = 'var(--bg-secondary)';
    chip.style.color = 'var(--text-secondary)';
    parent.appendChild(chip);

    const logout = document.createElement('button');
    logout.id = 'logoutBtn';
    logout.className = 'auth-btn';
    logout.textContent = 'Logout';
    logout.addEventListener('click', () => { logoutCurrentUser(); refreshAuthHeader(); });
    parent.appendChild(logout);
  } else {
    loginBtn.style.display = 'inline-block';
  }
}

// ---------------- SCORE PERSISTENCE ----------------
function updateUserScore(questionId, score) {
  const email = getCurrentUserEmail();
  if (!email) return; // silently ignore if not logged in
  const users = getUsersMap();
  const user = users[email];
  if (!user) return;
  user.profile.perQuestion[String(questionId)] = score;
  const total = Object.values(user.profile.perQuestion).reduce((a, b) => a + Number(b || 0), 0);
  user.profile.totalScore = total;
  setUsersMap(users);
}

// Contest Data
const contestData = {
  questions: [
    {
      id: 1,
      title: "Sum of Two Numbers",
      description: "Given two integers A and B, print their sum.",
      input: "Two integers A and B (1 ≤ A, B ≤ 1000).",
      output: "Print the sum of A and B.",
      sampleInput: "2 3",
      sampleOutput: "5",
      testCases: [
        { input: "2 3", expected: "5" },
        { input: "10 20", expected: "30" },
        { input: "100 200", expected: "300" },
        { input: "1 1", expected: "2" },
        { input: "999 1", expected: "1000" },
        { input: "0 0", expected: "0" },
        { input: "50 50", expected: "100" },
        { input: "123 456", expected: "579" },
        { input: "777 333", expected: "1110" },
        { input: "1 999", expected: "1000" }
      ]
    },
    {
      id: 2,
      title: "Maximum of Three Numbers",
      description: "Given three integers A, B, and C, find and print the maximum among them.",
      input: "Three integers A, B, and C (1 ≤ A, B, C ≤ 1000).",
      output: "Print the maximum of the three numbers.",
      sampleInput: "10 20 15",
      sampleOutput: "20",
      testCases: [
        { input: "10 20 15", expected: "20" },
        { input: "1 2 3", expected: "3" },
        { input: "100 50 75", expected: "100" },
        { input: "5 5 5", expected: "5" },
        { input: "999 1 500", expected: "999" },
        { input: "1 999 500", expected: "999" },
        { input: "1 500 999", expected: "999" },
        { input: "100 200 300", expected: "300" },
        { input: "50 100 25", expected: "100" },
        { input: "1 1 2", expected: "2" }
      ]
    },
    {
      id: 3,
      title: "Factorial",
      description: "Given an integer N, calculate and print N! (N factorial).",
      input: "An integer N (1 ≤ N ≤ 10).",
      output: "Print N! (N factorial).",
      sampleInput: "5",
      sampleOutput: "120",
      testCases: [
        { input: "5", expected: "120" },
        { input: "1", expected: "1" },
        { input: "2", expected: "2" },
        { input: "3", expected: "6" },
        { input: "4", expected: "24" },
        { input: "6", expected: "720" },
        { input: "7", expected: "5040" },
        { input: "8", expected: "40320" },
        { input: "9", expected: "362880" },
        { input: "10", expected: "3628800" }
      ]
    }
  ],
  currentQuestion: 1,
  timeRemaining: 3600, // 60 minutes in seconds
  testResults: {} // Store test results for each question
};

// Contest Timer
let timerInterval;

function startTimer() {
  timerInterval = setInterval(() => {
    contestData.timeRemaining--;
    updateTimerDisplay();
    
    if (contestData.timeRemaining <= 0) {
      clearInterval(timerInterval);
      alert("Time's up! Contest ended.");
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(contestData.timeRemaining / 60);
  const seconds = contestData.timeRemaining % 60;
  const timerElement = document.getElementById("timer");
  const progressElement = document.getElementById("progress");
  
  if (timerElement) {
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  if (progressElement) {
    const totalTime = 3600; // 60 minutes
    const progress = (contestData.timeRemaining / totalTime) * 100;
    progressElement.style.width = `${progress}%`;
  }
}

// Scoring System
let totalScore = 0;
let questionScores = { 1: 0, 2: 0, 3: 0 };

function updateScore() {
  const totalScoreElement = document.getElementById("total-score");
  if (totalScoreElement) {
    totalScoreElement.textContent = totalScore;
  }
}

function calculateQuestionScore(questionId) {
  const question = contestData.questions.find(q => q.id === questionId);
  if (!question) return 0;
  
  const testCaseElements = document.querySelectorAll(`#test-cases-results .test-case`);
  let passedCount = 0;
  
  testCaseElements.forEach(element => {
    if (element.classList.contains("passed")) {
      passedCount++;
    }
  });
  
  // Each test case is worth 10 points, so max 100 points per question
  const questionScore = Math.round((passedCount / question.testCases.length) * 100);
  questionScores[questionId] = questionScore;
  
  // Recalculate total score
  totalScore = Object.values(questionScores).reduce((sum, score) => sum + score, 0);
  
  updateScore();
  // Persist to user profile if logged in
  updateUserScore(questionId, questionScores[questionId]);
  return questionScore;
}

// Contest Functions
function loadQuestion(questionId) {
  // Handle admin panel
  if (questionId === 'admin') {
    showAdminPanel();
    return;
  }
  
  hideAdminPanel();
  
  const question = contestData.questions.find(q => q.id === questionId);
  if (!question) return;

  contestData.currentQuestion = questionId;
  
  // Update question content
  const questionContent = document.getElementById("question-content");
  if (questionContent) {
    questionContent.innerHTML = `
      <h3>${question.title}</h3>
      <p><strong>Description:</strong> ${question.description}</p>
      <p><strong>Input:</strong> ${question.input}</p>
      <p><strong>Output:</strong> ${question.output}</p>
      <div class="sample-io">
        <h5>Sample Input:</h5>
        <pre>${question.sampleInput}</pre>
        <h5>Sample Output:</h5>
        <pre>${question.sampleOutput}</pre>
      </div>
    `;
  }

  // Update current question display
  const currentQuestionElement = document.getElementById("current-question");
  if (currentQuestionElement) {
    currentQuestionElement.textContent = questionId;
  }

  // Update question tabs
  document.querySelectorAll(".question-tab").forEach(tab => {
    tab.classList.remove("active");
    if (tab.getAttribute("data-question") == questionId) {
      tab.classList.add("active");
    }
  });

  // Load test case results for this question
  loadTestCases(questionId);
}

function showAdminPanel() {
  const questionContent = document.getElementById("question-content");
  const adminPanel = document.getElementById("admin-panel");
  
  if (questionContent) questionContent.style.display = "none";
  if (adminPanel) adminPanel.style.display = "block";
  
  // Update question tabs
  document.querySelectorAll(".question-tab").forEach(tab => {
    tab.classList.remove("active");
    if (tab.getAttribute("data-question") === "admin") {
      tab.classList.add("active");
    }
  });
}

function hideAdminPanel() {
  const questionContent = document.getElementById("question-content");
  const adminPanel = document.getElementById("admin-panel");
  
  if (questionContent) questionContent.style.display = "block";
  if (adminPanel) adminPanel.style.display = "none";
}

function loadTestCases(questionId) {
  const testCasesContainer = document.getElementById("test-cases-results");
  if (!testCasesContainer) return;

  const question = contestData.questions.find(q => q.id === questionId);
  if (!question) return;

  testCasesContainer.innerHTML = "";
  
  question.testCases.forEach((testCase, index) => {
    const testCaseElement = document.createElement("div");
    testCaseElement.className = "test-case pending";
    testCaseElement.textContent = `Test ${index + 1}`;
    testCaseElement.setAttribute("data-test", index);
    testCasesContainer.appendChild(testCaseElement);
  });

  // Update test cases passed count
  updateTestCasesPassed();
}

function updateTestCasesPassed() {
  const questionId = contestData.currentQuestion;
  const question = contestData.questions.find(q => q.id === questionId);
  if (!question) return;

  let passedCount = 0;
  const testCaseElements = document.querySelectorAll(`#test-cases-results .test-case`);
  
  testCaseElements.forEach(element => {
    if (element.classList.contains("passed")) {
      passedCount++;
    }
  });

  const testCasesPassedElement = document.getElementById("test-cases-passed");
  if (testCasesPassedElement) {
    testCasesPassedElement.textContent = passedCount;
  }
  
  // Update score when test cases change
  calculateQuestionScore(questionId);
}

async function runTestCases() {
  const aceEditor = window.aceEditor;
  const languageId = document.getElementById("language").value;
  const sourceCode = aceEditor.getValue();
  
  if (!sourceCode.trim()) {
    alert("Please write some code first!");
    return;
  }

  const question = contestData.questions.find(q => q.id === contestData.currentQuestion);
  if (!question) return;

  // Clear previous results
  const testCaseElements = document.querySelectorAll("#test-cases-results .test-case");
  testCaseElements.forEach(element => {
    element.className = "test-case pending";
  });

  // Run each test case
  for (let i = 0; i < question.testCases.length; i++) {
    const testCase = question.testCases[i];
    const testCaseElement = testCaseElements[i];
    
    if (testCaseElement) {
      testCaseElement.className = "test-case running";
    }

    try {
      const result = await executeCode(sourceCode, languageId, testCase.input);
      const isPassed = result.trim() === testCase.expected.trim();
      
      if (testCaseElement) {
        testCaseElement.className = `test-case ${isPassed ? 'passed' : 'failed'}`;
      }
    } catch (error) {
      if (testCaseElement) {
        testCaseElement.className = "test-case failed";
      }
    }
  }

  updateTestCasesPassed();
}

async function executeCode(sourceCode, languageId, input) {
  const response = await fetch(
    "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": "7154fb5b03msh0ca3b89d144c208p190cfdjsn3cbb49bce032",
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin: input,
      }),
    }
  );

  const data = await response.json();
  return data.stdout || data.stderr || data.compile_output || "";
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
    const sectionEl = document.getElementById(sectionId);
    if (sectionEl) sectionEl.style.display = "block";
    updateActiveNav(sectionId);

    // Initialize contest functionality
    if (sectionId === "contests") {
      // Start timer if not already started
      if (!timerInterval) {
        startTimer();
      }

      // Load first question
      loadQuestion(1);

    // Initialize Ace editor only once
      if (!window.aceInitialized) {
      const aceEditor = ace.edit("editor", {
          theme: currentTheme === 'light' ? "ace/theme/github" : "ace/theme/monokai",
        mode: "ace/mode/python",
          fontSize: 14,
          showPrintMargin: false,
          showGutter: true,
          highlightActiveLine: true,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
        });
        window.aceEditor = aceEditor;
      window.aceInitialized = true;

      const langMap = {
        71: "python",
        54: "c_cpp",
          50: "c_cpp",
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

        // Run button - run single test
      const runBtn = document.getElementById("runBtn");
      if (runBtn) {
          runBtn.addEventListener("click", async function () {
            const sourceCode = aceEditor.getValue();
            const languageId = langSel.value;
            const input = contestData.questions.find(q => q.id === contestData.currentQuestion)?.sampleInput || "";

            try {
              const result = await executeCode(sourceCode, languageId, input);
              document.getElementById("output").textContent = result;
            } catch (err) {
              document.getElementById("output").textContent = "Error: " + err;
            }
          });
        }

        // Submit button - run all test cases
        const submitBtn = document.getElementById("submitBtn");
        if (submitBtn) {
          submitBtn.addEventListener("click", runTestCases);
        }

        // Question tab switching
        document.querySelectorAll(".question-tab").forEach(tab => {
          tab.addEventListener("click", function() {
            const questionId = this.getAttribute("data-question");
            if (questionId === "admin") {
              loadQuestion("admin");
            } else {
              loadQuestion(parseInt(questionId));
            }
          });
        });

        // Admin panel functionality
        const adminQuestionSelect = document.getElementById("admin-question-select");
        const loadTestCasesBtn = document.getElementById("load-test-cases");
        const saveTestCasesBtn = document.getElementById("save-test-cases");
        const addTestCaseBtn = document.getElementById("add-test-case");
        const testCasesList = document.getElementById("test-cases-list");

        if (loadTestCasesBtn) {
          loadTestCasesBtn.addEventListener("click", function() {
            const questionId = parseInt(adminQuestionSelect.value);
            loadAdminTestCases(questionId);
          });
        }

        if (saveTestCasesBtn) {
          saveTestCasesBtn.addEventListener("click", function() {
            const questionId = parseInt(adminQuestionSelect.value);
            saveAdminTestCases(questionId);
          });
        }

        if (addTestCaseBtn) {
          addTestCaseBtn.addEventListener("click", function() {
            addTestCase();
          });
        }
      }
    }

    // Initialize problemset functionality
    if (sectionId === "problemset") {
      initProblemset();
    }
  });
});

// Highlight active nav item like Codeforces
function updateActiveNav(sectionId) {
  document.querySelectorAll('.top-nav li').forEach(li => li.classList.remove('active'));
  const link = document.querySelector(`.top-nav .nav-link[data-section="${sectionId}"]`);
  if (link && link.parentElement && link.parentElement.tagName === 'LI') {
    link.parentElement.classList.add('active');
  }
}

// Admin Panel Functions
function loadAdminTestCases(questionId) {
  const question = contestData.questions.find(q => q.id === questionId);
  if (!question) return;

  const adminCurrentQuestion = document.getElementById("admin-current-question");
  if (adminCurrentQuestion) {
    adminCurrentQuestion.textContent = questionId;
  }

  const testCasesList = document.getElementById("test-cases-list");
  if (!testCasesList) return;

  testCasesList.innerHTML = "";
  
  question.testCases.forEach((testCase, index) => {
    const testCaseDiv = document.createElement("div");
    testCaseDiv.className = "test-case-item";
    testCaseDiv.innerHTML = `
      <input type="text" value="${testCase.input}" placeholder="Input" class="test-input">
      <input type="text" value="${testCase.expected}" placeholder="Expected Output" class="test-expected">
      <button class="remove-test-case" onclick="removeTestCase(this)">Remove</button>
    `;
    testCasesList.appendChild(testCaseDiv);
  });
}

function saveAdminTestCases(questionId) {
  const question = contestData.questions.find(q => q.id === questionId);
  if (!question) return;

  const testInputs = document.querySelectorAll(".test-input");
  const testExpecteds = document.querySelectorAll(".test-expected");
  
  question.testCases = [];
  
  for (let i = 0; i < testInputs.length; i++) {
    const input = testInputs[i].value.trim();
    const expected = testExpecteds[i].value.trim();
    
    if (input && expected) {
      question.testCases.push({ input, expected });
    }
  }
  
  alert(`Test cases saved for Question ${questionId}!`);
}

function addTestCase() {
  const testCasesList = document.getElementById("test-cases-list");
  if (!testCasesList) return;

  const testCaseDiv = document.createElement("div");
  testCaseDiv.className = "test-case-item";
  testCaseDiv.innerHTML = `
    <input type="text" placeholder="Input" class="test-input">
    <input type="text" placeholder="Expected Output" class="test-expected">
    <button class="remove-test-case" onclick="removeTestCase(this)">Remove</button>
  `;
  testCasesList.appendChild(testCaseDiv);
}

function removeTestCase(button) {
  button.parentElement.remove();
}

// -------------------- PROBLEMSET --------------------
let problemsetState = {
  loaded: false,
  items: [],
  topics: [],
  companies: [],
  selectedCompanies: new Set(),
};

function getProgressMap() {
  try {
    return JSON.parse(localStorage.getItem('cc_problem_progress') || '{}');
  } catch (_) {
    return {};
  }
}

function setProgressMap(map) {
  localStorage.setItem('cc_problem_progress', JSON.stringify(map));
}

async function initProblemset() {
  if (!problemsetState.loaded) {
    const res = await fetch('questions_data.json');
    const data = await res.json();
    // Normalize items
    const items = data.map((q, idx) => ({
      id: idx, // stable index id
      title: q['Question'] || '',
      difficulty: q['Difficulty'] || '',
      link: q['Link of Question'] || '#',
      topics: (q['Topics'] || '').split(',').map(t => t.trim()).filter(Boolean),
      frequency: Number(q['Frequency (Number of Companies)'] || 0),
      companies: q['Companies Asking This Question'] || ''
    }));
    const topicSet = new Set();
    const companySet = new Set();
    items.forEach(it => it.topics.forEach(t => topicSet.add(t)));
    items.forEach(it => (it.companies || '').split(',').forEach(c => { const v = c.trim(); if (v) companySet.add(v); }));
    problemsetState.items = items;
    problemsetState.topics = Array.from(topicSet).sort();
    problemsetState.companies = Array.from(companySet).sort();
    problemsetState.loaded = true;
    renderTopics();
    renderCompanies();
  }
  attachProblemsetHandlers();
  renderProblemset();
}

function renderTopics() {
  const container = document.getElementById('ps-topics');
  if (!container) return;
  container.innerHTML = '';
  problemsetState.topics.forEach(topic => {
    const btn = document.createElement('button');
    btn.className = 'topic-chip';
    btn.textContent = topic;
    btn.setAttribute('data-topic', topic);
    btn.addEventListener('click', () => {
      const search = document.getElementById('ps-search');
      if (search) {
        search.value = `topic:${topic}`;
        renderProblemset();
      }
    });
    container.appendChild(btn);
  });
}

function attachProblemsetHandlers() {
  const search = document.getElementById('ps-search');
  const diff = document.getElementById('ps-difficulty');
  const prog = document.getElementById('ps-progress');
  const compToggle = document.getElementById('ps-company-toggle');
  if (search && !search._bound) {
    search._bound = true;
    search.addEventListener('input', debounce(renderProblemset, 200));
  }
  if (diff && !diff._bound) {
    diff._bound = true;
    diff.addEventListener('change', renderProblemset);
  }
  if (prog && !prog._bound) {
    prog._bound = true;
    prog.addEventListener('change', renderProblemset);
  }
  if (compToggle && !compToggle._bound) {
    compToggle._bound = true;
    compToggle.addEventListener('click', () => {
      const panel = document.getElementById('ps-companies');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }
}

function parseSearchQuery(q) {
  const query = (q || '').trim().toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  const filters = { text: [], topic: [], company: [] };
  terms.forEach(t => {
    if (t.startsWith('topic:')) {
      const val = t.slice(6).trim();
      if (val) filters.topic.push(val);
    } else if (t.startsWith('company:')) {
      const val = t.slice(8).trim();
      if (val) filters.company.push(val);
    } else {
      filters.text.push(t);
    }
  });
  return filters;
}

function renderProblemset() {
  const list = document.getElementById('ps-list');
  const stats = document.getElementById('ps-stats');
  if (!list) return;
  const search = document.getElementById('ps-search');
  const diff = document.getElementById('ps-difficulty');
  const prog = document.getElementById('ps-progress');
  const progressMap = getProgressMap();

  const filters = parseSearchQuery(search ? search.value : '');
  const difficulty = diff ? diff.value : '';
  const progressFilter = prog ? prog.value : '';
  const selectedCompanies = Array.from(problemsetState.selectedCompanies);

  let items = problemsetState.items;
  if (difficulty) {
    items = items.filter(i => i.difficulty === difficulty);
  }
  if (filters.text.length) {
    items = items.filter(i => {
      const hay = `${i.title} ${i.topics.join(' ')}`.toLowerCase();
      return filters.text.every(t => hay.includes(t));
    });
  }
  if (filters.topic.length) {
    items = items.filter(i => filters.topic.every(t => i.topics.map(x=>x.toLowerCase()).includes(t)));
  }
  if (filters.company.length) {
    items = items.filter(i => filters.company.every(c => (i.companies || '').toLowerCase().includes(c)));
  }
  if (selectedCompanies.length) {
    items = items.filter(i => {
      const hay = (i.companies || '').toLowerCase();
      // OR over selected
      return selectedCompanies.some(c => hay.includes(c.toLowerCase()));
    });
  }
  if (progressFilter) {
    items = items.filter(i => (progressMap[i.id] || 'todo') === progressFilter);
  }

  // Stats
  if (stats) {
    const done = Object.values(progressMap).filter(v => v === 'done').length;
    const inprog = Object.values(progressMap).filter(v => v === 'in_progress').length;
    stats.textContent = `showing ${items.length} / ${problemsetState.items.length} • done ${done} • in progress ${inprog}`;
  }

  list.innerHTML = '';
  const frag = document.createDocumentFragment();
  items.forEach(i => {
    const card = document.createElement('div');
    card.className = 'ps-card nerdy-card';
    const status = progressMap[i.id] || 'todo';
    card.innerHTML = `
      <div class="ps-card-left">
        <a class="ps-title" href="${i.link}" target="_blank" rel="noopener noreferrer">${escapeHtml(i.title)}</a>
        <div class="ps-meta">
          <span class="diff ${i.difficulty.toLowerCase()}">${i.difficulty}</span>
          <span class="freq">${i.frequency}</span>
          <div class="topics">${i.topics.map(t => `<span class=\"topic\">${escapeHtml(t)}</span>`).join(' ')}</div>
        </div>
      </div>
      <div class="ps-card-right">
        <select class="ps-progress-select" data-id="${i.id}">
          <option value="todo" ${status==='todo'?'selected':''}>To do</option>
          <option value="in_progress" ${status==='in_progress'?'selected':''}>In progress</option>
          <option value="done" ${status==='done'?'selected':''}>Done</option>
        </select>
      </div>
    `;
    frag.appendChild(card);
  });
  list.appendChild(frag);

  list.querySelectorAll('.ps-progress-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      const map = getProgressMap();
      map[id] = e.target.value;
      setProgressMap(map);
      renderProblemset();
    });
  });
}

function renderCompanies() {
  const wrap = document.getElementById('ps-companies');
  if (!wrap) return;
  wrap.innerHTML = '';
  const frag = document.createDocumentFragment();
  problemsetState.companies.forEach(name => {
    const chip = document.createElement('button');
    chip.className = 'company-chip';
    chip.type = 'button';
    chip.textContent = name;
    if (problemsetState.selectedCompanies.has(name)) chip.classList.add('active');
    chip.addEventListener('click', () => {
      if (problemsetState.selectedCompanies.has(name)) {
        problemsetState.selectedCompanies.delete(name);
        chip.classList.remove('active');
      } else {
        problemsetState.selectedCompanies.add(name);
        chip.classList.add('active');
      }
      renderProblemset();
    });
    frag.appendChild(chip);
  });
  wrap.appendChild(frag);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(fn, ms) {
  let t = null;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}
