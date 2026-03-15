# Guía de Contribución

## Flujo de trabajo

1. Asigna el issue o tarea que vayas a trabajar
2. Crea un branch: `git checkout -b feature/nombre-descriptivo`
3. Haz commits pequeños y descriptivos
4. Abre un Pull Request en Draft mientras trabajas
5. Cuando esté listo, cambia a "Ready for Review"
6. Espera al menos 1 revisión antes de hacer merge

## Estándares de código

- Comenta el "por qué", no el "qué" (el código ya dice qué hace)
- Funciones de máximo 30 líneas (si son más, refactoriza)
- Nombres en español para variables de dominio (cliente, tarea, proyecto)
- Nombres en inglés para código técnico (handler, callback, render)

## Reportar bugs

Usa el template de Issues en GitHub con:
- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Capturas de pantalla si aplica
- Navegador y sistema operativo
