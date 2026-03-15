/**
 * config.js — Configuración central de la aplicación
 *
 * ⚠ IMPORTANTE PARA DESARROLLADORES:
 *   En producción, NUNCA expongas API keys en el frontend.
 *   Usa un backend proxy (Supabase Edge Functions, Vercel Serverless, etc.)
 *   Este archivo es solo para desarrollo local y demos.
 *
 * Para producción: mueve las keys a variables de entorno del servidor.
 */

const CONFIG = {
  // ──────────────────────────────────────────────────────────
  // Supabase
  // Obtén estos valores en: https://app.supabase.com → Settings → API
  // ──────────────────────────────────────────────────────────
  SUPABASE_URL:      localStorage.getItem('supabase_url')  || '',
  SUPABASE_ANON_KEY: localStorage.getItem('supabase_key')  || '',

  // ──────────────────────────────────────────────────────────
  // Proveedor de IA
  // Valores posibles: 'claude' | 'openai' | 'mock'
  // 'mock' no necesita API key — útil para desarrollo UI
  // ──────────────────────────────────────────────────────────
  AI_PROVIDER: localStorage.getItem('ai_provider') || 'mock',
  AI_API_KEY:  localStorage.getItem('ai_api_key')  || '',

  // ──────────────────────────────────────────────────────────
  // Modelos por proveedor
  // ──────────────────────────────────────────────────────────
  AI_MODELS: {
    claude: 'claude-opus-4-5',   // o 'claude-sonnet-4-6' para respuestas más rápidas
    openai: 'gpt-4o-mini',       // cambia a 'gpt-4o' para mayor calidad
  },

  // ──────────────────────────────────────────────────────────
  // Parámetros del chat
  // ──────────────────────────────────────────────────────────
  MAX_CONTEXT_MESSAGES: 20,   // cuántos mensajes previos se envían al LLM como contexto
  MAX_TOKENS: 1024,           // límite de tokens en la respuesta

  // ──────────────────────────────────────────────────────────
  // Datos del freelancer (editables desde el modal de config)
  // ──────────────────────────────────────────────────────────
  FREELANCER_NAME: localStorage.getItem('freelancer_name') || 'Freelancer',

  // ──────────────────────────────────────────────────────────
  // Endpoints de la IA (no cambiar salvo que uses un proxy)
  // ──────────────────────────────────────────────────────────
  AI_ENDPOINTS: {
    claude: 'https://api.anthropic.com/v1/messages',
    openai: 'https://api.openai.com/v1/chat/completions',
  },

  // ──────────────────────────────────────────────────────────
  // System prompt base — personaliza el comportamiento de la IA
  // ──────────────────────────────────────────────────────────
  get SYSTEM_PROMPT() {
    return `Eres FreelanceAI, un asistente inteligente especializado en ayudar a freelancers a gestionar su trabajo.

Tu usuario se llama ${this.FREELANCER_NAME}.

Puedes ayudar con:
- Gestión de clientes (crear, buscar, actualizar)
- Proyectos (crear, revisar estado, asignar tareas)
- Tareas y recordatorios (crear, priorizar, marcar como completadas)
- Consultas de negocio (facturas, presupuestos, contratos)
- Consejos para freelancers

Comandos especiales que reconoces:
- /tarea [descripción] → crear una tarea nueva
- /cliente [nombre] → crear o buscar un cliente
- /proyecto [nombre] → crear o buscar un proyecto
- /recordatorio [fecha] [mensaje] → crear un recordatorio

Responde siempre en español, de forma concisa y útil.
Cuando el usuario pida crear algo (tarea, cliente, proyecto), responde con un JSON estructurado así:
{"action": "create_task", "data": {...}} para que el sistema lo procese automáticamente.

Sé proactivo: si ves que el usuario tiene tareas vencidas o proyectos sin actividad, menciónalo.`;
  },
};

// Actualiza CONFIG desde localStorage al cargar
function loadConfigFromStorage() {
  CONFIG.SUPABASE_URL      = localStorage.getItem('supabase_url')      || '';
  CONFIG.SUPABASE_ANON_KEY = localStorage.getItem('supabase_key')      || '';
  CONFIG.AI_PROVIDER       = localStorage.getItem('ai_provider')       || 'mock';
  CONFIG.AI_API_KEY        = localStorage.getItem('ai_api_key')        || '';
  CONFIG.FREELANCER_NAME   = localStorage.getItem('freelancer_name')   || 'Freelancer';
}

loadConfigFromStorage();
