# IA con visión para la consola Game Boy (MCP local)

Implementación del 2026-10-16. Un cliente MCP externo (por ejemplo Claude Desktop
o Claude Code) con un modelo con visión observa la pantalla del emulador, pulsa
botones, deja avanzar el juego y vuelve a observar. El sitio no contiene ningún
proveedor de IA ni pide claves: el ciclo de decisión ocurre en el cliente MCP.

**Estado:** implementación, pruebas automáticas y documentación completas. No se ha
iniciado Next, el proceso MCP, ningún navegador ni ningún puerto. Las pruebas usan
adaptadores simulados. Que el juego responda de extremo a extremo con EmulatorJS
real sigue **pendiente de la validación manual autorizada** descrita al final.

## Arquitectura

```text
Cliente MCP (modelo con visión)
   │  stdio: JSON-RPC MCP (stdout reservado; registros solo en stderr)
   ▼
scripts/gameboy-mcp.mjs  (Node, un proceso)
   ├─ servidor MCP: get_status, observe, act, wait, stop
   └─ puente WebSocket  ws://127.0.0.1:41887/gameboy-ai   (solo loopback)
            │  Origin permitido + código de emparejamiento + subprotocolo
            ▼
Página del juego (host React)  src/lib/gameboy/ai-link.ts
            │  postMessage existente, validado por origen, ventana y sesión
            ▼
iframe /gameboy/frame.html  bridge.js + ai-player.js  →  EmulatorJS 4.2.3
```

| Archivo | Responsabilidad |
| --- | --- |
| `scripts/gameboy-mcp.mjs` | Punto de entrada: redirige `console.*` a stderr y llama a `main`. |
| `scripts/gameboy-mcp/main.mjs` | Configuración, puente, servidor loopback, MCP por stdio y apagado ordenado. |
| `scripts/gameboy-mcp/tools.mjs` | Herramientas MCP con esquemas JSON estrictos, imágenes PNG y errores legibles. |
| `scripts/gameboy-mcp/bridge.mjs` | Núcleo del puente: emparejamiento, una pestaña, una sesión, cola, idempotencia, timeouts, `stop` prioritario, presupuesto y control condicionado al respaldo. |
| `scripts/gameboy-mcp/server.mjs` | HTTP/WebSocket sobre `ws`: valida método, ruta exacta, Host, Origin y subprotocolo antes del handshake. |
| `scripts/gameboy-mcp/png.mjs` | PNG sin pérdidas (indexado si hay ≤ 256 colores) y escalado entero por vecino más cercano. |
| `scripts/gameboy-mcp/backups.mjs` | Validación y escritura única de los respaldos iniciales. |
| `scripts/gameboy-mcp/config.mjs` | Opciones, variables de entorno y registro en stderr. |
| `public/gameboy/ai-protocol.js` | Constantes y validadores compartidos por Node, la página y el iframe. |
| `public/gameboy/ai-player.js` | Ejecutor dentro del iframe: capturas sincronizadas, pulsaciones y pausas. |
| `public/gameboy/bridge.js` | Integra el ejecutor con el puente postMessage existente. |
| `src/lib/gameboy/ai-link.ts` | Adaptador de la página: WebSocket, sesión activa, relevo de órdenes y respaldo previo. |
| `src/components/v2/gameboy-player.tsx` | Panel mínimo ES/EN: conectar, emparejar, estado, última acción y «Tomar control». |

El adaptador del iframe sigue sin tocar `EJS_emulator`, `GameManager` ni `Module`.
Pulsa con los mismos `KeyboardEvent` sintéticos que el host, pausa y reanuda con los
botones nativos ocultos de EmulatorJS, y solo lee el elemento `<canvas>` del DOM. Para
saber si el buffer WebGL se conserva consulta `getContextAttributes()` del contexto ya
creado (solo después del arranque, cuando `getContext` devuelve el existente y no crea
otro).
Se comprobó en el código fijado que el botón de pausa llama a `toggleMainLoop(0)` de
forma síncrona y que el core importa `emscripten_pause_main_loop`/`resume_main_loop`.

## Dependencias

| Paquete | Versión | Motivo |
| --- | --- | --- |
| `@modelcontextprotocol/server` | 2.3.1 (exacta, devDependency) | SDK oficial v2, la línea estable recomendada por su documentación actual. Con `StdioServerTransport` habla el protocolo de la era 2025 y negocia con clientes que piden 2024-11-05, 2025-06-18 o 2025-11-25 (probado en memoria). |
| `ws` | 8.22.0 (exacta, devDependency) | Servidor WebSocket sin dependencias. Node no incluye un servidor WebSocket. |

- Ninguno de los dos paquetes tiene scripts de instalación. El SDK incluye su propio ajv
  para validar los esquemas JSON (`fromJsonSchema`). El código del proyecto no usa zod.
- El SDK v2 exige `zod ^4.2`. npm lo anidó (`zod@4.6.7` dentro de
  `node_modules/@modelcontextprotocol/*`). El `zod@3.25.76` de la raíz, que usan
  `openai@4` (dependencia opcional de pares `^3.23.8`) y ESLint, no cambió.
- Se descartó `@modelcontextprotocol/sdk@1.32.1` (v1): sigue recibiendo correcciones al
  menos seis meses desde el 2026-07-27, pero arrastra express, hono, cors, jose y otros.
- Node ≥ 20 (exigido por el SDK). Probado con Node 24.21 (`/opt/homebrew/bin/node`).
- Son devDependencies porque solo las usa la herramienta local; el sitio desplegado no las importa.
- Instalación: ya están en `package.json` y `package-lock.json`. En un clon nuevo basta con
  `npm ci` (o `npm install`).

## Requisitos del cliente MCP

- Un **modelo con visión** y un cliente que entregue al modelo los bloques
  `{"type":"image","mimeType":"image/png"}` de los resultados de herramientas. Claude
  Desktop y Claude Code los entregan. Un cliente que solo muestre texto no sirve: la
  imagen nunca va como ruta, URL ni base64 dentro del texto.
- Transporte stdio. El cliente lanza el proceso; no hay que iniciarlo a mano.

## Configuración del proceso MCP

No uses `npm run` para lanzarlo: npm escribe su cabecera en stdout y corrompe MCP.
Usa `node` con ruta absoluta (Claude Desktop no hereda el `PATH` de la terminal).

| Opción | Variable de entorno | Valor por defecto |
| --- | --- | --- |
| `--port <1024-65535>` | `GAMEBOY_MCP_PORT` | `41887` |
| `--allow-origin <origen>` (repetible; sustituye la lista) | `GAMEBOY_MCP_ALLOWED_ORIGINS` (separados por comas) | `http://localhost:3000`, `http://127.0.0.1:3000` |
| `--backup-dir <ruta absoluta o ~/…>` | `GAMEBOY_MCP_BACKUP_DIR` | `~/.monsite-gameboy-mcp/backups` |
| `--max-actions <1-10000>` | `GAMEBOY_MCP_MAX_ACTIONS` | `200` por concesión de control |
| `--log-level error\|warn\|info\|debug` | `GAMEBOY_MCP_LOG_LEVEL` | `info` |
| `--help` | — | Muestra la ayuda en stderr y sale |

Los orígenes son `esquema://host[:puerto]` exactos, sin ruta ni barra final; `*` y
`null` se rechazan. La línea de órdenes tiene prioridad sobre las variables.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gameboy": {
      "command": "/opt/homebrew/bin/node",
      "args": [
        "--max-old-space-size=256",
        "/Users/alexis_reyna/MyCode/monSite/scripts/gameboy-mcp.mjs"
      ]
    }
  }
}
```

Reinicia Claude Desktop después de guardar. Los registros del proceso aparecen en
`~/Library/Logs/Claude/mcp-server-gameboy.log`.

`--max-old-space-size=256` solo limita el heap de JavaScript de V8; no es un límite de la
memoria total del proceso. No se ha medido el consumo real del proceso.

### Claude Code

```sh
claude mcp add gameboy -- /opt/homebrew/bin/node --max-old-space-size=256 /Users/alexis_reyna/MyCode/monSite/scripts/gameboy-mcp.mjs
```

Con otro puerto u origen, añade argumentos al final, por ejemplo
`--port 41900 --allow-origin http://localhost:3000`. Si cambias el puerto, escribe el
mismo en el campo «Puerto local» del panel.

Si otro proceso ya usa el puerto, el servidor MCP sigue respondiendo y `get_status`
informa `bridge.error: "port 41887 is already in use"`. Solo un proceso puede tener el
puente, así que solo hay un controlador.

## Abrir el juego y emparejar la pestaña

1. Con autorización expresa, inicia Next exclusivamente con
   `npm run dev -- --allow-server` y abre `http://localhost:3000/gba` en una ventana
   visible (no minimizada ni tapada del todo, con la pestaña en primer plano).
2. Pide al cliente MCP que llame a `get_status`. Sin pestaña emparejada devuelve
   `available: false`, el motivo y un código como `K7QM-3XPA`.
3. En la consola, abre el icono del robot («Control por IA»), escribe el código y pulsa
   **Conectar IA**. El panel solo aparece en páginas servidas desde `localhost`,
   `127.0.0.1` o `[::1]`, o con `?ai=1` en la URL. La página no intenta conectar hasta
   ese clic.
4. Inicia Pokémon Gold. Cuando sea jugable, pulsa **Permitir que la IA controle**. El
   puente guarda primero el respaldo inicial y solo entonces concede el control. El
   juego queda en pausa y aparece la etiqueta «AI» sobre la pantalla.
5. Para recuperar el control: **Tomar control** (barra o panel) o **Esc**. Cancela al
   instante la acción en curso, suelta los botones y deja el juego en pausa para que lo
   reanudes. Para volver a ceder el control hay que pulsar de nuevo «Permitir…», lo que
   guarda otro respaldo. **Desconectar IA** cierra la conexión.

El código tiene 8 caracteres sin ambigüedades (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, unas
2^39 combinaciones). Caduca a los 5 minutos y es de un solo uso. Cinco intentos fallidos
lo invalidan. Viaja solo en el primer mensaje del WebSocket, nunca en la URL, y no se
escribe en los registros. Pasa por el chat del cliente MCP, lo cual es aceptable porque
caduca enseguida y no sirve una segunda vez. Tras recargar la página hace falta un
código nuevo.

## Herramientas MCP

| Herramienta | Entrada | Resultado |
| --- | --- | --- |
| `get_status` | — | JSON: `available` y su motivo, puente y orígenes, código de emparejamiento si no hay pestaña, origen de la pestaña, `session` (`session_id`, juego, plataforma, `ready`, `paused`, `page_hidden`), `control` (`none`/`user`/`ai`), cola, acciones usadas, respaldo inicial, última acción y límites. No toca el juego. |
| `observe` | `scale?` (1-4) | Texto con metadatos y un bloque de imagen PNG. |
| `act` | `session_id`, `buttons`, `duration_ms`, `settle_ms?`, `request_id?`, `scale?` | Reanuda, pulsa, espera, suelta, deja correr `settle_ms`, pausa y captura. Devuelve metadatos e imagen. |
| `wait` | `session_id`, `duration_ms`, `request_id?`, `scale?` | Deja correr el juego sin botones, pausa y captura. |
| `stop` | — | Cancela la orden en curso, vacía la cola, suelta los botones y pausa. Es idempotente. |

No hay herramientas para cargar archivos o ROM, ejecutar órdenes de shell o
JavaScript, ni restaurar respaldos. Restaurar checkpoints por MCP queda para una
segunda fase.

Metadatos de cada captura: `session_id`, `capture_id` (`<sesión>:<n>`), `captured_at`,
juego y plataforma, `paused`, `frame_sha256` (16 hex del RGBA nativo),
`changed_since_previous_capture`, `unchanged_streak`, `uniform_color` (p. ej. `#ffffff`
en un fundido, para no confundirlo con un fallo), `capture_source`, `timing` medido,
la acción ejecutada, `actions_used`/`actions_limit`, `request_id` y `deduplicated`.

Los errores llegan como resultado `isError` con `{"error": {"code", "message", "hint"}}`.
Códigos: `invalid-argument`, `not-connected`, `no-session`, `not-ready`,
`stale-session`, `user-control`, `page-hidden`, `queue-full`, `cancelled`, `stopped`,
`timeout`, `interrupted`, `capture-failed`, `session-changed`, `disconnected`,
`budget-exhausted`, `request-id-conflict`.

## Capturas y sincronización con el render

- Solo se lee el canvas del juego: nunca el escritorio, ni el iframe completo, ni la
  exportación de partidas.
- El core dibuja desde `requestAnimationFrame` y su buffer WebGL puede borrarse tras
  presentarse. La captura se lee en un callback de animación encolado después del del
  emulador, que se vuelve a encolar al final de cada ciclo. En ese mismo callback se
  pulsa la pausa nativa. La imagen es exactamente el fotograma en el que el juego queda
  detenido.
- Se recorta el área centrada con la relación de aspecto nativa (160×144 GB/GBC,
  240×160 GBA) y se muestrea a resolución nativa sin suavizado. El servidor la escala
  ×3 (480×432) o ×2 (480×320 en GBA) por vecino más cercano. El parámetro `scale`
  admite de 1 a 4.
- El core no redibuja los fotogramas que no cambian (texto esperando A, menús quietos).
  Sin más, el buffer WebGL ya presentado se leía borrado (negro con ruido 0/1). Por eso,
  en páginas que ofrecen el panel (el iframe recibe `ai=1`), el puente pide
  `preserveDrawingBuffer: true` al crear contextos WebGL. Solo toca la API del navegador,
  igual que el seguimiento de `AudioContext`. Se comprobó con Pokémon Gold real:
  `drawingBuffer: "preserved"` y capturas correctas de pantallas quietas.
- Si aun así el fotograma leído es casi negro (todos los canales ≤ 3), se reintenta hasta
  dos fotogramas más. Una pantalla negra real se acepta y se marca como uniforme.
- `capture_source` indica el origen:
  - `live-frame`: el juego corría y se detuvo en ese fotograma.
  - `pause-frame`: la imagen tomada con la última pausa; observar no avanza el juego.
  - `preserved-buffer`: el contexto conserva su buffer y se lee en pausa.
  - `one-frame-advance`: el juego estaba en pausa sin captura sincronizada; avanza un
    solo fotograma para obtenerla.
- Falta de canvas, tamaño cero, contexto WebGL perdido o error al leer devuelven
  `capture-failed`, nunca una imagen. Las dimensiones y el tamaño se validan en el
  iframe, en la página y en Node.

## Límites, timeouts y cancelación

| Límite | Valor |
| --- | --- |
| Botones | `up down left right a b start select`; `l r` solo en GBA |
| Simultáneos | 1 a 3, sin repetir y sin direcciones opuestas (excluye el reinicio A+B+Start+Select) |
| `duration_ms` de `act` | 50-2000 |
| `settle_ms` | 0-2000; por defecto 250 |
| `duration_ms` de `wait` | 50-10000 |
| Cola | 1 orden en ejecución y 2 en espera; más devuelve `queue-full` |
| Presupuesto | 200 `act`/`wait` por concesión (`--max-actions`); `observe` no consume |

- Los tiempos son milisegundos reales mientras el emulador corre a velocidad normal. No
  hay avance exacto por fotogramas ni se anuncia: una pulsación de 100 ms son unos
  6 fotogramas, con variación. `timing` devuelve la duración medida.
- Cada orden tiene un timeout de duración + 5 s en el puente. Al vencer, el puente
  cancela, ordena detener (suelta botones y pausa) y vacía la cola. La página tiene un
  respaldo propio de 1,5 s más.
- `stop` no espera turno: cancela la orden en curso, vacía la cola, envía la parada a la
  página y espera hasta 3 s la confirmación (`confirmed`, `paused`). Repetirlo no pulsa
  nada. Si el usuario tiene el control, no pausa su partida.
- Cancelar la llamada MCP desde el cliente (`notifications/cancelled`) cancela la orden
  en el navegador y pausa.
- Cualquier fallo de una orden cancela las que esperaban: se planearon sobre un estado
  que no ocurrió.
- `request_id` hace idempotentes `act` y `wait`. Repetir el mismo id devuelve el primer
  resultado (`deduplicated: true`) sin volver a pulsar, tanto si sigue en curso como si
  terminó. Usarlo con otros parámetros devuelve `request-id-conflict`. Alcance: el
  proceso MCP recuerda los últimos 64 ids mientras vive, en todas las sesiones (la huella
  incluye `session_id`). Al reiniciar el proceso se olvidan, pero las órdenes antiguas ya
  no valdrían por el `session_id`.
- Resultado incierto (timeout, cancelación, desconexión): la orden se cancela y el juego
  queda en pausa. Repetir el mismo `request_id` devuelve el mismo error, no vuelve a
  pulsar. El agente debe llamar a `observe` y decidir con un id nuevo.
- La página (últimos 256) y el iframe (últimos 128) tampoco ejecutan dos veces el mismo id
  interno de orden.
- Los botones se sueltan en un `finally` ante cualquier error, timeout, cancelación,
  toma de control, pestaña oculta o cierre.

## Carreras y modo normal

- Mientras la IA controla, se ignoran el teclado, los controles táctiles, el botón de
  pausa y la superposición «En pausa · Continuar». Dentro del iframe se bloquean las
  teclas físicas. **Esc** equivale a «Tomar control».
- Perder el foco (por ejemplo, al escribir en el cliente MCP) no pausa ni suelta los
  botones de la IA; solo guarda la SRAM como antes. Ocultar o minimizar la pestaña
  interrumpe la orden (`page-hidden`) y pausa. Con la pestaña oculta se rechazan las
  órdenes.
- Volver a la biblioteca, cambiar de juego, recargar o cerrar el iframe cambia la sesión:
  lo pendiente falla con `session-changed` o `disconnected`, y las órdenes con un
  `session_id` anterior devuelven `stale-session`. Un juego nuevo necesita una nueva
  concesión y su propio respaldo.
- Si el puente se pierde, la página cancela la IA, el iframe suelta los botones y pausa,
  y el control vuelve al usuario.
- Con la IA desactivada nada cambia: mismos mensajes de teclado, pérdida de foco,
  visibilidad y pausa. Sin pulsar «Conectar IA» no se abre ninguna conexión. Las pruebas
  lo verifican.

## Respaldo inicial

- Antes de la primera orden de cada concesión, el iframe usa el guardado nativo del
  cartucho (el mismo de «Exportar respaldo», sin descarga). El puente valida la
  identidad de la ROM y escribe el archivo con permisos `0600` y la marca `wx`, así que
  nunca sobrescribe:
  `~/.monsite-gameboy-mcp/backups/<juego>/<fecha>-<concesión>.json`
  (`pokemon-gold/` para Gold; `rom-<sha256>/` para el resto).
- Los guardados posteriores dentro del juego siguen yendo a IndexedDB y al espejo de
  Gold como siempre, y nunca tocan estos archivos.
- Si falla (lectura del cartucho, validación o escritura), el panel muestra el error y la
  IA no recibe el control. Si falta el reloj verificado, el respaldo se marca como
  parcial y el panel lo indica.
- Recuperarlo: **Partida y respaldos → Importar respaldo →** el `.json` de esa carpeta
  **→ Restaurar y reiniciar**. Es el flujo existente: guarda la sesión actual, desmonta y
  restaura antes de arrancar.
- No es lo mismo que un estado instantáneo (`Exportar estado instantáneo`, memoria
  completa del emulador) ni que una captura PNG (solo la imagen). El respaldo inicial es
  la SRAM del cartucho más el reloj cuando existe.
- Los archivos no se borran solos. Para limpiar: `rm ~/.monsite-gameboy-mcp/backups/<juego>/<archivo>.json`.

## Seguridad del puente

- Escucha solo en `127.0.0.1` (TCP, `exclusive`). Las peticiones HTTP normales reciben
  404 vacío.
- Antes del handshake exige `GET`, la ruta exacta `/gameboy-ai` sin query, un `Host`
  `127.0.0.1:<puerto>` o `localhost:<puerto>` (contra DNS rebinding), un `Origin` de
  la lista y el subprotocolo `monsite-gameboy-ai.v1`.
- Una sola pestaña emparejada. Como máximo 2 sockets sin emparejar, con 10 s para
  saludar. Mensajes de hasta 4 MiB. Ping cada 15 s.
- Un solo cliente MCP por proceso (stdio) y un solo proceso por puerto. El control
  requiere una concesión explícita respaldada por un archivo guardado; el puente ignora
  reclamaciones de control sin respaldo.
- stdout solo transporta MCP. Los registros van a stderr sin códigos, capturas ni
  respaldos.

## Navegadores, localhost y HTTPS

| Página que abre la conexión | Chrome/Edge | Brave | Firefox | Safari |
| --- | --- | --- | --- | --- |
| `http://localhost:3000` o `http://127.0.0.1:3000` (desarrollo) | Previsto: loopback a loopback, sin aviso | Previsto: permite localhost desde páginas de localhost | Previsto | Previsto: sin contenido mixto |
| `https://gba.alexisrs.dev` u otro HTTPS (producción) | Requiere `--allow-origin` y conceder el permiso de red local («Apps en este dispositivo»). Los WebSockets a localhost quedaron sujetos a ese permiso (prueba para desarrolladores en Chrome 142; según notas secundarias, por defecto desde Chrome 147). Denegarlo es persistente | Requiere `--allow-origin` y conceder el permiso en `brave://settings/content/localhostAccess` | Requiere `--allow-origin`; Firefox 153+ puede pedir permiso de red local | **No soportado**: bloquea `ws://127.0.0.1` desde HTTPS como contenido mixto |

- Soportado para este MVP: el servidor de desarrollo local. «Previsto» significa que
  es la conducta documentada; ninguna celda se ha probado en un navegador real.
- Producción es experimental: el origen no está permitido por defecto y el panel solo
  aparece con `?ai=1`. No se desactiva ninguna protección. Soportar Safari en HTTPS
  exigiría `wss://` con un certificado local de confianza; queda fuera del MVP.
- No hay CSP en `next.config.ts` ni en el middleware que limite `connect-src`. Si se
  añadiera una, debería incluir `ws://127.0.0.1:41887` solo donde corresponda.
- Mantén la ventana visible: Chrome trata las ventanas tapadas por completo como ocultas
  y deja de animar.
- Otro dispositivo de la red local (`http://192.168.x.x:3000`) no puede usarlo: el puente
  solo escucha en loopback y ese origen no está permitido. Es intencionado.

Fuentes consultadas: [Chrome Local Network Access](https://developer.chrome.com/blog/local-network-access),
[LNA para WebSockets (blink-dev)](https://groups.google.com/a/chromium.org/g/blink-dev/c/4gx2y5jPGbU),
[WebKit 171934](https://bugs.webkit.org/show_bug.cgi?id=171934),
[contenido mixto en Safari](https://discussions.apple.com/thread/254087609),
[Firefox: permisos de red local](https://support.mozilla.org/en-US/kb/control-personal-device-local-network-permissions-firefox),
[Brave: permiso de localhost](https://brave.com/privacy-updates/27-localhost-permission/),
[SDK de TypeScript v2](https://github.com/modelcontextprotocol/typescript-sdk) y su
[guía de migración](https://ts.sdk.modelcontextprotocol.io/v2/migration/upgrade-to-v2).

## Detener todos los procesos

- En el navegador: **Tomar control**, **Esc**, **Desconectar IA** o cerrar la pestaña.
- Desde el agente: la herramienta `stop`.
- El proceso MCP termina al cerrar el cliente (stdin cerrado) o con SIGINT/SIGTERM/SIGHUP:
  avisa a la pestaña, cierra el puerto y sale en ≤ 2 s. Puedes quitarlo con
  `claude mcp remove gameboy` o borrando su entrada de `claude_desktop_config.json`.
- Comprobar que no queda nada: `lsof -nP -iTCP:41887 -sTCP:LISTEN` (sin salida = libre);
  si hiciera falta, `pkill -f scripts/gameboy-mcp.mjs`.
- Next: `Ctrl+C` en la terminal de `npm run dev -- --allow-server`.

## Guía breve para el agente

1. `get_status`. Si no hay pestaña, da el código al usuario y espera a que la conecte y
   conceda el control.
2. `observe` y describe en una frase lo que ves.
3. Elige **una** acción corta: `a` unos 100 ms para confirmar o avanzar texto; `b` para
   cancelar; `start` para el menú; en Pokémon, unos 270 ms de dirección por casilla
   (un toque de 50-80 ms puede solo girar al personaje). Usa `wait` para textos y
   transiciones.
4. `act` con el `session_id` vigente y un `request_id` nuevo. Revisa la imagen devuelta
   antes de decidir otra cosa.
5. Detente (`stop` y explica) si `unchanged_streak` llega a 3-5, si te pierdes, si
   aparece algo que podría sobrescribir la partida (no guardes salvo que te lo pidan), si
   recibes `budget-exhausted` o si el usuario toma el control. No intentes rodear un
   rechazo.
6. Fija un presupuesto propio inferior al del servidor (por ejemplo 40 acciones para el
   objetivo de prueba) y un límite de tiempo (por ejemplo 10 minutos), y repórtalos al
   terminar.

## Solución de problemas

| Síntoma o código | Causa probable y solución |
| --- | --- |
| Panel: «No se pudo conectar» | El proceso MCP no está en marcha (reinicia el cliente MCP), el puerto del panel no coincide con `--port`, el origen de la página no está en `--allow-origin` (el registro muestra `Refused a WebSocket upgrade (origin …)`), o el navegador bloqueó el acceso a localhost (ver la tabla de navegadores). |
| Panel: «Código incorrecto o caducado» | Pide otro `get_status`: el código dura 5 minutos, es de un solo uso y se anula tras 5 intentos. |
| Panel: «Otra pestaña ya está emparejada» | Desconecta la otra pestaña o ciérrala. |
| `get_status`: `bridge.error: port … is already in use` | Hay otro proceso del puente: `lsof -nP -iTCP:41887 -sTCP:LISTEN`; ciérralo o usa otro puerto en ambos lados. |
| `not-connected` / `no-session` / `not-ready` | Empareja la pestaña, inicia un juego o espera a que cargue. |
| `user-control` | El usuario no concedió el control o lo retomó. Hay que pulsar «Permitir que la IA controle». |
| `stale-session` / `session-changed` | Se recargó o cambió el juego: `observe` y usa el `session_id` nuevo. |
| `page-hidden` | La pestaña está oculta o minimizada: mantenla visible. |
| `interrupted` | Alguien pausó o tocó controles durante la orden (por ejemplo, abrió «Partida y respaldos»). `observe` y repite. |
| `capture-failed` | No hay canvas o se perdió WebGL. `observe` otra vez; si persiste, recarga la página. |
| `timeout` | El navegador no respondió a tiempo (pestaña congelada o en segundo plano). |
| `budget-exhausted` | Se agotó el presupuesto de la concesión: «Tomar control» y otra concesión, o `--max-actions`. |
| Respaldo inicial fallido | El panel muestra la causa (lectura del cartucho, validación o escritura en `--backup-dir`). Revisa permisos de la carpeta y reintenta. |
| El cliente no muestra imágenes | El cliente o el modelo no admite imágenes en resultados de herramientas; usa uno que sí. |

## Objetivo de prueba en Pokémon Gold

Corto y sin guardar:

1. **Diálogo:** con un cuadro de texto en pantalla (por ejemplo, habla con alguien con
   `a`), avanza el diálogo con `a` (100 ms) y `wait` cuando el texto aún se escribe,
   hasta que el personaje vuelva a moverse libremente. Éxito: no queda cuadro de texto.
   Presupuesto: 20 acciones.
2. **Salir de la habitación:** en el dormitorio del protagonista (planta alta de su casa
   en New Bark Town, el inicio de una partida nueva), camina hasta la escalera y bájala.
   Éxito: aparece la planta baja. Presupuesto: 40 acciones. Si la partida está en otro
   lugar, sal del edificio actual por su puerta.

Si la partida termina en un estado no deseado, restaura el respaldo inicial.

## Validación manual pendiente (requiere autorización)

Un navegador y un proceso por vez. Anotar navegador, versión, resultado y evidencia.

1. Comprobaciones previas (una por vez): `npm run test:gameboy`, `npm run typecheck:gameboy`.
2. Configurar uno de los clientes MCP con la ruta real de arriba y reiniciarlo.
   Esperado: el cliente lista `get_status`, `observe`, `act`, `wait` y `stop`.
3. Iniciar Next: `npm run dev -- --allow-server`. Abrir `http://localhost:3000/gba`
   en Chrome, en una ventana visible.
4. `get_status`. Esperado: `bridge.listening: true`, `available: false`, motivo «No browser
   tab is paired…» y un código.
5. Panel IA: escribir el código y pulsar «Conectar IA». Esperado: «Conectada · Tú tienes
   el control». `get_status` muestra el origen `http://localhost:3000`.
6. Abrir Pokémon Gold y esperar a que sea jugable. Pulsar «Permitir que la IA controle».
   Esperado: «Respaldo inicial guardado: …json», etiqueta «AI», juego en pausa y
   `ls -l ~/.monsite-gameboy-mcp/backups/pokemon-gold/` muestra un archivo `-rw-------`.
7. `observe`. Esperado: imagen de 480×432 idéntica a la pantalla, sin bordes negros ni
   escritorio, `capture_source` `pause-frame`, `live-frame` o `one-frame-advance`.
   Anotar `capture.drawingBuffer` y `capture.attempts`.
8. `act` `["a"]` 100 ms. Esperado: el juego reacciona, la imagen devuelta coincide con la
   pantalla congelada y `timing.holdMs` ≈ 100.
9. `wait` 1000 ms. Esperado: el texto o la animación avanzan y el juego queda en pausa.
10. `act` `["right"]` 270 ms en el mapa. Anotar cuántas casillas avanza (referencia de
    tiempos; no es precisión por fotograma).
11. `act` `["up"]` 2000 ms y, durante la pulsación, `stop`. Esperado: se suelta al
    instante, queda en pausa y la orden termina con `stopped`.
12. Durante otra pulsación larga, pulsar «Tomar control». Esperado: se suelta, queda en
    pausa, el teclado vuelve a funcionar tras reanudar y `act` devuelve `user-control`.
    Repetir con Esc.
13. Con la IA controlando, cambiar al cliente MCP durante un `wait`. Esperado: el juego
    sigue. Minimizar el navegador durante otro `wait`. Esperado: `page-hidden` y pausa.
14. Recargar la página. Esperado: `get_status` sin pestaña emparejada y `act` con el
    `session_id` anterior rechazado (`not-connected` y, tras emparejar de nuevo,
    `stale-session`).
15. Restaurar el respaldo inicial con «Importar respaldo». Esperado: la partida vuelve al
    estado anterior a la IA.
16. Cerrar el cliente MCP. Esperado: el proceso sale, el puerto queda libre (`lsof`) y la
    página muestra «Se perdió la conexión…» con el juego en pausa.
17. Ejecutar el objetivo de prueba y anotar acciones usadas y resultado.
18. Opcional: repetir 4-12 en Firefox, Safari y Brave sobre localhost. Opcional y
    experimental: producción con `--allow-origin https://gba.alexisrs.dev` y `?ai=1`,
    anotando avisos o bloqueos (Safari debería bloquear).

## Verificación realizada

- `npm run test:gameboy`: 114 pruebas aprobadas (69 previas sin cambios y 45 nuevas en
  `scripts/test-gameboy-ai.mjs` y al final de `scripts/test-gameboy.mjs`). Cubren:
  validación de botones y duraciones; PNG decodificado y comparado píxel a píxel; orden
  de reanudar, pulsar, soltar y pausar; captura en el fotograma pausado; reintentos ante
  un buffer borrado; fallos de captura; `stop`, timeouts y cancelación MCP; peticiones
  duplicadas; emparejamiento; sesiones antiguas; Origin y Host no autorizados (incluso
  con el stack real `ws` sobre sockets en memoria, sin abrir puertos); desconexión;
  toma de control; pestaña oculta; presupuesto; respaldo inicial; modo normal sin
  cambios; mensajes postMessage de otro origen, ventana o sesión; el punto de entrada
  stdio real con streams en memoria (stdout solo JSON-RPC, registros en stderr, cierre al
  terminar stdin); y MCP real del SDK por transporte en memoria con clientes 2024-11-05,
  2025-06-18 y 2025-11-25.
- `npm run typecheck:gameboy` y ESLint sobre los archivos modificados: sin errores.
- No se ejecutaron servidores, previews, builds, navegadores ni el proceso MCP real.

## Servidor público `mcp.alexisrs.dev` (cualquier agente)

Además del modo local, `scripts/gameboy-mcp-remote.mjs` sirve a varios agentes a la vez
desde un VPS:

```text
Agente A ─┐  HTTPS  https://mcp.alexisrs.dev/mcp   (MCP Streamable HTTP, una sesión por agente)
Agente B ─┤              │
          │        Caddy (TLS) → 127.0.0.1:8787  scripts/gameboy-mcp-remote.mjs
          │              │
Pestañas ─┘  WSS   wss://mcp.alexisrs.dev/gameboy-ai  ← https://gba.alexisrs.dev (panel IA)
```

- Cada sesión MCP (cada agente) tiene su propio puente y su código. La pestaña que
  escribe un código se conecta solo con el agente que lo emitió. El código es la
  autorización: ningún agente controla una pestaña sin que su dueño lo escriba.
- En `gba.alexisrs.dev` (y en el escritorio de `alexisrs.dev`) el panel se conecta a
  `wss://mcp.alexisrs.dev/gameboy-ai`. En `localhost` sigue usando el proceso local.
- Con TLS real no hay contenido mixto ni avisos de red local: Chrome, Brave, Firefox y
  Safari deberían conectarse (pendiente de comprobar en el despliegue).
- El respaldo inicial se **descarga en tu navegador**
  (`<juego>-respaldo-ia-<fecha>.json`) antes de conceder el control. El servidor solo lo
  valida y no guarda partidas. Se restaura con «Importar respaldo».
- Límites por IP:
  - 30 sesiones nuevas por cada 10 minutos.
  - 10 códigos fallidos por cada 10 minutos.
  - 20 sesiones simultáneas.
  - Las sesiones inactivas se cierran a los 30 minutos y liberan su pestaña.
  - El endpoint MCP valida el Host; el WebSocket valida Host, Origin y subprotocolo.

### Conectar un agente

- **Claude.ai / Claude Desktop:** Ajustes → Conectores → Añadir conector personalizado
  → URL `https://mcp.alexisrs.dev/mcp` (sin autenticación).
- **Claude Code:** `claude mcp add --transport http gameboy https://mcp.alexisrs.dev/mcp`.
- **Otros (ChatGPT, Cursor, etc.):** cualquier cliente con MCP remoto por HTTP. El modelo
  debe tener visión y el cliente debe entregarle las imágenes de los resultados;
  compruébalo en cada uno.
- Después: pide al agente `get_status`, escribe su código en el panel del robot, abre el
  juego y pulsa «Permitir que la IA controle».

### Desplegar en el VPS (Docker, junto a Artisanal Brew)

El VPS (`209.23.11.117`, Ubuntu 26.04, 2 CPU, 4 GB) ya tiene un Caddy en Docker
(`artisanalbrew-caddy-1`, `/opt/artisanalbrew`) que ocupa los puertos 80 y 443. El
servidor MCP corre como **otro contenedor** en la red `artisanalbrew_default`, sin
publicar puertos. Caddy recibe un bloque más y se recarga en caliente, sin reiniciar los
demás sitios.

1. DNS en GoDaddy: registro A `mcp` → `209.23.11.117` (hecho).
2. Local: `sh deploy/gameboy-mcp/bundle.sh`. Crea `deploy/gameboy-mcp/dist` con el
   servidor, su lockfile, `Dockerfile` y `compose.yml`, sin Next ni ROM.
3. Subirlo: `rsync -a -e "ssh -F ~/.ssh/private_chat_atlantic.conf" deploy/gameboy-mcp/dist/ private-chat-atlantic-root:/opt/gameboy-mcp/`
4. En el VPS: `cd /opt/gameboy-mcp && docker compose up -d --build`. El contenedor es de
   solo lectura, sin capacidades, con 384 MB máximo y una comprobación de salud.
5. Añadir `deploy/gameboy-mcp/Caddyfile` **al final** de `/opt/artisanalbrew/Caddyfile`
   (con copia de seguridad antes), validar y recargar:
   `docker exec artisanalbrew-caddy-1 caddy validate --config /etc/caddy/Caddyfile`
   y luego `docker exec artisanalbrew-caddy-1 caddy reload --config /etc/caddy/Caddyfile`.
6. Comprobar: `curl https://mcp.alexisrs.dev/healthz` → `ok`.
7. Desplegar el sitio (Vercel) con el panel nuevo.

Operación: `docker logs -f gameboy-mcp` (registros, sin códigos ni capturas),
`docker restart gameboy-mcp`, `docker compose -f /opt/gameboy-mcp/compose.yml down`. Para
retirarlo por completo, quita también el bloque `mcp.alexisrs.dev` del Caddyfile y recarga.
