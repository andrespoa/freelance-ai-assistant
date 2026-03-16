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
    const cmd = parts[0].toLowerCase();
    const argsStr = t.replace(new RegExp('^/' + cmd), '').trim();
    const tokens = tokenizeArgs(argsStr);
    const { opts, rest } = parseOptions(tokens);

    switch (cmd) {
      case 'tarea':
      case 'tareas': {
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

      case 'cliente':
      case 'clientes': {
        const name = rest.join(' ') || opts.name || '';
        if (!name) return { command: 'invalid', error: 'missing_name' };
        return { command: 'create_client', data: { name } };
      }

      case 'proyecto':
      case 'proyectos': {
        const name = rest.join(' ') || opts.name || '';
        if (!name) return { command: 'invalid', error: 'missing_name' };
        return { command: 'create_project', data: { name } };
      }

      default:
        return { command: 'unknown' };
    }
  }

  function isCommand(text) { return typeof text === 'string' && text.trim().startsWith('/'); }

  window.parseCommand = parseCommand;
  window.isCommand = isCommand;
})();
