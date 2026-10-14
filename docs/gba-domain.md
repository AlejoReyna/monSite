# gba.alexisrs.dev

Configuración iniciada el 13 de octubre de 2026.

## Aplicación

- `/gba` abre directamente la biblioteca y el emulador existentes.
- El host `gba.alexisrs.dev` reescribe únicamente `/` a `/gba`, antes de resolver
  la página del portafolio. La URL pública permanece en la raíz del subdominio.
- El subdominio solo sirve la consola: un middleware redirige cualquier otra
  ruta de página a `/`, sin tocar ROMs, cores, iframes, API ni recursos de Next.
- La navegación del portafolio se oculta tanto en `/gba` como en el host dedicado.
- Los metadatos ES/EN y la URL canónica apuntan a `https://gba.alexisrs.dev`.
- Salir conserva el flujo de guardado del reproductor y vuelve a `https://alexisrs.dev`.
- Las rutas del iframe, ROMs, cores y recursos de Next conservan sus URLs.

Los guardados del navegador pertenecen a cada origen. Abrir el subdominio no
traslada los guardados del portafolio: pueden transferirse con los respaldos
que ya ofrece el reproductor.

## Hosting y DNS

Dominio añadido al entorno **Production** del proyecto Vercel
[`mon-new-portfolio`](https://vercel.com/alexis-reynas-projects-4c620588/mon-new-portfolio/settings/domains).

Registro creado y confirmado en la tabla DNS de GoDaddy:

| Tipo | Nombre | Destino | TTL mostrado tras guardar |
| --- | --- | --- | --- |
| CNAME | `gba` | `8ac488e95ee5e9bd.vercel-dns-017.com.` | 1 hora |

Servidores autoritativos existentes: `ns61.domaincontrol.com` y
`ns62.domaincontrol.com`. El destino CNAME se obtuvo del panel del proyecto,
sin sustituir otros registros ni los nameservers.

## Verificación y pasos pendientes

Pasaron siete pruebas enfocadas: enrutamiento por host con los helpers de Next,
rutas de recursos intactas, metadatos propios, navegación del portafolio oculta,
biblioteca y arranque simulado de Gold/Doom. También pasaron TypeScript del ámbito
Game Boy, TypeScript global, lint de los archivos de aplicación modificados y
`git diff --check`.

El CNAME ya responde correctamente desde ambos nameservers autoritativos y
desde el resolver local. HTTPS en `https://gba.alexisrs.dev` ya responde 200
con certificado válido de Vercel (verificado el 14 de octubre de 2026); hoy
sirve el portafolio porque la producción aún no incluye este commit.
Pendiente: desplegar el código preparado (merge a `main`). La producción
existente aún no incluye `/gba` ni el rewrite.
No se inició ningún servidor, preview ni build.

Comprobaciones después de publicar esta versión:

```sh
dig @ns61.domaincontrol.com gba.alexisrs.dev CNAME +short
dig @ns62.domaincontrol.com gba.alexisrs.dev CNAME +short
curl -I https://gba.alexisrs.dev
```

Abrir después `https://gba.alexisrs.dev` en móvil: debe mostrar la biblioteca,
arrancar cada plataforma, conservar el color de carcasa y mantener estable el
tamaño de la pantalla. Verificar también que `https://alexisrs.dev` conserva
el portafolio.

Referencia: [configuración de dominios en Vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
y [rewrites por host de Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites).
