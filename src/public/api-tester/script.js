// JavaScript for the API Tester interface
document.addEventListener('DOMContentLoaded', function() {
    // Base URL for API requests
    const API_BASE_URL = '/api';
    
    // DOM Elements
    const authToken = document.getElementById('auth-token');
    const copyTokenBtn = document.getElementById('copy-token');
    const clearTokenBtn = document.getElementById('clear-token');
    const responseDisplay = document.getElementById('response-display');
    
    // Demo User Buttons
    const demoFreeBtn = document.getElementById('demo-free');
    const demoPremiumBtn = document.getElementById('demo-premium');
    const demoEducationBtn = document.getElementById('demo-education');
    
    // Forms
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const appleForm = document.getElementById('apple-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Quiz Elements
    const questionsContainer = document.getElementById('questions-container');
    const questionsList = document.getElementById('questions-list');
    const questionSelect = document.getElementById('question-select');
    const selectedQuestionText = document.getElementById('selected-question-text');
    
    // Store questions data
    let currentQuestions = [];
    
    // Tab Navigation
    setupTabs();
    
    // Initialize token from localStorage
    initializeToken();
    
    // Event Listeners for Demo Users
    demoFreeBtn.addEventListener('click', () => createDemoUser('free'));
    demoPremiumBtn.addEventListener('click', () => createDemoUser('premium'));
    demoEducationBtn.addEventListener('click', () => createDemoUser('education'));
    
    // Event Listeners for Auth Forms
    registerForm.addEventListener('submit', handleRegister);
    loginForm.addEventListener('submit', handleLogin);
    appleForm.addEventListener('submit', handleAppleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Token Management
    copyTokenBtn.addEventListener('click', copyToken);
    clearTokenBtn.addEventListener('click', clearToken);
    
    // Student checkbox toggle
    const studentCheckbox = document.getElementById('register-student');
    const studentFields = document.getElementById('student-fields');
    studentCheckbox.addEventListener('change', function() {
        studentFields.classList.toggle('hidden', !this.checked);
    });
    
    // Question selection change
    questionSelect.addEventListener('change', function() {
        const selectedId = this.value;
        if (selectedId) {
            const selectedQuestion = currentQuestions.find(q => q._id === selectedId);
            if (selectedQuestion) {
                selectedQuestionText.innerHTML = `
                    <strong>Question:</strong> ${selectedQuestion.text}<br>
                    <strong>Category:</strong> ${selectedQuestion.category}<br>
                    <strong>Difficulty:</strong> ${selectedQuestion.difficulty}
                `;
            }
        } else {
            selectedQuestionText.textContent = 'No question selected';
        }
    });
    
    // API Testing Buttons
    document.getElementById('get-profile').addEventListener('click', getProfile);
    document.getElementById('update-profile-form').addEventListener('submit', updateProfile);
    document.getElementById('get-daily-questions').addEventListener('click', getDailyQuestions);
    document.getElementById('submit-answer-form').addEventListener('submit', submitAnswer);
    document.getElementById('get-daily-leaderboard').addEventListener('click', getDailyLeaderboard);
    document.getElementById('create-lobby-form').addEventListener('submit', createLobby);
    document.getElementById('get-lobbies').addEventListener('click', getLobbies);
    document.getElementById('join-lobby-form').addEventListener('submit', joinLobby);
    document.getElementById('get-leaderboard').addEventListener('click', getLeaderboard);
    document.getElementById('game-leaderboard-form').addEventListener('submit', getGameLeaderboard);
    document.getElementById('get-subscription').addEventListener('click', getSubscription);
    document.getElementById('create-checkout').addEventListener('click', createCheckout);
    document.getElementById('cancel-subscription').addEventListener('click', cancelSubscription);
    document.getElementById('upload-material-form').addEventListener('submit', uploadMaterial);
    document.getElementById('get-materials').addEventListener('click', getMaterials);
    document.getElementById('generate-questions-form').addEventListener('submit', generateQuestions);
    
    // Setup tab navigation
    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                const tabContainer = this.closest('.auth-section, .api-section');
                
                // Remove active class from all buttons in this container
                tabContainer.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                // Hide all tab panes in this container
                tabContainer.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Show the corresponding tab pane
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    // Initialize token from localStorage
    function initializeToken() {
        const token = localStorage.getItem('authToken');
        if (token) {
            authToken.value = token;
        }
    }
    
    // Copy token to clipboard
    function copyToken() {
        if (authToken.value) {
            navigator.clipboard.writeText(authToken.value)
                .then(() => {
                    displayResponse({ success: true, message: 'Token copied to clipboard' });
                })
                .catch(err => {
                    displayResponse({ success: false, message: 'Failed to copy token', error: err.message });
                });
        }
    }
    
    // Clear token
    function clearToken() {
        authToken.value = '';
        localStorage.removeItem('authToken');
        displayResponse({ success: true, message: 'Token cleared' });
    }
    
    // Create demo user
    async function createDemoUser(tier) {
        try {
            let endpoint;
            switch (tier) {
                case 'free':
                    endpoint = '/auth/demo/free';
                    break;
                case 'premium':
                    endpoint = '/auth/demo/premium';
                    break;
                case 'education':
                    endpoint = '/auth/demo/education';
                    break;
                default:
                    throw new Error('Invalid tier');
            }
            
            const response = await fetch(API_BASE_URL + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            displayResponse(data);
            
            if (data.success && data.token) {
                authToken.value = data.token;
                localStorage.setItem('authToken', data.token);
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error creating demo user', error: error.message });
        }
    }
    
    // Handle register form submission
    async function handleRegister(e) {
        e.preventDefault();
        
        try {
            const isStudent = document.getElementById('register-student').checked;
            const requestBody = {
                email: document.getElementById('register-email').value,
                password: document.getElementById('register-password').value,
                name: document.getElementById('register-name').value
            };
            
            if (isStudent) {
                requestBody.isStudent = true;
                requestBody.studentEmail = document.getElementById('student-email').value;
                requestBody.yearOfStudy = parseInt(document.getElementById('year-of-study').value);
            }
            
            const response = await fetch(API_BASE_URL + '/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            displayResponse(data);
            
            if (data.success && data.token) {
                authToken.value = data.token;
                localStorage.setItem('authToken', data.token);
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error registering user', error: error.message });
        }
    }
    
    // Handle login form submission
    async function handleLogin(e) {
        e.preventDefault();
        
        try {
            const response = await fetch(API_BASE_URL + '/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: document.getElementById('login-email').value,
                    password: document.getElementById('login-password').value
                })
            });
            
            const data = await response.json();
            displayResponse(data);
            
            if (data.success && data.token) {
                authToken.value = data.token;
                localStorage.setItem('authToken', data.token);
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error logging in', error: error.message });
        }
    }
    
    // Handle Apple login form submission
    async function handleAppleLogin(e) {
        e.preventDefault();
        
        try {
            const response = await fetch(API_BASE_URL + '/auth/apple/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    appleId: document.getElementById('apple-id').value,
                    email: document.getElementById('apple-email').value,
                    name: document.getElementById('apple-name').value
                })
            });
            
            const data = await response.json();
            displayResponse(data);
            
            if (data.success && data.token) {
                authToken.value = data.token;
                localStorage.setItem('authToken', data.token);
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error with Apple login', error: error.message });
        }
    }
    
    // Handle logout
    async function handleLogout() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'No authentication token found' });
            }
            
            const response = await fetch(API_BASE_URL + '/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            displayResponse(data);
            
            if (data.success) {
                authToken.value = '';
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error logging out', error: error.message });
        }
    }
    
    // Get user profile
    async function getProfile() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/auth/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching profile', error: error.message });
        }
    }
    
    // Update user profile
    async function updateProfile(e) {
        e.preventDefault();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: document.getElementById('update-name').value,
                    bio: document.getElementById('update-bio').value,
                    location: document.getElementById('update-location').value
                })
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error updating profile', error: error.message });
        }
    }
    
    // Get daily questions
    async function getDailyQuestions() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/quiz/daily', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
            
            if (data.success && data.questions && data.questions.length > 0) {
                // Store questions for later use
                currentQuestions = data.questions;
                
                // Show questions container
                questionsContainer.classList.remove('hidden');
                
                // Clear previous questions
                questionsList.innerHTML = '';
                questionSelect.innerHTML = '<option value="">-- Select a question --</option>';
                
                // Populate questions list and dropdown
                data.questions.forEach(question => {
                    // Add to visual list
                    const questionItem = document.createElement('div');
                    questionItem.className = 'question-item';
                    questionItem.innerHTML = `
                        <strong>${question.text}</strong><br>
                        <small>Category: ${question.category} | Difficulty: ${question.difficulty}</small>
                    `;
                    questionItem.dataset.id = question._id;
                    questionItem.addEventListener('click', () => {
                        // Update dropdown when clicking on question
                        questionSelect.value = question._id;
                        // Trigger change event
                        const event = new Event('change');
                        questionSelect.dispatchEvent(event);
                    });
                    questionsList.appendChild(questionItem);
                    
                    // Add to dropdown
                    const option = document.createElement('option');
                    option.value = question._id;
                    option.textContent = question.text.substring(0, 60) + (question.text.length > 60 ? '...' : '');
                    questionSelect.appendChild(option);
                });
            } else {
                questionsContainer.classList.add('hidden');
                questionsList.innerHTML = '<p class="no-questions">No questions available.</p>';
                questionSelect.innerHTML = '<option value="">-- No questions available --</option>';
                selectedQuestionText.textContent = 'No questions available';
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching daily questions', error: error.message });
        }
    }
    
    // Submit answer for daily quiz
    async function submitAnswer(e) {
        e.preventDefault();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const questionId = questionSelect.value;
            if (!questionId) {
                return displayResponse({ success: false, message: 'Please select a question first' });
            }
            
            const response = await fetch(API_BASE_URL + '/quiz/daily/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    questionId: questionId,
                    answer: document.getElementById('answer').value
                })
            });
            
            const data = await response.json();
            displayResponse(data);
            
            // Clear answer field after submission
            if (data.success) {
                document.getElementById('answer').value = '';
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error submitting answer', error: error.message });
        }
    }
    
    // Get daily leaderboard
    async function getDailyLeaderboard() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/quiz/daily/leaderboard', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching daily leaderboard', error: error.message });
        }
    }
    
    // Create a lobby
    async function createLobby(e) {
        e.preventDefault();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/game/lobby', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: document.getElementById('lobby-name').value,
                    isPublic: document.getElementById('lobby-public').checked,
                    maxPlayers: parseInt(document.getElementById('max-players').value)
                })
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error creating lobby', error: error.message });
        }
    }
    
    // Get public lobbies
    async function getLobbies() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/game/lobbies', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching lobbies', error: error.message });
        }
    }
    
    // Join a lobby
    async function joinLobby(e) {
        e.preventDefault();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/game/lobby/join', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: document.getElementById('lobby-code').value
                })
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error joining lobby', error: error.message });
        }
    }
    
    // Get leaderboard
    async function getLeaderboard() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/leaderboard', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching leaderboard', error: error.message });
        }
    }
    
    // Get game leaderboard
    async function getGameLeaderboard(e) {
        e.preventDefault();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const gameId = document.getElementById('game-id').value;
            
            const response = await fetch(API_BASE_URL + `/leaderboard/game/${gameId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching game leaderboard', error: error.message });
        }
    }
    
    // Get subscription details
    async function getSubscription() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/subscription', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching subscription details', error: error.message });
        }
    }
    
    // Create checkout session
    async function createCheckout() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/subscription/checkout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error creating checkout session', error: error.message });
        }
    }
    
    // Cancel subscription
    async function cancelSubscription() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/subscription/cancel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error cancelling subscription', error: error.message });
        }
    }
    
    // Upload study material
    async function uploadMaterial(e) {
        e.preventDefault();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/study-material', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: document.getElementById('material-title').value,
                    subject: document.getElementById('material-subject').value,
                    content: document.getElementById('material-content').value
                })
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error uploading study material', error: error.message });
        }
    }
    
    // Get study materials
    async function getMaterials() {
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/study-material', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching study materials', error: error.message });
        }
    }
    
    // Generate questions from study material
    async function generateQuestions(e) {
        e.preventDefault();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const materialId = document.getElementById('material-id').value;
            const count = document.getElementById('question-count').value;
            
            const response = await fetch(API_BASE_URL + `/study-material/${materialId}/generate-questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    count: parseInt(count)
                })
            });
            
            const data = await response.json();
            displayResponse(data);
        } catch (error) {
            displayResponse({ success: false, message: 'Error generating questions', error: error.message });
        }
    }
    
    // Display response in the response container
    function displayResponse(data) {
        responseDisplay.textContent = JSON.stringify(data, null, 2);
    }
});
