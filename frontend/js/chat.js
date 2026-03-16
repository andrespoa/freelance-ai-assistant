/**
 * chat.js — Módulo de Chat
 *
 * Responsabilidades:
 * - Renderizar mensajes en el DOM
 * - Gestionar la conversación activa
 * - Llamar al AI Service y guardar en Supabase
 * - Manejar la UI (typing indicator, scroll, input auto-resize)
 * - Ejecutar acciones detectadas en respuestas de la IA
 */

// ── Estado del chat ──────────────────────────────────────────
const ChatState = {
  conversationId: null,    // ID de la conversación activa en Supabase
  messages: [],            // [{role, content, timestamp}]
  isLoading: false,        // ¿Está esperando respuesta de la IA?
};

// ── Refs al DOM ──────────────────────────────────────────────
const DOM = {
  get container()      { return document.getElementById('messagesContainer'); },
  get input()          { return document.getElementById('messageInput'); },
  get sendBtn()        { return document.getElementById('sendBtn'); },
  get typingIndicator(){ return document.getElementById('typingIndicator'); },
  get welcomeScreen()  { return document.getElementById('welcomeScreen'); },
};


// ════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════════════════════

/**
 * Inicializa el módulo de chat.
 * - Conecta los event listeners del input y botón enviar
 * - Carga la conversación más reciente (o crea una nueva)
 */
async function initChat() {
  try {
    // Input de texto: envía con Ctrl+Enter
    if (DOM.input) {
      DOM.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      // Auto-resize del textarea
      DOM.input.addEventListener('input', () => {
        DOM.input.style.height = 'auto';
        DOM.input.style.height = Math.min(DOM.input.scrollHeight, 160) + 'px';
      });
    } else {
      console.warn('[Chat] Input de mensaje no encontrado en el DOM.');
    }

    // Botón enviar
    if (DOM.sendBtn) {
      DOM.sendBtn.addEventListener('click', sendMessage);
    } else {
      console.warn('[Chat] Botón enviar no encontrado en el DOM.');
    }

    // Botones de acción rápida (pantalla de bienvenida)
    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-msg');
        if (msg && DOM.input) {
          DOM.input.value = msg;
          sendMessage();
        }
      });
    });

    // Cargar o crear conversación
    await loadOrCreateConversation();
  } catch (err) {
    console.error('[Chat] Error inicializando chat:', err);
  }
}

/**
 * Carga la última conversación o crea una nueva si no hay ninguna.
 */
async function loadOrCreateConversation() {
  const conversations = await getConversations();

  if (conversations.length > 0) {
    await loadConversation(conversations[0].id);
  } else {
    await startNewConversation();
  }
}


// ════════════════════════════════════════════════════════════
// CONVERSACIONES
// ════════════════════════════════════════════════════════════

/**
 * Inicia una nueva conversación (limpia el chat y genera un ID).
 */
async function startNewConversation() {
  ChatState.messages = [];
  ChatState.conversationId = null;
  ChatState.isLoading = false;

  // Limpia el DOM pero deja la pantalla de bienvenida
  clearMessages();
  showWelcomeScreen();

  // Crea la conversación en Supabase (se creará con el primer mensaje)
  console.info('[Chat] Nueva conversación iniciada.');
}

/**
 * Carga una conversación existente desde Supabase.
 * @param {string} conversationId
 */
async function loadConversation(conversationId) {
  ChatState.conversationId = conversationId;
  clearMessages();
  hideWelcomeScreen();

  const dbMessages = await getMessages(conversationId);
  ChatState.messages = dbMessages.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: m.created_at,
  }));

  // Renderiza todos los mensajes
  ChatState.messages.forEach(m => {
    appendMessage(m.role, m.content, m.timestamp, false);
  });

  // Scroll al final
  scrollToBottom(false);
}


// ════════════════════════════════════════════════════════════
// ENVIAR / RECIBIR MENSAJES
// ════════════════════════════════════════════════════════════

/**
 * Lee el input, envía el mensaje del usuario y obtiene respuesta de la IA.
 */
async function sendMessage() {
  const text = DOM.input.value.trim();
  if (!text || ChatState.isLoading) return;

  // Limpia el input
  DOM.input.value = '';
  DOM.input.style.height = 'auto';

  // Manejo de comandos mediante el parser central (si está disponible)
  let parsedCmd = null;
  if (typeof parseCommand === 'function') {
    parsedCmd = parseCommand(text);
  }

  if (parsedCmd && parsedCmd.command) {
    if (parsedCmd.command === 'invalid') {
      appendMessage('error', `Comando inválido: ${parsedCmd.error || ''}`);
      return;
    }

    switch (parsedCmd.command) {
      case 'create_task': {
        const task = await createTask(parsedCmd.data);
        if (task) {
          appendMessage('ai', `✅ Tarea creada: ${task.title || parsedCmd.data.title}`);
          showToast('Tarea creada', 'success');
          if (document.getElementById('section-tasks').classList.contains('active')) loadTasksSection();
        } else {
          appendMessage('error', 'No se pudo crear la tarea.');
        }
        return;
      }
      case 'create_client': {
        const client = await createClient(parsedCmd.data);
        if (client) {
          appendMessage('ai', `👥 Cliente creado: ${client.name || parsedCmd.data.name}`);
          showToast('Cliente creado', 'success');
          if (document.getElementById('section-clients').classList.contains('active')) loadClientsSection();
        } else {
          appendMessage('error', 'No se pudo crear el cliente.');
        }
        return;
      }
      case 'create_project': {
        const project = await createProject(parsedCmd.data);
        if (project) {
          appendMessage('ai', `📁 Proyecto creado: ${project.name || parsedCmd.data.name}`);
          showToast('Proyecto creado', 'success');
          if (document.getElementById('section-projects').classList.contains('active')) loadProjectsSection();
        } else {
          appendMessage('error', 'No se pudo crear el proyecto.');
        }
        return;
      }
      case 'unknown':
        // no es un comando reconocido por el parser — permitir que la IA lo procese
        break;
    }
  }


  // Si es la primera message, crea la conversación en Supabase
  if (!ChatState.conversationId) {
    const title = text.slice(0, 60) + (text.length > 60 ? '…' : '');
    const conv = await createConversation(title);
    ChatState.conversationId = conv?.id || `local-${Date.now()}`;
  }

  // Oculta la bienvenida
  hideWelcomeScreen();

  // Agrega el mensaje del usuario
  const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString(), _saved: false };
  ChatState.messages.push(userMsg);
  appendMessage('user', text);

  // Si la conversación tiene ID local (p.ej. 'local-...') pero Supabase ya está listo,
  // crea la conversación real en la DB antes de intentar guardar mensajes.
  if (String(ChatState.conversationId).startsWith('local-') && isSupabaseReady()) {
    try {
      const title = ChatState.messages[0]?.content?.slice(0, 60) || 'Nueva conversación';
      const conv = await createConversation(title);
      if (conv?.id) {
        ChatState.conversationId = conv.id;
        // Migrar mensajes locales pendientes al servidor (si hay)
        for (const m of ChatState.messages) {
          if (m._saved) continue;
          await saveMessage(ChatState.conversationId, m.role, m.content);
          m._saved = true;
        }
      }
    } catch (err) {
      console.error('[Chat] Error migrando conversación local a Supabase:', err);
    }
  } else {
    // Guarda en Supabase (si ya es un ID válido o supabase no está listo, saveMessage internamente lo ignorará)
    await saveMessage(ChatState.conversationId, 'user', text);
    userMsg._saved = true;
  }

  // Muestra el indicador de escritura
  setLoading(true);

  try {
    // Llama a la IA
    const responseText = await AIService.chat(ChatState.messages);

    // Parsea si hay acciones embebidas
    const { text: displayText, action } = AIService.parseResponse(responseText);

    // Agrega la respuesta al historial
    const aiMsg = { role: 'assistant', content: displayText, timestamp: new Date().toISOString() };
    ChatState.messages.push(aiMsg);
    appendMessage('ai', displayText);

    // Guarda en Supabase
    await saveMessage(ChatState.conversationId, 'assistant', displayText);

    // Ejecuta acción si la IA la retornó
    if (action) {
      await executeAIAction(action);
    }

    // Actualiza historial en sidebar
    updateSidebarHistory();

  } catch (err) {
    console.error('[Chat] Error al obtener respuesta:', err);
    appendMessage('error', `❌ Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
}


// ════════════════════════════════════════════════════════════
// ACCIONES DE LA IA
// ════════════════════════════════════════════════════════════

/**
 * Ejecuta una acción detectada en la respuesta de la IA.
 * Permite que la IA cree tareas, clientes o proyectos automáticamente.
 * @param {{action: string, data: object}} actionObj
 */
async function executeAIAction(actionObj) {
  const { action, data } = actionObj;

  switch (action) {
    case 'create_task': {
      const task = await createTask(data);
      if (task) {
        showToast(`✅ Tarea creada: ${task.title || data.title}`, 'success');
        // Refresca la vista de tareas si está activa
        if (document.getElementById('section-tasks').classList.contains('active')) {
          loadTasksSection();
        }
      }
      break;
    }

    case 'create_client': {
      const client = await createClient(data);
      if (client) {
        showToast(`👥 Cliente creado: ${client.name || data.name}`, 'success');
        if (document.getElementById('section-clients').classList.contains('active')) {
          loadClientsSection();
        }
      }
      break;
    }

    case 'create_project': {
      const project = await createProject(data);
      if (project) {
        showToast(`📁 Proyecto creado: ${project.name || data.name}`, 'success');
        if (document.getElementById('section-projects').classList.contains('active')) {
          loadProjectsSection();
        }
      }
      break;
    }

    default:
      console.info('[Chat] Acción no reconocida:', action);
  }
}


// ════════════════════════════════════════════════════════════
// RENDER DOM
// ════════════════════════════════════════════════════════════

/**
 * Agrega un mensaje al DOM.
 * @param {'user'|'ai'|'error'} role
 * @param {string} content
 * @param {string|null} timestamp - ISO string
 * @param {boolean} animate - Si debe animarse al entrar
 */
function appendMessage(role, content, timestamp = null, animate = true) {
  const time = timestamp ? new Date(timestamp) : new Date();
  const timeStr = time.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;
  if (!animate) wrapper.style.animation = 'none';

  // Avatar
  const avatarEl = document.createElement('div');
  avatarEl.className = 'message-avatar';
  avatarEl.textContent = role === 'user' ? '👤' : role === 'error' ? '⚠' : '⬡';

  // Contenido
  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'message-bubble';
  // Convierte saltos de línea y negrita básica de markdown
  bubbleEl.innerHTML = formatMessage(content);

  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.textContent = timeStr;

  contentEl.appendChild(bubbleEl);
  contentEl.appendChild(timeEl);

  if (role === 'user') {
    wrapper.appendChild(contentEl);
    wrapper.appendChild(avatarEl);
  } else {
    wrapper.appendChild(avatarEl);
    wrapper.appendChild(contentEl);
  }

  DOM.container.appendChild(wrapper);
  scrollToBottom();
}

/**
 * Formatea texto básico de Markdown a HTML seguro.
 * Solo soporta **negrita**, _cursiva_ y saltos de línea.
 * (Para un parser completo, considera usar marked.js)
 */
function formatMessage(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') // Escapa HTML
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // **negrita**
    .replace(/_(.+?)_/g, '<em>$1</em>')                 // _cursiva_
    .replace(/`(.+?)`/g, '<code>$1</code>')             // `código`
    .replace(/\n/g, '<br>');                             // saltos de línea
}

/**
 * Limpia todos los mensajes del contenedor.
 */
function clearMessages() {
  // Elimina solo los mensajes (no el welcome screen ni el typing indicator)
  const messages = DOM.container.querySelectorAll('.message');
  messages.forEach(m => m.remove());
}

/**
 * Muestra/oculta la pantalla de bienvenida.
 */
function showWelcomeScreen() {
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.display = 'flex';
}

function hideWelcomeScreen() {
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.display = 'none';
}

/**
 * Activa/desactiva el estado de carga (typing indicator + deshabilita input).
 */
function setLoading(isLoading) {
  ChatState.isLoading = isLoading;
  DOM.typingIndicator.hidden = !isLoading;
  DOM.sendBtn.disabled = isLoading;
  DOM.input.disabled = isLoading;

  if (isLoading) scrollToBottom();
}

/**
 * Hace scroll suave hasta el fondo del contenedor de mensajes.
 */
function scrollToBottom(smooth = true) {
  requestAnimationFrame(() => {
    DOM.container.scrollTo({
      top: DOM.container.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    });
  });
}
