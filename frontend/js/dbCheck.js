/**
 * dbCheck.js — pequeño script de verificación manual de persistencia
 * Uso: abrir la consola del navegador y ejecutar `dbCheck.run()`
 * Devuelve logs en consola con el resultado de write/read/delete.
 */
(function (global) {
  async function run() {
    if (typeof isSupabaseReady === 'undefined' || !isSupabaseReady()) {
      console.warn('[dbCheck] Supabase no está listo. Ejecutando en modo demo (no habrá persistencia).');
      return { ok: false, error: 'supabase_not_ready' };
    }

    try {
      // 1) Crear una conversación de prueba
      const conv = await createConversation('dbCheck - prueba');
      console.log('[dbCheck] conv creado:', conv);

      // 2) Guardar un mensaje de prueba
      const msg = await saveMessage(conv.id, 'user', 'Mensaje de verificación dbCheck');
      console.log('[dbCheck] msg creado:', msg);

      // 3) Leer mensajes
      const msgs = await getMessages(conv.id, 10);
      console.log('[dbCheck] mensajes leídos:', msgs);

      // 4) Limpieza: eliminar conversación (y mensajes asociados)
      const deleted = await deleteConversation(conv.id);
      console.log('[dbCheck] deleteConversation:', deleted);

      return { ok: true, conv, msg, msgs, deleted };
    } catch (err) {
      console.error('[dbCheck] error:', err);
      return { ok: false, error: err };
    }
  }

  // Test específico para creación de tareas
  async function runTaskTest() {
    if (typeof isSupabaseReady === 'undefined' || !isSupabaseReady()) {
      console.warn('[dbCheck] Supabase no está listo. Ejecutando en modo demo (no habrá persistencia).');
      return { ok: false, error: 'supabase_not_ready' };
    }

    try {
      // 1) Crear una tarea de prueba usando createTask
      const task = await createTask({ title: 'dbCheck - tarea prueba', description: 'Prueba de persistencia', priority: 'low' });
      console.log('[dbCheck] tarea creada:', task);

      // 2) Leer tareas y buscar la creada
      const tasks = await getTasks();
      const found = tasks.find(t => String(t.id) === String(task.id) || t.title === 'dbCheck - tarea prueba');
      console.log('[dbCheck] tareas leídas (total):', tasks.length, 'encontrada:', !!found);

      // 3) Limpieza: si existe y Supabase está listo, eliminar la tarea (si tienes endpoint update/delete)
      // Nota: no hay deleteTask genérico implementado, por lo que esta limpieza puede omitirse o implementarse según esquema.

      return { ok: !!found, task, found };
    } catch (err) {
      console.error('[dbCheck] runTaskTest error:', err);
      return { ok: false, error: err };
    }
  }

  global.dbCheck = { run, runTaskTest };
})(window);
