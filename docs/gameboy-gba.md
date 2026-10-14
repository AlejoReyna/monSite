# Biblioteca GB / GBC / GBA

Implementación por fases, 2026-10-13. El motor sigue siendo EmulatorJS 4.2.3:
Gambatte para GB/GBC y mGBA para GBA. Solo existe un iframe activo.

## Estado de las fases

| Fase | Implementado | Verificación pendiente |
| --- | --- | --- |
| 0. Referencia y binarios | 23 pruebas originales pasaban antes de editar. mGBA oficial descargado, licencia preservada, hashes y tamaños registrados. Ambos bundles indican mínimo EJS 4.2.2 y versión de bundle 2.0.2. | Arranque del WASM en navegador real. |
| 1. Catálogo | Gold y Doom GBA incluidos; plataforma, core, SHA-256, origen, URL y estrategia de guardado por entrada. Identidades antiguas de Gold y ROM locales conservadas. | Catálogo validado automáticamente; ejecución real pendiente. |
| 2. ROM locales y arranque | .gb/.gbc/.dmg/.gba; 8 MiB para GB/GBC y 32 MiB para GBA; mínimo 16 KiB. Sesiones autenticadas, arranque único, URL nueva por reintento. | Compatibilidad de juegos reales en dispositivos objetivo. |
| 3. Partidas y respaldos | IDBFS por ROM; respaldo Gold antiguo compatible; respaldo genérico con identidad y reloj disponible; importación de JSON, .sav/.srm y estados con metadatos. Escritura antes de cambiar o salir. | Persistencia real SRAM/EEPROM/Flash y reloj mGBA. |
| 4. Interfaz | L/R en un hueco sobre los controles, pantalla un poco más alta hacia abajo, pausa, sonido al pulsar un control, fullscreen, ES/EN y confirmación de restauración. | Inspección visual, multitáctil y accesibilidad en navegador. |
| 5. Recursos | Carga bajo demanda; variantes sin threads; cabeceras de caché para recursos fijados; diez ciclos simulados con limpieza de frames, URLs, timers y listeners. | Medición de red, memoria, CPU y batería en hardware real. |
| 6. Entrega | Pruebas automáticas, comprobaciones estáticas y esta documentación. | Validación real autorizada; resultados de la matriz manual. |

No se ha iniciado ningún servidor ni build. AGENTS.md exige autorización explícita.
Cuando se autorice un servidor local, usar exclusivamente:

```sh
npm run dev -- --allow-server
```

## Experiencia del jugador

Escritorio → biblioteca → juego incluido o Abrir ROM → jugar → conservar partida
→ biblioteca u otra salida. Se espera a la confirmación de escritura antes de
retirar el iframe. Si falla o tarda más de cinco segundos, se conserva el iframe
y se muestran exportación y una salida explícita sin conservar la partida.
Una confirmación tardía de escritura también se procesa.

Una importación guarda primero la sesión anterior y restaura los archivos antes
de montar la nueva. Si falla la escritura anterior, puede cancelarse la
importación. Si falla la restauración explícita, no se arranca el juego con una
partida anterior por accidente.

Los archivos locales permanecen en el equipo: no se suben ni se almacenan como
ROM en IndexedDB. Se retiene el File mientras dura la sesión para regenerar la
URL que EmulatorJS consume al descargarla. Después de volver a la biblioteca o
recargar el sitio hay que seleccionar el archivo otra vez. La partida sí
permanece en el almacenamiento del navegador, sujeto a su disponibilidad.

Controles: flechas, X=A, Z=B, Enter=Start, Shift=Select. Para GBA: A=L y S=R.
Esc pausa; Alt+Q vuelve al escritorio. Los controles táctiles admiten fuentes
simultáneas, y se liberan al perder foco o pausar. La primera pulsación de un
control enciende el sonido; silenciar con el botón de sonido se respeta.

## Guardados e identidad

- Pokémon Gold incluido mantiene `pokemon-gold`, `monsite.gold.cartridge.v1`,
  la SRAM de 32 KiB y el RTC de 8 bytes. Los respaldos antiguos siguen válidos.
- ROM locales mantienen `rom-<SHA-256>` y `/data/saves/rom-<SHA-256>.srm`/`.rtc`.
  No se migra ni fusiona automáticamente una partida local de Gold con la del
  Gold incluido; esas identidades ya eran distintas antes de este cambio.
- Nuevos juegos del catálogo usan la misma identidad SHA que su ROM local,
  por lo que pueden compartir partida con el mismo archivo importado.
- GB/GBC usan la bandera de color del cartucho, evitando que cambiar .gb a .gbc
  altere la plataforma del respaldo. No se exigen logo o checksum oficiales,
  para permitir homebrew y ROM modificadas.
- Los respaldos genéricos incluyen ROM, plataforma, core, fecha, SRAM y RTC
  separado si está disponible. El SRAM puede contener datos de reloj propios
  del core; se conserva entero, sin asumir un tamaño de Gold.
- Un respaldo parcial se identifica como tal. Un .sav/.srm crudo no prueba su
  identidad ni su reloj: la interfaz pide revisar el archivo antes de restaurar.
- Los estados se exportan como `.state.json`, con ROM, core y runtime fijado.
  Los antiguos `.state` sin metadatos no se importan automáticamente.
- El protocolo conserva los nombres de canal históricos pero agrega una sesión
  nueva por arranque. Valida origen, ventana emisora y sesión; el ID numérico de
  EmulatorJS no se utiliza como identidad de almacenamiento.

Los validadores compartidos viven en `public/gameboy/backups.js`, con tipos en
`backups.d.ts`. El límite de SRAM es 1 MiB, RTC separado 4 KiB y estado 8 MiB;
los envoltorios JSON tienen límites adicionales antes de leerse/decodificarse.

## Espacio y descarga

mGBA WebGL2: 1,055,616 bytes. mGBA legacy: 1,054,993 bytes. Reporte: 118 bytes.
Total añadido de bundles/reporte: 2,110,727 bytes, más licencia y código.
El navegador descarga una variante al seleccionar GBA, junto con los recursos
comunes y la ROM seleccionada. No se precargan juegos o cores al visitar el
sitio o ver la biblioteca. Las cabeceras de recursos versionados son immutable:
las actualizaciones deben usar otra carpeta/version y nuevos hashes, nunca
reemplazar estos bytes en la misma URL.

Los tamaños están comprobados; los tiempos de arranque y la memoria en navegador
no se han medido. Las pruebas de diez ciclos usan React/DOM simulados y no
sustituyen el perfilado de WASM.

## Añadir Doom u otro juego incluido

Se necesita la ROM de Doom para GBA **sin comprimir, extensión .gba**. Un WAD
pertenece a la versión PC y requiere otro motor. No hay una entrada de Doom
vacía. Doom ya está incluido a partir del archivo que proporcionó el usuario
en su Escritorio: `Doom (USA, Europe).zip`, con una sola entrada GBA de
8,388,608 bytes. Se comprobó el CRC del ZIP, la cabecera y el checksum GBA.
El ZIP original permanece intacto. La copia está en `public/games/doom.gba`.
Su SHA-256 es `f5f4f0aac6c1884ef0b771dacb21a5d3f2152a066157f46abb39769c7f95deab`;
la selección incluida y ese mismo archivo local comparten identidad y partida.

Para añadir otro juego, seguir estos pasos con su archivo y hash propios:

1. Colocar el archivo autorizado en `public/games/doom.gba`.
2. Calcular su SHA-256 (`shasum -a 256 public/games/doom.gba`).
3. Añadir una entrada a `src/lib/gameboy/library.ts`:

```ts
{
  id: `rom-${sha256}`, // sustituir sha256 por el hash real del archivo
  title: "Doom",
  platform: "gba",
  core: "mgba",
  source: "bundled",
  saveMode: "cartridge",
  sha256,
  romUrl: "/games/doom.gba",
  playerUrl: "/gameboy/frame.html?local=1",
}
```

4. Verificar que la entrada y el archivo comparten hash; probar controles,
   partida, recarga y regreso a la biblioteca en el motor real.

Los nombres de archivos incluidos deben ser minúsculas y usar letras, números
 o guiones; el puente permite exclusivamente `/games/<nombre>.gb|gbc|gba`.

## Comprobaciones locales

Un proceso por vez; no correr pruebas, lint y TypeScript simultáneamente.

```sh
npm run test:gameboy
npm run typecheck:gameboy
node --max-old-space-size=768 node_modules/eslint/bin/eslint.js src/lib/gameboy src/components/v2/gameboy-player.tsx public/gameboy scripts/test-gameboy.mjs next.config.ts
```

59 pruebas automáticas. Incluyen validadores, manifiesto, bridge, IndexedDB
simulado y handlers reales del componente mediante hooks/DOM deterministas.
Se usan bytes sintéticos para la lógica GBA y la ROM real de Doom para verificar
integridad, identidad local/catálogo y selección en el host. Estas pruebas no
ejecutan mGBA ni acreditan que Doom arranque.

`typecheck:gameboy` usa `tsconfig.gameboy.json` para comprobar el reproductor,
sus módulos y dependencias sin incluir componentes de otras tareas en curso.
La comprobación global llegó a detectar un `crash-player` ausente en el trabajo
concurrente de PlayStation; no se modificaron esos archivos para resolverlo.
Después de que esos archivos estuvieron disponibles, se repitió TypeScript
globalmente y también pasó. Lint del ámbito modificado y `git diff --check`
pasaron; no se ejecutaron servidores, previews ni builds.

## Matriz de pruebas

A = automatización aprobada; M = manual pendiente. P0 bloquea el cierre de la
validación completa. Ejecutar Chrome/Safari macOS, Safari iOS y Chrome Android,
un dispositivo por vez, con el servidor autorizado. Registrar ROM/hash,
dispositivo, navegador, conexión, resultado y evidencia.

| ID | Prioridad | Caso | Resultado requerido | Evidencia actual |
| --- | --- | --- | --- | --- |
| T01 | P0 | Sitio y biblioteca | Cero solicitudes de motor/ROM antes de jugar | A: sin iframe/config; M: red |
| T02 | P0 | Gold incluido | Carga, controles y funciones anteriores | A: regresiones; M: juego real |
| T03 | P0 | Doom GBA | Arranque y recorrido jugable | A: ROM/hash/catálogo/config; M: ejecución real |
| T04 | P0 | ROM GB/GBC/GBA local | Core correcto; sin subida de archivo | A: identificación/config; M: ejecución/red |
| T05 | P0 | Archivo inválido o excesivo | Rechazo antes de leer; biblioteca usable | A |
| T06 | P0 | ROM corrupta de extensión válida | Error recuperable | A: error del puente; M: core real |
| T07 | P0 | Doble selección | Una lectura y un arranque | A: guardas/config única; M: interacción |
| T08 | P0 | Gold: guardar/cerrar/recargar | SRAM y RTC preservados | A: formatos/orden; M: persistencia real |
| T09 | P0 | GBA SRAM/EEPROM/Flash | Partidas preservadas en cada variante | A: tamaños; M: juegos reales |
| T10 | P0 | Reloj y ausencia de reloj | Conservación/restauración apropiadas | A: RTC opcional; M: mGBA real |
| T11 | P0 | Alternar juegos | Partidas independientes | A: identidades/rutas; M: contenido real |
| T12 | P0 | Renombrar ROM | Misma identidad y partida | A; M: recarga real |
| T13 | P0 | Nombre igual, contenido diferente | Identidades distintas | A |
| T14 | P0 | Respaldo antiguo Gold | Restauración antes de arrancar | A; M: juego real |
| T15 | P0 | Respaldo genérico | Restauración íntegra y aislada | A; M: partida real |
| T16 | P0 | Respaldo equivocado/dañado | Sin escritura ni reinicio | A |
| T17 | P0 | Salir durante escritura | Desmontaje solo tras confirmación | A: promesa diferida/host; M: IDBFS real |
| T18 | P0 | Almacenamiento fallido o lento | Exportación, cancelación y salida explícita | A; M: navegador restringido |
| T19 | P0 | Origen/sesión antiguos | Mensajes ignorados | A |
| T20 | P0 | Teclado A/B/L/R | Mapeo y fuentes simultáneas correctos | A; M: juego real |
| T21 | P0 | Multitáctil y blur | Sin teclas atascadas | A: handlers; M: móvil |
| T22 | P1 | Estados instantáneos | Metadatos compatibles y restauración explícita | A; M: estado WASM real |
| T23 | P1 | Fullscreen y alternativa | Sin perder sesión; salida limpia | A: controlador; M: navegador |
| T24 | P1 | Juego→biblioteca→juego | Guardar, desmontar y arrancar uno solo | A: ciclos; M: motor real |
| T25 | P1 | Retrato/paisaje/pantalla pequeña | Sin deformación ni controles ocultos | M |
| T26 | P1 | Foco y ES/EN | Navegación y mensajes completos | A: render inicial; M: accesibilidad |
| T27 | P0 | Diez ciclos | Sin acumulación de runtime/audio/workers | A: DOM/timers/URLs; M: WASM/perfilado |
| T28 | P1 | Red fría/caché/lenta | Bytes/tiempos registrados; error recuperable | A: hashes/tamaños; M: red |
| T29 | P1 | Volver al escritorio | Terminal, carrusel y desplazamiento utilizables | A: listeners/overflow; M: integración |

Rollback: conservar siempre los guardados existentes. La entrada Gold y sus
claves no se han migrado. Una reversión del código puede retirar GBA del flujo
sin borrar IndexedDB, dependencias ni caches del usuario.

## Corrección de rutas nativas verificada en producción

La inspección real de IndexedDB mostró que RetroArch guarda Gold en
`/data/saves/Gambatte/pokemon-gold.srm` y Doom en
`/data/saves/mGBA/<nombre>.srm`. El adaptador usa ahora esos directorios,
conserva las rutas antiguas como origen de migración y crea el directorio
nativo al restaurar. Un Gold sin archivo RTC separado puede conservar su SRAM;
el respaldo indica la ausencia del reloj, sin inventarlo.

Doom se sirve mediante un rewrite desde `/games/rom-<SHA-256>.gba` al archivo
existente `/games/doom.gba`. El motor deriva así el mismo basename que al abrir
esa ROM local. La partida antigua `mGBA/doom.srm` se migra antes de iniciar el
motor, únicamente para el SHA de Doom incluido y sin borrar el archivo anterior.

El despliegue del PR #63 y el ícono se verificaron en ambos dominios. Doom y Gold
arrancaron en Brave. Safari mostró un error de arranque en la prueba inicial;
la causa específica de Safari sigue pendiente de diagnóstico.

## Guardado periódico sin exportación de imágenes

Ante el reporte de recargas aproximadamente a los 15 segundos, se retiró el
intervalo del puente que pulsaba la exportación manual. Esa acción también
captura una imagen del motor, aunque solo se quiera conservar SRAM. El runtime
fijado admite `save-save-interval: 30`, que llama directamente al guardado nativo
sin generar capturas ni notificar al host en cada ciclo. Exportar respaldos y
salir siguen usando su flujo explícito con confirmación de escritura.

62 pruebas, incluidas la ejecución del consumidor real de la opción del runtime
durante dos minutos simulados y la conservación del iframe ante notificaciones
de guardado. El reporte de recarga completa no se reprodujo inicialmente en
Brave de escritorio; esta corrección elimina la operación periódica sospechosa
sin afirmar que se haya confirmado la causa del cierre en todos los dispositivos.
