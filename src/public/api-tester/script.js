// JavaScript for the API Tester interface
document.addEventListener('DOMContentLoaded', function() {
    // Base URL for API requests
    const API_BASE_URL = '/api';
    
    // DOM Elements
    const authToken = document.getElementById('auth-token');
    const copyTokenBtn = document.getElementById('copy-token');
    const clearTokenBtn = document.getElementById('clear-token');
    const responseDisplay = document.getElementById('response-display');
    const clearResponseBtn = document.getElementById('clear-response');
    const copyResponseBtn = document.getElementById('copy-response');
    const modeToggleCheckbox = document.getElementById('mode-toggle-checkbox');
    const modeLabel = document.getElementById('mode-label');
    const environmentBadge = document.getElementById('environment-badge');
    const devPanel = document.getElementById('dev-panel');
    const requestCount = document.getElementById('request-count');
    const lastRequestTime = document.getElementById('last-request-time');
    const responseTime = document.getElementById('response-time');
    const userTier = document.getElementById('user-tier');
    const currentDateElement = document.getElementById('current-date');
    
    // Set current date in footer
    const currentDate = new Date();
    currentDateElement.textContent = currentDate.toLocaleDateString();
    
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
    const themeInfo = document.getElementById('theme-info');
    const themeBadge = document.getElementById('theme-badge');
    const themeDescription = document.getElementById('theme-description');
    
    // Store questions data
    let currentQuestions = [];
    
    // Request tracking variables
    let requestCounter = 0;
    let lastRequestTimestamp = null;
    let lastResponseTime = null;
    
    // Initialize dev/regular mode from localStorage
    initializeMode();
    
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
    
    // Response Management
    clearResponseBtn.addEventListener('click', clearResponse);
    copyResponseBtn.addEventListener('click', copyResponse);
    
    // Mode Toggle
    modeToggleCheckbox.addEventListener('change', toggleMode);
    
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
                    <strong>Category:</strong> ${selectedQuestion.category || 'General'}<br>
                    <strong>Difficulty:</strong> ${selectedQuestion.difficulty || 'Medium'}
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
    
    // Initialize dev/regular mode
    function initializeMode() {
        const isDev = localStorage.getItem('devMode') === 'true';
        modeToggleCheckbox.checked = isDev;
        updateModeUI(isDev);
    }
    
    // Toggle between dev and regular mode
    function toggleMode() {
        const isDev = modeToggleCheckbox.checked;
        localStorage.setItem('devMode', isDev);
        updateModeUI(isDev);
    }
    
    // Update UI based on mode
    function updateModeUI(isDev) {
        if (isDev) {
            document.body.classList.add('dev-mode');
            document.body.classList.remove('regular-mode');
            modeLabel.textContent = 'Developer Mode';
            environmentBadge.textContent = 'Development';
            devPanel.style.display = 'flex';
        } else {
            document.body.classList.add('regular-mode');
            document.body.classList.remove('dev-mode');
            modeLabel.textContent = 'Regular User Mode';
            environmentBadge.textContent = 'Production';
            devPanel.style.display = 'none';
        }
    }
    
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
            updateUserTierFromToken(token);
        }
    }
    
    // Update user tier display from token
    function updateUserTierFromToken(token) {
        try {
            if (!token) {
                userTier.textContent = 'Not logged in';
                return;
            }
            
            // Decode JWT token (simple decode, not validation)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            
            if (payload.subscription && payload.subscription.status) {
                userTier.textContent = payload.subscription.status.charAt(0).toUpperCase() + 
                                      payload.subscription.status.slice(1);
            } else {
                userTier.textContent = 'Free';
            }
        } catch (error) {
            userTier.textContent = 'Unknown';
            console.error('Error decoding token:', error);
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
        userTier.textContent = 'Not logged in';
        displayResponse({ success: true, message: 'Token cleared' });
    }
    
    // Clear response
    function clearResponse() {
        responseDisplay.textContent = 'No response yet. Use the API endpoints above to test.';
    }
    
    // Copy response to clipboard
    function copyResponse() {
        const responseText = responseDisplay.textContent;
        if (responseText && responseText !== 'No response yet. Use the API endpoints above to test.') {
            navigator.clipboard.writeText(responseText)
                .then(() => {
                    // Show a temporary message in the response area
                    const originalText = responseDisplay.textContent;
                    responseDisplay.textContent = 'Response copied to clipboard!';
                    setTimeout(() => {
                        responseDisplay.textContent = originalText;
                    }, 1500);
                })
                .catch(err => {
                    displayResponse({ success: false, message: 'Failed to copy response', error: err.message });
                });
        }
    }
    
    // Update request tracking info
    function updateRequestTracking(startTime) {
        requestCounter++;
        lastRequestTimestamp = new Date();
        
        const endTime = performance.now();
        lastResponseTime = Math.round(endTime - startTime);
        
        // Update UI
        requestCount.textContent = requestCounter;
        lastRequestTime.textContent = lastRequestTimestamp.toLocaleTimeString();
        responseTime.textContent = `${lastResponseTime}ms`;
    }
    
    // Create demo user
    async function createDemoUser(tier) {
        const startTime = performance.now();
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
            updateRequestTracking(startTime);
            
            if (data.success && data.token) {
                authToken.value = data.token;
                localStorage.setItem('authToken', data.token);
                updateUserTierFromToken(data.token);
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error creating demo user', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Handle register form submission
    async function handleRegister(e) {
        e.preventDefault();
        const startTime = performance.now();
        
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
            updateRequestTracking(startTime);
            
            if (data.success && data.token) {
                authToken.value = data.token;
                localStorage.setItem('authToken', data.token);
                updateUserTierFromToken(data.token);
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error registering user', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Handle login form submission
    async function handleLogin(e) {
        e.preventDefault();
        const startTime = performance.now();
        
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
            updateRequestTracking(startTime);
            
            if (data.success && data.token) {
                authToken.value = data.token;
                localStorage.setItem('authToken', data.token);
                updateUserTierFromToken(data.token);
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error logging in', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Handle Apple login form submission
    async function handleAppleLogin(e) {
        e.preventDefault();
        const startTime = performance.now();
        
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
            updateRequestTracking(startTime);
            
            if (data.success && data.token) {
                authToken.value = data.token;
                localStorage.setItem('authToken', data.token);
                updateUserTierFromToken(data.token);
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error with Apple login', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Handle logout
    async function handleLogout() {
        const startTime = performance.now();
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
            updateRequestTracking(startTime);
            
            if (data.success) {
                authToken.value = '';
                localStorage.removeItem('authToken');
                userTier.textContent = 'Not logged in';
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error logging out', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Get user profile
    async function getProfile() {
        const startTime = performance.now();
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
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching profile', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Update user profile
    async function updateProfile(e) {
        e.preventDefault();
        const startTime = performance.now();
        
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
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error updating profile', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Get daily questions
    async function getDailyQuestions() {
        const startTime = performance.now();
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
            updateRequestTracking(startTime);
            
            if (data.success && data.questions && data.questions.length > 0) {
                // Store questions for later use
                currentQuestions = data.questions;
                
                // Show questions container
                questionsContainer.classList.remove('hidden');
                
                // Update theme info if available
                if (data.theme) {
                    themeBadge.textContent = data.theme.name || 'General';
                    themeDescription.textContent = data.theme.description || `Today's theme is ${data.theme.name}`;
                    themeInfo.style.display = 'flex';
                } else {
                    themeInfo.style.display = 'none';
                }
                
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
                        <small>Category: ${question.category || 'General'} | Difficulty: ${question.difficulty || 'Medium'}</small>
                    `;
                    questionItem.dataset.id = question._id;
                    questionItem.addEventListener('click', () => {
                        // Update dropdown when clicking on question
                        questionSelect.value = question._id;
                        
                        // Trigger change event
                        const event = new Event('change');
                        questionSelect.dispatchEvent(event);
                        
                        // Update selected class
                        document.querySelectorAll('.question-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        questionItem.classList.add('selected');
                    });
                    questionsList.appendChild(questionItem);
                    
                    // Add to dropdown
                    const option = document.createElement('option');
                    option.value = question._id;
                    option.textContent = question.text.substring(0, 60) + (question.text.length > 60 ? '...' : '');
                    questionSelect.appendChild(option);
                });
            } else {
                // No questions or error
                questionsContainer.classList.add('hidden');
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching daily questions', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Submit answer
    async function submitAnswer(e) {
        e.preventDefault();
        const startTime = performance.now();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const questionId = document.getElementById('question-select').value;
            const answer = document.getElementById('answer').value;
            
            if (!questionId) {
                return displayResponse({ success: false, message: 'Please select a question' });
            }
            
            const response = await fetch(API_BASE_URL + '/quiz/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    questionId,
                    answer
                })
            });
            
            const data = await response.json();
            displayResponse(data);
            updateRequestTracking(startTime);
            
            // Clear answer field on successful submission
            if (data.success) {
                document.getElementById('answer').value = '';
            }
        } catch (error) {
            displayResponse({ success: false, message: 'Error submitting answer', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Get daily leaderboard
    async function getDailyLeaderboard() {
        const startTime = performance.now();
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/leaderboard/daily', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching daily leaderboard', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Create lobby
    async function createLobby(e) {
        e.preventDefault();
        const startTime = performance.now();
        
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
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error creating lobby', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Get public lobbies
    async function getLobbies() {
        const startTime = performance.now();
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
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching lobbies', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Join lobby
    async function joinLobby(e) {
        e.preventDefault();
        const startTime = performance.now();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const lobbyCode = document.getElementById('lobby-code').value;
            
            const response = await fetch(API_BASE_URL + `/game/lobby/${lobbyCode}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error joining lobby', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Get leaderboard
    async function getLeaderboard() {
        const startTime = performance.now();
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
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching leaderboard', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Get game leaderboard
    async function getGameLeaderboard(e) {
        e.preventDefault();
        const startTime = performance.now();
        
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
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching game leaderboard', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Get subscription details
    async function getSubscription() {
        const startTime = performance.now();
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
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching subscription details', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Create checkout session
    async function createCheckout() {
        const startTime = performance.now();
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/subscription/checkout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plan: 'premium'
                })
            });
            
            const data = await response.json();
            displayResponse(data);
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error creating checkout session', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Cancel subscription
    async function cancelSubscription() {
        const startTime = performance.now();
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/subscription/cancel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error cancelling subscription', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Upload study material
    async function uploadMaterial(e) {
        e.preventDefault();
        const startTime = performance.now();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/study/materials', {
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
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error uploading study material', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Get study materials
    async function getMaterials() {
        const startTime = performance.now();
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const response = await fetch(API_BASE_URL + '/study/materials', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken.value}`
                }
            });
            
            const data = await response.json();
            displayResponse(data);
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error fetching study materials', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Generate questions from study material
    async function generateQuestions(e) {
        e.preventDefault();
        const startTime = performance.now();
        
        try {
            if (!authToken.value) {
                return displayResponse({ success: false, message: 'Authentication required' });
            }
            
            const materialId = document.getElementById('material-id').value;
            const count = document.getElementById('question-count').value;
            
            const response = await fetch(API_BASE_URL + `/study/materials/${materialId}/generate`, {
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
            updateRequestTracking(startTime);
        } catch (error) {
            displayResponse({ success: false, message: 'Error generating questions', error: error.message });
            updateRequestTracking(startTime);
        }
    }
    
    // Display response in the response container
    function displayResponse(data) {
        // Format the JSON with indentation for better readability
        const formattedJson = JSON.stringify(data, null, 2);
        
        // Add syntax highlighting (simple version)
        const highlightedJson = formattedJson
            .replace(/"([^"]+)":/g, '<span style="color: #e06c75;">"$1"</span>:')  // keys
            .replace(/: "([^"]+)"/g, ': <span style="color: #98c379;">"$1"</span>') // string values
            .replace(/: (true|false)/g, ': <span style="color: #d19a66;">$1</span>') // boolean values
            .replace(/: (\d+)/g, ': <span style="color: #d19a66;">$1</span>'); // number values
        
        // Set the highlighted JSON in the response display
        responseDisplay.innerHTML = highlightedJson;
        
        // Add success/error styling
        if (data.success) {
            responseDisplay.classList.add('success');
            responseDisplay.classList.remove('error');
        } else {
            responseDisplay.classList.add('error');
            responseDisplay.classList.remove('success');
        }
    }
});
