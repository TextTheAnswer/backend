// API base URL
const API_BASE_URL = '/api';

// Authentication state
let authToken = localStorage.getItem('authToken');
let isAuthenticated = !!authToken;

// DOM Elements
const authStatusElement = document.getElementById('auth-status');
const tokenInputElement = document.getElementById('token-input');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const copyTokenBtn = document.getElementById('copy-token-btn');
const authWarnings = document.querySelectorAll('.auth-warning');

// Additional DOM Elements for Quiz Demo
const startQuizBtn = document.getElementById('start-quiz-demo');
const quizContainer = document.getElementById('quiz-container');
const quizStartContainer = document.getElementById('quiz-start-container');
const quizResults = document.getElementById('quiz-results');
const questionText = document.getElementById('question-text');
const questionCategory = document.getElementById('question-category');
const questionDifficulty = document.getElementById('question-difficulty');
const userAnswerInput = document.getElementById('user-answer');
const submitQuizAnswerBtn = document.getElementById('submit-quiz-answer');
const countdownTimer = document.getElementById('countdown-timer');
const answerFeedback = document.getElementById('answer-feedback');
const nextQuestionBtn = document.getElementById('next-question');
const restartQuizBtn = document.getElementById('restart-quiz');
const correctCount = document.getElementById('correct-count');
const totalCount = document.getElementById('total-count');

// Global quiz state
let quizQuestions = [];
let currentQuestionIndex = 0;
let timerInterval = null;
let userScore = 0;
let currentTimeLimit = 30;

// Global lobby state
let currentLobby = null;

// Initialize auth status
updateAuthStatus();

// Event Listeners
document.getElementById('is-student').addEventListener('change', function() {
    document.getElementById('student-fields').style.display = this.checked ? 'block' : 'none';
});

loginBtn.addEventListener('click', function() {
    document.getElementById('auth-tab').click();
});

registerBtn.addEventListener('click', function() {
    document.getElementById('auth-tab').click();
});

logoutBtn.addEventListener('click', function() {
    logout();
});

copyTokenBtn.addEventListener('click', function() {
    copyTokenToClipboard();
});

// Form Submissions
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    login();
});

document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    register();
});

document.getElementById('submit-answer-form').addEventListener('submit', function(e) {
    e.preventDefault();
    submitAnswer();
});

document.getElementById('upload-study-form').addEventListener('submit', function(e) {
    e.preventDefault();
    uploadStudyMaterial();
});

document.getElementById('generate-questions-form').addEventListener('submit', function(e) {
    e.preventDefault();
    generateQuestions();
});

document.getElementById('custom-question-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addCustomQuestion();
});

document.getElementById('create-lobby-form').addEventListener('submit', function(e) {
    e.preventDefault();
    createLobby();
});

// Button click handlers
document.getElementById('get-daily-questions-btn').addEventListener('click', function() {
    getDailyQuestions();
});

document.getElementById('get-leaderboard-btn').addEventListener('click', function() {
    getLeaderboard();
});

document.getElementById('get-materials-btn').addEventListener('click', function() {
    getStudyMaterials();
});

document.getElementById('get-lobbies-btn').addEventListener('click', function() {
    getLobbies();
});

document.getElementById('refresh-lobbies-btn').addEventListener('click', function() {
    refreshPublicLobbies();
});

document.getElementById('join-private-form').addEventListener('submit', function(e) {
    e.preventDefault();
    joinPrivateLobby();
});

document.getElementById('leave-lobby-btn').addEventListener('click', function() {
    leaveLobby();
});

document.getElementById('copy-lobby-code-btn').addEventListener('click', function() {
    copyLobbyCode();
});

document.getElementById('start-game-btn').addEventListener('click', function() {
    startGame();
});

// Profile form handlers
document.getElementById('create-profile-form').addEventListener('submit', function(e) {
    e.preventDefault();
    createProfile();
});

document.getElementById('get-profile-btn').addEventListener('click', function() {
    getProfile();
});

// Profile picture handlers
document.querySelectorAll('input[name="profile-pic-option"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const customContainer = document.getElementById('custom-pic-container');
        if (this.value === 'custom') {
            customContainer.classList.remove('d-none');
        } else {
            customContainer.classList.add('d-none');
        }
    });
});

document.getElementById('profile-pic-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        const previewContainer = document.getElementById('image-preview-container');
        const previewImage = document.getElementById('image-preview');
        
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
        }
        
        reader.readAsDataURL(file);
    }
});

// Button click handlers for quiz demo
startQuizBtn.addEventListener('click', startQuizDemo);
submitQuizAnswerBtn.addEventListener('click', submitQuizAnswer);
nextQuestionBtn.addEventListener('click', showNextQuestion);
restartQuizBtn.addEventListener('click', restartQuiz);

// Authentication Functions
function updateAuthStatus() {
    if (isAuthenticated) {
        authStatusElement.textContent = 'Authenticated';
        authStatusElement.style.color = 'green';
        tokenInputElement.value = authToken;
        loginBtn.disabled = true;
        registerBtn.disabled = true;
        logoutBtn.disabled = false;
        
        // Hide auth warnings
        authWarnings.forEach(warning => {
            warning.style.display = 'none';
        });
    } else {
        authStatusElement.textContent = 'Not authenticated';
        authStatusElement.style.color = 'red';
        tokenInputElement.value = '';
        loginBtn.disabled = false;
        registerBtn.disabled = false;
        logoutBtn.disabled = true;
        
        // Show auth warnings
        authWarnings.forEach(warning => {
            warning.style.display = 'block';
        });
    }
}

function setAuthToken(token) {
    authToken = token;
    isAuthenticated = !!token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
    updateAuthStatus();
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const responseElement = document.getElementById('login-response');
    
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        if (data.success && data.token) {
            setAuthToken(data.token);
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const isStudent = document.getElementById('is-student').checked;
    const responseElement = document.getElementById('register-response');
    
    const requestBody = { name, email, password };
    
    if (isStudent) {
        requestBody.isStudent = true;
        requestBody.studentEmail = document.getElementById('student-email').value;
        requestBody.yearOfStudy = parseInt(document.getElementById('year-of-study').value);
    }
    
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        if (data.success && data.token) {
            setAuthToken(data.token);
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function logout() {
    setAuthToken(null);
}

function copyTokenToClipboard() {
    tokenInputElement.select();
    document.execCommand('copy');
    alert('Token copied to clipboard!');
}

// Quiz Functions
function getDailyQuestions() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const responseElement = document.getElementById('daily-questions-response');
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/quiz/daily`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function submitAnswer() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const questionId = document.getElementById('question-id').value;
    const answer = document.getElementById('answer-text').value;
    const timeSpent = parseInt(document.getElementById('time-spent').value);
    const responseElement = document.getElementById('submit-answer-response');
    
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/quiz/daily/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ questionId, answer, timeSpent })
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

// Study Material Functions
function getStudyMaterials() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const responseElement = document.getElementById('materials-response');
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/study-materials`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function uploadStudyMaterial() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const fileInput = document.getElementById('study-file');
    const title = document.getElementById('study-title').value;
    const tags = document.getElementById('study-tags').value;
    const responseElement = document.getElementById('upload-study-response');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        responseElement.textContent = 'Please select a file';
        return;
    }
    
    const formData = new FormData();
    formData.append('studyMaterial', fileInput.files[0]);
    if (title) formData.append('title', title);
    if (tags) formData.append('tags', tags);
    
    responseElement.textContent = 'Uploading file...';
    
    fetch(`${API_BASE_URL}/study-materials/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function generateQuestions() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const materialId = document.getElementById('material-id').value;
    const count = document.getElementById('question-count').value;
    const responseElement = document.getElementById('generate-questions-response');
    
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/study-materials/${materialId}/generate-questions?count=${count}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function addCustomQuestion() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const materialId = document.getElementById('custom-material-id').value;
    const text = document.getElementById('question-text').value;
    const correctAnswer = document.getElementById('correct-answer').value;
    const alternativeAnswersString = document.getElementById('alternative-answers').value;
    const alternativeAnswers = alternativeAnswersString ? alternativeAnswersString.split(',').map(a => a.trim()) : [];
    const explanation = document.getElementById('explanation').value;
    const difficulty = document.getElementById('difficulty').value;
    const timeLimit = parseInt(document.getElementById('time-limit').value);
    
    const responseElement = document.getElementById('custom-question-response');
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/study-materials/${materialId}/questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
            text, 
            correctAnswer,
            alternativeAnswers,
            explanation,
            difficulty,
            timeLimit
        })
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

// Game Functions
function getLobbies() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const responseElement = document.getElementById('lobbies-response');
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/game/lobbies`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        // Update the public lobbies list if successful
        if (data.success && data.lobbies) {
            displayPublicLobbies(data.lobbies);
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function refreshPublicLobbies() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const responseElement = document.getElementById('join-public-response');
    responseElement.textContent = 'Refreshing lobbies...';
    
    fetch(`${API_BASE_URL}/game/lobbies`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        // Update the public lobbies list if successful
        if (data.success && data.lobbies) {
            displayPublicLobbies(data.lobbies);
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function displayPublicLobbies(lobbies) {
    const publicLobbiesList = document.getElementById('public-lobbies-list');
    publicLobbiesList.innerHTML = '';
    
    const infoAlert = document.querySelector('#public-lobbies-container .alert-info');
    
    if (lobbies.length === 0) {
        infoAlert.textContent = 'No public lobbies available right now.';
        infoAlert.classList.remove('d-none');
        return;
    }
    
    infoAlert.classList.add('d-none');
    
    lobbies.forEach(lobby => {
        const lobbyItem = document.createElement('a');
        lobbyItem.href = '#';
        lobbyItem.className = 'list-group-item list-group-item-action';
        if (lobby.isFull) {
            lobbyItem.className += ' disabled';
        }
        
        lobbyItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${escapeHtml(lobby.name)}</h5>
                <small>${lobby.playerCount}/${lobby.maxPlayers} players</small>
            </div>
            <p class="mb-1">Host: ${escapeHtml(lobby.host.name)}</p>
            <small>Code: ${lobby.code}</small>
            ${lobby.isFull ? '<span class="badge bg-danger ms-2">Full</span>' : ''}
        `;
        
        if (!lobby.isFull) {
            lobbyItem.addEventListener('click', function(e) {
                e.preventDefault();
                joinPublicLobby(lobby.code);
            });
        }
        
        publicLobbiesList.appendChild(lobbyItem);
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function joinPublicLobby(code) {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const responseElement = document.getElementById('join-public-response');
    responseElement.textContent = 'Joining lobby...';
    
    fetch(`${API_BASE_URL}/game/lobby/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ code })
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        if (data.success && data.lobby) {
            // Update current lobby
            currentLobby = data.lobby;
            updateActiveLobbyDisplay();
            
            // Show success message
            alert(`Successfully joined lobby: ${data.lobby.name}`);
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function joinPrivateLobby() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const code = document.getElementById('lobby-code').value.trim();
    if (!code) {
        alert('Please enter a lobby code');
        return;
    }
    
    const responseElement = document.getElementById('join-private-response');
    responseElement.textContent = 'Joining private lobby...';
    
    fetch(`${API_BASE_URL}/game/lobby/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ code })
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        if (data.success && data.lobby) {
            // Update current lobby
            currentLobby = data.lobby;
            updateActiveLobbyDisplay();
            
            // Clear input
            document.getElementById('lobby-code').value = '';
            
            // Show success message
            alert(`Successfully joined private lobby: ${data.lobby.name}`);
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function createLobby() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const name = document.getElementById('lobby-name').value;
    const isPublic = document.getElementById('is-public').checked;
    const maxPlayers = parseInt(document.getElementById('max-players').value);
    
    const responseElement = document.getElementById('create-lobby-response');
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/game/lobby`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name, isPublic, maxPlayers })
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        if (data.success && data.lobby) {
            // Update current lobby
            currentLobby = data.lobby;
            updateActiveLobbyDisplay();
            
            // Clear inputs
            document.getElementById('lobby-name').value = '';
            
            // Show success message
            alert(`Lobby created successfully! Code: ${data.lobby.code}`);
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function updateActiveLobbyDisplay() {
    const noActiveLobby = document.getElementById('no-active-lobby');
    const activeLobbyDetails = document.getElementById('active-lobby-details');
    
    if (!currentLobby) {
        noActiveLobby.classList.remove('d-none');
        activeLobbyDetails.classList.add('d-none');
        return;
    }
    
    // Hide no lobby message, show active lobby details
    noActiveLobby.classList.add('d-none');
    activeLobbyDetails.classList.remove('d-none');
    
    // Update lobby information
    document.getElementById('active-lobby-name').textContent = currentLobby.name;
    document.getElementById('active-lobby-code').textContent = currentLobby.code;
    document.getElementById('active-lobby-status').textContent = currentLobby.status;
    document.getElementById('active-lobby-visibility').textContent = currentLobby.isPublic ? 'Public' : 'Private';
    
    // Update host info
    if (currentLobby.host && typeof currentLobby.host === 'object') {
        document.getElementById('active-lobby-host').textContent = currentLobby.host.name;
        
        // Check if user is host to show/hide the start game button
        const startGameBtn = document.getElementById('start-game-btn');
        if (currentLobby.host.id === getUserIdFromToken()) {
            startGameBtn.classList.remove('d-none');
        } else {
            startGameBtn.classList.add('d-none');
        }
    } else {
        document.getElementById('active-lobby-host').textContent = 'Unknown';
    }
    
    // Update player list
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';
    
    const playerCount = document.getElementById('player-count');
    const maxPlayerCount = document.getElementById('max-player-count');
    
    playerCount.textContent = currentLobby.players.length;
    maxPlayerCount.textContent = currentLobby.maxPlayers;
    
    currentLobby.players.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // Highlight the host
        if (currentLobby.host && player.id === currentLobby.host.id) {
            playerItem.className += ' list-group-item-warning';
        }
        
        playerItem.innerHTML = `
            ${escapeHtml(player.name)}
            <span>
                ${player.ready ? '<span class="badge bg-success">Ready</span>' : ''}
                ${currentLobby.host && player.id === currentLobby.host.id ? '<span class="badge bg-primary ms-1">Host</span>' : ''}
            </span>
        `;
        
        playerList.appendChild(playerItem);
    });
}

function leaveLobby() {
    if (!isAuthenticated || !currentLobby) {
        alert('You are not in a lobby.');
        return;
    }
    
    const responseElement = document.getElementById('active-lobby-response');
    responseElement.textContent = 'Leaving lobby...';
    
    fetch(`${API_BASE_URL}/game/lobby/${currentLobby.id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        if (data.success) {
            // Clear current lobby
            currentLobby = null;
            updateActiveLobbyDisplay();
            
            // Show success message
            alert('You have left the lobby.');
            
            // Refresh public lobbies
            refreshPublicLobbies();
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function copyLobbyCode() {
    if (!currentLobby) return;
    
    navigator.clipboard.writeText(currentLobby.code)
        .then(() => {
            alert('Lobby code copied to clipboard');
        })
        .catch(err => {
            console.error('Error copying text: ', err);
        });
}

function startGame() {
    if (!isAuthenticated || !currentLobby) {
        alert('You are not in a lobby.');
        return;
    }
    
    // Check if user is the host
    if (!currentLobby.host || currentLobby.host.id !== getUserIdFromToken()) {
        alert('Only the host can start the game.');
        return;
    }
    
    const responseElement = document.getElementById('active-lobby-response');
    responseElement.textContent = 'Starting game...';
    
    fetch(`${API_BASE_URL}/game/lobby/${currentLobby.id}/start`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        if (data.success) {
            alert('Game started successfully!');
            // Update lobby status
            if (currentLobby) {
                currentLobby.status = 'playing';
                updateActiveLobbyDisplay();
            }
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function getUserIdFromToken() {
    if (!authToken) return null;
    
    try {
        // Parse the JWT token (without validation)
        const base64Url = authToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        return payload.id;
    } catch (e) {
        console.error('Error parsing auth token:', e);
        return null;
    }
}

// Quiz Demo Functions
function startQuizDemo() {
    // Sample questions with typed answers
    quizQuestions = [
        { 
            text: 'What is the capital of France?', 
            correctAnswer: 'Paris',
            category: 'Geography',
            difficulty: 'easy',
            timeLimit: 30,
            explanation: 'Paris is the capital and largest city of France.'
        },
        { 
            text: 'What is the chemical symbol for water?', 
            correctAnswer: 'H2O',
            category: 'Science',
            difficulty: 'easy',
            timeLimit: 20,
            explanation: 'Water consists of two hydrogen atoms and one oxygen atom.'
        },
        { 
            text: 'Who wrote Romeo and Juliet?', 
            correctAnswer: 'William Shakespeare',
            category: 'Literature',
            difficulty: 'medium',
            timeLimit: 25,
            explanation: 'William Shakespeare wrote this famous tragedy around 1594-1596.'
        },
        { 
            text: 'What is the largest planet in our solar system?', 
            correctAnswer: 'Jupiter',
            category: 'Astronomy',
            difficulty: 'easy',
            timeLimit: 20,
            explanation: 'Jupiter is the fifth planet from the Sun and the largest in our solar system.'
        },
        { 
            text: 'What year did World War II end?', 
            correctAnswer: '1945',
            category: 'History',
            difficulty: 'medium',
            timeLimit: 15,
            explanation: 'World War II ended in 1945 after the surrender of Germany and Japan.'
        }
    ];
    
    // Reset quiz state
    currentQuestionIndex = 0;
    userScore = 0;
    
    // Show quiz container, hide start button
    quizContainer.classList.remove('d-none');
    quizStartContainer.classList.add('d-none');
    quizResults.classList.add('d-none');
    
    // Show first question
    showCurrentQuestion();
}

function showCurrentQuestion() {
    // Hide any previous feedback
    answerFeedback.classList.add('d-none');
    document.getElementById('feedback-correct').classList.add('d-none');
    document.getElementById('feedback-incorrect').classList.add('d-none');
    document.getElementById('feedback-timeout').classList.add('d-none');
    
    // Clear previous answer
    userAnswerInput.value = '';
    userAnswerInput.disabled = false;
    submitQuizAnswerBtn.disabled = false;
    
    // Get current question
    const question = quizQuestions[currentQuestionIndex];
    
    // Update question display
    questionText.textContent = question.text;
    questionCategory.textContent = question.category;
    questionDifficulty.textContent = question.difficulty;
    
    // Set time limit for this question
    currentTimeLimit = question.timeLimit || 30;
    countdownTimer.textContent = currentTimeLimit;
    
    // Start timer
    startTimer();
    
    // Focus on answer input
    userAnswerInput.focus();
}

function startTimer() {
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    let timeLeft = currentTimeLimit;
    countdownTimer.textContent = timeLeft;
    
    // Reset timer color
    countdownTimer.parentElement.classList.remove('bg-danger');
    countdownTimer.parentElement.classList.add('bg-warning');
    
    // Calculate and show possible points
    updatePossiblePoints(timeLeft);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        countdownTimer.textContent = timeLeft;
        
        // Update possible points as time goes by
        updatePossiblePoints(timeLeft);
        
        // Update color as time runs low
        if (timeLeft <= 5) {
            countdownTimer.parentElement.classList.remove('bg-warning');
            countdownTimer.parentElement.classList.add('bg-danger');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeOut();
        }
    }, 1000);
}

function updatePossiblePoints(timeLeft) {
    const question = quizQuestions[currentQuestionIndex];
    const timeLimit = question.timeLimit || 30;
    
    // Base points for correct answer
    const basePoints = 100;
    
    // Time bonus: faster answers get more points
    // Formula: Bonus = (1 - timeSpent/timeLimit) * 100
    const timeBonus = Math.round((timeLeft / timeLimit) * 100);
    
    // Difficulty multiplier
    const difficultyMultiplier = 
        question.difficulty === 'easy' ? 1 :
        question.difficulty === 'medium' ? 1.5 : 2; // hard = 2x
    
    // Calculate total points
    const points = Math.round((basePoints + timeBonus) * difficultyMultiplier);
    
    // Update UI
    document.getElementById('possible-points').textContent = points;
}

function handleTimeOut() {
    // Disable input
    userAnswerInput.disabled = true;
    submitQuizAnswerBtn.disabled = true;
    
    // Show timeout feedback
    answerFeedback.classList.remove('d-none');
    document.getElementById('feedback-timeout').classList.remove('d-none');
    
    // Show correct answer
    const correctAnswer = quizQuestions[currentQuestionIndex].correctAnswer;
    document.getElementById('timeout-correct-answer').textContent = correctAnswer;
    
    // Show explanation
    document.getElementById('explanation-text').textContent = quizQuestions[currentQuestionIndex].explanation;
}

function submitQuizAnswer() {
    // Stop timer
    clearInterval(timerInterval);
    
    // Disable input
    userAnswerInput.disabled = true;
    submitQuizAnswerBtn.disabled = true;
    
    // Get current question and user answer
    const question = quizQuestions[currentQuestionIndex];
    const userAnswer = userAnswerInput.value.trim();
    const timeSpent = question.timeLimit - parseInt(countdownTimer.textContent);
    
    // Check if answer is correct (case-insensitive)
    const isCorrect = userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
    
    // Calculate points
    let points = 0;
    if (isCorrect) {
        // Base points for correct answer
        const basePoints = 100;
        
        // Time bonus: faster answers get more points
        // Formula: Bonus = (1 - timeSpent/timeLimit) * 100
        const timeLimit = question.timeLimit || 30;
        const timeBonus = Math.round((1 - (timeSpent / timeLimit)) * 100);
        
        // Difficulty multiplier
        const difficultyMultiplier = 
            question.difficulty === 'easy' ? 1 :
            question.difficulty === 'medium' ? 1.5 : 2; // hard = 2x
        
        // Calculate total points
        points = Math.round((basePoints + timeBonus) * difficultyMultiplier);
        userScore += points;
    }
    
    // Show feedback
    answerFeedback.classList.remove('d-none');
    
    if (isCorrect) {
        document.getElementById('feedback-correct').classList.remove('d-none');
        document.getElementById('correct-answer-text').textContent = `${question.correctAnswer} (+${points} points!)`;
    } else {
        document.getElementById('feedback-incorrect').classList.remove('d-none');
        document.getElementById('correct-answer').textContent = question.correctAnswer;
    }
    
    // Show explanation
    document.getElementById('explanation-text').textContent = question.explanation;
}

function showNextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < quizQuestions.length) {
        showCurrentQuestion();
    } else {
        showQuizResults();
    }
}

function showQuizResults() {
    // Hide quiz container, show results
    quizContainer.classList.add('d-none');
    quizResults.classList.remove('d-none');
    
    // Update score
    correctCount.textContent = userScore;
    totalCount.textContent = quizQuestions.length;
}

function restartQuiz() {
    // Reset quiz state
    currentQuestionIndex = 0;
    userScore = 0;
    
    // Show quiz container, hide results
    quizContainer.classList.remove('d-none');
    quizResults.classList.add('d-none');
    
    // Show first question
    showCurrentQuestion();
}

function getLeaderboard() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to use this endpoint.');
        return;
    }
    
    const responseElement = document.getElementById('leaderboard-response');
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/quiz/daily/leaderboard`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        // Show leaderboard if successful
        if (data.success && data.leaderboard && data.leaderboard.length > 0) {
            displayLeaderboard(data);
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function displayLeaderboard(data) {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const leaderboardBody = document.getElementById('leaderboard-body');
    const userRankContainer = document.getElementById('user-rank-container');
    
    // Clear previous entries
    leaderboardBody.innerHTML = '';
    
    // Show leaderboard container
    leaderboardContainer.classList.remove('d-none');
    
    // Add entries to the table
    data.leaderboard.forEach(entry => {
        const row = document.createElement('tr');
        
        // Highlight the top player
        if (entry.rank === 1) {
            row.classList.add('table-success', 'fw-bold');
        }
        
        row.innerHTML = `
            <td>${entry.rank}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${entry.correctAnswers}/10</td>
            <td>${entry.isPerfectScore ? 
                '<span class="badge bg-success">Perfect!</span>' : 
                '<span class="badge bg-secondary">-</span>'}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
    
    // Show user's rank if available
    if (data.userRank) {
        userRankContainer.classList.remove('d-none');
        document.getElementById('user-rank').textContent = data.userRank;
        document.getElementById('user-score').textContent = data.userScore || 0;
        
        // Get user's correct answers from their position in the leaderboard
        const userInLeaderboard = data.leaderboard.find(entry => entry.rank === data.userRank);
        if (userInLeaderboard) {
            document.getElementById('user-correct').textContent = userInLeaderboard.correctAnswers;
        }
    } else {
        userRankContainer.classList.add('d-none');
    }
}

// Profile Functions
function createProfile() {
    if (!isAuthenticated) {
        alert('You need to log in first');
        return;
    }
    
    const bio = document.getElementById('profile-bio').value;
    const location = document.getElementById('profile-location').value;
    
    // Get favorite categories
    const favoriteCategories = [];
    if (document.getElementById('category-science').checked) favoriteCategories.push('Science');
    if (document.getElementById('category-history').checked) favoriteCategories.push('History');
    if (document.getElementById('category-sports').checked) favoriteCategories.push('Sports');
    if (document.getElementById('category-entertainment').checked) favoriteCategories.push('Entertainment');
    
    // Get notification settings
    const notificationSettings = {
        dailyQuizReminder: document.getElementById('notify-daily-quiz').checked,
        multiplayerInvites: document.getElementById('notify-multiplayer').checked
    };
    
    // Get display theme
    const displayTheme = document.getElementById('display-theme').value;
    
    // Handle profile picture
    let profilePicture = null;
    const selectedOption = document.querySelector('input[name="profile-pic-option"]:checked').value;
    
    if (selectedOption === 'default-1' || selectedOption === 'default-2') {
        // Use default image
        profilePicture = selectedOption;
    } else if (selectedOption === 'custom') {
        // Use custom uploaded image
        const fileInput = document.getElementById('profile-pic-upload');
        if (fileInput.files && fileInput.files[0]) {
            // Convert image to base64
            const imagePreview = document.getElementById('image-preview');
            if (imagePreview.src) {
                profilePicture = imagePreview.src; // base64 data URL
            }
        }
    }
    
    const requestData = {
        bio,
        location,
        preferences: {
            favoriteCategories,
            notificationSettings,
            displayTheme
        }
    };
    
    // Add profile picture if selected
    if (profilePicture) {
        requestData.profilePicture = profilePicture;
    }
    
    const responseElement = document.getElementById('create-profile-response');
    responseElement.textContent = 'Sending request...';
    
    fetch(`${API_BASE_URL}/profile/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        // If profile was created successfully with an image, show it
        if (data.success && data.profile && data.profile.imageUrl) {
            alert('Profile created successfully with profile picture!');
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
}

function getProfile() {
    if (!isAuthenticated) {
        alert('You need to log in first');
        return;
    }
    
    const responseElement = document.getElementById('get-profile-response');
    responseElement.textContent = 'Fetching profile...';
    
    fetch(`${API_BASE_URL}/profile/full`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        responseElement.textContent = JSON.stringify(data, null, 2);
        
        // If profile has an image URL, display it
        if (data.success && data.profile && data.profile.profile && data.profile.profile.imageUrl) {
            const previewContainer = document.getElementById('get-profile-image-preview');
            if (previewContainer) {
                const imageUrl = data.profile.profile.imageUrl;
                previewContainer.innerHTML = `
                    <div class="mt-3 text-center">
                        <img src="${imageUrl}" alt="Profile Image" style="max-width: 150px; max-height: 150px; border-radius: 50%; border: 3px solid #0d6efd;">
                        <div class="mt-2">Current Profile Image</div>
                    </div>
                `;
                previewContainer.style.display = 'block';
            }
        }
    })
    .catch(error => {
        responseElement.textContent = `Error: ${error.message}`;
    });
} 