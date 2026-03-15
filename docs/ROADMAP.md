# 🗺️ Roadmap de Desarrollo — Freelance AI Assistant

> Guía para pasantes y desarrolladores junior que continuarán el proyecto.
> Cada tarea está detallada con criterios de aceptación, archivos involucrados y conceptos a aprender.

---

## 📌 Cómo usar este roadmap

1. Lee la tarea completa antes de empezar
2. Pregunta si algo no está claro (no adivines)
3. Haz un branch por cada tarea: `git checkout -b feature/nombre-tarea`
4. Abre un Pull Request aunque no hayas terminado (marca como Draft)
5. Pide revisión de código antes de hacer merge

**Convención de commits:**
```
feat: agrega filtro de tareas por fecha
fix: corrige error al cargar conversaciones vacías
docs: actualiza README con instrucciones de Gemini
style: mejora estilos del modal en móvil
refactor: separa lógica de tareas en módulo propio
```

---

## 🔴 FASE 1 — Fundamentos (Semanas 1-2)
*Para quienes recién se unen al proyecto*

### Tarea 1.1 — Configurar entorno de desarrollo
**Dificultad:** ⭐ Fácil  
**Tiempo estimado:** 2-3 horas  
**Aprenderás:** Git, Supabase, variables de entorno

**Qué hacer:**
- [ ] Clonar el repositorio
- [ ] Crear una cuenta en Supabase y ejecutar el schema SQL
- [ ] Abrir la app localmente con `python3 -m http.server 8080`
- [ ] Configurar el proveedor Mock en la interfaz
- [ ] Enviar 3 mensajes al chat y verificar que funciona

**Criterio de aceptación:** La app corre localmente, el chat responde (modo Mock).

---

### Tarea 1.2 — Agregar Supabase CDN al HTML
**Dificultad:** ⭐ Fácil  
**Tiempo estimado:** 1 hora  
**Archivo:** `frontend/index.html`  
**Aprenderás:** Carga de SDKs externos, CDN

**Qué hacer:**
- [ ] Agregar el script de Supabase JS desde CDN antes de los scripts propios:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```
- [ ] Verificar en la consola del navegador que `window.supabase` está disponible
- [ ] Conectar con tu proyecto de Supabase real y verificar que los mensajes se guardan

**Criterio de aceptación:** Los mensajes del chat se guardan y recuperan de Supabase.

---

### Tarea 1.3 — Mejorar el formateo de mensajes de la IA
**Dificultad:** ⭐⭐ Media  
**Tiempo estimado:** 3-4 horas  
**Archivo:** `frontend/js/chat.js` (función `formatMessage`)  
**Aprenderás:** Expresiones regulares, sanitización HTML, Markdown

**Qué hacer:**
La función `formatMessage()` actual es básica. Mejórala para soportar:
- [ ] Listas con `-` o `*`
- [ ] Bloques de código con triple backtick
- [ ] Emojis (ya funcionan, verifica)
- [ ] Links automáticos (URLs que se vuelven `<a href>`)

**Importante:** Siempre escapa el HTML antes de procesar Markdown para evitar XSS.

**Bonus:** Si te animas, integra la librería [marked.js](https://marked.js.org/) desde CDN.

---

### Tarea 1.4 — Persistencia de conversación activa
**Dificultad:** ⭐⭐ Media  
**Tiempo estimado:** 2-3 horas  
**Archivos:** `frontend/js/chat.js`, `frontend/js/app.js`  
**Aprenderás:** localStorage, estado de aplicación

**Qué hacer:**
Actualmente si recargas la página, se crea una nueva conversación. Mejora esto:
- [ ] Al cargar la app, si existe un `lastConversationId` en localStorage, carga esa conversación
- [ ] Al cambiar de conversación, guarda el ID en localStorage
- [ ] Al crear una nueva conversación, borra el `lastConversationId`

```javascript
// Ejemplo de lo que necesitas agregar en chat.js:
localStorage.setItem('lastConversationId', conversationId);
const saved = localStorage.getItem('lastConversationId');
```

---

## 🟡 FASE 2 — Funcionalidades Core (Semanas 3-4)
*Una vez que el entorno funciona correctamente*

### Tarea 2.1 — Modal de creación de clientes
**Dificultad:** ⭐⭐ Media  
**Tiempo estimado:** 4-6 horas  
**Archivos:** `frontend/index.html`, `frontend/css/styles.css`, `frontend/js/app.js`  
**Aprenderás:** Formularios, validación, UX de modales

**Qué hacer:**
Actualmente el botón "Agregar cliente" usa `prompt()` (muy feo). Reemplázalo con un modal bonito:
- [ ] Crea un modal HTML con campos: Nombre*, Email, Teléfono, Empresa, Notas
- [ ] Valida que el nombre no esté vacío
- [ ] Valida formato de email (regex básico)
- [ ] Al guardar, llama a `createClient()` y actualiza la vista
- [ ] Muestra errores inline (no con `alert()`)
- [ ] El modal se cierra con Escape y al hacer click fuera

**Criterio de aceptación:** Puedo crear clientes completos desde el modal sin errores.

---

### Tarea 2.2 — Modal de creación de tareas
**Dificultad:** ⭐⭐ Media  
**Tiempo estimado:** 4-6 horas  
**Archivos:** Mismos que 2.1  
**Aprenderás:** Selects dinámicos, fechas en JS

**Qué hacer:**
Similar a la tarea 2.1, pero para tareas:
- [ ] Campos: Título*, Descripción, Proyecto (select dinámico), Cliente (select dinámico), Prioridad (select), Fecha límite (date picker)
- [ ] Carga los proyectos y clientes existentes en los selects (llama a `getProjects()` y `getClients()`)
- [ ] La fecha límite debe ser futura (valida esto)
- [ ] Al guardar, la tarea aparece inmediatamente en la lista

---

### Tarea 2.3 — Búsqueda en el chat y secciones
**Dificultad:** ⭐⭐ Media  
**Tiempo estimado:** 3-4 horas  
**Archivos:** `frontend/js/app.js`, `frontend/css/styles.css`  
**Aprenderás:** Filtrado de DOM, debounce

**Qué hacer:**
- [ ] Agrega un input de búsqueda encima de las listas de clientes, proyectos y tareas
- [ ] Mientras el usuario escribe, filtra los elementos visibles
- [ ] Implementa un debounce de 300ms para no filtrar en cada tecla
- [ ] Resalta en negrita el texto que coincide con la búsqueda

```javascript
// Función debounce que necesitarás implementar:
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

---

### Tarea 2.4 — Eliminar conversaciones del historial
**Dificultad:** ⭐⭐ Media  
**Tiempo estimado:** 2-3 horas  
**Archivos:** `frontend/js/supabaseClient.js`, `frontend/js/app.js`  
**Aprenderás:** DELETE en SQL, confirmación de acciones destructivas

**Qué hacer:**
- [ ] Agrega en `supabaseClient.js` una función `deleteConversation(id)` que borre la conversación y sus mensajes
- [ ] En el historial de conversaciones (sidebar y sección), muestra un botón de borrar al hacer hover
- [ ] Al hacer click, pide confirmación: "¿Eliminar esta conversación? Esta acción no se puede deshacer."
- [ ] Si confirma, elimina y actualiza la UI
- [ ] Si la conversación activa es la eliminada, inicia una nueva

---

## 🟢 FASE 3 — Mejoras de UX (Semanas 5-6)

### Tarea 3.1 — Indicador de costo de tokens (opcional para modelos con precio)
**Dificultad:** ⭐⭐⭐ Difícil  
**Tiempo estimado:** 6-8 horas  
**Archivos:** `frontend/js/aiService.js`, `frontend/js/chat.js`, `frontend/js/supabaseClient.js`  
**Aprenderás:** APIs de IA, manejo de metadatos de respuesta, cálculo de costos

**Qué hacer:**
- [ ] Modifica las respuestas de `ClaudeProvider` y `OpenAIProvider` para guardar también `tokens_used`
- [ ] Guarda `tokens_used` en la tabla `messages` de Supabase
- [ ] Crea una función que calcule el costo aproximado según el proveedor y modelo
- [ ] Muestra en la UI un contador pequeño: "~$0.003 · 847 tokens" al final de cada sesión
- [ ] Tabla de precios de referencia (actualizar periódicamente):

```javascript
const TOKEN_PRICES = {
  'claude-opus-4-5': { input: 0.000003, output: 0.000015 },  // por token
  'claude-sonnet-4-6': { input: 0.000001, output: 0.000005 },
  'gpt-4o-mini': { input: 0.0000002, output: 0.0000008 },
};
```

---

### Tarea 3.2 — Exportar conversación a PDF o TXT
**Dificultad:** ⭐⭐ Media  
**Tiempo estimado:** 3-4 horas  
**Archivos:** `frontend/js/chat.js`  
**Aprenderás:** Generación de archivos en el navegador, Blob API

**Qué hacer:**
- [ ] Agrega un botón "Exportar" en la topbar cuando hay una conversación activa
- [ ] Al hacer click, genera un archivo `.txt` con todos los mensajes formateados:
```
FreelanceAI Assistant — Conversación exportada
Fecha: 09/03/2026 14:32
─────────────────────────

[14:30] Tú: ¿Cuáles son mis tareas pendientes?
[14:31] IA: Encontré 3 tareas pendientes...
```
- [ ] Descarga automáticamente el archivo
- [ ] Bonus: Ofrece también exportar como JSON (útil para importar después)

```javascript
// Cómo descargar un archivo desde JS:
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

### Tarea 3.3 — Modo claro / oscuro
**Dificultad:** ⭐⭐ Media  
**Tiempo estimado:** 3-4 horas  
**Archivos:** `frontend/css/styles.css`, `frontend/js/app.js`  
**Aprenderás:** CSS custom properties, prefers-color-scheme

**Qué hacer:**
- [ ] Agrega un set de variables CSS para el modo claro en `:root[data-theme="light"]`
- [ ] Crea un botón toggle (🌙/☀) en la topbar
- [ ] Al hacer click, cambia `document.documentElement.setAttribute('data-theme', ...)`
- [ ] Persiste la preferencia en localStorage
- [ ] Respeta `prefers-color-scheme` del sistema operativo al cargar por primera vez

---

### Tarea 3.4 — Notificaciones de tareas vencidas
**Dificultad:** ⭐⭐⭐ Difícil  
**Tiempo estimado:** 5-7 horas  
**Archivos:** `frontend/js/app.js`, `frontend/js/supabaseClient.js`  
**Aprenderás:** Web Notifications API, fechas y comparación temporal

**Qué hacer:**
- [ ] Al cargar la app, consulta las tareas con `due_date` menor a `NOW()` y estado `pending`
- [ ] Si hay tareas vencidas, muestra un badge con el número en el nav item "Tareas"
- [ ] Si el usuario da permiso de notificaciones (`Notification.requestPermission()`), envía una notificación del sistema
- [ ] Permite "snooze" de 1 día desde la notificación
- [ ] No molestes al usuario con más de 1 notificación por tarea por día

---

## 🔵 FASE 4 — Features Avanzados (Mes 2+)
*Para desarrolladores con más experiencia o que quieran un reto mayor*

### Tarea 4.1 — Sistema de autenticación con Supabase Auth
**Dificultad:** ⭐⭐⭐⭐ Avanzado  
**Tiempo estimado:** 8-12 horas  
**Aprenderás:** OAuth, JWT, sesiones, Row Level Security

**Qué hacer:**
- [ ] Agrega pantalla de login/registro (email+password o Google OAuth)
- [ ] Usa `supabase.auth.signInWithPassword()` y `supabase.auth.signUp()`
- [ ] Agrega el `user_id` de Supabase Auth a todas las queries
- [ ] Implementa RLS correctamente (el schema ya tiene las políticas)
- [ ] Muestra botón de "Cerrar sesión" en el sidebar
- [ ] Redirige al login si no hay sesión activa

---

### Tarea 4.2 — Memoria de contexto con resúmenes
**Dificultad:** ⭐⭐⭐⭐ Avanzado  
**Tiempo estimado:** 10-15 horas  
**Aprenderás:** Manejo avanzado de contexto, prompting, resúmenes automáticos

**El problema:** Si una conversación tiene 200 mensajes, enviarlos todos al LLM es costoso.

**Qué hacer:**
- [ ] Cuando la conversación supera `MAX_CONTEXT_MESSAGES` (20), llama a la IA para generar un resumen
- [ ] Guarda el resumen en `conversations.summary` de Supabase
- [ ] En lugar de enviar los 200 mensajes, envía: `[resumen] + [últimos 10 mensajes]`
- [ ] El resumen debe incluir: clientes mencionados, tareas creadas, decisiones importantes

```javascript
// System prompt para generar el resumen:
const SUMMARY_PROMPT = `
Resume esta conversación en máximo 200 palabras, destacando:
- Clientes o proyectos mencionados
- Tareas creadas o completadas
- Decisiones o compromisos importantes
- Contexto relevante para futuras consultas
`;
```

---

### Tarea 4.3 — Dashboard con métricas
**Dificultad:** ⭐⭐⭐ Difícil  
**Tiempo estimado:** 8-12 horas  
**Aprenderás:** Visualización de datos, SQL agregaciones, Chart.js

**Qué hacer:**
Crea una nueva sección "📊 Dashboard" con:
- [ ] Contadores: Total clientes, Proyectos activos, Tareas pendientes, Tareas completadas esta semana
- [ ] Gráfico de barras: Tareas completadas por semana (últimas 4 semanas)
- [ ] Lista de "próximas fechas límite" (próximos 7 días)
- [ ] Usa [Chart.js](https://www.chartjs.org/) desde CDN para los gráficos
- [ ] Los datos vienen de queries agregadas a Supabase

```sql
-- Ejemplo de query de Supabase para el dashboard:
SELECT 
  status,
  COUNT(*) as total
FROM tasks
GROUP BY status;
```

---

### Tarea 4.4 — Sistema de etiquetas (tags) para tareas
**Dificultad:** ⭐⭐⭐ Difícil  
**Tiempo estimado:** 6-8 horas  
**Aprenderás:** Arrays en PostgreSQL, filtros múltiples, UI de tags

**Qué hacer:**
- [ ] La tabla `tasks` ya tiene el campo `tags TEXT[]`. Úsalo.
- [ ] En el modal de creación de tareas, agrega un input de tags (tipo "píldoras")
- [ ] Al escribir y presionar Enter o coma, se agrega una nueva etiqueta
- [ ] Las etiquetas se guardan como array en Supabase
- [ ] Agrega filtro por etiqueta en la sección de tareas
- [ ] Muestra las etiquetas como badges de color en cada tarea

---

### Tarea 4.5 — Integración con Google Calendar (webhook)
**Dificultad:** ⭐⭐⭐⭐⭐ Experto  
**Tiempo estimado:** 15-20 horas  
**Aprenderás:** OAuth2, Google APIs, webhooks, Supabase Edge Functions

**Qué hacer:**
- [ ] Permite al usuario conectar su Google Calendar con OAuth2
- [ ] Cuando se crea una tarea con fecha límite, crea automáticamente un evento en Google Calendar
- [ ] Cuando se completa una tarea, marca el evento como completado
- [ ] Sincronización bidireccional: eventos de Calendar → tareas en la app

---

## 📚 Recursos de aprendizaje

**Para entender el proyecto:**
- [Supabase Docs](https://supabase.com/docs) — especialmente "Database" y "JavaScript Client"
- [MDN Web Docs](https://developer.mozilla.org) — referencia de JavaScript vanilla
- [Anthropic Docs](https://docs.anthropic.com) — API de Claude

**Para mejorar el código:**
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript) — buenas prácticas
- [JavaScript.info](https://javascript.info/) — tutorial moderno de JS
- [CSS Tricks](https://css-tricks.com) — trucos de CSS

**Para seguridad:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — vulnerabilidades web más comunes
- Nunca confíes en input del usuario. Siempre sanitiza.

---

## 🤝 Proceso de revisión de código

Antes de abrir un Pull Request, verifica:

- [ ] El código tiene comentarios donde la lógica no es obvia
- [ ] Las funciones hacen una sola cosa (principio de responsabilidad única)
- [ ] No hay `console.log()` de debugging olvidados
- [ ] Los nombres de variables y funciones son descriptivos en español o inglés (consistente)
- [ ] Probé en Chrome y Firefox
- [ ] Probé en móvil (o usé DevTools responsive mode)
- [ ] No rompí ninguna funcionalidad existente

---

## 💡 Ideas para proponer mejoras propias

Si tienes una idea que no está en el roadmap, ¡proponla! Crea un Issue en GitHub con:

1. **Qué problema resuelve** para el usuario
2. **Cómo lo implementarías** (descripción técnica breve)
3. **Qué tan difícil crees que es** (días de trabajo estimados)
4. **Si bloqueara** otras tareas del roadmap

Las mejores ideas se agregan al roadmap con tu nombre como autor. 🎉
