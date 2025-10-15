document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');
    const loading = document.getElementById('loading');
    const twoFactorGroup = document.getElementById('twoFactorGroup');

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        window.location.href = '/';
        return;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password'),
            twoFactorCode: formData.get('twoFactorCode') || undefined
        };

        // Clear any previous errors
        hideError();
        showLoading();

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store the token
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect to dashboard
                window.location.href = '/';
            } else {
                if (data.message === 'Two-factor authentication code required') {
                    // Show 2FA input
                    twoFactorGroup.style.display = 'block';
                    document.getElementById('twoFactorCode').focus();
                    showError('Please enter your two-factor authentication code');
                } else {
                    showError(data.message || 'Login failed');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        } finally {
            hideLoading();
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function showLoading() {
        loading.style.display = 'block';
        loginForm.querySelector('button[type="submit"]').disabled = true;
    }

    function hideLoading() {
        loading.style.display = 'none';
        loginForm.querySelector('button[type="submit"]').disabled = false;
    }

    // Auto-focus on 2FA code when shown
    document.getElementById('twoFactorCode').addEventListener('input', function(e) {
        // Limit to 6 digits
        this.value = this.value.replace(/\D/g, '').substring(0, 6);
        
        // Auto-submit when 6 digits are entered
        if (this.value.length === 6) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});