# UD Churrax

Web oficial de UD Churrax, equipo de fútbol 7 de Sevilla. Incluye una página de inicio-resumen y páginas independientes para El club, Plantilla, Competición, Noticias, Galería y el archivo de temporadas.

## Desarrollo local

Abre `index.html` en un navegador. La página utiliza HTML, CSS y JavaScript sin proceso de compilación.

## Páginas

- `index.html`: portada con el resumen de cada área y enlaces a sus páginas.
- `club.html`: historia, identidad y filosofía del club.
- `plantilla.html`: jugadores, cuerpo técnico y estadísticas.
- `plantilla-data.js`: nombres, dorsales, posiciones y fotos de la plantilla y del entrenador.
- `competicion.html`: resumen de la Primera División IMD Sevilla 2026/27, clasificación, Season Tracker, calendario y resultados.
- `ficha-partido.html`: ficha individual de cada encuentro del Churrax, seleccionada por jornada.
- `noticias.html`: crónicas, comunicados y actualidad.
- `archivo.html`: temporadas actuales y anteriores, conservadas por separado.
- `galeria.html`: galería de fotos y vídeos.

## Actualización de contenidos

Los datos que el club aún no ha confirmado se muestran como pendientes; no se publican jugadores, clasificación ni resultados ficticios. El calendario oficial de 2026/27 está publicado en la página de Competición.

La plantilla y el entrenador se mantienen en `plantilla-data.js`. Guarda las fotos en `images/plantilla/` y registra cada jugador en `window.CHURRAX_SQUAD` con `number`, `position`, `name` y `photo`, por ejemplo `{ number: 10, position: "Delantero", name: "Nombre del jugador", photo: "images/plantilla/jugador-10.jpg" }`. Registra al entrenador en `window.CHURRAX_COACH` con `name`, `position: "Entrenador"` y `photo`. Hasta que el club confirme estos datos, la página muestra el contenido como pendiente.

El calendario se mantiene en `schedule-data.js`: cada jornada guarda la vuelta y una lista de partidos con local, visitante, fecha (`AAAA-MM-DD`), hora, día y sede. En Competición se puede elegir una jornada concreta y filtrar para mostrar solo los partidos de UD Churrax. `schedule.js` presenta los encuentros por vuelta y jornada, destacando los partidos de UD Churrax y mostrando el marcador registrado o el estado «Por disputar». Cada partido del Churrax enlaza a su ficha individual con la jornada correspondiente. Actualiza el manifiesto con los cambios oficiales de fecha, hora o campo.

La clasificación y las imágenes de los equipos se mantienen en `standings-data.js`. Guarda cada escudo (PNG, JPG o SVG) en `images/equipos/` y escribe su ruta en la propiedad `image` del equipo correspondiente, por ejemplo `image: "images/equipos/fumanchester-pity.png"`. Deja `image: ""` si todavía no tienes el archivo; se mostrarán las iniciales. El escudo actual de UD Churrax ya está asociado. La tabla usa el orden de los equipos de cada registro como clasificación oficial, calcula la diferencia de goles con GF−GC y muestra la racha de hasta cinco últimos partidos (`lastFive: ["V", "E", "D"]`, de más antiguo a más reciente).

Para conservar la clasificación tras cada jornada, añade un registro a `window.CHURRAX_STANDINGS_HISTORY` en `standings-data.js`: `{ round: 1, teams: [/* los diez equipos ordenados al cierre de la jornada */] }`. Cada equipo debe incluir `name`, `pj`, `pg`, `pe`, `pp`, `pnp`, `gf`, `gc`, `points`, `lastFive` e `image`. El selector permite elegir el inicio de temporada o cualquiera de las 18 jornadas; si aún no hay una clasificación guardada para esa jornada, la página lo indica sin reutilizar datos de otra fecha. La clasificación y el Season Tracker utilizan estas instantáneas para mostrar posición y puntos históricos; añade una por jornada para obtener la evolución completa. Las dos primeras posiciones se marcan sutilmente como ascenso y las tres últimas como descenso.

El Season Tracker compara los puntos de UD Churrax con los tres equipos mejor clasificados en la última instantánea. Victorias, empates, derrotas, goles a favor/en contra y rachas se calculan con los marcadores de UD Churrax guardados en `results-data.js`; sin resultados confirmados se muestran como pendientes.

Los marcadores se registran en `results-data.js` como objetos con jornada, equipos y goles numéricos: `{ round: 1, home: "UD CHURRAX", away: "RIVAL FC", homeScore: 2, awayScore: 1, playedOn: "2026-11-11", goals: ["Nombre del goleador (min. 12)"], chronicle: "Resumen del encuentro.", galleryUrl: "galeria.html" }`. `playedOn`, `goals`, `chronicle` y `galleryUrl` son opcionales; si no hay datos editoriales, la ficha indica que están pendientes y enlaza a la galería general. La ficha se abre con `ficha-partido.html?jornada=1` y obtiene rival, condición, fecha y campo del calendario, así que los detalles no necesitan duplicarse. El apartado Competición usa los marcadores para mostrar jornadas disputadas y pendientes, el último partido del Churrax, la última jornada y el histórico de encuentros. La clasificación resumida toma los dos puestos por encima y por debajo del Churrax (o los cinco primeros/últimos en los extremos). La cuenta atrás y el próximo encuentro se seleccionan automáticamente desde `schedule-data.js`. Si aún no hay marcadores, el último partido y la última jornada indican que todavía no se han disputado encuentros. Los escudos se muestran sin una silueta o fondo añadido, conservando sus colores originales; si falta un archivo, se muestran las iniciales sin un fondo detrás.

El archivo de temporadas es editorial y estático: cuando comience una nueva temporada, añade su ficha al archivo y conserva las fichas anteriores con sus plantillas, calendario, resultados y noticias. No sobrescribas el contenido de una temporada cerrada. La web todavía no incluye un CMS ni almacenamiento automático; los cambios se guardan en los archivos del proyecto.

## Galería de fotos y vídeos

1. Guarda las fotos y vídeos de partidos y postpartidos en `images/galeria/`.
2. Añade cada archivo a `gallery-data.js`. Las fotos pueden usar el formato existente:

   ```js
   {
       type: "image",
       src: "images/galeria/partido-01.jpg",
       alt: "El equipo durante un partido",
       title: "Jornada de liga",
       season: "Temporada 2026/27"
   }
   ```

Para un vídeo MP4 (H.264) o WebM, especifica `type: "video"`. La galería extrae automáticamente un fotograma aleatorio como miniatura cuando no se especifica `poster`; si sí se especifica, esa imagen se usa como vista previa:

   ```js
   {
       type: "video",
       src: "images/galeria/celebracion.mp4",
       poster: "images/galeria/celebracion.jpg",
       alt: "Celebración del equipo al terminar el partido",
       title: "Celebración tras el partido",
       season: "Temporada 2026/27"
   }
   ```

La propiedad `poster` es opcional: omítela para usar un fotograma aleatorio. Los vídeos se reproducen con los controles del navegador al abrirlos desde la galería. No se incluyen en la selección aleatoria de la cabecera; esta solo utiliza fotos. La cabecera elige una foto al azar al cargar la web y vuelve a elegir cada hora mientras la página permanece abierta. Al ser una web estática, añadir archivos a la carpeta no actualiza la lista automáticamente: registra cada medio en `gallery-data.js`.
