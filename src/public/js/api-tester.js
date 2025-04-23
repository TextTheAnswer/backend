// Global variables
let baseApiUrl = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken') || null;
let userInfo = JSON.parse(localStorage.getItem('userInfo')) || null;

// DOM Elements
const responseDisplay = document.getElementById('response-display');
const loadingOverlay = document.getElementById('loading-overlay');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const authStatusText = document.getElementById('auth-status-text');
const toggleThemeBtn = document.getElementById('toggle-theme-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const copyResponseBtn = document.getElementById('copy-response-btn');
const formatResponseBtn = document.getElementById('format-response-btn');
const responseTimeDisplay = document.getElementById('response-time-value');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('API Tester initialized');
    
    initializeUI();
    setupFormHandlers();
    setupEventListeners();
});

// Initialize UI state
function initializeUI() {
    // Set theme from localStorage or default to light
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeButtonText();
    
    // Update auth status display
updateAuthStatus();

    // Show/hide sidebar on mobile
    const sidebarToggle = document.querySelector('.navbar-toggler');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('sidebar-active');
        });
    }
    
    // Show/hide student fields based on checkbox
    const isStudentCheckbox = document.getElementById('register-is-student');
    const studentFields = document.getElementById('student-fields');
    
    if (isStudentCheckbox && studentFields) {
        isStudentCheckbox.addEventListener('change', function() {
            studentFields.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Set active sidebar item based on hash
    highlightActiveSidebarItem();
}

// Set up form handlers for API endpoints
function setupFormHandlers() {
    // Auth Forms
    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', handleLoginForm);
    }
    
    if (document.getElementById('register-form')) {
        document.getElementById('register-form').addEventListener('submit', handleRegisterForm);
    }
    
    // Get profile button
    const getProfileBtn = document.getElementById('get-profile-btn');
    if (getProfileBtn) {
        getProfileBtn.addEventListener('click', handleGetProfile);
    }
    
    // User endpoint forms
    const getUsersBtn = document.getElementById('get-users-btn');
    if (getUsersBtn) {
        getUsersBtn.addEventListener('click', handleGetUsers);
    }
    
    // Product endpoint forms
    const getProductsForm = document.getElementById('get-products-form');
    if (getProductsForm) {
        getProductsForm.addEventListener('submit', handleGetProducts);
    }
    
    const createProductForm = document.getElementById('create-product-form');
    if (createProductForm) {
        createProductForm.addEventListener('submit', handleCreateProduct);
    }
    
    // Order endpoint forms
    const getOrdersBtn = document.getElementById('get-orders-btn');
    if (getOrdersBtn) {
        getOrdersBtn.addEventListener('click', handleGetOrders);
    }
    
    const createOrderForm = document.getElementById('create-order-form');
    if (createOrderForm) {
        createOrderForm.addEventListener('submit', handleCreateOrder);
    }
}

// Set up general event listeners
function setupEventListeners() {
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Theme toggle
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', toggleTheme);
    }
    
    // Clear logs button
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', clearResponseDisplay);
    }
    
    // Copy response button
    if (copyResponseBtn) {
        copyResponseBtn.addEventListener('click', copyResponseToClipboard);
    }
    
    // Format response button
    if (formatResponseBtn) {
        formatResponseBtn.addEventListener('click', formatResponseJSON);
    }
    
    // Hash change for navigation
    window.addEventListener('hashchange', () => {
        highlightActiveSidebarItem();
        showActiveSection();
    });
    
    // Initial section display based on hash
    showActiveSection();
}

// API Request Helper
async function makeApiRequest(endpoint, method, data = null, requiresAuth = false) {
    showLoading(true);
    const startTime = performance.now();
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (requiresAuth && authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const fetchOptions = {
            method,
            headers
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            fetchOptions.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${baseApiUrl}${endpoint}`, fetchOptions);
        let responseData;
        
        try {
            responseData = await response.json();
        } catch (e) {
            responseData = { message: 'No JSON response received' };
        }
        
        // Format and display the response
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        displayResponse(responseData, response.status, response.ok, duration);
        
        // If it's a successful auth request, store the token
        if (response.ok && endpoint.includes('/auth/') && responseData.token) {
            handleAuthSuccess(responseData);
        }
        
        return { data: responseData, status: response.status, success: response.ok };
    } catch (error) {
        console.error('API Request Error:', error);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        displayResponse({ error: error.message }, 500, false, duration);
        return { data: null, status: 500, success: false, error: error.message };
    } finally {
        showLoading(false);
    }
}

// Form Handlers
async function handleLoginForm(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    await makeApiRequest('/auth/login', 'POST', { email, password });
}

async function handleRegisterForm(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value;
    
    await makeApiRequest('/auth/register', 'POST', { email, password, name });
}

async function handleGetProfile(e) {
                e.preventDefault();
    await makeApiRequest('/users/profile', 'GET', null, true);
}

async function handleGetUsers(e) {
    e.preventDefault();
    await makeApiRequest('/users', 'GET', null, true);
}

async function handleGetProducts(e) {
    e.preventDefault();
    const limit = document.getElementById('products-limit').value;
    await makeApiRequest(`/products?limit=${limit}`, 'GET');
}

async function handleCreateProduct(e) {
    e.preventDefault();
    const name = document.getElementById('product-name').value;
    const price = document.getElementById('product-price').value;
    const description = document.getElementById('product-description').value;
    
    await makeApiRequest('/products', 'POST', {
        name,
        price: parseFloat(price),
        description
    }, true);
}

async function handleGetOrders(e) {
    e.preventDefault();
    await makeApiRequest('/orders', 'GET', null, true);
}

async function handleCreateOrder(e) {
    e.preventDefault();
    const productId = document.getElementById('order-product-id').value;
    const quantity = document.getElementById('order-quantity').value;
    const shippingAddress = document.getElementById('order-shipping-address').value;
    
    await makeApiRequest('/orders', 'POST', {
        productId,
        quantity: parseInt(quantity),
        shippingAddress
    }, true);
}

function handleAuthSuccess(data) {
    authToken = data.token;
    userInfo = data.user;
    
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    
    updateAuthStatus();
    showMessage('Login successful! Your authentication token has been saved.');
}

function handleLogout() {
    clearAuthData();
    updateAuthStatus();
    showMessage('You have been logged out. Authentication token has been removed.');
}

function clearAuthData() {
    authToken = null;
    userInfo = null;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
}

function updateAuthStatus() {
    if (authStatusText) {
        if (authToken) {
            authStatusText.innerHTML = `
                <span class="badge bg-success">Authenticated</span>
                <span class="ms-2">as ${userInfo?.email || 'User'}</span>
            `;
            
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
            }
            
            document.querySelectorAll('.requires-auth').forEach(el => {
                el.classList.remove('disabled-endpoint');
            });
        } else {
            authStatusText.innerHTML = `
                <span class="badge bg-warning">Not Authenticated</span>
                <span class="ms-2">Please log in</span>
            `;
            
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
            
            document.querySelectorAll('.requires-auth').forEach(el => {
                el.classList.add('disabled-endpoint');
            });
        }
    }
}

function displayResponse(data, status, success, duration = 0) {
    const formattedJson = formatJson(data);
    const highlightedJson = highlightJson(formattedJson);
    
    let statusBadge = '';
    if (status) {
        const statusClass = success ? 'success-status' : (status >= 400 && status < 500 ? 'warning-status' : 'error-status');
        statusBadge = `<div class="status-code ${statusClass}">Status: ${status}</div>`;
    }
    
    if (responseDisplay) {
        responseDisplay.innerHTML = statusBadge + highlightedJson;
    }
    
    if (responseTimeDisplay && duration) {
        responseTimeDisplay.textContent = `${duration} ms`;
    }
}

function formatJson(data) {
    try {
        return JSON.stringify(data, null, 2);
    } catch (e) {
        return String(data);
    }
}

function highlightJson(json) {
    // Simple syntax highlighting
    return json
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
        .replace(/"([^"]+)"(?=[,\s\n]|$)/g, '<span class="json-string">"$1"</span>')
        .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
        .replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="json-number">$1</span>');
}

function clearResponseDisplay() {
    if (responseDisplay) {
        responseDisplay.innerHTML = '<div class="text-muted">Response will appear here...</div>';
    }
    
    if (responseTimeDisplay) {
        responseTimeDisplay.textContent = '-';
    }
}

function copyResponseToClipboard() {
    if (responseDisplay) {
        const textContent = responseDisplay.textContent || '';
        
        navigator.clipboard.writeText(textContent)
            .then(() => {
                showMessage('Response copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy', err);
                showMessage('Failed to copy to clipboard', 'error');
            });
    }
}

function formatResponseJSON() {
    try {
        const content = responseDisplay.textContent || '';
        const jsonObj = JSON.parse(content);
        displayResponse(jsonObj, null, true);
        showMessage('Response has been formatted');
    } catch (error) {
        console.error('Format error', error);
        showMessage('Could not format the response as JSON', 'error');
    }
}

function showLoading(isLoading) {
    if (loadingOverlay) {
        loadingOverlay.style.display = isLoading ? 'flex' : 'none';
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeButtonText();
}

function updateThemeButtonText() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    
    if (toggleThemeBtn) {
        toggleThemeBtn.innerHTML = currentTheme === 'light' 
            ? '<i class="bi bi-moon"></i> Dark Mode' 
            : '<i class="bi bi-sun"></i> Light Mode';
    }
}

function highlightActiveSidebarItem() {
    const hash = window.location.hash || '#home';
    
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
        
        if (link.getAttribute('href') === hash) {
            link.classList.add('active');
        }
    });
}

function showActiveSection() {
    const hash = window.location.hash || '#home';
    const sectionId = hash.substring(1);
    
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
    }
}

function showMessage(message, type = 'success') {
    // Create a simple alert instead of toast
    alert(message);
} 