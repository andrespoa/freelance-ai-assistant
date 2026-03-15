/**
 * aiService.js — Servicio de Inteligencia Artificial
 *
 * Implementa el patrón AIProvider:
 * Una interfaz común para múltiples proveedores de IA.
 * Para agregar un nuevo proveedor, solo debes:
 *   1. Crear una clase que extienda AIProvider
 *   2. Implementar el método sendMessage()
 *   3. Registrarla en AI_PROVIDERS
 *
 * ─────────────────────────────────────────────────────
 * Proveedores disponibles:
 *   - ClaudeProvider  → Anthropic Claude API
 *   - OpenAIProvider  → OpenAI GPT API
 *   - MockProvider    → Respuestas simuladas (sin API key)
 * ─────────────────────────────────────────────────────
 */

// ── Clase base (interfaz) ────────────────────────────────────
class AIProvider {
  /**
   * @param {string} apiKey
   * @param {object} options - Opciones adicionales del proveedor.
   */
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.options = options;
  }

  /**
   * Envía un mensaje al modelo y retorna la respuesta.
   * @param {Array<{role: string, content: string}>} messages - Historial del chat.
   * @param {string} systemPrompt - Instrucciones del sistema.
   * @returns {Promise<string>} Texto de respuesta.
   */
  async sendMessage(messages, systemPrompt) {
    throw new Error('sendMessage() debe ser implementado por la subclase.');
  }

  /**
   * Verifica que la API key esté configurada.
   */
  isConfigured() {
    return this.apiKey && this.apiKey.length > 0;
  }
}


// ═══════════════════════════════════════════════════════════
// PROVEEDOR: ANTHROPIC CLAUDE
// ═══════════════════════════════════════════════════════════

class ClaudeProvider extends AIProvider {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.model = options.model || CONFIG.AI_MODELS.claude;
    this.endpoint = CONFIG.AI_ENDPOINTS.claude;
  }

  async sendMessage(messages, systemPrompt) {
    if (!this.isConfigured()) {
      throw new Error('API key de Claude no configurada. Ve a ⚙ Configuración.');
    }

    // ⚠ NOTA: El navegador no puede llamar directamente a la API de Anthropic
    // por política CORS. En producción, usa un Edge Function o proxy.
    // Para desarrollo, considera usar un proxy local como:
    //   https://github.com/anthropics/anthropic-sdk-python (con CORS habilitado)
    //
    // Para demo en producción, usa el proveedor 'mock' o un serverless proxy.

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        // Header requerido para llamadas desde el navegador (cuando hay proxy)
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: CONFIG.MAX_TOKENS,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Claude API error ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }
}


// ═══════════════════════════════════════════════════════════
// PROVEEDOR: OPENAI GPT
// ═══════════════════════════════════════════════════════════

class OpenAIProvider extends AIProvider {
  constructor(apiKey, options = {}) {
    super(apiKey, options);
    this.model = options.model || CONFIG.AI_MODELS.openai;
    this.endpoint = CONFIG.AI_ENDPOINTS.openai;
  }

  async sendMessage(messages, systemPrompt) {
    if (!this.isConfigured()) {
      throw new Error('API key de OpenAI no configurada. Ve a ⚙ Configuración.');
    }

    // Construye el array de mensajes con el system prompt al inicio
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: CONFIG.MAX_TOKENS,
        messages: chatMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}


// ═══════════════════════════════════════════════════════════
// PROVEEDOR: MOCK (sin API key — para desarrollo y demos)
// ═══════════════════════════════════════════════════════════

class MockProvider extends AIProvider {
  constructor() {
    super('mock');
    // Respuestas predefinidas para demostración
    this.responses = [
      '¡Entendido! He procesado tu solicitud. En modo demo, las respuestas son simuladas. Configura tu API key en ⚙ para respuestas reales.',
      'Claro, puedo ayudarte con eso. Esta es una respuesta de demostración del asistente FreelanceAI.',
      'Para gestionar tus tareas y clientes de forma inteligente, conecta una API key real en la configuración.',
      '¡Perfecto! Recuerda que en modo demo solo veo respuestas simuladas. Conecta Claude o GPT para magia real. 🚀',
      'He registrado tu mensaje. En modo producción, analizaría tu historial de proyectos y te daría recomendaciones personalizadas.',
    ];
    this._index = 0;
  }

  async sendMessage(messages, systemPrompt) {
    // Simula una demora de red realista
    await this._delay(800 + Math.random() * 1200);

    // Detecta comandos especiales para demos más ricas
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';

    if (lastMsg.includes('tarea') || lastMsg.includes('/tarea')) {
      return `He creado una nueva tarea para ti. Respuesta de ejemplo:\n\n` +
             `{"action": "create_task", "data": {"title": "Tarea de ejemplo", "status": "pending", "priority": "medium"}}`;
    }
    if (lastMsg.includes('cliente') || lastMsg.includes('/cliente')) {
      return `Buscando clientes... En modo demo te muestro un ejemplo:\n\n**Cliente:** Empresa Ejemplo S.A.\n**Email:** contacto@ejemplo.com\n**Estado:** Activo`;
    }
    if (lastMsg.includes('proyecto') || lastMsg.includes('/proyecto')) {
      return `Aquí están tus proyectos activos (modo demo):\n\n1. **Rediseño web** — En progreso\n2. **App móvil** — Pendiente inicio\n3. **Consultoría SEO** — Completado`;
    }
    if (lastMsg.includes('hola') || lastMsg.includes('ayuda')) {
      return `¡Hola, ${CONFIG.FREELANCER_NAME}! 👋 Soy tu asistente FreelanceAI (modo demo).\n\nPuedo ayudarte con:\n- 📋 Gestionar tareas\n- 👥 Administrar clientes\n- 📁 Seguir proyectos\n\nEscribe /tarea, /cliente o /proyecto para ver ejemplos.`;
    }

    // Respuesta cíclica genérica
    const reply = this.responses[this._index % this.responses.length];
    this._index++;
    return reply;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


// ═══════════════════════════════════════════════════════════
// REGISTRO DE PROVEEDORES
// Agrega aquí nuevos proveedores
// ═══════════════════════════════════════════════════════════

const AI_PROVIDERS = {
  claude: ClaudeProvider,
  openai: OpenAIProvider,
  mock:   MockProvider,
};


// ═══════════════════════════════════════════════════════════
// FÁBRICA — crea el proveedor activo según la configuración
// ═══════════════════════════════════════════════════════════

/**
 * Crea y retorna una instancia del proveedor de IA activo.
 * @returns {AIProvider}
 */
function createAIProvider() {
  const providerName = CONFIG.AI_PROVIDER || 'mock';
  const ProviderClass = AI_PROVIDERS[providerName];

  if (!ProviderClass) {
    console.warn(`[AI] Proveedor "${providerName}" no encontrado. Usando Mock.`);
    return new MockProvider();
  }

  if (providerName === 'mock') {
    return new MockProvider();
  }

  return new ProviderClass(CONFIG.AI_API_KEY, {
    model: CONFIG.AI_MODELS[providerName],
  });
}


// ═══════════════════════════════════════════════════════════
// SERVICIO PRINCIPAL
// Esta es la interfaz que usa el resto de la aplicación
// ═══════════════════════════════════════════════════════════

const AIService = {
  _provider: null,

  /**
   * Inicializa (o re-inicializa) el proveedor.
   * Llama esto cuando cambia la configuración.
   */
  init() {
    this._provider = createAIProvider();
    console.info(`[AI] Proveedor activo: ${CONFIG.AI_PROVIDER}`);
  },

  /**
   * Envía un mensaje y obtiene respuesta.
   * @param {Array} messages - Historial [{role, content}]
   * @returns {Promise<string>}
   */
  async chat(messages) {
    if (!this._provider) this.init();

    // Limita el contexto para no exceder el límite de tokens
    const contextMessages = messages.slice(-CONFIG.MAX_CONTEXT_MESSAGES);
    return this._provider.sendMessage(contextMessages, CONFIG.SYSTEM_PROMPT);
  },

  /**
   * Verifica si el proveedor actual está configurado con una key.
   */
  isReady() {
    if (!this._provider) this.init();
    return this._provider.isConfigured();  
  },

  /**
   * Retorna el nombre del proveedor actual.
   */
  getProviderName() {
    return CONFIG.AI_PROVIDER || 'mock';
  },

  /**
   * Parsea la respuesta buscando acciones JSON embebidas.
   * El LLM puede retornar {"action": "create_task", "data": {...}}
   * para que la app ejecute acciones automáticamente.
   * @param {string} responseText
   * @returns {{text: string, action: object|null}}
   */
  parseResponse(responseText) {
    const jsonMatch = responseText.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (!jsonMatch) return { text: responseText, action: null };

    try {
      const action = JSON.parse(jsonMatch[0]);
      // Elimina el JSON del texto visible para el usuario
      const cleanText = responseText.replace(jsonMatch[0], '').trim();
      return { text: cleanText || 'Acción ejecutada.', action };
    } catch {
      return { text: responseText, action: null };
    }
  },
};

// Inicialización automática
AIService.init();
