// Configuração
const API_URL = 'http://localhost:8000/api/v1';
let authToken = null;
let currentUser = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Verificar se tem token salvo
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        fetchUserData();
        closeModal('auth-modal');
        loadDashboardData();
    }
}

function setupEventListeners() {
    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            showPage(page);
        });
    });

    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchAuthTab(tabName);
        });
    });

    // Enter key para login
    document.getElementById('login-password')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });

    document.getElementById('register-password')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') register();
    });
}

// Navegação entre páginas
function showPage(pageName) {
    // Atualizar menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');

    // Atualizar páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}-page`)?.classList.add('active');

    // Atualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'automations': 'Automações',
        'integrations': 'Integrações',
        'logs': 'Logs',
        'settings': 'Configurações'
    };
    document.getElementById('page-title').textContent = titles[pageName] || pageName;

    // Carregar dados da página
    loadPageData(pageName);
}

function loadPageData(pageName) {
    switch(pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'automations':
            loadAutomations();
            break;
        case 'integrations':
            loadIntegrations();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

// Autenticação
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                username: email,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            closeModal('auth-modal');
            showNotification('Login realizado com sucesso!', 'success');
            fetchUserData();
            loadDashboardData();
        } else {
            showNotification('Email ou senha incorretos', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showNotification('Erro ao fazer login. Verifique se o backend está rodando.', 'error');
    }
}

async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (!name || !email || !password) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                full_name: name,
                email: email,
                password: password
            })
        });

        if (response.ok) {
            showNotification('Conta criada com sucesso! Faça login.', 'success');
            switchAuthTab('login');
            document.getElementById('login-email').value = email;
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        showNotification('Erro ao criar conta. Verifique se o backend está rodando.', 'error');
    }
}

function useDemoMode() {
    closeModal('auth-modal');
    showNotification('Modo demo ativado! Explore à vontade.', 'info');
    
    // Definir dados de demo
    currentUser = {
        email: 'demo@example.com',
        full_name: 'Usuário Demo'
    };
    
    updateUserInfo();
    loadDemoData();
}

function updateUserInfo() {
    if (currentUser) {
        document.querySelector('.user-name').textContent = currentUser.full_name;
        document.querySelector('.user-email').textContent = currentUser.email;
    }
}

async function fetchUserData() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            updateUserInfo();
        }
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    document.getElementById('auth-modal').classList.add('active');
    showNotification('Logout realizado com sucesso', 'info');
}

function switchAuthTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${tabName}-form`)?.classList.add('active');
}

// Dashboard
async function loadDashboardData() {
    if (!authToken) {
        loadDemoData();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/logs/dashboard`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateDashboardStats(data);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function loadDemoData() {
    updateDashboardStats({
        total_automations: 5,
        active_automations: 3,
        executions_today: 12,
        success_rate: 95.5,
        total_integrations: 2
    });
}

function updateDashboardStats(data) {
    document.getElementById('active-automations').textContent = data.active_automations || 0;
    document.getElementById('executions-today').textContent = data.executions_today || 0;
    document.getElementById('total-integrations').textContent = data.total_integrations || 0;
    document.getElementById('success-rate').textContent = `${data.success_rate || 0}%`;
}

// Automações
async function loadAutomations() {
    if (!authToken) {
        showDemoAutomations();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/automations`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const automations = await response.json();
            displayAutomations(automations);
        }
    } catch (error) {
        console.error('Erro ao carregar automações:', error);
    }
}

function showDemoAutomations() {
    const demoAutomations = [
        {
            id: '1',
            name: 'Boas-vindas WhatsApp',
            description: 'Envia mensagem de boas-vindas para novos clientes',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: '2',
            name: 'Email de Follow-up',
            description: 'Envia email automático após 3 dias',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: '3',
            name: 'Registro em Planilha',
            description: 'Adiciona novos leads no Google Sheets',
            status: 'paused',
            created_at: new Date().toISOString()
        }
    ];
    displayAutomations(demoAutomations);
}

function displayAutomations(automations) {
    const container = document.getElementById('automations-list');
    
    if (automations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-robot"></i>
                <p>Nenhuma automação criada</p>
                <button class="btn-primary" onclick="openCreateAutomationModal()">Criar Primeira Automação</button>
            </div>
        `;
        return;
    }

    container.innerHTML = automations.map(auto => `
        <div class="card">
            <div class="card-header">
                <h3>${auto.name}</h3>
                <span class="badge ${auto.status === 'active' ? 'success' : 'warning'}">${auto.status}</span>
            </div>
            <div class="card-body">
                <p>${auto.description}</p>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn-primary" onclick="executeAutomation('${auto.id}')">
                        <i class="fas fa-play"></i> Executar
                    </button>
                    <button class="btn-secondary" onclick="editAutomation('${auto.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Integrações
async function loadIntegrations() {
    // Implementar quando tiver backend completo
}

function connectIntegration(type) {
    showNotification(`Conectando ${type}... (implementar OAuth)`, 'info');
}

// Logs
async function loadLogs() {
    if (!authToken) {
        showDemoLogs();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/logs`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const logs = await response.json();
            displayLogs(logs);
        }
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
    }
}

function showDemoLogs() {
    const demoLogs = [
        {
            id: '1',
            automation_name: 'Boas-vindas WhatsApp',
            status: 'success',
            executed_at: new Date().toISOString(),
            duration: '1.2s'
        },
        {
            id: '2',
            automation_name: 'Email de Follow-up',
            status: 'success',
            executed_at: new Date(Date.now() - 3600000).toISOString(),
            duration: '2.5s'
        },
        {
            id: '3',
            automation_name: 'Registro em Planilha',
            status: 'error',
            executed_at: new Date(Date.now() - 7200000).toISOString(),
            error_message: 'Falha na autenticação Google'
        }
    ];
    displayLogs(demoLogs);
}

function displayLogs(logs) {
    const container = document.getElementById('logs-list');
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <p>Nenhum log disponível</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${logs.map(log => `
                <div class="card">
                    <div class="card-body" style="padding: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${log.automation_name || 'Automação'}</strong>
                                <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                    ${new Date(log.executed_at).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <span class="badge ${log.status === 'success' ? 'success' : 'error'}">
                                ${log.status}
                            </span>
                        </div>
                        ${log.error_message ? `<p style="color: var(--danger-color); margin-top: 0.5rem; font-size: 0.875rem;">${log.error_message}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Modals
function openCreateAutomationModal() {
    document.getElementById('create-automation-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function createAutomation() {
    const name = document.getElementById('automation-name').value;
    const description = document.getElementById('automation-description').value;
    const type = document.getElementById('automation-type').value;

    if (!name || !description || !type) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }

    if (!authToken) {
        showNotification('Funcionalidade disponível apenas com login', 'warning');
        closeModal('create-automation-modal');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/automations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description,
                status: 'active'
            })
        });

        if (response.ok) {
            showNotification('Automação criada com sucesso!', 'success');
            closeModal('create-automation-modal');
            loadAutomations();
            
            // Limpar formulário
            document.getElementById('automation-name').value = '';
            document.getElementById('automation-description').value = '';
            document.getElementById('automation-type').value = '';
        } else {
            showNotification('Erro ao criar automação', 'error');
        }
    } catch (error) {
        console.error('Erro ao criar automação:', error);
        showNotification('Erro ao criar automação', 'error');
    }
}

async function executeAutomation(id) {
    showNotification('Executando automação...', 'info');
    
    if (!authToken) {
        setTimeout(() => {
            showNotification('Automação executada com sucesso! (modo demo)', 'success');
        }, 1000);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/automations/${id}/execute`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showNotification('Automação executada com sucesso!', 'success');
        } else {
            showNotification('Erro ao executar automação', 'error');
        }
    } catch (error) {
        console.error('Erro ao executar automação:', error);
        showNotification('Erro ao executar automação', 'error');
    }
}

function editAutomation(id) {
    showNotification('Edição em desenvolvimento', 'info');
}

// Utilidades
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function testConnection() {
    const apiUrl = document.getElementById('api-url').value;
    
    fetch(`${apiUrl}/health`)
        .then(response => response.json())
        .then(data => {
            showNotification(`Conexão OK! Status: ${data.status}`, 'success');
        })
        .catch(error => {
            showNotification('Falha na conexão com o backend', 'error');
        });
}

function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Adicionar estilos se não existirem
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                box-shadow: var(--shadow-lg);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            }
            .notification-success { border-left: 4px solid var(--success-color); }
            .notification-error { border-left: 4px solid var(--danger-color); }
            .notification-info { border-left: 4px solid var(--info-color); }
            .notification-warning { border-left: 4px solid var(--warning-color); }
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Filtros
function filterLogs() {
    const filter = document.getElementById('log-filter').value;
    showNotification(`Filtrando logs: ${filter}`, 'info');
    // Implementar filtro real
}

// Mobile menu
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
});