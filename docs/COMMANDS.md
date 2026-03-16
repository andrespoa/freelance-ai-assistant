# Especificación de comandos del chat

Este documento describe la gramática, uso y API del parser de comandos implementado en `frontend/js/commands.js`.

## Objetivo

Permitir que el usuario ejecute acciones directamente desde el chat mediante comandos con prefijo `/`, por ejemplo crear tareas, clientes o proyectos. El parser normaliza la entrada y la aplicación decide la acción a ejecutar.

## Gramática mínima

- Prefijo: `/`
- Comando: palabra (p. ej. `tarea`, `cliente`, `proyecto`)
- Argumentos posicionales: texto libre, soporta comillas `"..."` o `'...'` para incluir espacios
- Opciones: `--clave=valor` (p. ej. `--due=2026-03-20`, `--priority=high`)

Ejemplo de entrada válida:

```
/tarea "Revisar contrato" --due=2026-03-20 --priority=high
/cliente Empresa Ejemplo
/proyecto "Rediseño web" --priority=low
```

## Salida del parser

La función `parseCommand(text)` retorna uno de los siguientes valores:

- `null` — no es un comando (no empieza por `/`)
- `{ command: 'create_task', data: { ... } }` — comando válido y normalizado
- `{ command: 'create_client', data: { ... } }`
- `{ command: 'create_project', data: { ... } }`
- `{ command: 'invalid', error: 'missing_title' }` — comando con formato inválido
- `{ command: 'unknown' }` — comando no reconocido por el parser

Ejemplo de output para el input anterior:

```json
{
  "command": "create_task",
  "data": {
    "title": "Revisar contrato",
    "due_date": "2026-03-20",
    "priority": "high"
  }
}
```

## API del módulo

- `parseCommand(text: string) => object | null`
- `isCommand(text: string) => boolean`

El módulo expone estas funciones en `window` para integración sencilla con `chat.js`.

## Integración recomendada

- En `sendMessage()` de `chat.js`:
  - Llamar `parseCommand(text)` antes de enviar al proveedor de IA.
  - Si retorna una acción `create_*`, ejecutar la función CRUD correspondiente (`createTask`, `createClient`, `createProject`) y mostrar feedback inmediato en el chat (appendMessage + showToast).
  - Si retorna `unknown`, enviar el texto a la IA para su interpretación.
  - Si retorna `invalid`, mostrar un error legible en el chat sin llamar a la DB.

## Validación y seguridad

- Sanitizar strings antes de enviarlos a la base de datos.
- Validar formatos: fechas en `YYYY-MM-DD`, longitudes máximas para títulos y nombres.
- No ejecutar operaciones destructivas sin confirmación.
- En producción, no exponer claves en el frontend; usar un proxy/serverless.

## Migración local → remoto

- La app puede crear `conversation_id` locales (`local-...`) en modo demo. Cuando Supabase esté listo, `chat.js` debe crear la conversación real y migrar mensajes pendientes.
- Opcional: persistir el mapeo `localId -> remoteId` en `localStorage` para sobrevivir recargas.

## Tests sugeridos

- Unitarios para `parseCommand()`:
  - Comando `/tarea` con y sin opciones.
  - Comillas y escapes.
  - Opciones inválidas → `invalid`.
  - Comando desconocido → `unknown`.
- Integración: simular `/tarea` y verificar que `createTask` es llamado y la UI muestra la respuesta.

## Criterios de aceptación (DoD)

- Parser reconoce los comandos definidos y devuelve un objeto normalizado.
- Comandos válidos crean recursos en Supabase cuando la app está conectada.
- Comandos inválidos muestran mensajes de error sin romper la app.
- Tests unitarios cubren los casos básicos y edge cases.

## Extensiones futuras

- Añadir subcomandos (p. ej. `/tarea list --status=pending`).
- Añadir más opciones y alias (`-p` para priority).
- Soporte para confirmaciones interactivas y edición de comandos previos.

Fin de especificación - Día 5
