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
  setupClientModal();
  setupProjectModal();
  setupTaskModal();

  // 6. Setup global error handlers and health checks
  setupGlobalErrorHandlers();
  runHealthChecks();

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

/**
 * Muestra un menú contextual para una tarea con opciones: cambiar estado y eliminar
 */
function showTaskMenu(buttonEl, task, onAction) {
  // Elimina cualquier menú existente
  const existing = document.getElementById('task-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'task-menu';
  menu.style.position = 'absolute';
  menu.style.zIndex = 2000;
  menu.style.minWidth = '180px';
  menu.style.background = 'var(--bg-surface)';
  menu.style.border = '1px solid var(--border)';
  menu.style.boxShadow = '0 8px 24px rgba(0,0,0,.5)';
  menu.style.borderRadius = '8px';
  menu.style.padding = '6px';

  const setDone = document.createElement('button');
  setDone.textContent = task.status === 'done' ? 'Marcar como pendiente' : 'Marcar como completada';
  setDone.style.display = 'block';
  setDone.style.width = '100%';
  setDone.style.border = 'none';
  setDone.style.background = 'transparent';
  setDone.style.padding = '8px';
  setDone.style.cursor = 'pointer';
  setDone.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.remove();
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    onAction({ type: 'set_status', status: newStatus });
  });

  const del = document.createElement('button');
  del.textContent = 'Eliminar tarea';
  del.style.display = 'block';
  del.style.width = '100%';
  del.style.border = 'none';
  del.style.background = 'transparent';
  del.style.padding = '8px';
  del.style.cursor = 'pointer';
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.remove();
    if (!confirm('¿Eliminar esta tarea?')) return;
    onAction({ type: 'delete' });
  });

  menu.appendChild(setDone);
  menu.appendChild(del);

  document.body.appendChild(menu);

  const rect = buttonEl.getBoundingClientRect();
  menu.style.top = (rect.bottom + window.scrollY + 6) + 'px';
  menu.style.left = (rect.left + window.scrollX - (menu.offsetWidth - rect.width)) + 'px';

  const onDocClick = (ev) => {
    if (!menu.contains(ev.target) && ev.target !== buttonEl) {
      menu.remove();
      document.removeEventListener('click', onDocClick);
    }
  };
  setTimeout(() => document.addEventListener('click', onDocClick), 0);
}

/**
 * Muestra un menú contextual para un proyecto con opciones: editar y eliminar
 */
function showProjectMenu(buttonEl, project, onAction) {
  const existing = document.getElementById('project-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'project-menu';
  menu.style.position = 'absolute';
  menu.style.zIndex = 2000;
  menu.style.minWidth = '200px';
  menu.style.background = 'var(--bg-surface)';
  menu.style.border = '1px solid var(--border)';
  menu.style.boxShadow = '0 8px 24px rgba(0,0,0,.5)';
  menu.style.borderRadius = '8px';
  menu.style.padding = '6px';

  const edit = document.createElement('button');
  edit.textContent = 'Editar proyecto';
  edit.style.display = 'block';
  edit.style.width = '100%';
  edit.style.border = 'none';
  edit.style.background = 'transparent';
  edit.style.padding = '8px';
  edit.style.cursor = 'pointer';
  edit.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.remove();
    onAction({ type: 'edit' });
  });

  const del = document.createElement('button');
  del.textContent = 'Eliminar proyecto';
  del.style.display = 'block';
  del.style.width = '100%';
  del.style.border = 'none';
  del.style.background = 'transparent';
  del.style.padding = '8px';
  del.style.cursor = 'pointer';
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.remove();
    if (!confirm('¿Eliminar este proyecto?')) return;
    onAction({ type: 'delete' });
  });

  menu.appendChild(edit);
  menu.appendChild(del);

  document.body.appendChild(menu);
  const rect = buttonEl.getBoundingClientRect();
  menu.style.top = (rect.bottom + window.scrollY + 6) + 'px';
  menu.style.left = (rect.left + window.scrollX - (menu.offsetWidth - rect.width)) + 'px';

  const onDocClick = (ev) => {
    if (!menu.contains(ev.target) && ev.target !== buttonEl) {
      menu.remove();
      document.removeEventListener('click', onDocClick);
    }
  };
  setTimeout(() => document.addEventListener('click', onDocClick), 0);
}

/**
 * Muestra un menú contextual para un cliente con opciones: editar y eliminar
 */
function showClientMenu(buttonEl, client, onAction) {
  const existing = document.getElementById('client-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'client-menu';
  menu.style.position = 'absolute';
  menu.style.zIndex = 2000;
  menu.style.minWidth = '200px';
  menu.style.background = 'var(--bg-surface)';
  menu.style.border = '1px solid var(--border)';
  menu.style.boxShadow = '0 8px 24px rgba(0,0,0,.5)';
  menu.style.borderRadius = '8px';
  menu.style.padding = '6px';

  const edit = document.createElement('button');
  edit.textContent = 'Editar cliente';
  edit.style.display = 'block';
  edit.style.width = '100%';
  edit.style.border = 'none';
  edit.style.background = 'transparent';
  edit.style.padding = '8px';
  edit.style.cursor = 'pointer';
  edit.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.remove();
    // Abrir edición usando el modal de cliente (prefill). Evita usar prompt() nativo.
    onAction({ type: 'edit' });
  });

  const del = document.createElement('button');
  del.textContent = 'Eliminar cliente';
  del.style.display = 'block';
  del.style.width = '100%';
  del.style.border = 'none';
  del.style.background = 'transparent';
  del.style.padding = '8px';
  del.style.cursor = 'pointer';
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.remove();
    if (!confirm('¿Eliminar este cliente?')) return;
    onAction({ type: 'delete' });
  });

  menu.appendChild(edit);
  menu.appendChild(del);

  document.body.appendChild(menu);
  const rect = buttonEl.getBoundingClientRect();
  menu.style.top = (rect.bottom + window.scrollY + 6) + 'px';
  menu.style.left = (rect.left + window.scrollX - (menu.offsetWidth - rect.width)) + 'px';

  const onDocClick = (ev) => {
    if (!menu.contains(ev.target) && ev.target !== buttonEl) {
      menu.remove();
      document.removeEventListener('click', onDocClick);
    }
  };
  setTimeout(() => document.addEventListener('click', onDocClick), 0);
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
      <span class="history-title">${escapeHtml(conv.title)}</span>
      <button class="history-more-btn" data-id="${conv.id}" title="Opciones">⋯</button>
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

  // Mostrar menú de opciones (⋯) para cada elemento
  listEl.querySelectorAll('.history-more-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (!id) return;
      showHistoryMenu(btn, id, async () => {
        const ok = await deleteConversation(id);
        if (ok) {
          showToast('Conversación eliminada', 'success');
          updateSidebarHistory();
        } else {
          showToast('No se pudo eliminar la conversación', 'error');
        }
      });
    });
  });
}

/**
 * Muestra un menú contextual simple (desplegable) junto a un botón 'more'.
 * onDeleteCallback es una función async que ejecuta la acción de eliminar.
 */
function showHistoryMenu(buttonEl, conversationId, onDeleteCallback) {
  // Elimina cualquier menú existente
  const existing = document.getElementById('history-menu');
  if (existing) existing.remove();

  // Crea menú
  const menu = document.createElement('div');
  menu.id = 'history-menu';
  menu.style.position = 'absolute';
  menu.style.zIndex = 2000;
  menu.style.minWidth = '140px';
  menu.style.background = 'var(--panel-bg, #fff)';
  menu.style.border = '1px solid rgba(0,0,0,0.08)';
  menu.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
  menu.style.borderRadius = '6px';
  menu.style.padding = '6px';

  const del = document.createElement('button');
  del.textContent = 'Eliminar conversación';
  del.style.display = 'block';
  del.style.width = '100%';
  del.style.border = 'none';
  del.style.background = 'transparent';
  del.style.padding = '8px';
  del.style.cursor = 'pointer';
  del.addEventListener('click', async (e) => {
    e.stopPropagation();
    menu.remove();
    if (!confirm('¿Eliminar esta conversación? Esta acción no se puede deshacer.')) return;
    await onDeleteCallback();
  });

  menu.appendChild(del);

  document.body.appendChild(menu);

  // Posicionar el menú cerca del botón
  const rect = buttonEl.getBoundingClientRect();
  menu.style.top = (rect.bottom + window.scrollY + 6) + 'px';
  menu.style.left = (rect.left + window.scrollX - (menu.offsetWidth - rect.width)) + 'px';

  // Cerrar al clicar fuera
  const onDocClick = (ev) => {
    if (!menu.contains(ev.target) && ev.target !== buttonEl) {
      menu.remove();
      document.removeEventListener('click', onDocClick);
    }
  };
  setTimeout(() => document.addEventListener('click', onDocClick), 0);
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
      <div class="client-actions">
        <button class="client-more-btn" data-id="${c.id}" title="Opciones">▾</button>
      </div>
    </div>
  `).join('');

  // Más opciones por cliente (botón chevron)
  grid.querySelectorAll('.client-more-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const client = clients.find(x => String(x.id) === String(id));
      if (!client) return;
      showClientMenu(btn, client, async (action) => {
        if (action.type === 'delete') {
          const ok = await deleteClient(client.id);
          if (ok) { showToast('Cliente eliminado', 'success'); loadClientsSection(); }
          else showToast('No se pudo eliminar el cliente', 'error');
        }
          if (action.type === 'edit') {
            // Abrir formulario en chat para editar (prefill con datos)
            window.openClientModal(client);
          }
      });
    });
  });
}

// Botón agregar cliente
document.getElementById('addClientBtn')?.addEventListener('click', () => {
  // Abrir modal para crear cliente
  window.openClientModal({});
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
      <div class="project-actions">
        <button class="project-more-btn" data-id="${p.id}" title="Opciones">▾</button>
      </div>
    </div>
  `).join('');

  // Más opciones por proyecto (botón chevron)
  grid.querySelectorAll('.project-more-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const project = projects.find(x => String(x.id) === String(id));
      if (!project) return;
      showProjectMenu(btn, project, async (action) => {
        if (action.type === 'delete') {
          // use actionsExecutor if available
          const res = await actionsExecutor.executeAction({ action: 'delete_project', data: { id: project.id } });
          if (res.ok) { showToast('Proyecto eliminado', 'success'); loadProjectsSection(); }
          else showToast('No se pudo eliminar el proyecto', 'error');
        }
        if (action.type === 'edit') {
          // Abrir modal con datos del proyecto
          window.openProjectModal({ id: project.id, name: project.name, client_id: project.client_id || project.client?.id || null, description: project.description || '', status: project.status || 'in_progress', deadline: project.deadline || null });
        }
      });
    });
  });
}

document.getElementById('addProjectBtn')?.addEventListener('click', () => {
  // Abrir modal para crear proyecto en vez de usar prompt()
  window.openProjectModal({});
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
        <div class="task-actions">
          <button class="task-more-btn" data-id="${t.id}" title="Opciones">▾</button>
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

    // Más opciones por tarea (botón chevron)
    listEl.querySelectorAll('.task-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const task = tasks.find(t => String(t.id) === String(id));
        if (!task) return;
        showTaskMenu(btn, task, async (action) => {
          // action: { type: 'delete'|'set_status', status? }
          if (action.type === 'delete') {
            const ok = await deleteTask(task.id);
            if (ok) { showToast('Tarea eliminada', 'success'); loadTasksSection(); }
            else showToast('No se pudo eliminar la tarea', 'error');
          }
          if (action.type === 'set_status') {
            const updated = await updateTaskStatus(task.id, action.status);
            if (updated) { showToast('Tarea actualizada', 'success'); loadTasksSection(); }
            else showToast('No se pudo actualizar la tarea', 'error');
          }
        });
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
  window.openTaskModal({});
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
      <div class="history-full-row">
        <div>
          <h4>${escapeHtml(conv.title)}</h4>
          <p>${new Date(conv.updated_at || conv.created_at).toLocaleString('es')}</p>
        </div>
        <div class="history-full-actions">
          <button class="history-more-btn" data-id="${conv.id}" title="Opciones">⋯</button>
        </div>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.history-full-item').forEach(item => {
    item.addEventListener('click', async () => {
      document.querySelector('[data-section="chat"]')?.click();
      await loadConversation(item.getAttribute('data-id'));
    });
  });

  // Más opciones en la lista completa
  listEl.querySelectorAll('.history-more-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (!id) return;
      showHistoryMenu(btn, id, async () => {
        const ok = await deleteConversation(id);
        if (ok) {
          showToast('Conversación eliminada', 'success');
          loadHistorySection();
          updateSidebarHistory();
        } else {
          showToast('No se pudo eliminar la conversación', 'error');
        }
      });
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


// ═══════════════════════════════════════════════════════════════════
// MODAL: Crear / Editar Cliente
// ═══════════════════════════════════════════════════════════════════
function setupClientModal() {
  const modal = document.getElementById('clientModal');
  const titleEl = document.getElementById('clientModalTitle');
  const idInput = document.getElementById('clientIdInput');
  const nameInput = document.getElementById('clientNameInput');
  const emailInput = document.getElementById('clientEmailInput');
  const phoneInput = document.getElementById('clientPhoneInput');
  const companyInput = document.getElementById('clientCompanyInput');
  const notesInput = document.getElementById('clientNotesInput');
  const saveBtn = document.getElementById('saveClientBtn');
  const cancelBtn = document.getElementById('cancelClientBtn');

  // Abre el modal overlay y precarga los campos (estilo Bootstrap modal)
  window.openClientModal = function (data = {}) {
    idInput.value = data.id || '';
    nameInput.value = data.name || '';
    emailInput.value = data.email || '';
    phoneInput.value = data.phone || '';
    companyInput.value = data.company || '';
    // nuevos campos
    const websiteInput = document.getElementById('clientWebsiteInput');
    const addressInput = document.getElementById('clientAddressInput');
    const statusInput = document.getElementById('clientStatusInput');
    if (websiteInput) websiteInput.value = data.website || '';
    if (addressInput) addressInput.value = data.address || '';
    if (statusInput) statusInput.value = data.status || 'active';
    notesInput.value = data.notes || '';
    titleEl.textContent = idInput.value ? 'Editar cliente' : 'Crear cliente';
    modal.hidden = false;
    nameInput.focus();
  };

  function close() { modal.hidden = true; }

  cancelBtn?.addEventListener('click', () => { close(); });
  modal?.addEventListener('click', (e) => { if (e.target === modal) close(); });

  // Close button in header
  const closeClientBtn = document.getElementById('closeClientModal');
  closeClientBtn?.addEventListener('click', () => { close(); });

  saveBtn?.addEventListener('click', async () => {
    const id = idInput.value || null;
    const name = (nameInput.value || '').trim();
    const email = (emailInput.value || '').trim();
    const phone = (phoneInput.value || '').trim();
    const company = (companyInput.value || '').trim();
    const website = (document.getElementById('clientWebsiteInput')?.value || '').trim();
    const address = (document.getElementById('clientAddressInput')?.value || '').trim();
    const status = (document.getElementById('clientStatusInput')?.value || 'active').trim();
    const notes = (notesInput.value || '').trim();

    // Validaciones: name, email, phone obligatorios
    if (!name) { showToast('Nombre es obligatorio', 'error'); nameInput.focus(); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) { showToast('Email inválido', 'error'); emailInput.focus(); return; }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) { showToast('Teléfono inválido', 'error'); phoneInput.focus(); return; }

    const payload = { name, email, phone: digits, company, website, address, notes, status };

    try {
      if (id) {
        const res = await actionsExecutor.executeAction({ action: 'update_client', data: { id, updates: payload } });
        if (res.ok) {
          showToast('Cliente actualizado', 'success');
          close();
          loadClientsSection();
        } else {
          showToast('Error actualizando cliente: ' + (res.error || ''), 'error');
        }
      } else {
        const res = await actionsExecutor.executeAction({ action: 'create_client', data: payload });
        if (res.ok) {
          showToast('Cliente creado', 'success');
          close();
          loadClientsSection();
        } else {
          showToast('Error creando cliente: ' + (res.error || ''), 'error');
        }
      }
    } catch (err) {
      console.error('[ClientModal] save error', err);
      showToast('Error interno', 'error');
    }
  });
}


// MODAL: Crear / Editar Proyecto
function setupProjectModal() {
  const modal = document.getElementById('projectModal');
  const titleEl = document.getElementById('projectModalTitle');
  const idInput = document.getElementById('projectIdInput');
  const nameInput = document.getElementById('projectNameInput');
  const clientSelect = document.getElementById('projectClientSelect');
  const descInput = document.getElementById('projectDescriptionInput');
  const statusInput = document.getElementById('projectStatusInput');
  const deadlineInput = document.getElementById('projectDeadlineInput');
  const saveBtn = document.getElementById('saveProjectBtn');
  const cancelBtn = document.getElementById('cancelProjectBtn');

  // Abre el modal overlay y precarga los campos
  window.openProjectModal = async function (data = {}) {
    idInput.value = data.id || '';
    nameInput.value = data.name || '';
    descInput.value = data.description || '';
    statusInput.value = data.status || 'in_progress';
    deadlineInput.value = data.deadline ? String(data.deadline).slice(0,10) : '';

    // Cargar clientes para select
    try {
      const clients = await getClients();
      clientSelect.innerHTML = '<option value="">-- Sin cliente --</option>' + clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
      if (data.client_id) clientSelect.value = data.client_id;
    } catch (err) {
      console.error('[ProjectModal] error loading clients', err);
    }

    titleEl.textContent = idInput.value ? 'Editar proyecto' : 'Crear proyecto';
    modal.hidden = false;
    nameInput.focus();
  };

  function close() { modal.hidden = true; }
  cancelBtn?.addEventListener('click', () => { close(); });
  modal?.addEventListener('click', (e) => { if (e.target === modal) close(); });
  const closeProjectBtn = document.getElementById('closeProjectModal');
  closeProjectBtn?.addEventListener('click', () => { close(); });

  saveBtn?.addEventListener('click', async () => {
    const id = idInput.value || null;
    const name = (nameInput.value || '').trim();
    const client_id = clientSelect.value || null;
    const description = (descInput.value || '').trim();
    const status = (statusInput.value || 'in_progress').trim();
    const deadline = (deadlineInput.value || '').trim() || null;

    if (!name) { showToast('Nombre del proyecto es obligatorio', 'error'); nameInput.focus(); return; }

    const payload = { name, client_id: client_id || null, description, status, deadline };

    try {
      if (id) {
        const res = await actionsExecutor.executeAction({ action: 'update_project', data: { id, updates: payload } });
        if (res.ok && res.result) {
          showToast('Proyecto actualizado', 'success');
          close();
          loadProjectsSection();
        } else {
          showToast('Error actualizando proyecto: ' + (res.error || ''), 'error');
        }
      } else {
        const res = await actionsExecutor.executeAction({ action: 'create_project', data: payload });
        if (res.ok && res.result) {
          showToast('Proyecto creado', 'success');
          close();
          loadProjectsSection();
        } else {
          showToast('Error creando proyecto: ' + (res.error || ''), 'error');
        }
      }
    } catch (err) {
      console.error('[ProjectModal] save error', err);
      showToast('Error interno', 'error');
    }
  });
}

// ════════════════════════════════════════════════════════════
// MODAL — TAREAS
// ════════════════════════════════════════════════════════════

function setupTaskModal() {
  const modal = document.getElementById('taskModal');
  const titleEl = document.getElementById('taskModalTitle');
  const closeBtn = document.getElementById('closeTaskModal');
  const cancelBtn = document.getElementById('cancelTaskBtn');
  const saveBtn = document.getElementById('saveTaskBtn');

  window.openTaskModal = async function (data = {}) {
    const idInput = document.getElementById('taskIdInput');
    const titleInput = document.getElementById('taskTitleInput');
    const descriptionInput = document.getElementById('taskDescriptionInput');
    const statusInput = document.getElementById('taskStatusInput');
    const priorityInput = document.getElementById('taskPriorityInput');
    const projectSelect = document.getElementById('taskProjectSelect');
    const dueDateInput = document.getElementById('taskDueDateInput');

    // Llenar select de proyectos
    try {
      const projects = await getProjects();
      projectSelect.innerHTML = '<option value="">-- Sin proyecto --</option>';
      if (projects && projects.length > 0) {
        projects.forEach(p => {
          const option = document.createElement('option');
          option.value = p.id;
          option.textContent = p.name;
          if (data.project_id === p.id) option.selected = true;
          projectSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error('[TaskModal] error cargar proyectos', err);
    }

    // Modo editar vs crear
    if (data.id) {
      titleEl.textContent = 'Editar tarea';
      idInput.value = data.id;
      titleInput.value = data.title || '';
      descriptionInput.value = data.description || '';
      statusInput.value = data.status || 'pending';
      priorityInput.value = data.priority || 'medium';
      dueDateInput.value = data.due_date ? data.due_date.split('T')[0] : '';
      if (data.project_id) projectSelect.value = data.project_id;
    } else {
      titleEl.textContent = 'Crear tarea';
      idInput.value = '';
      titleInput.value = '';
      descriptionInput.value = '';
      statusInput.value = 'pending';
      priorityInput.value = 'medium';
      dueDateInput.value = '';
      projectSelect.value = '';
    }

    modal.hidden = false;
    titleInput.focus();
  };

  const closeModal = () => { modal.hidden = true; };
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Cerrar al hacer clic fuera el overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Guardar tarea
  saveBtn.addEventListener('click', async () => {
    const idInput = document.getElementById('taskIdInput');
    const titleInput = document.getElementById('taskTitleInput');
    const descriptionInput = document.getElementById('taskDescriptionInput');
    const statusInput = document.getElementById('taskStatusInput');
    const priorityInput = document.getElementById('taskPriorityInput');
    const projectSelect = document.getElementById('taskProjectSelect');
    const dueDateInput = document.getElementById('taskDueDateInput');

    const title = titleInput.value.trim();
    if (!title) {
      showToast('⚠️ Descripción es requerida', 'error');
      return;
    }

    try {
      const taskData = {
        title,
        description: descriptionInput.value.trim(),
        status: statusInput.value,
        priority: priorityInput.value,
        project_id: projectSelect.value ? projectSelect.value : null,
        due_date: dueDateInput.value || null,
      };

      const id = idInput.value;
      let result;
      if (id) {
        result = await actionsExecutor.executeAction('update_task', { id, ...taskData });
      } else {
        result = await actionsExecutor.executeAction('create_task', taskData);
      }

      if (result) {
        showToast(id ? '✅ Tarea actualizada' : '✅ Tarea creada', 'success');
        closeModal();
        loadTasksSection();
      } else {
        showToast('❌ Error al guardar tarea', 'error');
      }
    } catch (err) {
      console.error('[TaskModal] save error', err);
      showToast('Error interno', 'error');
    }
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

// System banner utilities
function setSystemBanner(message, type = 'error') {
  const banner = document.getElementById('systemBanner');
  if (!banner) return;
  banner.textContent = message || '';
  banner.classList.remove('warn', 'info', 'error');
  if (type === 'warn') banner.classList.add('warn');
  else if (type === 'info') banner.classList.add('info');
  else banner.classList.add('error');
  banner.hidden = false;
}

function clearSystemBanner() {
  const banner = document.getElementById('systemBanner');
  if (!banner) return;
  banner.hidden = true;
  banner.textContent = '';
  banner.classList.remove('warn', 'info', 'error');
}

// Global error handlers to catch uncaught exceptions and promise rejections
function setupGlobalErrorHandlers() {
  window.addEventListener('error', (evt) => {
    console.error('[GlobalError]', evt.error || evt.message, evt);
    showToast('Ha ocurrido un error interno. Revisa la consola.', 'error');
    setSystemBanner('Error interno detectado. Revisa la consola para más detalles.', 'error');
  });

  window.addEventListener('unhandledrejection', (evt) => {
    console.error('[UnhandledRejection]', evt.reason);
    showToast('Error: promesa rechazada. Revisa la consola.', 'error');
    setSystemBanner('Error en promesa no manejada. Revisa la consola.', 'error');
  });
}

// Health checks: Supabase and AI provider
async function runHealthChecks() {
  // Check Supabase
  try {
    const supOk = isSupabaseReady && isSupabaseReady();
    updateConnectionStatus(!!supOk);
    if (!supOk) {
      setSystemBanner('Advertencia: Supabase no configurado o inaccesible. Algunas funciones pueden fallar.', 'warn');
    } else {
      // clear any previous banner if present (but only if it was a supabase warning)
      const banner = document.getElementById('systemBanner');
      if (banner && banner.classList.contains('warn')) clearSystemBanner();
    }
  } catch (err) {
    console.error('[HealthCheck] supabase check error', err);
    setSystemBanner('Error checando Supabase. Revisa configuración.', 'error');
  }

  // Check AI provider readiness
  try {
    const aiReady = AIService && typeof AIService.isReady === 'function' ? AIService.isReady() : false;
    if (!aiReady) {
      // show non-blocking info that AI is in demo mode or not configured
      setSystemBanner('IA no configurada: el sistema funciona en modo demo (Mock).', 'info');
      showToast('IA no configurada — modo demo habilitado', 'error');
    } else {
      // if banner shows AI info, clear it
      const banner = document.getElementById('systemBanner');
      if (banner && banner.classList.contains('info')) clearSystemBanner();
    }
  } catch (err) {
    console.error('[HealthCheck] ai check error', err);
    setSystemBanner('Error checando el proveedor de IA.', 'error');
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
