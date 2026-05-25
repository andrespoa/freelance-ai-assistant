# ⬡ Freelance AI Assistant

> Asistente inteligente para freelancers · Dashboard + Chat IA + Gestión de negocio

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Licencia](https://img.shields.io/badge/licencia-Apache%202.0-green)
![Versión](https://img.shields.io/badge/versión-0.1.0-blue)
![Versión de Node](https://img.shields.io/badge/node-%3E%3D%2018-green)
![Navegadores](https://img.shields.io/badge/navegadores-Chrome%2C%20Firefox%2C%20Safari-blue)

---

## 📌 ¿Qué es esto?

**Freelance AI Assistant** es una aplicación web moderna que combina un **Dashboard analítico** con un **Chatbot inteligente** para ayudarte a gestionar tu negocio como freelancer.

### ✨ Características principales:

**Dashboard (Vista analítica)**
- 📊 **Métricas clave** — Clientes activos, proyectos en curso, tareas pendientes, ingresos potenciales
- 📈 **Gráficos interactivos** — Estado de proyectos, prioridad de tareas, top clientes
- 📋 **Actividad reciente** — Historial de acciones y cambios
- ⏰ **Proyectos próximos a vencer** — Alertas y fechas límite

**Chat IA (Asistente conversacional)**
- 💬 **Lenguaje natural** — Hablale como a una persona, entiende contexto
- 🤖 **Múltiples proveedores** — Claude, GPT, Gemini (gratis) o Mock
- ⚡ **Acciones automáticas** — Crea tareas, clientes, proyectos solo diciéndolo
- 📝 **Historial completo** — Guarda todas las conversaciones

**Gestión de negocio**
- 👥 **Clientes** — Crear, buscar, actualizar estados (activo/prospecto/inactivo)
- 📁 **Proyectos** — Seguimiento completo con fechas límite y presupuestos
- ✅ **Tareas** — Gestión con prioridades (alta/media/baja) y estados
- 🔍 **Búsqueda y filtros** — Encuentra rápidamente lo que necesitas
- 💾 **Datos persistentes** — Todo se guarda en Supabase

**Accesibilidad**
- 🌙 **Tema oscuro profesional** — Editorial y moderno
- 📱 **Responsive design** — Funciona en desktop, tablet, móvil
- ⌨️ **Atajos de teclado** — Ctrl+Enter para enviar chat
- 🎨 **Paleta limpia** — Tipografía moderna (DM Serif + DM Sans)

---

## 🎯 Casos de uso

**Para freelancers independientes:**
- Gestionar múltiples clientes y proyectos simultáneamente
- Priorizar tareas y respetar fechas límite
- Hacer seguimiento de ingresos y presupuestos
- Automatizar creación de registros vía chat

**Para pequeños equipos:**
- Dashboard compartido de proyectos
- Colaboración en tareas y proyectos
- Historial de conversaciones para contexto

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                   NAVEGADOR (Frontend)                    │
│                                                           │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │  Dashboard  │  │  Chat IA │  │  Gestión de Datos│    │
│  │  (KPIs +    │  │(Claude/  │  │ (Clientes,      │    │
│  │  Gráficos)  │  │GPT/Gemini│  │  Proyectos,     │    │
│  │             │  │ /Mock)   │  │  Tareas)        │    │
│  └──────┬──────┘  └─────┬────┘  └────────┬─────────┘    │
│         │               │               │                 │
│         │ Frontend Logic│               │                 │
│         └───────────────┼───────────────┘                 │
│                         │                                  │
│  ┌──────────────────────┴─────────────────────┐           │
│  │  Config & Servicios                        │           │
│  │  - supabaseClient.js (capa de datos)      │           │
│  │  - aiService.js (multi-proveedor IA)      │           │
│  │  - config.js (variables globales)         │           │
│  └───────────────┬──────────────┬────────────┘           │
└──────────────────┼──────────────┼─────────────────────────┘
                   │              │
                   │              │ fetch / REST
        ┌──────────▼──┐      ┌────▼────────┐
        │  Supabase   │      │ AI Provider  │
        │ PostgreSQL  │      │ (Claude/GPT/ │
        │  Auth+API   │      │  Gemini)     │
        └─────────────┘      └──────────────┘
```

**Stack técnico:**
- **Frontend:** HTML5 + CSS3 + JavaScript ES6+ (vanilla, sin frameworks)
- **Base de datos:** Supabase (PostgreSQL + Auth + REST API)
- **IA:** Anthropic Claude, OpenAI GPT, Google Gemini, o Mock local
- **Deployment:** GitHub Pages, Vercel, Netlify (estático)

---

## 📂 Estructura del repositorio

```
freelance-ai-assistant/
│
├── frontend/
│   ├── index.html               # Estructura HTML (chat + dashboard + gestión)
│   ├── css/
│   │   └── styles.css           # Estilos (dark theme, responsive, animaciones)
│   └── js/
│       ├── config.js            # Configuración central (Supabase, IA, freelancer)
│       ├── supabaseClient.js    # Capa de datos (CRUD de clientes/proyectos/tareas)
│       ├── aiService.js         # Servicio de IA con soporte multi-proveedor
│       ├── aiService.js         # MultiProvider: Claude, OpenAI, Gemini, Mock
│       ├── dashboard.js         # Lógica del dashboard (KPIs, gráficos, actividad)
│       ├── chat.js              # Módulo de chat (UI + interacción)
│       ├── commands.js          # Parser de comandos especiales (/tarea, /cliente, etc)
│       ├── actionsExecutor.js   # Ejecutor de acciones automáticas
│       ├── dbCheck.js           # Validador de schema de base de datos
│       └── app.js               # Controlador principal + ruteo de secciones
│
├── database/
│   └── schema.sql               # Schema SQL completo (tablas, índices, RLS)
│
├── docs/
│   ├── ROADMAP.md               # Plan de desarrollo futuro
│   ├── CONTRIBUTING.md          # Guía de contribución
│   ├── COMMANDS.md              # Documentación de comandos de IA
│   └── DAY*.md                  # Logs de desarrollo (gitignored)
│
├── .gitignore                   # Excluye .env, API keys, node_modules
├── README.md                    # Este archivo
└── LICENSE                      # Apache 2.0
```

---

## 🚀 Instalación rápida (5 minutos)

### Opción A: Abrir directo en el navegador (sin instalación)

```bash
# 1. Clona el repositorio
git clone https://github.com/andrespoa/freelance-ai-assistant.git
cd freelance-ai-assistant

# 2. Abre index.html en tu navegador
open frontend/index.html
# o en Windows:
start frontend/index.html
```

Esto abrirá la app en **modo demo** (proveedor Mock — sin API key).

### Opción B: Servidor local con Python

```bash
cd freelance-ai-assistant/frontend
python3 -m http.server 8080
# Abre: http://localhost:8080
```

### Opción C: Servidor con Node.js

```bash
cd freelance-ai-assistant
npx serve frontend -p 8080
# Abre: http://localhost:8080
```

---

## 🎬 Tu primer uso

1. **Abre la app** → Ve a ⚙ **Configuración** (esquina inferior izquierda)
2. **Conecta Supabase** (ver sección debajo)
3. **Conecta una IA** (Google Gemini gratis recomendado)
4. **Prueba el chat** → "Hola, ¿quién eres?"
5. **Crea un cliente** → "Crea un cliente llamado Juan García"
6. **Crea un proyecto** → "Nuevo proyecto: Sitio web"
7. **Crea una tarea** → "Tarea urgente: revisar contrato"
8. **Mira el Dashboard** → Los KPIs y gráficos se actualizan automáticamente

---

## 🛠️ Configuración inicial

### Paso 1: Conectar Supabase (Base de datos)

#### A. Crea tu proyecto en Supabase
1. Ve a [https://app.supabase.com](https://app.supabase.com) (regístrate gratis)
2. Crea un nuevo proyecto
3. Selecciona región más cercana
4. Espera ~2 minutos

#### B. Ejecuta el schema SQL
1. En Supabase, abre **SQL Editor**
2. Crea una nueva query
3. Copia-pega el contenido de `database/schema.sql`
4. Ejecuta (Run)
5. Verifica que no haya errores

#### C. Obtén las credenciales
1. Ve a **Settings → API**
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon public**: `eyJ...`

#### D. Pega en la app
1. En la app, haz clic en **⚙ Configuración**
2. Pega Supabase URL y Anon Key
3. Guarda

✅ Ahora puedes crear clientes, proyectos y tareas que se guardan en la BD.

---

### Paso 2: Conectar un proveedor de IA

#### 🚀 Opción recomendada: Google Gemini (GRATIS)

**Por qué Gemini:**
- ✅ **100% gratis** (no requiere tarjeta de crédito)
- ⚡ **Muy rápido** (gemini-2.0-flash)
- 📊 **60 solicitudes/minuto** (perfecto para desarrollo)
- 🆓 **Sin restricciones de uso personal**

**Pasos:**
1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Haz clic en **"Create API Key"**
3. Selecciona **"Create API key in new project"**
4. Copia la key (comienza con `AIza...`)
5. En la app, ⚙ Configuración:
   - Proveedor: **Google Gemini (GRATIS - Recomendado)**
   - API Key: `AIza...`
6. Guarda y prueba con un mensaje

**Modelos disponibles en Gemini:**
- `gemini-2.0-flash` — Recomendado (rápido y económico)
- `gemini-1.5-flash` — Alternativa
- `gemini-1.5-pro` — Más potente pero más lento

---

#### 💳 Alternativa: Anthropic Claude

1. Crea cuenta en [https://console.anthropic.com](https://console.anthropic.com)
2. Crea un proyecto y una API key
3. **Costo:** ~$3-5 USD por 1M tokens de entrada
4. En la app, ⚙ Configuración:
   - Proveedor: **Anthropic Claude**
   - API Key: `sk-ant-...`

**Ventajas:** Excelente para tareas complejas, mejor comprensión de contexto.

---

#### 🟣 Alternativa: OpenAI GPT

1. Crea cuenta en [https://platform.openai.com](https://platform.openai.com)
2. Genera una API key
3. **Costo:** ~$0.15 USD por 1M tokens (GPT-4o-mini)
4. En la app, ⚙ Configuración:
   - Proveedor: **OpenAI GPT**
   - API Key: `sk-...`

**Ventajas:** Confiable, modelo GPT-4o excelente.

---

#### 🎭 Modo demo: Mock (sin API key)

Selecciona **Mock** en Proveedor. Útil para:
- Desarrollar UI sin gastar créditos
- Demostrar la app sin internet
- Testing automático

---

## 📊 Dashboard (Nuevo en v0.1)

El dashboard es la página principal y muestra un resumen de tu negocio:

### KPIs Principales
```
┌──────────────────────────────────────────────────────┐
│ 👥 Clientes Activos      📁 Proyectos en Curso      │
│        5                        3                     │
│    este mes              en progreso                  │
├──────────────────────────────────────────────────────┤
│ ✅ Tareas Pendientes     💰 Ingresos Potenciales    │
│        12                      $45,000                │
│   requieren atención     de proyectos activos         │
└──────────────────────────────────────────────────────┘
```

### Gráficos Analíticos
- **Estado de Proyectos** — Donut chart con In Progreso / Pendiente / Done / Cancelado
- **Tareas por Prioridad** — Distribución de Alta / Media / Baja
- **Top 5 Clientes** — Bar chart por volumen de proyectos
- **Actividad Reciente** — Timeline de cambios y completaciones

### Secciones Adicionales
- 📋 **Historial de Actividad** — Últimas acciones realizadas
- ⏰ **Próximos a Vencer** — Proyectos con deadline cercana (coloreados por urgencia)

---

## 💬 Chat & Comandos

### Cómo hablarle al Asistente

**Conversación natural (recomendado):**
```
Tú:  "Hola, ¿me ayudas a crear una tarea?"
IA:  "Claro, ¿cuál es la descripción de la tarea?"

Tú:  "Revisar el contrato de Ana antes del viernes"
IA:  [Crea automáticamente la tarea con prioridad]
```

**Comandos especiales (slash commands):**

| Comando | Ejemplo | Resultado |
|---------|---------|-----------|
| `/tarea [desc]` | `/tarea Revisar propuesta de López` | Crea tarea con descripción |
| `/cliente [nombre]` | `/cliente Carlos López` | Busca o crea cliente |
| `/proyecto [nombre]` | `/proyecto Sitio web` | Busca o crea proyecto |
| `/recordatorio [fecha] [msg]` | `/recordatorio 2026-06-01 Llamar a cliente` | Crea recordatorio |

### Ejemplos de conversación avanzada

```
Tú:  "¿Cuáles son mis tareas pendientes?"
IA:  [Extrae y lista todas las tareas no completadas]

Tú:  "¿Cuánto dinero espero hacer este mes?"
IA:  [Suma presupuestos de proyectos activos]

Tú:  "¿Quién es mi cliente con más proyectos?"
IA:  [Analiza datos y responde]

Tú:  "Agrega al cliente María García de empresa TechCorp"
IA:  [Crea registro automáticamente]
```

### Atajos de teclado

| Atajo | Función |
|-------|---------|
| `Ctrl + Enter` | Enviar mensaje |
| `Shift + Enter` | Nueva línea |
| `Escape` | Cerrar modal activo |

---

## 🗂️ Secciones de la app

### 📊 Dashboard (Nueva)
- Vista principal con KPIs y gráficos
- Actualiza automáticamente al cambiar datos
- Resumen ejecutivo de tu negocio

### 💬 Chat
- Conversa con la IA
- Crea objetos automáticamente
- Consulta tu información
- Historial completo guardado

### 👥 Clientes
- CRUD completo (Crear, Leer, Actualizar, Eliminar)
- Estados: Activo, Prospecto, Inactivo
- Datos: Email, teléfono, empresa, sitio web, dirección, notas
- Búsqueda rápida

### 📁 Proyectos
- Gestión completa con fechas límite
- Estados: En progreso, Pendiente, Completado, Cancelado
- Presupuesto y cliente asociado
- Seguimiento de actividad

### ✅ Tareas
- Prioridades: Alta, Media, Baja
- Estados: Pendiente, En progreso, Completada
- Asociar a proyecto
- Filtros por estado o prioridad

### 📖 Historial
- Registro completo de conversaciones
- Buscar por fecha o contenido
- Exportar conversaciones (futuro)

---

## 🌐 Despliegue

### GitHub Pages (Gratis, recomendado para demo)

```bash
# 1. Crea repo en GitHub: tu-usuario/freelance-ai-assistant
# 2. Clona y sube
git clone https://github.com/tu-usuario/freelance-ai-assistant.git
cd freelance-ai-assistant
git add .
git commit -m "Initial commit: Freelance AI Assistant v0.1"
git push -u origin main

# 3. En GitHub: Settings → Pages
# 4. Source: Deploy from a branch
# 5. Select: main / /frontend
# 6. Tu app estará en: https://tu-usuario.github.io/freelance-ai-assistant
```

### Vercel (Recomendado para producción)

```bash
# 1. Instala Vercel CLI
npm install -g vercel

# 2. Deploy
cd freelance-ai-assistant/frontend
vercel

# 3. Sigue las instrucciones
# Tu URL: freelance-ai-assistant.vercel.app
```

### Netlify (Alternativa fácil)

```bash
# Opción 1: CLI
npm install -g netlify-cli
netlify deploy --dir=frontend

# Opción 2: Drag & drop
# Arrastra la carpeta frontend/ a https://app.netlify.com/drop
```

### Despliegue con backend proxy (para producción con API keys seguras)

Para producción real, necesitas ocultar las API keys. Opciones:

**Supabase Edge Functions:**
```sql
-- Crea una Edge Function que haga proxy de llamadas a Claude/OpenAI
-- Ver: https://supabase.com/docs/guides/functions
```

**Vercel Serverless Functions:**
```javascript
// api/chat.js
export default async function (req, res) {
  // Tu API key aquí (variable de entorno)
  // Proxy la llamada a Claude/OpenAI
  // Retorna respuesta sin exponer la key
}
```

**Railway, Render, o Heroku:**
Deploya un backend Node.js/Python que haga proxy.

---

## 🔐 Seguridad

### Cómo se guardan las credenciales

- **Supabase URL & Key:** `localStorage` (navegador)
- **API Keys de IA:** `localStorage` (navegador)
- **Freelancer data:** `localStorage` (navegador)

**Importante:** Esto es solo para desarrollo local. En producción:

### ⚠️ Checklist de seguridad para producción

- [ ] Nunca expongas API keys en el frontend
- [ ] Usa un backend proxy (Vercel, Supabase, etc)
- [ ] Las API keys en el backend, nunca en el navegador
- [ ] Usa variables de entorno:
  ```bash
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=xxx
  ANTHROPIC_API_KEY=sk-ant-xxx
  OPENAI_API_KEY=sk-xxx
  GEMINI_API_KEY=AIza-xxx
  ```
- [ ] Implementa autenticación en el backend proxy
- [ ] Usa HTTPS en producción
- [ ] Rate limiting en el backend
- [ ] Valida entrada de usuario

### Ejemplo: Backend Node.js con variables de entorno

```javascript
// api.js
require('dotenv').config();

app.post('/api/chat', async (req, res) => {
  const message = req.body.message;
  
  // Aquí tienes acceso a process.env.ANTHROPIC_API_KEY
  // sin exponerla al cliente
  const response = await fetch('https://api.anthropic.com/...', {
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
    },
  });
  
  res.json(response);
});
```

---

## 🧪 Testing

### Pruebas Manuales (Smoke Testing)

Checklist básico:
- [ ] Dashboard carga con datos iniciales
- [ ] Chat funciona con proveedor Mock
- [ ] Crear cliente desde chat
- [ ] Crear proyecto desde chat
- [ ] Crear tarea desde chat
- [ ] KPIs actualizan correctamente
- [ ] Gráficos se renderizan
- [ ] Filtros de tareas funcionan
- [ ] Modales abren y cierran

### Pruebas Automáticas (Playwright)

```bash
# Instalar
npm install @playwright/test --save-dev

# Ejecutar suite de tests
npx playwright test

# Ver reporte interactivo
npx playwright show-report
```

### Test Coverage

- Funciones de chat: AI provider integration, message history
- Dashboard: KPI calculations, chart rendering
- CRUD de datos: Clientes, proyectos, tareas
- UI: Modales, filtros, navegación

---

## 📝 Desarrollo local

### Requisitos

- Node.js 18+ (opcional, solo si usas servidor)
- Git
- Navegador moderno

### Setup de desarrollo

```bash
# 1. Clona
git clone https://github.com/andrespoa/freelance-ai-assistant.git
cd freelance-ai-assistant

# 2. Inicia servidor local
npx serve frontend -p 8080

# 3. Abre http://localhost:8080

# 4. En navegador: ⚙ Configuración
# 5. Pega credenciales de Supabase y API key de IA
```

### Estructura para modificar

```
frontend/
├── index.html        ← Agregar nuevas secciones HTML aquí
├── css/
│   └── styles.css    ← Agregar estilos nuevos
└── js/
    ├── config.js     ← Variables globales
    ├── dashboard.js  ← Lógica de dashboard
    ├── chat.js       ← Lógica de chat
    └── app.js        ← Controlador principal
```

### Workflow de desarrollo

```bash
# 1. Haz cambios en los archivos
# 2. El navegador recarga automáticamente (si usas Vercel)
# 3. Abre DevTools: F12 → Console para ver errores
# 4. Cuando esté listo, commit:
git add .
git commit -m "feat: describe tu cambio"
git push origin main
```

---

## 🚀 Roadmap futuro

### v0.2 (Próximo)
- [ ] Autenticación de usuario (login/signup)
- [ ] Base de datos de clientes compartida (multi-user)
- [ ] Más integraciones de IA (Claude 3.5, GPT-4o)
- [ ] Exportar reportes (PDF, Excel)
- [ ] Notificaciones de tareas vencidas

### v0.3
- [ ] Calendario de proyectos
- [ ] Integración con Google Calendar
- [ ] Seguimiento de tiempo (time tracking)
- [ ] Facturas automáticas
- [ ] CRM básico

### v1.0 (Visión a largo plazo)
- [ ] App móvil (React Native)
- [ ] API pública para integraciones
- [ ] Marketplace de extensiones
- [ ] Team collaboration features
- [ ] Analytics avanzado

Ver [ROADMAP.md](docs/ROADMAP.md) completo.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

### Cómo contribuir

1. **Fork** el repositorio
2. Crea una rama: `git checkout -b feature/mi-mejora`
3. Haz tus cambios
4. Commit: `git commit -m "feat: describe tu cambio"`
5. Push: `git push origin feature/mi-mejora`
6. Abre un **Pull Request**

### Pautas

- Código limpio y comentado
- Una feature por PR
- Incluir descripción clara
- Probar localmente antes de enviar

Ver [CONTRIBUTING.md](docs/CONTRIBUTING.md) para detalles.

---

## 📚 Recursos

### Documentación

- [ROADMAP.md](docs/ROADMAP.md) — Plan de desarrollo
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) — Guía de contribución
- [COMMANDS.md](docs/COMMANDS.md) — Referencia de comandos
- [schema.sql](database/schema.sql) — Modelo de datos

### API Providers

- [Google Gemini Docs](https://ai.google.dev/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com)
- [OpenAI API Docs](https://platform.openai.com/docs)

### Tutorials relacionados

- [Supabase Getting Started](https://supabase.com/docs/guides/getting-started)
- [Building with Vanilla JS](https://www.freecodecamp.org/news/vanilla-javascript-tutorial/)

---

## 💬 Comunidad

- **Issues:** Reporta bugs y sugiere features
- **Discussions:** Conversa con otros usuarios
- **GitHub:** [andrespoa/freelance-ai-assistant](https://github.com/andrespoa/freelance-ai-assistant)

---

## 📄 Licencia

Apache License 2.0 — Usa, modifica y distribuye libremente con atribución.

```
Copyright 2026 Andrés Poa
Licensed under the Apache License, Version 2.0
```

---

## 🙏 Créditos y Agradecimientos

Construido con:
- [Supabase](https://supabase.com) — Backend abierto
- [Google AI](https://ai.google.dev/) — Gemini API gratis
- [Anthropic Claude](https://www.anthropic.com/) — API de IA
- [OpenAI](https://openai.com/) — GPT models
- [Google Fonts](https://fonts.google.com/) — DM Serif + DM Sans

Inspirado en:
- Mejoras de UX en herramientas modernas
- Necesidades reales de freelancers
- Open source community

---

## 💡 ¿Tienes preguntas?

Abre un [Issue](https://github.com/andrespoa/freelance-ai-assistant/issues) o envía un email.

---

**¡Hecho con ❤️ para freelancers empoderados por IA!**
