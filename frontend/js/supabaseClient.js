/**
 * supabaseClient.js — Cliente de Supabase
 *
 * Encapsula todas las llamadas a Supabase:
 * - Conversaciones y mensajes
 * - Clientes, proyectos, tareas
 *
 * Usa el patrón "service layer": el resto de la app no llama
 * directamente a Supabase, solo usa estas funciones.
 *
 * Si Supabase no está configurado, las funciones devuelven
 * datos vacíos para que la app no rompa en demo/desarrollo.
 */

// ─── Inicialización del cliente Supabase ─────────────────────
// El SDK de Supabase se carga desde CDN (ver index.html en producción)
// o puede importarse como módulo ES si usas un bundler.

let _supabase = null;

/**
 * Inicializa el cliente de Supabase.
 * Se llama desde app.js una vez cargada la config.
 */
function initSupabase() {
  // Evita crear múltiples instancias si ya existe una
  if (_supabase) {
    console.info('[Supabase] Cliente ya inicializado — reutilizando instancia.');
    return true;
  }

  try {
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
      console.warn('[Supabase] No configurado. Usando modo sin persistencia.');
      return false;
    }

      // Verifica que el SDK de Supabase esté disponible (CDN)
      if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        _supabase = window.supabase.createClient(
          CONFIG.SUPABASE_URL,
          CONFIG.SUPABASE_ANON_KEY
        );
        console.info('[Supabase] Cliente inicializado correctamente.');
        return true;
      } else {
        console.warn('[Supabase] SDK no encontrado o versión incompatible. Agrega el script CDN al HTML.');
        return false;
      }
  } catch (err) {
    console.error('[Supabase] Error al inicializar el cliente:', err);
    _supabase = null;
    return false;
  }
}

/**
 * Verifica si Supabase está disponible.
 * Permite que el resto de la app funcione sin base de datos (modo demo).
 */
function isSupabaseReady() {
  return _supabase !== null;
}

// ════════════════════════════════════════════════════════════
// CONVERSACIONES
// ════════════════════════════════════════════════════════════

/**
 * Crea una nueva conversación.
 * @param {string} title - Título (se genera del primer mensaje).
 * @returns {object|null} La conversación creada o null si hay error.
 */
async function createConversation(title = 'Nueva conversación') {
  if (!isSupabaseReady()) return { id: `local-${Date.now()}`, title };

  const { data, error } = await _supabase
    .from('conversations')
    .insert({ title, created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) { console.error('[Supabase] createConversation:', error); return null; }
  return data;
}

/**
 * Obtiene todas las conversaciones del usuario, ordenadas por fecha.
 * @returns {Array} Lista de conversaciones.
 */
async function getConversations() {
  if (!isSupabaseReady()) return [];

  const { data, error } = await _supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) { console.error('[Supabase] getConversations:', error); return []; }
  return data || [];
}

/**
 * Guarda un mensaje en una conversación.
 * @param {string} conversationId
 * @param {string} role - 'user' | 'assistant'
 * @param {string} content - Texto del mensaje.
 */
async function saveMessage(conversationId, role, content) {
  if (!isSupabaseReady()) return null;

  try {
    const { data, error } = await _supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] saveMessage:', error);
      return null;
    }

    // Actualiza el timestamp de la conversación (siempre con la misma instancia)
    try {
      await _supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (upErr) {
      console.warn('[Supabase] No se pudo actualizar timestamp de conversación:', upErr);
    }

    return data;
  } catch (err) {
    console.error('[Supabase] saveMessage excepción:', err);
    return null;
  }
}

/**
 * Obtiene los mensajes de una conversación.
 * @param {string} conversationId
 * @param {number} limit - Cuántos mensajes cargar (los más recientes).
 */
async function getMessages(conversationId, limit = 100) {
  if (!isSupabaseReady()) return [];

  const { data, error } = await _supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) { console.error('[Supabase] getMessages:', error); return []; }
  return data || [];
}

// ════════════════════════════════════════════════════════════
// CLIENTES
// ════════════════════════════════════════════════════════════

/**
 * Obtiene todos los clientes.
 */
async function getClients() {
  if (!isSupabaseReady()) return [];

  const { data, error } = await _supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) { console.error('[Supabase] getClients:', error); return []; }
  return data || [];
}

/**
 * Crea un nuevo cliente.
 * @param {object} clientData - { name, email, phone, company, notes }
 */
async function createClient(clientData) {
  if (!isSupabaseReady()) {
    return { id: `local-${Date.now()}`, ...clientData, status: 'active' };
  }

  const { data, error } = await _supabase
    .from('clients')
    .insert({ ...clientData, status: 'active', created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) { console.error('[Supabase] createClient:', error); return null; }
  return data;
}

/**
 * Actualiza un cliente existente.
 */
async function updateClient(id, updates) {
  if (!isSupabaseReady()) return null;

  const { data, error } = await _supabase
    .from('clients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) { console.error('[Supabase] updateClient:', error); return null; }
  return data;
}

/**
 * Elimina un cliente por id.
 * @param {string} id
 * @returns {boolean} true si eliminado o en modo demo simulado
 */
async function deleteClient(id) {
  if (!id) return false;
  if (!isSupabaseReady()) {
    console.info('[Supabase] deleteClient: modo demo, simulando eliminación de', id);
    return true;
  }

  try {
    const { error } = await _supabase.from('clients').delete().eq('id', id);
    if (error) { console.error('[Supabase] deleteClient error:', error); return false; }
    return true;
  } catch (err) {
    console.error('[Supabase] deleteClient excepción:', err);
    return false;
  }
}

// ════════════════════════════════════════════════════════════
// PROYECTOS
// ════════════════════════════════════════════════════════════

/**
 * Obtiene todos los proyectos (con info del cliente).
 */
async function getProjects() {
  if (!isSupabaseReady()) return [];

  const { data, error } = await _supabase
    .from('projects')
    .select('*, clients(name)')
    .order('created_at', { ascending: false });

  if (error) { console.error('[Supabase] getProjects:', error); return []; }
  return data || [];
}

/**
 * Crea un nuevo proyecto.
 * @param {object} projectData - { name, client_id, description, status, deadline }
 */
async function createProject(projectData) {
  if (!isSupabaseReady()) {
    return { id: `local-${Date.now()}`, ...projectData, status: 'in_progress' };
  }

  const { data, error } = await _supabase
    .from('projects')
    .insert({ ...projectData, status: 'in_progress', created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) { console.error('[Supabase] createProject:', error); return null; }
  return data;
}

/**
 * Actualiza un proyecto por id.
 * @param {string|number} id
 * @param {object} updates
 */
async function updateProject(id, updates) {
  if (!isSupabaseReady()) return null;

  const { data, error } = await _supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) { console.error('[Supabase] updateProject:', error); return null; }
  return data;
}

/**
 * Elimina un proyecto por id.
 * @param {string|number} id
 */
async function deleteProject(id) {
  if (!isSupabaseReady()) return false;

  const { error } = await _supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) { console.error('[Supabase] deleteProject:', error); return false; }
  return true;
}

// ════════════════════════════════════════════════════════════
// TAREAS
// ════════════════════════════════════════════════════════════

/**
 * Obtiene todas las tareas, opcionalmente filtradas por estado.
 * @param {string|null} status - 'pending' | 'in_progress' | 'done' | null (todas)
 */
async function getTasks(status = null) {
  if (!isSupabaseReady()) return [];

  let query = _supabase
    .from('tasks')
    .select('*, projects(name), clients(name)')
    .order('due_date', { ascending: true });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) { console.error('[Supabase] getTasks:', error); return []; }
  return data || [];
}

/**
 * Crea una nueva tarea.
 * @param {object} taskData - { title, description, status, due_date, project_id, client_id, priority }
 */
async function createTask(taskData) {
  if (!isSupabaseReady()) {
    return { id: `local-${Date.now()}`, ...taskData, status: 'pending' };
  }

  const { data, error } = await _supabase
    .from('tasks')
    .insert({
      ...taskData,
      status: taskData.status || 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) { console.error('[Supabase] createTask:', error); return null; }
  return data;
}

/**
 * Actualiza el estado de una tarea.
 */
async function updateTaskStatus(id, status) {
  if (!isSupabaseReady()) return null;

  const { data, error } = await _supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) { console.error('[Supabase] updateTaskStatus:', error); return null; }
  return data;
}

/**
 * Elimina una tarea por id.
 * @param {string} id
 * @returns {boolean} true si eliminado o en modo demo simulado
 */
async function deleteTask(id) {
  if (!id) return false;
  if (!isSupabaseReady()) {
    console.info('[Supabase] deleteTask: modo demo, simulando eliminación de', id);
    return true;
  }

  try {
    const { error } = await _supabase.from('tasks').delete().eq('id', id);
    if (error) { console.error('[Supabase] deleteTask error:', error); return false; }
    return true;
  } catch (err) {
    console.error('[Supabase] deleteTask excepción:', err);
    return false;
  }
}

// ════════════════════════════════════════════════════════════
// FREELANCER (perfil)
// ════════════════════════════════════════════════════════════

/**
 * Obtiene el perfil del freelancer.
 * Supabase almacena un único registro en la tabla 'freelancer_profile'.
 */
async function getFreelancerProfile() {
  if (!isSupabaseReady()) {
    return { name: CONFIG.FREELANCER_NAME, role: 'Freelancer', email: '' };
  }

  const { data, error } = await _supabase
    .from('freelancer_profile')
    .select('*')
    .limit(1)
    .single();

  if (error) { return { name: CONFIG.FREELANCER_NAME }; }
  return data;
}

/**
 * Elimina una conversación y sus mensajes.
 * Si la conversación es local (id empieza con 'local-') limpia el fallback local.
 * @param {string} conversationId
 * @returns {boolean} true si la operación fue aceptada (o simulada en demo)
 */
async function deleteConversation(conversationId) {
  // Manejo demo/local
  if (!isSupabaseReady()) {
    console.info('[Supabase] deleteConversation: modo demo, eliminando localmente:', conversationId);
    // Intentar limpiar cualquier almacenamiento local si existiera (clave genérica)
    try { localStorage.removeItem(`conv:${conversationId}`); } catch (e) { /* ignore */ }
    return true;
  }

  try {
    // Primero eliminar mensajes asociados (si la tabla messages existe)
    await _supabase.from('messages').delete().eq('conversation_id', conversationId);
    // Luego eliminar la conversación
    const { error } = await _supabase.from('conversations').delete().eq('id', conversationId);
    if (error) { console.error('[Supabase] deleteConversation error:', error); return false; }
    return true;
  } catch (err) {
    console.error('[Supabase] deleteConversation excepción:', err);
    return false;
  }
}
