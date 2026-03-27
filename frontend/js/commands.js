/**
 * commands.js — Parser simple de comandos de chat
 *
 * Exporta funciones globales:
 * - parseCommand(text) => { command: string, data: object } | null
 * - isCommand(text) => boolean
 */

(function () {
  function tokenizeArgs(str) {
    const re = /"([^"]+)"|'([^']+)'|([^\s"]+)/g;
    const tokens = [];
    let m;
    while ((m = re.exec(str)) !== null) {
      if (m[1] !== undefined) tokens.push(m[1]);
      else if (m[2] !== undefined) tokens.push(m[2]);
      else if (m[3] !== undefined) tokens.push(m[3]); 
    }
    return tokens;
  }

  function parseOptions(tokens) {
    const opts = {};
    const rest = [];
    tokens.forEach(t => {
      if (t.startsWith('--')) {
        const kv = t.slice(2).split('=');
        const k = kv[0];
        const v = kv.slice(1).join('=') || true;
        opts[k] = v;
      } else {
        rest.push(t);
      }
    });
    return { opts, rest };
  }

  function parseCommand(text) {
    if (!text || typeof text !== 'string') return null;
    const t = text.trim();
    if (!t.startsWith('/')) return null;

    const parts = t.slice(1).split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    // Evita usar RegExp con el nombre del comando (podría contener caracteres especiales)
    const argsStr = t.slice(1 + cmd.length).trim();
    const tokens = tokenizeArgs(argsStr);
    const { opts, rest } = parseOptions(tokens);

    switch (cmd) {
      case 'tarea': {
        // singular: crear tarea, o comandos verbales: eliminar / estado
        if (rest.length > 0) {
          const verb = rest[0].toLowerCase();
          const leftover = rest.slice(1);

          // eliminar / borrar
          if (['eliminar', 'borrar', 'delete', 'remove', 'elimina'].includes(verb)) {
            const id = opts.id || opts.i || leftover[0] || null;
            if (!id) return { command: 'invalid', error: 'missing_id' };
            return { command: 'delete_task', data: { id } };
          }

          // cambiar estado: /tarea estado --id=123 --status=done  OR /tarea estado 123 done
          if (['estado', 'set', 'marcar', 'actualizar', 'update'].includes(verb)) {
            let id = opts.id || opts.i || null;
            let status = opts.status || opts.s || null;

            // si se proporcionó id via opciones pero el status viene en leftover, recupéralo
            if (id && !status && leftover.length >= 1) {
              status = leftover[0];
            }

            // caso: /tarea estado 123 done
            if (!id && leftover.length >= 1) {
              const first = leftover[0];
              if (first && (first.startsWith('local-') || /^\d+$/.test(first))) {
                id = first;
                if (leftover[1]) status = leftover[1];
              } else {
                // maybe form: /tarea estado done --id=123  or /tarea estado done
                if (!status) status = first;
                if (!id && leftover[1]) id = leftover[1];
              }
            }

            if (!id) return { command: 'invalid', error: 'missing_id' };
            if (!status) return { command: 'invalid', error: 'missing_status' };
            return { command: 'update_task', data: { id, status } };
          }
        }

        // default: crear tarea
        const title = rest.join(' ') || opts.title || '';
        if (!title) return { command: 'invalid', error: 'missing_title' };
        return {
          command: 'create_task',
          data: {
            title: title,
            due_date: opts.due || opts.fecha || null,
            priority: opts.priority || 'medium',
          }
        };
      }

      case 'tareas': {
        // plural: si no hay texto, listar tareas; si hay texto, crear
        if (rest.length === 0) {
          const status = opts.status || opts.s || 'pending';
          return { command: 'list_tasks', data: { status } };
        }
        const title = rest.join(' ') || opts.title || '';
        if (!title) return { command: 'invalid', error: 'missing_title' };
        return {
          command: 'create_task',
          data: {
            title: title,
            due_date: opts.due || opts.fecha || null,
            priority: opts.priority || 'medium',
          }
        };
      }
      
      // Soporte para modificar o eliminar tareas desde chat:
      // /tarea eliminar --id=123  OR  /tarea eliminar 123
      // /tarea estado --id=123 --status=done  OR /tarea estado 123 done
      
      // Note: 'tarea' (singular) already handled above for create; we intercept verbs in rest
      

      case 'cliente':
      case 'clientes': {
        // /clientes -> listar
        if (cmd === 'clientes' && rest.length === 0) return { command: 'list_clients', data: {} };

        // Support verbs: eliminar, editar
        if (rest.length > 0) {
          const verb = rest[0].toLowerCase();
          const leftover = rest.slice(1);

          if (['eliminar', 'borrar', 'delete', 'remove', 'elimina'].includes(verb)) {
            const id = opts.id || opts.i || leftover[0] || null;
            if (!id) return { command: 'invalid', error: 'missing_id' };
            return { command: 'delete_client', data: { id } };
          }

          if (['editar', 'edit', 'actualizar', 'update', 'modificar', 'cambiar'].includes(verb)) {
            const id = opts.id || opts.i || leftover[0] || null;
            const updates = {};
            if (opts.name) updates.name = opts.name;
            if (opts.email) updates.email = opts.email;
            if (opts.phone) updates.phone = opts.phone;
            if (leftover.length > 1) updates.name = leftover.slice(1).join(' ');
            if (!id) return { command: 'invalid', error: 'missing_id' };
            if (Object.keys(updates).length === 0) return { command: 'invalid', error: 'missing_updates' };
            return { command: 'update_client', data: { id, updates } };
          }
        }

        // Si el usuario solo puso '/cliente' -> abrir modal vacío
        if (rest.length === 0) return { command: 'open_client_modal', data: {} };

        // Soporta sintaxis inline: /cliente Nombre|email@x.com|3001234567
        const raw = argsStr;
        if (raw && raw.includes('|')) {
          const parts = raw.split('|').map(s => s.trim()).filter(Boolean);
          const [nameInline, emailInline, phoneInline] = parts;
          // Si vienen los 3 campos, crear directamente
          if (nameInline && emailInline && phoneInline) {
            return { command: 'create_client', data: { name: nameInline, email: emailInline, phone: phoneInline } };
          }
          // Si faltan campos, prefill modal
          return { command: 'open_client_modal', data: { name: nameInline || '', email: emailInline || '', phone: phoneInline || '' } };
        }

        // Si el usuario escribió un nombre tras el comando, prefill modal
        const name = rest.join(' ') || opts.name || '';
        return { command: 'open_client_modal', data: { name } };
      }

      case 'proyecto': 
      case 'proyectos': {
        // /proyectos -> listar proyectos
        if (cmd === 'proyectos' && rest.length === 0) return { command: 'list_projects', data: {} };

        // /proyecto -> abrir modal vacío
        if (cmd === 'proyecto' && rest.length === 0) return { command: 'open_project_modal', data: {} };

        // Si hay texto, creamos proyecto con nombre
        const name = rest.join(' ') || opts.name || '';
        if (!name) return { command: 'invalid', error: 'missing_name' };
        return { command: 'create_project', data: { name } };
      }

      default:
        return { command: 'unknown' };
    }
  }

  function isCommand(text) { return typeof text === 'string' && text.trim().startsWith('/'); }

  // Detecta comandos expresados en lenguaje natural (ej. "crea la tarea Revisar contrato")
  function detectNaturalLanguageCommand(text) {
    if (!text || typeof text !== 'string') return null;
    const t = text.trim();

    // 1) Crear tarea — formas comunes: "crea la tarea <titulo>", "crear tarea: <titulo>", "añade tarea <titulo>"
    let m = t.match(/\b(?:crea|crear|creá|añade|agrega|crear)\b(?: una| la| el)?\s*tarea(?:\s*(?:llamada|:|-)?\s*)(?:['"])?(.+?)(?:['"])?$/i);
    if (m && m[1]) {
      const title = m[1].trim();
      if (title) return { command: 'create_task', data: { title } };
    }

    // 2) Alternativa: "crear tarea <titulo> ahora" — capturar el resto de la frase
    m = t.match(/\b(?:crea|crear|añade|agrega)\b(?: una| la| el)?\s*tarea\s+(.+)/i);
    if (m && m[1]) {
      const title = m[1].trim();
      if (title) return { command: 'create_task', data: { title } };
    }

    // 3) Pedir ver tareas: "muéstrame mis tareas", "ver tareas pendientes"
    if (/\b(muéstrame|muestra|ver|lista|enséñame)\b.*\btareas\b/i.test(t)) {
      // intentar detectar filtro de estado
      if (/pendiente|pendientes/i.test(t)) return { command: 'list_tasks', data: { status: 'pending' } };
      if (/completad|finalizad|terminad|hecho|done/i.test(t)) return { command: 'list_tasks', data: { status: 'done' } };
      if (/progres|en curso|in progress/i.test(t)) return { command: 'list_tasks', data: { status: 'in_progress' } };
      return { command: 'list_tasks', data: { status: 'pending' } };
    }

    // 4) Crear cliente: "crea el cliente Ana García", "crear cliente: Acme"
    m = t.match(/\b(?:crea|crear|añade|agrega)\b(?: el| la| un| una)?\s*cliente\s*(?:[:\-])?\s*(?:['"])?(.+?)(?:['"])?$/i);
    if (m && m[1]) {
      const name = m[1].trim();
      if (name) return { command: 'create_client', data: { name } };
    }

    // 5) Pedir ver clientes: "muéstrame mis clientes", "ver clientes"
    if (/\b(muéstrame|muestra|ver|lista|enséñame)\b.*\bclientes\b/i.test(t)) {
      return { command: 'list_clients', data: {} };
    }

    return null;
  }

  window.parseCommand = parseCommand;
  window.isCommand = isCommand;
  window.detectNaturalLanguageCommand = detectNaturalLanguageCommand;
})();
