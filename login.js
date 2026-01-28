// API Base URL - Point to Node.js server
const API_BASE = 'http://localhost:3000';

// Show notification function
function showNotification(message, isError = false) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.className = 'notification';
    
    if (isError) {
        notification.classList.add('error');
    } else {
        notification.classList.add('success');
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Wait for DOM to load before selecting elements
document.addEventListener('DOMContentLoaded', function() {
    const registerButton = document.getElementById('register');
    const loginButton = document.getElementById('login');
    const container = document.getElementById('container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Toggle between login and register
    if (registerButton) {
        registerButton.onclick = function() {
            container.className = 'active';
        }
    }

    if (loginButton) {
        loginButton.onclick = function() {
            container.className = 'close';
        }
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            if (!email || !password) {
                showNotification('Please fill in all fields', true);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Server did not return JSON response');
                }

                const data = await response.json();

                // Store user data and token
                localStorage.setItem('asNuts_token', data.token);
                localStorage.setItem('asNuts_user', JSON.stringify(data.user));

                showNotification(`Welcome back, ${data.user.name}!`);

                // Redirect based on user role
                setTimeout(() => {
                    if (data.user.role === 'owner') {
                        window.location.href = `${API_BASE}/owner`;
                    } else {
                        window.location.href = `${API_BASE}/customer`;
                    }
                }, 1500);

            } catch (error) {
                if (error.message.includes('HTTP error! status: 405')) {
                    showNotification('Server endpoint not found. Make sure Node.js server is running on port 3000.', true);
                } else if (error.message.includes('Failed to fetch')) {
                    showNotification('Cannot connect to server. Please ensure the server is running at http://localhost:3000', true);
                } else {
                    showNotification('Login failed. Please try again.', true);
                }
            }
        });
    }

    // Handle register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value.trim();

            if (!name || !email || !password) {
                showNotification('Please fill in all fields', true);
                return;
            }

            if (password.length < 6) {
                showNotification('Password must be at least 6 characters long', true);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification('Registration successful! You can now login.');
                    
                    // Switch to login view
                    container.className = 'close';
                    
                    // Reset form
                    registerForm.reset();
                } else {
                    showNotification(data.error || 'Registration failed', true);
                }
            } catch (error) {
                showNotification('Registration failed. Please try again.', true);
            }
        });
    }
});