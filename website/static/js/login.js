// API endpoints
const API_BASE = mainDomain + '/users/';
const LOGIN_URL = API_BASE + 'auth/jwt/create/';
const REGISTER_URL = API_BASE + 'auth/users/register/';
const LOGOUT_URL = API_BASE + 'auth/users/logout/';
const REFRESH_URL = API_BASE + 'auth/jwt/refresh/';
const PASSWORD_RESET_REQUEST = API_BASE + 'password-reset/request/';
const PASSWORD_RESET_VERIFY = API_BASE + 'password-reset/verify/';
const PASSWORD_RESET_RESET = API_BASE + 'password-reset/reset/';

// Password generator configuration
const PASSWORD_CHARS = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Utility functions
function showMessage(messageId, text, type = 'info') {
    const messageEl = document.getElementById(messageId);
    messageEl.className = `message message-${type} show`;
    messageEl.textContent = text;
    
    if (type === 'success') {
        setTimeout(() => hideMessage(messageId), 5000);
    }
}

function hideMessage(messageId) {
    document.getElementById(messageId).classList.remove('show');
}

function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    
    if (isLoading) {
        button.disabled = true;
        btnText.style.display = 'none';
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        button.appendChild(spinner);
    } else {
        button.disabled = false;
        btnText.style.display = 'inline';
        const spinner = button.querySelector('.spinner');
        if (spinner) spinner.remove();
    }
}

// Form management
function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    hideMessage('login-message');
}

function showLoginForm() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    hideMessage('register-message');
}

// Password visibility toggle
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('bi-eye-slash', 'bi-eye');
    } else {
        input.type = 'password';
        icon.classList.replace('bi-eye', 'bi-eye-slash');
    }
}

// Password generation
function generateStrongPassword() {
    const length = 12;
    let charset = '';
    let password = '';
    
    // Ensure at least one character from each set
    charset += PASSWORD_CHARS.lowercase;
    password += PASSWORD_CHARS.lowercase.charAt(Math.floor(Math.random() * PASSWORD_CHARS.lowercase.length));
    
    charset += PASSWORD_CHARS.uppercase;
    password += PASSWORD_CHARS.uppercase.charAt(Math.floor(Math.random() * PASSWORD_CHARS.uppercase.length));
    
    charset += PASSWORD_CHARS.numbers;
    password += PASSWORD_CHARS.numbers.charAt(Math.floor(Math.random() * PASSWORD_CHARS.numbers.length));
    
    charset += PASSWORD_CHARS.symbols;
    password += PASSWORD_CHARS.symbols.charAt(Math.floor(Math.random() * PASSWORD_CHARS.symbols.length));
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    // Set the password fields
    const passwordField = document.getElementById('register-password');
    const confirmField = document.getElementById('register-confirm-password');
    passwordField.value = password;
    confirmField.value = password;
    
    // Trigger input events to update strength indicator
    passwordField.dispatchEvent(new Event('input'));
    confirmField.dispatchEvent(new Event('input'));
}

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
    
    // Calculate strength score (0-5)
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Update UI based on score
    if (score < 2) {
        strengthIndicators[0].style.backgroundColor = '#FF4757';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#FF4757';
    } else if (score < 4) {
        strengthIndicators[0].style.backgroundColor = '#FFA502';
        strengthIndicators[1].style.backgroundColor = '#FFA502';
        strengthText.textContent = 'Medium';
        strengthText.style.color = '#FFA502';
    } else {
        strengthIndicators.forEach(ind => ind.style.backgroundColor = '#2ED573');
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#2ED573';
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

// Email validation
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!validateEmail(email)) {
        showMessage('login-message', 'Please enter a valid email address', 'error');
        return;
    }
    
    hideMessage('login-message');
    setButtonLoading('login-btn', true);
    console.log(LOGIN_URL);
    
    try {
        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },
            body: JSON.stringify({ email, password })
        });
        console.log(LOGIN_URL);
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('login-message', 'Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = '/', 1500);
        } else {
            const errorMessage = data.detail || 'Login failed. Please check your credentials.';
            showMessage('login-message', errorMessage, 'error');
        }
    } catch (error) {
        showMessage('login-message', 'An error occurred during login. Please try again.', 'error');
    } finally {
        setButtonLoading('login-btn', false);
    }
});

// Registration form handler
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const termsChecked = document.querySelector('input[name="terms"]').checked;
    
    // Client-side validation
    if (!validateEmail(email)) {
        showMessage('register-message', 'Please enter a valid email address', 'error');
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
    
    if (!termsChecked) {
        showMessage('register-message', 'You must accept the terms and conditions', 'error');
        return;
    }
    
    setButtonLoading('register-btn', true);
    hideMessage('register-message');
    
    try {
        const response = await fetch(REGISTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },

       body: JSON.stringify({
    username: email, // أو أي username تريده
    email: email,
    password: password,
    re_password: password
})
        });
        
        const data = await response.json();
        console.log(data);
        if (response.ok) {
            showMessage('register-message', 'Account created successfully! Redirecting...', 'success');
            setTimeout(() => window.location.href = '/', 1500);
        } else {
            let errorMessage = 'Registration failed.';
            if (data.email) errorMessage = 'Email: ' + data.email.join(' ');
            if (data.password) errorMessage = 'Password: ' + data.password.join(' ');
            if (data.non_field_errors) errorMessage = data.non_field_errors.join(' ');
            showMessage('register-message', errorMessage, 'error');
        }
    } catch (error) {
        showMessage('register-message', 'An error occurred during registration. Please try again.', 'error');
    } finally {
        setButtonLoading('register-btn', false);
    }
});

// Password reset modal functions
function showResetModal() {
    document.getElementById('resetModal').style.display = 'flex';
    document.getElementById('reset-step1').style.display = 'block';
    document.getElementById('reset-step2').style.display = 'none';
    document.getElementById('reset-step3').style.display = 'none';
    document.getElementById('reset-email').value = '';
    document.getElementById('reset-code').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-new-password').value = '';
    hideMessage('reset-message');
}

function closeResetModal() {
    document.getElementById('resetModal').style.display = 'none';
}

// Password reset handlers
async function sendResetCode() {
    const email = document.getElementById('reset-email').value;
    
    if (!validateEmail(email)) {
        showMessage('reset-message', 'Please enter a valid email address', 'error');
        return;
    }
    
    setButtonLoading('reset-send-btn', true);
    
    try {
        const response = await fetch(PASSWORD_RESET_REQUEST, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            showMessage('reset-message', 'Reset code sent to your email', 'success');
            document.getElementById('reset-step1').style.display = 'none';
            document.getElementById('reset-step2').style.display = 'block';
        } else {
            const data = await response.json();
            showMessage('reset-message', data.error || 'Failed to send reset code', 'error');
        }
    } catch (error) {
        showMessage('reset-message', 'Network error. Please try again.', 'error');
    } finally {
        setButtonLoading('reset-send-btn', false);
    }
}

async function verifyResetCode() {
    const email = document.getElementById('reset-email').value;
    const code = document.getElementById('reset-code').value;
    
    if (!code || code.length !== 6) {
        showMessage('reset-message', 'Please enter a valid 6-digit code', 'error');
        return;
    }
    
    setButtonLoading('reset-verify-btn', true);
    
    try {
        const response = await fetch(PASSWORD_RESET_VERIFY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },
            body: JSON.stringify({ email, code })
        });
        
        if (response.ok) {
            showMessage('reset-message', 'Code verified successfully', 'success');
            document.getElementById('reset-step2').style.display = 'none';
            document.getElementById('reset-step3').style.display = 'block';
        } else {
            const data = await response.json();
            showMessage('reset-message', data.error || 'Invalid verification code', 'error');
        }
    } catch (error) {
        showMessage('reset-message', 'Network error. Please try again.', 'error');
    } finally {
        setButtonLoading('reset-verify-btn', false);
    }
}

async function submitNewPassword() {
    const email = document.getElementById('reset-email').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (newPassword.length < 8) {
        showMessage('reset-message', 'Password must be at least 8 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('reset-message', 'Passwords do not match', 'error');
        return;
    }
    
    setButtonLoading('reset-submit-btn', true);
    
    try {
        const response = await fetch(PASSWORD_RESET_RESET, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },
            body: JSON.stringify({ email, new_password: newPassword })
        });
        
        if (response.ok) {
            showMessage('reset-message', 'Password updated successfully! You can now login with your new password.', 'success');
            setTimeout(() => {
                closeResetModal();
                showLoginForm();
            }, 2000);
        } else {
            const data = await response.json();
            showMessage('reset-message', data.error || 'Failed to update password', 'error');
        }
    } catch (error) {
        showMessage('reset-message', 'Network error. Please try again.', 'error');
    } finally {
        setButtonLoading('reset-submit-btn', false);
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Generate password button
    const generateBtn = document.getElementById('generate-password');
    if (generateBtn) {
        generateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            generateStrongPassword();
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeResetModal();
            }
        });
    }
});