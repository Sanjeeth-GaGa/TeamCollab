/* ── Dashboard Charts ─────────────────────────────────────── */
function loadDashboardCharts() {
  // Logic is now mostly in templates for simplicity, but if needed via API:
  fetch('/api/dashboard/charts')
    .then(r => r.json())
    .then(data => {
      // Build charts if endpoints exist
    });
}

const CHART_DEFAULTS = {
  plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } } },
  scales: {
    x: { ticks: { color: '#64748b', font: { family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b', font: { family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.04)' } }
  }
};

/* ── Task Modal ───────────────────────────────────────────── */
function openTaskModal() {
  document.getElementById('task-modal-overlay').classList.add('open');
  loadUsersForModal();
}
function closeTaskModal() {
  document.getElementById('task-modal-overlay').classList.remove('open');
}

function loadUsersForModal() {
  const sel = document.getElementById('task-assignee');
  if (!sel || sel.options.length > 1) return;
  fetch('/api/users').then(r => r.json()).then(users => {
    sel.innerHTML = '<option value="">Unassigned</option>';
    users.forEach(u => {
      const o = document.createElement('option');
      o.value = u.id; o.textContent = u.nickname || u.username;
      sel.appendChild(o);
    });
  });
}

function submitTask(e) {
  e.preventDefault();
  const body = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-desc').value,
    assigned_to_id: document.getElementById('task-assignee').value || null,
    priority: document.getElementById('task-priority').value,
    team_tag: document.getElementById('task-tag').value,
    due_date: document.getElementById('task-due').value || null,
  };
  fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()).then(() => location.reload());
}

/* ── Kanban Drag & Drop ───────────────────────────────────── */
let draggedTaskId = null;

function onDragStart(e, taskId) {
  draggedTaskId = taskId;
  e.target.classList.add('dragging');
  setTimeout(() => e.target.classList.remove('dragging'), 0);
}

function onDrop(e, newStatus) {
  e.preventDefault();
  if (!draggedTaskId) return;
  const col = e.currentTarget;
  col.classList.remove('drag-over');
  fetch(`/api/tasks/${draggedTaskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  }).then(() => location.reload());
}

document.querySelectorAll('.kanban-col').forEach(col => {
  col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
  col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
});

/* ── Task Detail Modal ────────────────────────────────────── */
function openTaskDetail(taskId) {
  const overlay = document.getElementById('detail-modal-overlay');
  const body = document.getElementById('detail-modal-body');
  if (!overlay || !body) return;
  overlay.classList.add('open');
  body.innerHTML = '<p style="color:var(--text2);text-align:center;padding:30px">Loading…</p>';

  fetch(`/api/tasks/${taskId}`)
    .then(r => r.json())
    .then(t => {
      body.innerHTML = `
        <div class="detail-section">
          <div class="detail-label">Title</div>
          <div class="detail-value" style="font-size:18px;font-weight:700">${t.title}</div>
        </div>
        ${t.description ? `
        <div class="detail-section">
          <div class="detail-label">Description</div>
          <div class="detail-desc">${t.description}</div>
        </div>` : ''}
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div class="detail-section">
            <div class="detail-label">Status</div>
            <span class="status-badge status-${t.status}">${t.status.replace('_',' ')}</span>
          </div>
          <div class="detail-section">
            <div class="detail-label">Priority</div>
            <span class="priority-badge priority-${t.priority}">${t.priority}</span>
          </div>
          <div class="detail-section">
            <div class="detail-label">Team</div>
            <div class="detail-value">${t.team_tag}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Due Date</div>
            <div class="detail-value">${t.due_date || '—'}</div>
          </div>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div class="detail-section">
            <div class="detail-label">Assigned To</div>
            <div class="detail-value">${t.assignee_name}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Created By</div>
            <div class="detail-value">${t.creator_name}</div>
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn btn-primary btn-sm" onclick="cycleStatus(${t.id}, '${t.status}')">Advance Status</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTask(${t.id})">Delete</button>
          <button class="btn btn-ghost btn-sm" onclick="closeDetailModal()">Close</button>
        </div>`;
    });
}

function closeDetailModal() {
  const overlay = document.getElementById('detail-modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

const STATUS_CYCLE = { todo: 'in_progress', in_progress: 'done', done: 'blocked', blocked: 'todo' };

function cycleStatus(taskId, currentStatus) {
  const next = STATUS_CYCLE[currentStatus] || 'todo';
  fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: next })
  }).then(() => location.reload());
}

function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    .then(() => location.reload());
}

/* ── Chat ─────────────────────────────────────────────────── */
let socket = null;

function initChat(room, username, color, userId) {
  socket = io();

  socket.on('connect', () => {
    socket.emit('join', { room });
  });

  socket.on('receive_message', (data) => {
    // Current user's nickname is passed as 'username' to initChat
    const isMine = data.username === username;
    appendMessage({ ...data, mine: isMine });
  });

  socket.on('status', (data) => {
    const area = document.getElementById('messages-area');
    if (!area) return;
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.textContent = data.msg;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  });

  // Scroll to bottom on load
  const area = document.getElementById('messages-area');
  if (area) area.scrollTop = area.scrollHeight;

  // Enter key to send
  const input = document.getElementById('msg-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }
}

function sendMessage() {
  const input = document.getElementById('msg-input');
  const content = input.value.trim();
  if (!content || !socket) return;

  socket.emit('send_message', { room: CURRENT_ROOM, content });
  // local echo handled by server receive_message or manual (here manual for speed)
  // Actually, handle_message emits to room, so we'll receive our own message.
  // But mine: isMine check handles it.
  input.value = '';
}

function appendMessage(data) {
  const area = document.getElementById('messages-area');
  if (!area) return;
  const div = document.createElement('div');
  div.className = `message${data.mine ? ' mine' : ''}`;
  if (!data.mine) {
    div.innerHTML = `
      <div class="msg-avatar" style="background:${data.avatar_color}">${data.username[0].toUpperCase()}</div>
      <div class="msg-bubble-wrap">
        <span class="msg-author">${data.username}</span>
        <div class="msg-bubble">${escHtml(data.content)}</div>
        <span class="msg-time">${data.timestamp}</span>
      </div>`;
  } else {
    div.innerHTML = `
      <div class="msg-bubble-wrap">
        <div class="msg-bubble">${escHtml(data.content)}</div>
        <span class="msg-time">${data.timestamp}</span>
      </div>`;
  }
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'task-modal-overlay') closeTaskModal();
  if (e.target.id === 'detail-modal-overlay') closeDetailModal();
});

// Keyboard ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeTaskModal(); closeDetailModal(); }
});
