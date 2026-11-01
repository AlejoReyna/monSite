# Prompt reutilizable de auditoría

Copia el siguiente bloque a cualquier modelo con acceso al repositorio. Si el modelo no tiene acceso, proporciónale los archivos y resultados necesarios; debe declarar lo que no puede verificar.

```text
Audita la implementación del MCP que permite a una IA con visión jugar al emulador Game Boy de este repositorio.

Repositorio esperado: /Users/alexis_reyna/MyCode/monSite
Si el checkout está en otra ruta, utiliza su raíz real y regístrala.

Lee primero AGENTS.md y las instrucciones aplicables. Después lee íntegramente:
docs/gameboy-mcp-verification-matrix.md

La matriz es el contrato de aceptación. Evalúa todos sus IDs V01–V33, sin sustituirla por criterios propios ni reducir requisitos para aprobar. Si falta ese archivo, informa el bloqueo; no reconstruyas una supuesta matriz de memoria.

Tu tarea es auditar y guardar el informe, no implementar ni corregir código. No cambies la matriz ni este prompt. No instales dependencias, actualices lockfiles, borres cachés, hagas commits o despliegues. Si una comprobación necesita modificar archivos funcionales, describe lo requerido y déjala pendiente.

CONTEXTO
El proyecto usa Next.js, React, TypeScript y EmulatorJS. Busca la implementación real; no asumas que existe por lo dicho en una conversación o README.
Puntos iniciales de inspección:
- src/components/v2/gameboy-player.tsx
- public/gameboy/bridge.js
- public/gameboy/backups.js
- public/gameboy/cartridge.js
- src/lib/gameboy/
- scripts/test-gameboy.mjs
- package.json y lockfile
- archivos y documentación MCP añadidos

El MVP previsto usa MCP por stdio y un puente WebSocket local emparejado con una pestaña. Un cliente externo con visión decide qué hacer. Herramientas mínimas: get_status, observe, act, wait y stop. El caso inicial es Pokémon Gold.

AUTORIZACIÓN Y RECURSOS
Este prompt autoriza inspección, pruebas acotadas sin listeners, comprobaciones estáticas y escritura del informe.
No autoriza servidores, previews, builds, procesos de escucha ni pruebas de navegador que los requieran. No interpretes “verifica todo” como permiso para iniciarlos. Si existe autorización explícita adicional en la sesión, respétala dentro de su alcance y regístrala.
Para Next.js, cuando su arranque esté autorizado, utiliza exclusivamente npm run dev -- --allow-server. No arranques copias concurrentes.
Ejecuta verificaciones de una en una con heap de Node limitado; inspecciona los scripts antes de ejecutarlos para detectar arranques indirectos. Excluye node_modules, .next y .git de búsquedas recursivas. No ejecutes pruebas de carga.

PROCEDIMIENTO
1. Registra fecha, raíz, revisión Git, estado del checkout, instrucciones y autorizaciones. No atribuyas cambios preexistentes al trabajo de auditoría.
2. Lee la matriz completa. Localiza las implementaciones, esquemas, tests y documentación que respaldan cada fila.
3. Traza el flujo completo: cliente MCP → puente → host → iframe → controles/captura → respuesta. Revisa especialmente las rutas de fallo y el orden real de liberación, pausa y captura.
4. Inspecciona pruebas existentes y ejecuta solo las relevantes y autorizadas, secuencialmente. Usa scripts del proyecto cuando sean apropiados. No declares aprobado algo basándote solo en nombres de tests o comentarios.
5. Contrasta firmas/capacidades de dependencias con versiones instaladas y, si necesitas consultar documentación externa, usa fuentes oficiales correspondientes a esas versiones. No uses APIs de otra versión como prueba de compatibilidad.
6. Realiza verificaciones reales únicamente cuando estén autorizadas y sean posibles. Protege partidas personales; no sobrescribas ni restaures una partida del usuario para probar. Utiliza una sesión de prueba aislada y respaldada. No descargues ROMs como parte de la auditoría.
7. Evalúa cada ID con CUMPLE, FALLA, NO VERIFICADO o NO APLICA, siguiendo exactamente la matriz. Distingue evidencia estática, tests simulados y ejecución real. Si una fila tiene varios niveles y falta alguno, no la marques CUMPLE.
8. Guarda el informe en docs/gameboy-mcp-verification-report.md. Si ya existe, conserva el anterior y crea otro con sufijo de fecha/hora. No copies tokens, ROMs, partidas privadas ni secretos al informe.

INFORME OBLIGATORIO
- Dictamen APROBADO, RECHAZADO o INCOMPLETO, conforme a la matriz.
- Entorno, revisión, autorizaciones y alcance efectivo.
- Tabla completa V01–V33: estado, nivel de evidencia, archivo/línea o comando, resultado observado y corrección/pendiente.
- Hallazgos ordenados por prioridad con reproducción concreta y consecuencia.
- Comandos ejecutados y sus resultados/códigos de salida.
- Comprobaciones no ejecutadas y motivo exacto; incluye procedimiento para completarlas.
- Límites de las conclusiones: una integración funcional no demuestra que la IA termine un juego.

No inventes evidencias, mediciones, referencias ni resultados. No transformes falta de autorización en fallo del producto. No marques funcionalidades requeridas ausentes como NO APLICA. Si faltan herramientas o acceso al repositorio, declara lo que no puedes verificar y no emitas una aprobación.

En tu respuesta final enlaza el informe y resume dictamen, fallos principales y validaciones pendientes. No realices reparaciones sin una petición posterior del usuario.
```
