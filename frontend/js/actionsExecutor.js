/**
 * actionsExecutor.js — Módulo central para ejecutar acciones normalizadas
 *
 * Responsabilidad:
 * - Recibir objetos de acción normalizados ({ action: 'create_task', data })
 * - Validar/sanitizar los datos básicos
 * - Ejecutar handlers registrados (por defecto llama a supabaseClient.js)
 * - Emitir eventos/hooks antes/después de la ejecución
 *
 * API principal:
 * - executeAction(actionObj) => Promise<{ ok: boolean, result?, error? }>
 * - registerHandler(actionName, handlerFn)
 * - on(eventName, cb) // events: before, after, error
 */

(function () {
  const handlers = Object.create(null);
  const listeners = { before: [], after: [], error: [] };

  // Helper: trigger event listeners
  function emit(eventName, payload) {
    (listeners[eventName] || []).forEach(cb => {
      try { cb(payload); } catch (e) { console.error('[actionsExecutor] listener error', e); }
    });
  }

  // Registro de handlers: permite extender el executor
  function registerHandler(actionName, handlerFn) {
    handlers[actionName] = handlerFn;
  }

  // Validaciones básicas por acción
  function validate(actionObj) {
    const { action, data } = actionObj || {};
    if (!action) return { ok: false, error: 'missing_action' };
    switch (action) {
      case 'create_task': {
        const title = String(data?.title || '').trim();
        if (!title) return { ok: false, error: 'missing_title' };
        if (title.length > 300) return { ok: false, error: 'title_too_long' };
        // due_date optional, basic format check YYYY-MM-DD
        if (data?.due_date) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(data.due_date)) return { ok: false, error: 'invalid_due_date' };
        }
        return { ok: true };
      }
      case 'create_client': {
        const name = String(data?.name || '').trim();
        if (!name) return { ok: false, error: 'missing_name' };
        if (name.length > 200) return { ok: false, error: 'name_too_long' };
        return { ok: true };
      }
      case 'create_project': {
        const name = String(data?.name || '').trim();
        if (!name) return { ok: false, error: 'missing_name' };
        if (name.length > 200) return { ok: false, error: 'name_too_long' };
        return { ok: true };
      }
      default:
        return { ok: true };
    }
  }

  // Ejecuta la acción (orquesta validation -> handler)
  async function executeAction(actionObj) {
    try {
      const validation = validate(actionObj);
      if (!validation.ok) {
        return { ok: false, error: validation.error };
      }

      emit('before', actionObj);

      const handler = handlers[actionObj.action];
      if (!handler) {
        return { ok: false, error: 'no_handler' };
      }

      // Ejecuta handler; puede ser asíncrono
      const result = await handler(actionObj.data);

      const out = { ok: true, result };
      emit('after', { action: actionObj, result: out });
      return out;
    } catch (err) {
      console.error('[actionsExecutor] executeAction error', err);
      emit('error', { action: actionObj, error: err });
      return { ok: false, error: err?.message || String(err) };
    }
  }

  // Handlers por defecto: delegan en funciones de supabaseClient.js
  // Estas funciones existen en el global scope del frontend (createTask, createClient, createProject)
  registerHandler('create_task', async (data) => {
    // data: { title, due_date, priority }
    return await createTask({
      title: String(data.title || '').trim(),
      description: data.description || '',
      status: data.status || 'pending',
      due_date: data.due_date || null,
      priority: data.priority || 'medium',
    });
  });

  registerHandler('create_client', async (data) => {
    return await createClient({
      name: String(data.name || '').trim(),
      email: String(data.email || '').trim(),
      phone: String(data.phone || '').trim(),
      company: String(data.company || '').trim(),
      website: String(data.website || '').trim(),
      address: String(data.address || '').trim(),
      notes: data.notes || '',
      status: data.status || 'active',
    });
  });

  registerHandler('create_project', async (data) => {
    return await createProject({ name: String(data.name || '').trim(), client_id: data.client_id || null, description: data.description || '', status: data.status || 'in_progress', deadline: data.deadline || null });
  });

  // Listar tareas
  registerHandler('list_tasks', async (data) => {
    // data: { status: 'pending'|'in_progress'|'done'| 'all' }
    const status = data?.status || 'pending';
    return await getTasks(status === 'all' ? null : status);
  });

  // Listar clientes
  registerHandler('list_clients', async (data) => {
    return await getClients();
  });

  // Listar proyectos
  registerHandler('list_projects', async (data) => {
    return await getProjects();
  });

  // Actualizar cliente
  registerHandler('update_client', async (data) => {
    // data: { id?, name?, updates }
    if (data?.id) {
      const updated = await updateClient(data.id, data.updates || { name: data.name });
      return updated ? updated : null;
    }

    if (data?.name) {
      const clients = await getClients();
      const found = clients.find(c => String(c.name).toLowerCase() === String(data.name).toLowerCase());
      if (!found) return null;
      const updated = await updateClient(found.id, data.updates || { name: data.new_name || data.name });
      return updated ? updated : null;
    }
    return null;
  });

  // Eliminar cliente
  registerHandler('delete_client', async (data) => {
    // data: { id?, name? }
    if (data?.id) {
      const ok = await deleteClient(data.id);
      return ok ? { deleted: true } : null;
    }
    if (data?.name) {
      const clients = await getClients();
      const found = clients.find(c => String(c.name).toLowerCase() === String(data.name).toLowerCase());
      if (!found) return null;
      const ok = await deleteClient(found.id);
      return ok ? { deleted: true } : null;
    }
    return null;
  });

  // Actualizar estado de tarea
  registerHandler('update_task', async (data) => {
    // data: { id?, title?, status }
    const status = data?.status;
    if (!status) return { ok: false, error: 'missing_status' };

    // Prioriza id
    if (data?.id) {
      const updated = await updateTaskStatus(data.id, status);
      return updated ? updated : null;
    }

    // Si no hay id, buscar por título
    if (data?.title) {
      const tasks = await getTasks();
      const found = tasks.find(t => String(t.title).toLowerCase() === String(data.title).toLowerCase());
      if (!found) return null;
      const updated = await updateTaskStatus(found.id, status);
      return updated ? updated : null;
    }

    return null;
  });

  // Eliminar tarea
  registerHandler('delete_task', async (data) => {
    // data: { id?, title? }
    if (data?.id) {
      const ok = await deleteTask(data.id);
      return ok ? { deleted: true } : null;
    }
    if (data?.title) {
      const tasks = await getTasks();
      const found = tasks.find(t => String(t.title).toLowerCase() === String(data.title).toLowerCase());
      if (!found) return null;
      const ok = await deleteTask(found.id);
      return ok ? { deleted: true } : null;
    }
    return null;
  });

  // Actualizar proyecto
  registerHandler('update_project', async (data) => {
    // data: { id, updates }
    if (!data?.id) return null;
    const updated = await updateProject(data.id, data.updates || {});
    return updated ? updated : null;
  });

  // Eliminar proyecto
  registerHandler('delete_project', async (data) => {
    if (data?.id) {
      const ok = await deleteProject(data.id);
      return ok ? { deleted: true } : null;
    }
    return null;
  });

  // API pública
  const api = { executeAction, registerHandler, on: (eventName, cb) => { if (listeners[eventName]) listeners[eventName].push(cb); } };
  window.actionsExecutor = api;
  console.info('[actionsExecutor] initialized');
})();
