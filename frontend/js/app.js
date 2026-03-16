/**
 * app.js — Controlador principal de la aplicación
 *
 * Responsabilidades:
 * - Inicializar todos los módulos
 * - Manejar la navegación entre secciones
 * - Gestionar el modal de configuración
 * - Cargar datos de Clientes, Proyectos y Tareas
 * - Utilidades globales (toast, estado de conexión)
 */

// ════════════════════════════════════════════════════════════
// INIT — punto de entrada
// ════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  console.info('[App] FreelanceAI Assistant iniciando…');

  // 1. Inicializa Supabase (protegido para evitar que errores detengan la carga)
  let supabaseOk = false;
  try {
    supabaseOk = !!initSupabase();
  } catch (err) {
    console.error('[App] Error inicializando Supabase:', err);
    supabaseOk = false;
  }

  // 2. Actualiza status en la topbar
  updateConnectionStatus(supabaseOk);

  // 3. Inicializa el chat (protegido para que fallos no detengan la carga)
  try {
    await initChat();
  } catch (err) {
    console.error('[App] Error inicializando chat:', err);
  }

  // 4. Carga el perfil del freelancer (protegido)
  try {
    await loadFreelancerProfile();
  } catch (err) {
    console.error('[App] Error cargando perfil del freelancer:', err);
  }

  // 5. Registra todos los event listeners de la app
  setupNavigation();
  setupSidebar();
  setupSettingsModal();

  // 6. Carga el historial de conversaciones en el sidebar
  updateSidebarHistory();

  console.info('[App] Listo.');
});


// ════════════════════════════════════════════════════════════
// PERFIL DEL FREELANCER
// ════════════════════════════════════════════════════════════

async function loadFreelancerProfile() {
  try {
    const profile = await getFreelancerProfile();
    const name = profile?.name || CONFIG.FREELANCER_NAME || 'Freelancer';

    // Actualiza UI
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl)   nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

    document.title = `${name} · FreelanceAI`;
  } catch (err) {
    console.error('[App] loadFreelancerProfile error:', err);
    // Fallback: ensure UI remains usable
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = CONFIG.FREELANCER_NAME || 'Freelancer';
    if (avatarEl) avatarEl.textContent = (CONFIG.FREELANCER_NAME || 'F').charAt(0).toUpperCase();
  }
}


// ════════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE SECCIONES
// ════════════════════════════════════════════════════════════

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections  = document.querySelectorAll('.section');

  navItems.forEach(btn => {
    btn.addEventListener('click', async () => {
      const sectionName = btn.getAttribute('data-section');

      // Actualiza botones activos
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Actualiza secciones visibles
      sections.forEach(s => s.classList.remove('active'));
      const target = document.getElementById(`section-${sectionName}`);
      if (target) target.classList.add('active');

      // Carga datos de la sección
      switch (sectionName) {
        case 'clients': await loadClientsSection(); break;
        case 'projects': await loadProjectsSection(); break;
        case 'tasks': await loadTasksSection(); break;
        case 'history': await loadHistorySection(); break;
      }

      // En móvil, cierra el sidebar al navegar
      closeSidebar();
    });
  });

  // Botón "Nueva conversación"
  document.getElementById('newChatBtn')?.addEventListener('click', async () => {
    // Activa la sección de chat
    document.querySelector('[data-section="chat"]')?.click();
    await startNewConversation();
  });
}


// ════════════════════════════════════════════════════════════
// SIDEBAR (móvil)
// ════════════════════════════════════════════════════════════

function setupSidebar() {
  const sidebar    = document.getElementById('sidebar');
  const menuBtn    = document.getElementById('menuBtn');
  const toggleBtn  = document.getElementById('sidebarToggle');

  menuBtn?.addEventListener('click',   openSidebar);
  toggleBtn?.addEventListener('click', closeSidebar);

  // Cierra el sidebar al hacer click fuera (overlay)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== menuBtn) {
      closeSidebar();
    }
  });
}

function openSidebar()  { document.getElementById('sidebar').classList.add('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); }


// ════════════════════════════════════════════════════════════
// HISTORIAL DE CONVERSACIONES (sidebar)
// ════════════════════════════════════════════════════════════

async function updateSidebarHistory() {
  const conversations = await getConversations();
  const listEl = document.getElementById('historyList');
  if (!listEl) return;

  if (conversations.length === 0) {
    listEl.innerHTML = '<p class="history-item" style="cursor:default;color:var(--text-muted)">Sin conversaciones</p>';
    return;
  }

  listEl.innerHTML = conversations.slice(0, 10).map(conv => `
    <div class="history-item" data-id="${conv.id}" title="${escapeHtml(conv.title)}">
      ${escapeHtml(conv.title)}
    </div>
  `).join('');

  // Click en una conversación → la carga
  listEl.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = item.getAttribute('data-id');
      if (id) {
        document.querySelector('[data-section="chat"]')?.click();
        await loadConversation(id);
      }
    });
  });
}


// ════════════════════════════════════════════════════════════
// SECCIÓN: CLIENTES
// ════════════════════════════════════════════════════════════

async function loadClientsSection() {
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><p>Cargando clientes…</p></div>';

  const clients = await getClients();

  if (clients.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No hay clientes todavía.<br/>
        Agrega uno con el botón + o dile a la IA:<br/>
        <em>"Crea un cliente llamado Empresa Ejemplo"</em></p>
      </div>`;
    return;
  }

  grid.innerHTML = clients.map(c => `
    <div class="card" data-id="${c.id}">
      <p class="card-title">${escapeHtml(c.name)}</p>
      <p class="card-meta">
        ${c.email ? `📧 ${escapeHtml(c.email)}<br>` : ''}
        ${c.company ? `🏢 ${escapeHtml(c.company)}<br>` : ''}
        ${c.phone ? `📱 ${escapeHtml(c.phone)}` : ''}
      </p>
      <span class="badge ${c.status === 'active' ? 'active' : 'inactive'}">
        ${c.status === 'active' ? 'Activo' : 'Inactivo'}
      </span>
    </div>
  `).join('');
}

// Botón agregar cliente
document.getElementById('addClientBtn')?.addEventListener('click', () => {
  const name = prompt('Nombre del cliente:');
  if (!name) return;
  const email = prompt('Email (opcional):') || '';
  createClient({ name, email }).then(c => {
    if (c) { showToast(`👥 Cliente "${c.name}" creado`, 'success'); loadClientsSection(); }
  });
});


// ════════════════════════════════════════════════════════════
// SECCIÓN: PROYECTOS
// ════════════════════════════════════════════════════════════

async function loadProjectsSection() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><p>Cargando proyectos…</p></div>';

  const projects = await getProjects();

  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>Sin proyectos por el momento.<br/>
        Crea uno con + o dile a la IA: <em>"Crear proyecto web para cliente X"</em></p>
      </div>`;
    return;
  }

  const statusLabels = {
    pending:     'Pendiente',
    in_progress: 'En progreso',
    done:        'Completado',
    cancelled:   'Cancelado',
  };

  grid.innerHTML = projects.map(p => `
    <div class="card" data-id="${p.id}">
      <p class="card-title">${escapeHtml(p.name)}</p>
      <p class="card-meta">
        ${p.clients?.name ? `👤 ${escapeHtml(p.clients.name)}<br>` : ''}
        ${p.description ? escapeHtml(p.description.slice(0, 80)) + (p.description.length > 80 ? '…' : '') : ''}
        ${p.deadline ? `<br>📅 ${new Date(p.deadline).toLocaleDateString('es')}` : ''}
      </p>
      <span class="badge ${p.status}">${statusLabels[p.status] || p.status}</span>
    </div>
  `).join('');
}

document.getElementById('addProjectBtn')?.addEventListener('click', () => {
  const name = prompt('Nombre del proyecto:');
  if (!name) return;
  createProject({ name }).then(p => {
    if (p) { showToast(`📁 Proyecto "${p.name}" creado`, 'success'); loadProjectsSection(); }
  });
});


// ════════════════════════════════════════════════════════════
// SECCIÓN: TAREAS
// ════════════════════════════════════════════════════════════

let currentTaskFilter = 'all';

async function loadTasksSection(filter = currentTaskFilter) {
  currentTaskFilter = filter;
  const listEl = document.getElementById('tasksList');
  if (!listEl) return;

  listEl.innerHTML = '<div class="empty-state"><p>Cargando tareas…</p></div>';

  const tasks = await getTasks(filter === 'all' ? null : filter);

  if (tasks.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>Sin tareas ${filter !== 'all' ? `con estado "${filter}"` : ''}.<br/>
        Agrega una con + o escríbele a la IA: <em>"/tarea Revisar contrato del cliente X"</em></p>
      </div>`;
    return;
  }

  listEl.innerHTML = tasks.map(t => `
    <div class="task-item" data-id="${t.id}">
      <div class="task-check ${t.status === 'done' ? 'checked' : ''}" data-task-id="${t.id}">
        ${t.status === 'done' ? '✓' : ''}
      </div>
      <div class="task-body">
        <p class="task-title ${t.status === 'done' ? 'done' : ''}">${escapeHtml(t.title)}</p>
        <p class="task-due">
          ${t.due_date ? `📅 ${new Date(t.due_date).toLocaleDateString('es')}` : ''}
          ${t.projects?.name ? ` · 📁 ${escapeHtml(t.projects.name)}` : ''}
          ${t.priority === 'high' ? ' · 🔴 Alta prioridad' : ''}
        </p>
      </div>
    </div>
  `).join('');

  // Toggle de completar tarea
  listEl.querySelectorAll('.task-check').forEach(check => {
    check.addEventListener('click', async (e) => {
      e.stopPropagation();
      const taskId = check.getAttribute('data-task-id');
      const isDone = check.classList.contains('checked');
      const newStatus = isDone ? 'pending' : 'done';
      await updateTaskStatus(taskId, newStatus);
      await loadTasksSection();
    });
  });
}

// Filtros de tareas
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadTasksSection(btn.getAttribute('data-filter'));
  });
});

document.getElementById('addTaskBtn')?.addEventListener('click', () => {
  const title = prompt('Descripción de la tarea:');
  if (!title) return;
  createTask({ title }).then(t => {
    if (t) { showToast(`✅ Tarea creada`, 'success'); loadTasksSection(); }
  });
});


// ════════════════════════════════════════════════════════════
// SECCIÓN: HISTORIAL COMPLETO
// ════════════════════════════════════════════════════════════

async function loadHistorySection() {
  const listEl = document.getElementById('fullHistoryList');
  if (!listEl) return;

  const conversations = await getConversations();

  if (conversations.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><p>No hay conversaciones guardadas todavía.</p></div>';
    return;
  }

  listEl.innerHTML = conversations.map(conv => `
    <div class="history-full-item" data-id="${conv.id}">
      <h4>${escapeHtml(conv.title)}</h4>
      <p>${new Date(conv.updated_at || conv.created_at).toLocaleString('es')}</p>
    </div>
  `).join('');

  listEl.querySelectorAll('.history-full-item').forEach(item => {
    item.addEventListener('click', async () => {
      document.querySelector('[data-section="chat"]')?.click();
      await loadConversation(item.getAttribute('data-id'));
    });
  });
}


// ════════════════════════════════════════════════════════════
// MODAL DE CONFIGURACIÓN
// ════════════════════════════════════════════════════════════

function setupSettingsModal() {
  const modal       = document.getElementById('settingsModal');
  const openBtn     = document.getElementById('settingsBtn');
  const closeBtn    = document.getElementById('closeSettings');
  const saveBtn     = document.getElementById('saveSettings');

  // Precarga los valores actuales
  openBtn?.addEventListener('click', () => {
    document.getElementById('aiProvider').value    = CONFIG.AI_PROVIDER || 'mock';
    document.getElementById('apiKeyInput').value   = CONFIG.AI_API_KEY  || '';
    document.getElementById('supabaseUrl').value   = CONFIG.SUPABASE_URL || '';
    document.getElementById('supabaseKey').value   = CONFIG.SUPABASE_ANON_KEY || '';
    document.getElementById('freelancerName').value= CONFIG.FREELANCER_NAME || '';
    modal.hidden = false;
  });

  closeBtn?.addEventListener('click', () => { modal.hidden = true; });

  // Cierra al hacer click en el overlay
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.hidden = true;
  });

  // Guarda la configuración
  saveBtn?.addEventListener('click', () => {
    const provider  = document.getElementById('aiProvider').value;
    const apiKey    = document.getElementById('apiKeyInput').value.trim();
    const sbUrl     = document.getElementById('supabaseUrl').value.trim();
    const sbKey     = document.getElementById('supabaseKey').value.trim();
    const name      = document.getElementById('freelancerName').value.trim();

    // Persiste en localStorage
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('supabase_url', sbUrl);
    localStorage.setItem('supabase_key', sbKey);
    if (name) localStorage.setItem('freelancer_name', name);

    // Recarga la config
    loadConfigFromStorage();

    // Re-inicializa el servicio de IA con la nueva config
    AIService.init();

    // Re-inicializa Supabase
    const ok = initSupabase();
    updateConnectionStatus(ok);

    // Actualiza el perfil en el sidebar
    loadFreelancerProfile();

    modal.hidden = true;
    showToast('✅ Configuración guardada', 'success');
  });
}


// ════════════════════════════════════════════════════════════
// UTILIDADES GLOBALES
// ════════════════════════════════════════════════════════════

/**
 * Muestra una notificación toast temporal.
 * @param {string} message
 * @param {'success'|'error'|''} type
 * @param {number} duration - ms antes de desaparecer
 */
function showToast(message, type = '', duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Actualiza el indicador de estado de conexión en la topbar.
 */
function updateConnectionStatus(isConnected) {
  const dot  = document.getElementById('statusDot');
  const text = document.getElementById('statusText');

  if (isConnected) {
    dot?.classList.remove('offline');
    dot?.classList.add('online');  
    if (text) text.textContent = 'Conectado';
  } else {
    dot?.classList.remove('online');
    dot?.classList.add('offline');
    if (text) text.textContent = `${CONFIG.AI_PROVIDER === 'mock' ? 'Modo demo' : 'Sin base de datos'}`;
  }
}

/**
 * Escapa caracteres HTML para prevenir XSS.
 * @param {string} str
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
