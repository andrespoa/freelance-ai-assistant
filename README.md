# ⬡ Freelance AI Assistant

> Chatbot inteligente para freelancers · Gestiona clientes, proyectos y tareas con IA

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Licencia](https://img.shields.io/badge/licencia-Apache%202.0-green)
![Versión](https://img.shields.io/badge/versión-0.1.0-blue)
![Discord](https://img.shields.io/discord/1234567890?logo=discord)
![Sponsors](https://img.shields.io/github/sponsors/cr1085?logo=github)

---

## 📌 ¿Qué es esto?

**Freelance AI Assistant** es un chatbot web que actúa como tu asistente personal de negocio. Le hablas en lenguaje natural y te ayuda a:

- Responder preguntas sobre tus clientes, proyectos y tareas
- Gestionar clientes (crear, buscar, actualizar)
- Hacer seguimiento de proyectos
- Crear y gestionar tareas con prioridades
- Guardar el historial completo de conversaciones
- Ejecutar acciones automáticamente (crear una tarea solo diciéndoselo)

**Sin servicios de pago obligatorios.**
**Demo live**: [cr1085.github.io/asistente-freelance](https://cr1085.github.io/asistente-freelance)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   NAVEGADOR (Frontend)               │
│                                                      │
│  index.html ← estructura visual                      │
│  styles.css ← diseño dark editorial                  │
│  config.js  ← variables de entorno del cliente       │
│  supabaseClient.js ← capa de datos                   │
│  aiService.js ← abstracción de proveedores IA        │
│  chat.js    ← lógica del chat                        │
│  app.js     ← navegación y controlador principal     │
└───────────────────────┬─────────────────────────────┘
                        │ fetch / REST
          ┌─────────────┴──────────────┐
          │                            │
   ┌──────▼──────┐              ┌──────▼──────┐
   │  Supabase   │              │  AI Provider │
   │  PostgreSQL │              │  Claude/GPT  │
   │  Auth + API │              │  (o Mock)    │
   └─────────────┘              └─────────────┘
```

**Stack:**
- Frontend: HTML + CSS + JavaScript vanilla (sin frameworks)
- Base de datos: Supabase (PostgreSQL + Auth + API REST)
- IA: Anthropic Claude, OpenAI GPT, o Mock local

---

## 📂 Estructura del repositorio

```
freelance-ai-assistant/
│
├── frontend/
│   ├── index.html               # Estructura HTML principal
│   ├── css/
│   │   └── styles.css           # Estilos (dark theme, responsive)
│   └── js/
│       ├── config.js            # Variables de configuración
│       ├── supabaseClient.js    # Capa de datos (Supabase)
│       ├── aiService.js         # Servicio de IA (multi-proveedor)
│       ├── chat.js              # Módulo del chat
│       └── app.js               # Controlador principal + secciones
│
├── database/
│   └── schema.sql               # Script SQL completo para Supabase
│
├── docs/
│   ├── ROADMAP.md               # Plan de desarrollo
│   └── CONTRIBUTING.md          # Guía de contribución
│
└── README.md                    # Este archivo
```

---

## 🚀 Instalación rápida (5 minutos)

### Opción A: Abrir directo en el navegador

```bash
# Clona el repositorio
git clone https://github.com/tu-usuario/freelance-ai-assistant.git
cd freelance-ai-assistant

# Abre index.html en tu navegador
open frontend/index.html
# o en Windows:
start frontend/index.html
```

Esto abrirá la app en **modo demo** (proveedor Mock — sin API key). Funciona para explorar la UI.

### Opción B: Servidor local (recomendado)

```bash
# Con Python
python3 -m http.server 8080 --directory frontend

# Con Node.js (npx)
npx serve frontend -p 8080

# Luego abre: http://localhost:8080
```

---

## ⚙️ Configuración

### 1. Conectar Supabase

#### Paso 1: Crea tu proyecto en Supabase
1. Ve a [https://app.supabase.com](https://app.supabase.com) y crea una cuenta gratuita
2. Crea un nuevo proyecto (dale un nombre, elige región cercana)
3. Espera ~2 minutos a que el proyecto esté listo
contraseña: 0Oq8v0YfCBqWd61j

#### Paso 2: Ejecuta el schema SQL
1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Copia todo el contenido de `database/schema.sql`
3. Pégalo en el editor y presiona **Run**
4. Verifica que no haya errores (deberías ver "Success. No rows returned.")

#### Paso 3: Obtén las credenciales
1. Ve a **Settings → API** en tu proyecto de Supabase
2. Copia:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Paso 4: Configura la app
1. Abre la app en el navegador
2. Haz clic en **⚙ Configuración** (esquina inferior izquierda)
3. Pega la URL y la Anon Key de Supabase
4. Guarda

### 2. Conectar un proveedor de IA

#### Claude (Anthropic)
1. Crea cuenta en [https://console.anthropic.com](https://console.anthropic.com)
2. Ve a **API Keys** y genera una nueva key
3. En la app, ve a ⚙ Configuración:
   - Proveedor: **Anthropic Claude**
   - API Key: tu key (`sk-ant-...`)

> ⚠ **Nota importante:** Por restricciones CORS, las APIs de IA no pueden ser llamadas directamente desde el navegador en producción. Para un entorno de producción real, necesitas un backend proxy (ver sección "Despliegue avanzado" más abajo).

#### OpenAI GPT
1. Crea cuenta en [https://platform.openai.com](https://platform.openai.com)
2. Ve a **API Keys** y genera una nueva key
3. En la app, configurar:
   - Proveedor: **OpenAI GPT**
   - API Key: tu key (`sk-...`)

#### Mock (sin API key)
Selecciona **Mock** en el proveedor. La IA dará respuestas de ejemplo, útil para desarrollo de UI.

---

## 🌐 Despliegue

### GitHub Pages (estático, gratis)

```bash
# 1. Sube el repositorio a GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/freelance-ai-assistant.git
git push -u origin main

# 2. En GitHub, ve a Settings → Pages
# 3. Source: Deploy from a branch → main → /frontend
# 4. Tu app estará en: https://tu-usuario.github.io/freelance-ai-assistant
```

### Vercel (recomendado)

```bash
# 1. Instala Vercel CLI
npm i -g vercel

# 2. Desde la carpeta frontend/
cd frontend
vercel

# Sigue las instrucciones.
# Vercel detectará automáticamente que es un sitio estático.
```

### Netlify

1. Arrastra la carpeta `frontend/` a [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. ¡Listo! Tu app estará online en segundos.

### Despliegue avanzado con proxy (para producción real)

Para llamadas a la API de IA en producción, necesitas un proxy que oculte tu API key. Opciones:


---


## 🛡️ Seguridad

**Lo que hace esta app:**
- Las credenciales se guardan en `localStorage` del navegador (solo en tu dispositivo)
- Nunca se envían a ningún servidor nuestro
- El código es completamente open source y auditable

**Lo que NO debes hacer en producción:**
- Nunca subas API keys a un repositorio público
- No uses tu API key de producción en demos públicas
- En producción real: usa un backend proxy serverless (ver arriba)

**Variables de entorno (para desarrollo local):**
```bash
# Crea un archivo .env (nunca lo subas a Git)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📋 Comandos de la IA

La IA reconoce estos comandos especiales:

| Comando | Descripción |
|---------|-------------|
| `/tarea [descripción]` | Crea una nueva tarea |
| `/cliente [nombre]` | Busca o crea un cliente |
| `/proyecto [nombre]` | Busca o crea un proyecto |
| `/recordatorio [fecha] [mensaje]` | Crea un recordatorio |

También puedes hablarle en lenguaje natural:
- *"Crea una tarea urgente para revisar el contrato de Ana"*
- *"¿Cuáles son mis proyectos activos?"*
- *"Agrega al cliente Carlos López de la empresa Tech SA"*

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Consulta `docs/CONTRIBUTING.md` para la guía completa.

Pasos básicos:
```bash
# 1. Fork del repo
# 2. Crea una rama
git checkout -b feature/mi-mejora

# 3. Haz tus cambios
# 4. Commit con mensaje descriptivo
git commit -m "feat: agrega filtro de tareas por proyecto"

# 5. Pull Request a main
```

---

## 📄 Licencia

MIT — Usa, modifica y distribuye libremente con atribución.

---

## 🙏 Créditos

Construido con:
- [Supabase](https://supabase.com) — Base de datos y API
- [Anthropic Claude](https://anthropic.com) / [OpenAI](https://openai.com) — IA
- [Google Fonts](https://fonts.google.com) — DM Serif Display + DM Sans
