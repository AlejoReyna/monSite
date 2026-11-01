# Matriz de verificación: IA jugando mediante MCP

Esta matriz es el contrato de evaluación del MVP solicitado. No certifica que esté implementado. Se limita al emulador Game Boy; el agente con visión se ejecuta en un cliente MCP externo. Caso inicial: Pokémon Gold.

## Cómo evaluar

Evalúa cada ID sin omitir filas. Estados permitidos:

- **CUMPLE**: evidencia suficiente para todos los requisitos de la fila.
- **FALLA**: evidencia de incumplimiento; incluye reproducción o referencia precisa.
- **NO VERIFICADO**: falta evidencia o la ejecución necesaria no está autorizada.
- **NO APLICA**: únicamente con una razón comprobable; no sirve para excluir funcionalidades requeridas. La fila V33 es opcional.

Niveles de evidencia: **E** = inspección estática, **T** = prueba automatizada, **R** = ejecución real con navegador, emulador y cliente MCP. Una prueba simulada no sustituye R. Cuando una fila requiere varios niveles, registra el resultado por nivel; el estado total es NO VERIFICADO si falta alguno y no se ha demostrado un fallo.

Prioridad **P0**: seguridad, integridad o función esencial. **P1**: requisito del MVP. **P2**: extensión opcional. No calcules una puntuación que oculte fallos P0/P1.

## Criterios

| ID | Prioridad | Criterio de aceptación | Evidencia requerida |
|---|---|---|---|
| V01 | P0 | Se respetan AGENTS.md y los cambios previos del usuario; no se arrancan servidores, previews, listeners ni builds sin autorización expresa. | E: instrucciones, diff y registro de comandos de esta auditoría; no certificar ejecuciones históricas desconocidas. |
| V02 | P1 | El alcance es Game Boy; un cliente externo aporta el modelo con visión. No se exige una API key de IA en la web. | E: dependencias, configuración y recorrido de integración. |
| V03 | P0 | MCP funciona por stdio y los logs propios van a stderr; stdout contiene solo tráfico del protocolo. | E + T: arranque/protocolo con transporte simulado o subprocess sin listeners; R: cliente compatible descubre herramientas. |
| V04 | P0 | El puente WebSocket escucha solo en loopback y valida Origin mediante una lista explícita; rechaza orígenes ausentes, malformados y no autorizados según política documentada. | E + T: binding y matriz de orígenes aceptados/rechazados. |
| V05 | P0 | Emparejamiento con token temporal impredecible, caducidad y revocación; no aparece en URLs ni logs. No se controla un juego antes de su activación explícita. | E + T: token válido, inválido, vencido y revocado; R: emparejamiento. |
| V06 | P0 | Solo un controlador y una sesión activa; cambiar juego, recargar o recrear iframe invalida órdenes anteriores. | E + T: competidores, reconexión y sesión antigua. |
| V07 | P0 | postMessage valida origen, ventana emisora, sesión y estructura; los mensajes inválidos no llegan a controles del juego. | E + T: pruebas negativas de cada validación. |
| V08 | P0 | get_status informa conexión, juego, plataforma, sesión, pausa y disponibilidad; la desconexión no se representa como éxito disponible. | E + T + R: estados conectado, cargando y desconectado. |
| V09 | P0 | observe devuelve contenido de imagen MCP válido y metadatos de sesión/captura; el cliente entrega la imagen al modelo. | E + T: MIME y bytes decodificables; R: imagen visible en cliente con visión. |
| V10 | P0 | La captura contiene únicamente la pantalla actual del juego, es legible y está sincronizada; errores o imágenes vacías no se presentan como observación válida. | E + T: error de captura; R: imagen antes/después de una acción y revisión visual. |
| V11 | P1 | Capturas a demanda con tamaño acotado, sin vídeo continuo ni exportación de partida por cada captura. | E + T: límites y separación captura/guardado. |
| V12 | P0 | act valida botones, tipos y duración finita acotada; rechaza combinaciones contradictorias y entradas desconocidas. | E + T: límites, NaN/infinito en interfaces internas, duraciones negativas y botones inválidos. |
| V13 | P0 | act reanuda, pulsa, espera, suelta, pausa y captura en ese orden; responde con imagen y estado. No promete frames exactos sin soporte verificado. | E + T: secuencia y fallos intermedios; R: movimiento real y pausa posterior. |
| V14 | P0 | wait avanza sin botones por un intervalo validado, pausa y devuelve imagen/estado. | E + T + R: avance de animación o diálogo sin entrada. |
| V15 | P0 | stop es idempotente y prioritario: cancela acción actual, vacía cola, suelta botones y pausa sin esperar a finalizar la duración original. | E + T: stop durante act, wait y cola ocupada; R: parada durante movimiento. |
| V16 | P0 | Cola acotada y ejecución serial; peticiones repetidas no duplican acciones. Se define el alcance y caducidad de la deduplicación y qué sucede ante resultado incierto. | E + T: concurrencia, duplicados en curso/completados y reintentos. |
| V17 | P0 | Errores, timeout, cancelación o desconexión liberan botones y pausan; resultados tardíos no reanudan una sesión detenida. | E + T: fallos inyectados en cada fase; R: desconexión durante act. |
| V18 | P0 | Ocultar pestaña, cerrar iframe, cambiar ROM o desmontar componente cancela trabajo y limpia timers/listeners; no quedan órdenes huérfanas. | E + T: eventos de ciclo de vida; R: ocultar y reabrir pestaña. |
| V19 | P0 | “Tomar control” cancela inmediatamente la IA, libera botones y devuelve control manual; la IA no recupera control sin reactivación explícita. | E + T + R: entrada manual tras cancelación y rechazo de orden posterior. |
| V20 | P1 | UI ES/EN coherente con el proyecto: conexión, desconexión, emparejamiento, estado, última acción y toma de control. | E + R: ambos idiomas y estados principales. |
| V21 | P0 | Antes de la primera acción IA se conserva un respaldo recuperable cuando el juego lo permite; un fallo impide continuar silenciosamente. La IA no sobrescribe ese respaldo inicial. | E + T: orden respaldo/acción, fallo y guardados posteriores; R: respaldo de Pokémon Gold y recuperación en sesión de prueba. |
| V22 | P0 | Guardados normales y restauración siguen funcionando; se distingue SRAM, estado instantáneo e imagen. Se valida identidad de ROM/motor al restaurar cuando corresponde. | E + T: regresiones y respaldo incompatible; R: restauración controlada sin poner en riesgo la partida personal. |
| V23 | P1 | Sin activar IA, controles, pausa, audio y partidas mantienen su comportamiento; no se conecta automáticamente ni crea otro emulador. | E + T + R: juego manual y una sola instancia. |
| V24 | P1 | Se reutiliza el adaptador de EmulatorJS fijado en el proyecto sin depender de internals prohibidos o APIs inventadas. | E: puntos de integración y evidencia de capacidades reales. |
| V25 | P0 | No se exponen shell, evaluación arbitraria de JavaScript, lectura arbitraria de archivos ni herramientas ajenas al juego. | E + T: esquemas cerrados y rechazo de entradas adicionales peligrosas. |
| V26 | P1 | SDK/dependencias compatibles, lockfile coherente, scripts y configuración utilizables; no se añade infraestructura remota al MVP. | E + comprobaciones estáticas disponibles. |
| V27 | P1 | Los tests cubren validación, cola, deduplicación, cancelación, sesiones, desconexión, captura, respaldo y regresiones mediante aserciones de comportamiento. | E + T: comandos, resultados y fallos exactos; ejecutar secuencialmente con heap limitado. |
| V28 | P1 | Se documentan restricciones HTTPS/localhost, Origin y acceso a red local sin desactivar protecciones; se distingue soporte demostrado de soporte previsto. | E + R: al menos un entorno documentado probado; otros entornos quedan NO VERIFICADOS. |
| V29 | P1 | Documentación incluye instalación, comando MCP, configuración stdio con rutas reales, emparejamiento, límites, respaldo y recuperación, parada y solución de errores. | E: verificar ejemplos contra archivos/scripts reales. |
| V30 | P1 | Guía del agente exige visión, acciones cortas, revisión del resultado, límite de acciones/tiempo y parada ante falta de progreso. | E: prompt o guía reutilizable. |
| V31 | P0 | Prueba integral: descubrir herramientas, emparejar, observar, actuar en Pokémon Gold, observar cambio, detener y recuperar control manual. | R: registro con objetivo corto, imágenes y resultados; ningún mock sustituye esta prueba. |
| V32 | P1 | Operación acotada: un emulador, sin vídeo continuo, colas/historial con límites y limpieza al desconectar; se reportan mediciones disponibles sin afirmar límites totales de RAM basados solo en heap. | E + T: límites/limpieza; R: observación de recursos durante sesión corta. |
| V33 | P2 | Si se implementan checkpoints MCP, validan ROM y motor, conservan respaldo inicial y manejan fallo de restauración. | E + T + R si existe; NO APLICA si se difiere. |

## Formato del informe

Registra revisión/commit si está disponible, fecha, modelo evaluador, entorno, alcance, autorizaciones efectivas y cambios locales preexistentes. Para cada fila utiliza:

| ID | Estado | Evidencia E/T/R | Archivo y línea / comando | Resultado observado | Pendiente o corrección |
|---|---|---|---|---|---|

Incluye comandos exactos, códigos de salida y evidencias suficientes sin tokens, ROMs ni partidas privadas. No inventes números de línea, capturas, mediciones o resultados.

Dictamen:
- **APROBADO**: todas las filas P0/P1 cumplen con sus niveles requeridos.
- **RECHAZADO**: existe al menos una fila P0/P1 que falla.
- **INCOMPLETO**: no hay fallos demostrados P0/P1, pero falta verificar al menos una.

Si hay fallos y evidencia pendiente, el dictamen es RECHAZADO y se enumeran también los pendientes. La ausencia de autorización para ejecución real deja esas evidencias pendientes; no es un fallo del producto. Una implementación ausente sí es FALLA, no NO APLICA. Una prueba integral exitosa no garantiza que la IA complete el juego.
