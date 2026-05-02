// ── Security & Utils ──
function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── State (20 Demo Projects) ──
let currentUser = JSON.parse(localStorage.getItem('syncUser')) || null;
let tasks = JSON.parse(localStorage.getItem('syncTasks')) || [
    { id: "1", title: "Q2 Financial Audit & Tax Filing", user: "finance@pro.com", status: "done", progress: 100, priority: "high" },
    { id: "2", title: "Cloud Infrastructure Security Patch", user: "devops@pro.com", status: "in-progress", progress: 65, priority: "critical" },
    { id: "3", title: "Global Talent Acquisition Strategy", user: "hr@pro.com", status: "todo", progress: 0, priority: "medium" },
    { id: "4", title: "Mobile App UX Research Phase 2", user: "design@pro.com", status: "in-progress", progress: 45, priority: "high" },
    { id: "5", title: "API Documentation Refactoring", user: "eng@pro.com", status: "todo", progress: 10, priority: "low" },
    { id: "6", title: "Social Media Campaign Q3", user: "marketing@pro.com", status: "todo", progress: 5, priority: "medium" },
    { id: "7", title: "Legal Compliance Review - EU", user: "legal@pro.com", status: "done", progress: 100, priority: "high" },
    { id: "8", title: "Customer Success Onboarding Flow", user: "success@pro.com", status: "in-progress", progress: 80, priority: "medium" },
    { id: "9", title: "Data Warehouse Migration", user: "data@pro.com", status: "todo", progress: 0, priority: "critical" },
    { id: "10", title: "Annual Shareholder Meeting Prep", user: "exec@pro.com", status: "todo", progress: 15, priority: "high" },
    { id: "11", title: "Cybersecurity Awareness Training", user: "security@pro.com", status: "done", progress: 100, priority: "medium" },
    { id: "12", title: "Enterprise Resource Planning (ERP) Upgrade", user: "it@pro.com", status: "in-progress", progress: 30, priority: "high" },
    { id: "13", title: "Internal Knowledge Base Launch", user: "hr@pro.com", status: "todo", progress: 40, priority: "low" },
    { id: "14", title: "Global Supply Chain Optimization", user: "ops@pro.com", status: "in-progress", progress: 55, priority: "critical" },
    { id: "15", title: "Brand Identity Refresh 2025", user: "marketing@pro.com", status: "todo", progress: 0, priority: "medium" },
    { id: "16", title: "Network Latency Reduction Project", user: "eng@pro.com", status: "done", progress: 100, priority: "high" },
    { id: "17", title: "DEI Initiative - Q4 Planning", user: "hr@pro.com", status: "todo", progress: 5, priority: "medium" },
    { id: "18", title: "Automated Regression Testing Suite", user: "qa@pro.com", status: "in-progress", progress: 90, priority: "medium" },
    { id: "19", title: "Investor Relations Portal Update", user: "finance@pro.com", status: "todo", progress: 0, priority: "high" },
    { id: "20", title: "SaaS Subscription Model Transition", user: "product@pro.com", status: "in-progress", progress: 25, priority: "critical" },
    { id: "21", title: "AI-Powered Customer Support Bot", user: "eng@pro.com", status: "in-progress", progress: 40, priority: "high" },
    { id: "22", title: "Quarterly Performance Reviews", user: "hr@pro.com", status: "todo", progress: 0, priority: "medium" },
    { id: "23", title: "Vendor Contract Renewals", user: "legal@pro.com", status: "in-progress", progress: 75, priority: "high" },
    { id: "24", title: "New Office Layout Planning", user: "ops@pro.com", status: "todo", progress: 5, priority: "low" },
    { id: "25", title: "Multi-Language App Localization", user: "product@pro.com", status: "in-progress", progress: 60, priority: "medium" },
    { id: "26", title: "Zero Trust Network Implementation", user: "security@pro.com", status: "in-progress", progress: 85, priority: "critical" },
    { id: "27", title: "Influencer Partnership Program", user: "marketing@pro.com", status: "todo", progress: 10, priority: "medium" },
    { id: "28", title: "Q3 Sales Kickoff Event", user: "sales@pro.com", status: "done", progress: 100, priority: "high" },
    { id: "29", title: "GDPR Compliance Audit", user: "legal@pro.com", status: "in-progress", progress: 35, priority: "critical" },
    { id: "30", title: "Microservices Architecture Migration", user: "eng@pro.com", status: "todo", progress: 0, priority: "high" },
    { id: "31", title: "Executive Dashboard Redesign", user: "design@pro.com", status: "in-progress", progress: 50, priority: "medium" },
    { id: "32", title: "Employee Wellness Program Launch", user: "hr@pro.com", status: "done", progress: 100, priority: "low" },
    { id: "33", title: "Cryptocurrency Payment Integration", user: "finance@pro.com", status: "todo", progress: 5, priority: "medium" },
    { id: "34", title: "Disaster Recovery Drill", user: "devops@pro.com", status: "in-progress", progress: 20, priority: "high" },
    { id: "35", title: "Customer Churn Analysis Report", user: "data@pro.com", status: "done", progress: 100, priority: "medium" }
];

let distChart = null;
let trendChart = null;

// ── Navigation ──
function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => {
        i.classList.remove('active');
        if (i.textContent.toLowerCase().includes(viewName)) i.classList.add('active');
    });
    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'tasks') renderBoard();
    if (viewName === 'chat') renderChat();
    if (viewName === 'members') renderMembersFull();
}

// ── Auth ──
function login() {
    const nickname = sanitize(document.getElementById('login-nickname').value.trim());
    if (!nickname) return alert("Enter nickname");
    const email = `${nickname.toLowerCase().replace(/\s/g, '')}@example.com`;
    currentUser = { email, nickname };
    localStorage.setItem('syncUser', JSON.stringify(currentUser));
    
    if (tasks.filter(t => t.user === email).length === 0) {
        tasks.push(
            { id: String(Date.now()), title: "Initial Workspace Setup", user: email, status: "in-progress", progress: 25, priority: "high" },
            { id: String(Date.now()+1), title: "Explore TeamFlow Features", user: email, status: "todo", progress: 0, priority: "medium" }
        );
        saveTasks();
    }
    initApp();
}

function renderDashboard() {
    document.getElementById('greeting').textContent = `Good Day, ${currentUser.nickname}`;
    document.getElementById('user-display').textContent = currentUser.nickname;
    
    const userTasks = tasks.filter(t => t.user === currentUser.email);
    const completed = userTasks.filter(t => t.status === 'done').length;
    document.getElementById('stat-pending').textContent = userTasks.filter(t => t.status !== 'done').length;
    document.getElementById('stat-pct').textContent = userTasks.length ? Math.round((completed/userTasks.length)*100)+'%' : '0%';
    
    const inbox = [
        { from: "System", sub: "Workspace ready", bubble: "S" },
        { from: "HR", sub: "New policy update", bubble: "H" }
    ];
    document.getElementById('inbox-list').innerHTML = inbox.map(m => `
        <div class="notification-item">
            <div class="notif-bubble">${m.bubble}</div>
            <div style="flex:1; font-size: 14px;"><b>${m.from}</b>: ${m.sub}</div>
        </div>
    `).join('');

    const priorityTasks = userTasks.filter(t => t.status !== 'done');
    document.getElementById('todo-priority-list').innerHTML = priorityTasks.map(t => `
        <div class="todo-item">
            <div class="todo-check"></div>
            <div style="flex:1; font-size: 14px;">${sanitize(t.title)}</div>
            <span class="status-pill status-${t.status === 'in-progress' ? 'at-risk' : 'on-track'}">${t.status}</span>
        </div>
    `).join('');

    initCharts();
    renderActiveProjects();
    renderTeamMembers();
}

function initCharts() {
    const todo = tasks.filter(t => t.status === 'todo').length;
    const progress = tasks.filter(t => t.status === 'in-progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    
    if (distChart) distChart.destroy();
    const ctxDist = document.getElementById('chart-distribution');
    if (ctxDist) {
        distChart = new Chart(ctxDist, {
            type: 'doughnut',
            data: {
                labels: ['Todo', 'Progress', 'Done'],
                datasets: [{ data: [todo, progress, done], backgroundColor: ['#E5E7EB', '#6D28D9', '#059669'], borderWidth: 0 }]
            },
            options: { cutout: '75%', plugins: { legend: { position: 'right' } }, maintainAspectRatio: false }
        });
    }

    if (trendChart) trendChart.destroy();
    const ctxTrend = document.getElementById('chart-trend');
    if (ctxTrend) {
        trendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Productivity',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    borderColor: '#6D28D9',
                    backgroundColor: 'rgba(109, 40, 217, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { 
                plugins: { legend: { display: false } }, 
                scales: { x: { display: false }, y: { display: false } },
                maintainAspectRatio: false 
            }
        });
    }
}

function renderActiveProjects() {
    const activeTasks = tasks.filter(t => t.status === 'in-progress').slice(0, 5);
    document.getElementById('active-projects-list').innerHTML = activeTasks.map(t => `
        <div class="todo-item" style="display: block;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                <div style="font-size: 14px; font-weight: 600;">${sanitize(t.title)}</div>
                <span style="font-size: 12px; color: var(--text-secondary);">${t.progress}%</span>
            </div>
            <div class="progress-container" style="margin: 0; height: 6px;">
                <div class="progress-fill" style="width: ${t.progress}%;"></div>
            </div>
        </div>
    `).join('');
}

function renderTeamMembers() {
    // Extract unique users
    const users = [...new Set(tasks.map(t => t.user))].slice(0, 5);
    document.getElementById('team-members-list').innerHTML = users.map(user => {
        const userTasks = tasks.filter(t => t.user === user).length;
        const initial = user.charAt(0).toUpperCase();
        return `
        <div class="notification-item">
            <div class="notif-bubble" style="background: var(--accent-gradient); color: #fff;">${initial}</div>
            <div style="flex:1; font-size: 14px;">
                <b>${sanitize(user.split('@')[0])}</b>
                <div style="font-size: 12px; color: var(--text-secondary);">${userTasks} Assigned Projects</div>
            </div>
        </div>
        `;
    }).join('');
}

function renderBoard() {
    const container = document.getElementById('task-board-columns');
    container.innerHTML = tasks.map(t => `
        <div class="project-card">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:16px;">
                <h3 style="font-size:18px; font-weight:800; max-width:70%;">${sanitize(t.title)}</h3>
                <span class="status-pill ${t.status === 'done' ? 'status-on-track' : (t.status === 'in-progress' ? 'status-at-risk' : '')}" style="background: ${t.status === 'todo' ? '#F3F4F6' : ''}">${t.status}</span>
            </div>
            <div style="color:var(--text-secondary); font-size:13px; margin-bottom: 8px;">Lead: ${sanitize(t.user)}</div>
            <div class="progress-container">
                <div class="progress-fill" style="width: ${t.progress}%"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; font-weight:700; color:var(--text-secondary);">${t.progress}% Complete</span>
                <div>
                    <button class="btn" style="padding: 6px 12px; font-size:11px; margin-right: 4px;" onclick="cycleTask('${t.id}')">Update</button>
                    <button class="btn" style="padding: 6px 12px; font-size:11px; background: var(--danger-bg); color: var(--danger);" onclick="removeTask('${t.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function cycleTask(id) {
    const t = tasks.find(x => x.id === id);
    const flow = { 'todo': 'in-progress', 'in-progress': 'done', 'done': 'todo' };
    const prog = { 'todo': 50, 'in-progress': 100, 'done': 0 };
    t.status = flow[t.status];
    t.progress = prog[t.status === 'todo' ? 'done' : (t.status === 'in-progress' ? 'todo' : 'in-progress')];
    saveTasks(); 
    if (document.getElementById('view-tasks').classList.contains('active')) renderBoard();
    if (document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
}

function addTaskAt(status) {
    const rawTitle = prompt("Enter new project/task title:");
    if (!rawTitle) return;
    tasks.unshift({ id: String(Date.now()), title: sanitize(rawTitle), user: currentUser.email, status, progress: 0, priority: 'medium' });
    saveTasks();
    if (document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
    if (document.getElementById('view-tasks').classList.contains('active')) renderBoard();
}

function removeTask(id) {
    if(!confirm("Are you sure you want to delete this project?")) return;
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    if (document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
    if (document.getElementById('view-tasks').classList.contains('active')) renderBoard();
}

function renderChat() {
    const container = document.getElementById('view-chat');
    container.innerHTML = `
        <header style="margin-bottom: 32px;">
            <h1>Team Communications</h1>
            <p class="subtitle">Real-time enterprise chat.</p>
        </header>
        <div style="background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow); border: 1px solid var(--border); height: 60vh; display: flex; flex-direction: column; overflow: hidden;">
            <div id="full-chat-messages" style="flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
                <div style="align-self: flex-start; padding: 12px 16px; border-radius: 12px; background: #F3F4F6; font-size: 14px;">Welcome to the team chat!</div>
            </div>
            <div style="padding: 24px; border-top: 1px solid var(--border); display: flex; gap: 16px;">
                <input type="text" id="full-chat-input" class="form-input" placeholder="Type your message..." style="margin-bottom: 0;">
                <button class="btn" onclick="sendFullMsg()">Send</button>
            </div>
        </div>
    `;
}

function sendFullMsg() {
    const input = document.getElementById('full-chat-input');
    if (!input.value.trim()) return;
    const msg = document.createElement('div');
    msg.style = "align-self: flex-end; padding: 12px 16px; border-radius: 12px; background: var(--accent-gradient); color: white; font-size: 14px;";
    msg.textContent = sanitize(input.value);
    document.getElementById('full-chat-messages').appendChild(msg);
    input.value = '';
}

function renderMembersFull() {
    const container = document.getElementById('view-members');
    const users = [...new Set(tasks.map(t => t.user))];
    container.innerHTML = `
        <header style="margin-bottom: 32px;">
            <h1>Organization Directory</h1>
            <p class="subtitle">All active team members.</p>
        </header>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px;">
            ${users.map(user => {
                const initial = user.charAt(0).toUpperCase();
                return `
                <div class="project-card" style="text-align: center;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--accent-gradient); color: white; font-size: 24px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">${initial}</div>
                    <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">${sanitize(user.split('@')[0])}</h3>
                    <div style="color: var(--text-secondary); font-size: 13px;">${sanitize(user)}</div>
                </div>
                `;
            }).join('')}
        </div>
    `;
}

function saveTasks() { localStorage.setItem('syncTasks', JSON.stringify(tasks)); }
function initApp() {
    if (currentUser) {
        document.getElementById('auth-modal').classList.remove('open');
        document.getElementById('app-shell').style.display = 'flex';
        switchView('dashboard');
    }
}

// ── Quick Chat ──
function toggleChat() { document.getElementById('quick-chat').style.display = document.getElementById('quick-chat').style.display === 'flex' ? 'none' : 'flex'; }
function sendMsg() {
    const input = document.getElementById('quick-chat-input');
    if (!input.value.trim()) return;
    const msg = document.createElement('div');
    msg.style = "padding:10px 14px; border-radius:12px; background:#F0F9FF; align-self:flex-end; font-size:13px; color:var(--accent); font-weight:500;";
    msg.textContent = input.value;
    document.getElementById('quick-chat-messages').appendChild(msg);
    input.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn').onclick = login;
    document.getElementById('logout-btn').onclick = () => { localStorage.removeItem('syncUser'); location.reload(); };
    document.getElementById('chat-fab').onclick = toggleChat;
    document.getElementById('close-quick-chat').onclick = toggleChat;
    document.getElementById('quick-send-btn').onclick = sendMsg;
    initApp();
});
