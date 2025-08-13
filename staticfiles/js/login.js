// API endpoints
const API_BASE = mainDomain + 'users/';
const LOGIN_URL = API_BASE + 'auth/jwt/create/';
const REGISTER_URL = API_BASE + 'auth/users/register/';
const LOGOUT_URL = API_BASE + 'auth/users/logout/';
const REFRESH_URL = API_BASE + 'auth/jwt/refresh/';



// Message display functions
function showMessage(messageId, text, type = 'info') {
    const messageEl = document.getElementById(messageId);
    messageEl.className = `message message-${type} show`;
    messageEl.textContent = text;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideMessage(messageId);
        }, 5000);
    }
}

function hideMessage(messageId) {
    const messageEl = document.getElementById(messageId);
    messageEl.classList.remove('show');
}

// Button loading state functions
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    
    if (isLoading) {
        button.disabled = true;
        btnText.style.display = 'none';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        const loadingText = document.createElement('span');
        loadingText.textContent = 'Please wait...';
        
        button.appendChild(spinner);
        button.appendChild(loadingText);
    } else {
        button.disabled = false;
        btnText.style.display = 'inline';
        
        // Remove spinner and loading text
        const spinner = button.querySelector('.spinner');
        const loadingText = button.querySelector('span:not(.btn-text)');
        if (spinner) spinner.remove();
        if (loadingText) loadingText.remove();
    }
}

// Toggle between login and register forms
function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    hideMessage('login-message');
    hideMessage('register-message');
}

function showLoginForm() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    hideMessage('login-message');
    hideMessage('register-message');
}

// Toggle password visibility
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    }
}

// Validate username during typing
document.getElementById('register-username')?.addEventListener('input', function(e) {
    const username = e.target.value;
    const regex = /^[a-zA-Z0-9_]{4,30}$/;
    
    if (!regex.test(username)) {
        this.style.borderColor = '#FF4757';
    } else {
        this.style.borderColor = '#2ED573';
    }
});

// Password strength indicator
document.getElementById('register-password')?.addEventListener('input', function(e) {
    const password = e.target.value;
    const strengthIndicators = document.querySelectorAll('.strength-indicator');
    const strengthText = document.querySelector('.strength-text');
    
    // Reset indicators
    strengthIndicators.forEach(ind => ind.style.backgroundColor = '#EDF0F2');
    
    if (password.length === 0) {
        strengthText.textContent = 'Password strength';
        strengthText.style.color = '#525E6F';
        return;
    }
    
    if (password.length < 6) {
        strengthIndicators[0].style.backgroundColor = '#FF4757';
        strengthText.textContent = 'Very weak';
        strengthText.style.color = '#FF4757';
        return;
    }
    
    // Medium strength (contains letters and numbers)
    if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) {
        strengthIndicators[0].style.backgroundColor = '#FFA502';
        strengthIndicators[1].style.backgroundColor = '#FFA502';
        strengthText.textContent = 'Medium';
        strengthText.style.color = '#FFA502';
        
        // Strong password (contains special chars)
        if (/[^a-zA-Z0-9]/.test(password)) {
            strengthIndicators[0].style.backgroundColor = '#2ED573';
            strengthIndicators[1].style.backgroundColor = '#2ED573';
            strengthIndicators[2].style.backgroundColor = '#2ED573';
            strengthText.textContent = 'Strong';
            strengthText.style.color = '#2ED573';
        }
    } else {
        strengthIndicators[0].style.backgroundColor = '#FFA502';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#FFA502';
    }
});

// Password confirmation check
document.getElementById('register-confirm-password')?.addEventListener('input', function() {
    const password = document.getElementById('register-password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = '#FF4757';
    } else if (confirmPassword) {
        this.style.borderColor = '#2ED573';
    } else {
        this.style.borderColor = '#DCE0E5';
    }
});

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.querySelector('input[name="remember"]').checked;
    
    // Hide any existing messages
    hideMessage('login-message');
    
    // Set loading state
    setButtonLoading('login-btn', true);
    
    try {
        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Successfully logged in
            showMessage('login-message', 'Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/'; // Redirect to home page
            }, 1500);
        } else {
            // Show error message
            const errorMessage = data.detail || 'Login failed. Please check your credentials.';
            showMessage('login-message', errorMessage, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('login-message', 'An error occurred during login. Please try again.', 'error');
    } finally {
        // Remove loading state
        setButtonLoading('login-btn', false);
    }
});

// Handle registration form submission
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const regex = /^[a-zA-Z0-9_]{4,30}$/;
    
    // Hide any existing messages
    hideMessage('register-message');
    
    // Client-side validation
    if (!regex.test(username)) {
        showMessage('register-message', 'Username must be 4-30 characters (letters, numbers, _ only)', 'error');
        return;
    }
    
    if (password.length < 8) {
        showMessage('register-message', 'Password must be at least 8 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('register-message', 'Passwords do not match!', 'error');
        return;
    }
    
    // Set loading state
    setButtonLoading('register-btn', true);
    
    try {
        const response = await fetch(REGISTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                re_password: confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Successfully registered
            showMessage('register-message', 'Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/'; // Redirect to home page
            }, 1500);
        } else {
            // Show error messages
            let errorMessage = 'Registration failed.';
            if (data.username) {
                errorMessage = 'Username: ' + data.username.join(' ');
            } else if (data.password) {
                errorMessage = 'Password: ' + data.password.join(' ');
            } else if (data.non_field_errors) {
                errorMessage = data.non_field_errors.join(' ');
            }
            showMessage('register-message', errorMessage, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('register-message', 'An error occurred during registration. Please try again.', 'error');
    } finally {
        // Remove loading state
        setButtonLoading('register-btn', false);
    }
});