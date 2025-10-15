document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        // Check if we're not already on the login page
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return;
    }

    // Initialize dashboard
    loadDashboard();
    setupEventListeners();

    async function loadDashboard() {
        try {
            const response = await apiCall('/api/dashboard');
            const data = await response.json();

            if (response.ok) {
                populateDashboard(data);
            } else {
                throw new Error(data.message || 'Failed to load dashboard');
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            showError('Failed to load dashboard data');
        }
    }

    function populateDashboard(data) {
        // Hide loading message
        const loadingEl = document.getElementById('loading-dashboard');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }

        // Update user info
        document.getElementById('username').textContent = data.user.username;
        document.getElementById('userRoles').textContent = `Roles: ${data.user.roles.join(', ')}`;
        document.getElementById('lastLogin').textContent = 
            `Last login: ${data.user.lastLogin ? new Date(data.user.lastLogin).toLocaleString() : 'Never'}`;

        // Update stats
        document.getElementById('totalLinks').textContent = data.stats.totalLinks;
        document.getElementById('totalClicks').textContent = data.stats.totalClicks;
        document.getElementById('publicLinks').textContent = data.stats.publicLinks;

        // Populate modules
        populateModules(data.availableModules);

        // Populate recent and popular links
        populateLinks('recentLinks', data.recentLinks);
        populateLinks('popularLinks', data.popularLinks);
    }

    function populateModules(modules) {
        const modulesList = document.getElementById('modulesList');
        modulesList.innerHTML = '';

        modules.forEach(module => {
            const moduleCard = document.createElement('div');
            moduleCard.className = 'module-card';
            moduleCard.innerHTML = `
                <h4>${module.name}</h4>
                <p>${module.description}</p>
            `;
            
            moduleCard.addEventListener('click', () => {
                if (module.name === 'Links') {
                    openLinkManager();
                } else {
                    showMessage(`${module.name} module coming soon!`, 'success');
                }
            });

            modulesList.appendChild(moduleCard);
        });
    }

    function populateLinks(containerId, links) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (links.length === 0) {
            container.innerHTML = '<p>No links found</p>';
            return;
        }

        links.forEach(link => {
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item';
            linkItem.innerHTML = `
                <div class="link-info">
                    <a href="#" class="link-title" onclick="openLink('${link.id}')">${link.title}</a>
                    <div class="link-meta">
                        ${link.category || 'General'} • 
                        ${link.clickCount} clicks • 
                        ${link.isPublic ? 'Public' : 'Private'}
                    </div>
                </div>
            `;
            container.appendChild(linkItem);
        });
    }

    function setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', logout);

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', closeModals);
        });

        // Link form
        document.getElementById('linkForm').addEventListener('submit', handleLinkSubmit);

        // Add link button
        document.getElementById('addLinkBtn').addEventListener('click', () => {
            openLinkForm();
        });

        // Search links
        document.getElementById('searchLinks').addEventListener('input', handleSearchLinks);

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeModals();
            }
        });
    }

    async function openLinkManager() {
        document.getElementById('linkModal').style.display = 'flex';
        await loadLinks();
    }

    async function loadLinks() {
        try {
            const response = await apiCall('/api/links');
            const data = await response.json();

            if (response.ok) {
                displayLinks(data.links);
            } else {
                throw new Error(data.message || 'Failed to load links');
            }
        } catch (error) {
            console.error('Links error:', error);
            showError('Failed to load links');
        }
    }

    function displayLinks(links) {
        const linksContainer = document.getElementById('linksList');
        linksContainer.innerHTML = '';

        if (links.length === 0) {
            linksContainer.innerHTML = '<p>No links found</p>';
            return;
        }

        links.forEach(link => {
            const linkElement = document.createElement('div');
            linkElement.className = 'link-item';
            linkElement.innerHTML = `
                <div class="link-info">
                    <a href="#" class="link-title" onclick="openLink('${link.id}')">${link.title}</a>
                    <div class="link-meta">
                        ${link.url} • ${link.category || 'General'} • 
                        ${link.clickCount} clicks • 
                        ${link.isPublic ? 'Public' : 'Private'}
                    </div>
                    ${link.description ? `<p>${link.description}</p>` : ''}
                </div>
                <div class="link-actions">
                    <button class="btn btn-secondary" onclick="editLink('${link.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteLink('${link.id}')">Delete</button>
                </div>
            `;
            linksContainer.appendChild(linkElement);
        });
    }

    function openLinkForm(linkId = null) {
        const modal = document.getElementById('linkFormModal');
        const form = document.getElementById('linkForm');
        const title = document.getElementById('linkFormTitle');

        if (linkId) {
            title.textContent = 'Edit Link';
            // Load link data for editing
            loadLinkForEdit(linkId);
        } else {
            title.textContent = 'Add Link';
            form.reset();
        }

        form.dataset.linkId = linkId || '';
        modal.style.display = 'flex';
    }

    async function handleLinkSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const linkId = form.dataset.linkId;
        
        const linkData = {
            title: formData.get('title'),
            url: formData.get('url'),
            description: formData.get('description'),
            category: formData.get('category'),
            isPublic: formData.has('isPublic')
        };

        try {
            const url = linkId ? `/api/links/${linkId}` : '/api/links';
            const method = linkId ? 'PUT' : 'POST';

            const response = await apiCall(url, {
                method,
                body: JSON.stringify(linkData)
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message, 'success');
                closeModals();
                await loadLinks();
                await loadDashboard(); // Refresh stats
            } else {
                throw new Error(data.message || 'Failed to save link');
            }
        } catch (error) {
            console.error('Save link error:', error);
            showError(error.message);
        }
    }

    function closeModals() {
        document.getElementById('linkModal').style.display = 'none';
        document.getElementById('linkFormModal').style.display = 'none';
    }

    async function apiCall(url, options = {}) {
        const token = localStorage.getItem('authToken');
        
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        return fetch(url, { ...defaultOptions, ...options });
    }

    function logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    function showError(message) {
        showMessage(message, 'error');
    }

    function showMessage(message, type = 'error') {
        const messageEl = document.getElementById(type === 'error' ? 'error-message' : 'success-message');
        messageEl.textContent = message;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    // Global functions for onclick handlers
    window.openLink = async function(linkId) {
        try {
            const response = await apiCall(`/api/links/${linkId}/click`, { method: 'POST' });
            const data = await response.json();
            
            if (response.ok) {
                window.open(data.url, '_blank');
                await loadDashboard(); // Refresh stats
            } else {
                showError(data.message);
            }
        } catch (error) {
            console.error('Open link error:', error);
            showError('Failed to open link');
        }
    };

    window.editLink = function(linkId) {
        openLinkForm(linkId);
    };

    window.deleteLink = async function(linkId) {
        if (!confirm('Are you sure you want to delete this link?')) {
            return;
        }

        try {
            const response = await apiCall(`/api/links/${linkId}`, { method: 'DELETE' });
            const data = await response.json();

            if (response.ok) {
                showMessage(data.message, 'success');
                await loadLinks();
                await loadDashboard(); // Refresh stats
            } else {
                throw new Error(data.message || 'Failed to delete link');
            }
        } catch (error) {
            console.error('Delete link error:', error);
            showError(error.message);
        }
    };

    async function loadLinkForEdit(linkId) {
        try {
            const response = await apiCall(`/api/links/${linkId}`);
            const data = await response.json();

            if (response.ok) {
                const form = document.getElementById('linkForm');
                form.title.value = data.link.title;
                form.url.value = data.link.url;
                form.description.value = data.link.description || '';
                form.category.value = data.link.category || '';
                form.isPublic.checked = data.link.isPublic;
            } else {
                throw new Error(data.message || 'Failed to load link');
            }
        } catch (error) {
            console.error('Load link error:', error);
            showError('Failed to load link data');
        }
    }

    function handleSearchLinks(e) {
        const searchTerm = e.target.value.toLowerCase();
        const linkItems = document.querySelectorAll('#linksList .link-item');
        
        linkItems.forEach(item => {
            const title = item.querySelector('.link-title').textContent.toLowerCase();
            const meta = item.querySelector('.link-meta').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || meta.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
});