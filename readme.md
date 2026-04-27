# RapRadar — Sonidos de la Calle

**Materia:** Aplicaciones Móviles
**Institución:** UNAJ
**Alumno:** Felipe Da Silva Moreno
**API utilizada:** Last.fm API

---

## Por qué elegí esta temática

Soy fanático del rap desde chico. Cuando vi que Last.fm era una de las opciones, no dudé: es una API con datos muy ricos (biografías, géneros, popularidad, imágenes) y me permitía construir algo que yo mismo usaría, lo cual hizo que las decisiones de diseño fueran más naturales y más fáciles de justificar.

---

## Estructura del proyecto

```
rapradar/
├── index.html        → estructura HTML y vistas de la SPA
├── app.js            → toda la lógica en JavaScript
├── style.css         → estilos propios con enfoque mobile-first
├── manifest.json     → configuración para la PWA
├── sw.js             → service worker para caché y funcionamiento offline
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

La separación entre HTML, CSS y JavaScript es estricta: no hay estilos inline más que ajustes mínimos de layout y ningún bloque `<script>` con lógica de negocio embebida en el HTML.

---

## Cómo funciona la aplicación

### Navegación

La app es una Single Page Application (SPA) construida con Vanilla JS. No hay recarga de página: todas las vistas existen en el HTML desde el inicio, con `display: none`, y la función `navigate(viewId)` se encarga de mostrar la que corresponde y ocultar el resto. Cada vez que se activa una vista, también se ejecutan las funciones de inicialización que corresponden a ese contexto (cargar artistas, renderizar historial, etc.).

---

### Vista de inicio — Home

Apenas se carga la app, se hace un `fetch` a la API de Last.fm pidiendo los diez artistas más populares del tag `rap`. El resultado se renderiza como cards en la grilla. Si no hay conexión a internet, la app detecta el error y revisa si el usuario tiene artistas guardados en el historial local; si los hay, los muestra junto con un aviso de que se está en modo offline. Si no hay nada guardado tampoco, muestra un mensaje de error descriptivo.

---

### Búsqueda y filtros

La vista de búsqueda tiene cuatro controles que actúan como filtros:

**Búsqueda por nombre:** campo de texto libre. Si se deja vacío, la app interpreta eso como una solicitud del ranking global del género seleccionado.

**Filtro de género:** permite elegir entre Rap, Trap, Drill y Boom Bap. Este valor se usa como `tag` en el endpoint `tag.gettopartists` de Last.fm cuando no hay texto de búsqueda.

**Filtro de país:** desplegable con países de Latinoamérica, Europa y Estados Unidos. Cuando se elige un país sin texto de búsqueda, se usa el endpoint `geo.gettopartists`, que devuelve los artistas más escuchados de esa región. Cuando se combina con texto, el parámetro se agrega a la URL del endpoint `artist.search`.

**Filtro de ordenamiento:** la API devuelve los resultados por relevancia. Las opciones A-Z y Z-A aplican un `.sort()` sobre el arreglo ya recibido, sin hacer un nuevo `fetch`.

**Paginación:** el botón "Cargar más" incrementa el número de página (`paginaActual`) y hace un nuevo `fetch` con `reset = false`, de manera que los resultados nuevos se agregan a los existentes en lugar de reemplazarlos.

**Restauración del estado:** cuando el usuario vuelve a la vista de búsqueda desde el detalle de un artista, los resultados anteriores y los valores de los filtros se restauran automáticamente desde variables en memoria (`lastSearchResults` y `lastSearchParams`), sin necesidad de repetir la llamada a la API.

---

### Vista de detalle

Al hacer clic en un artista, se ejecuta `viewDetail(artistName)`, que llama al endpoint `artist.getinfo` de Last.fm. La respuesta incluye la biografía completa, pero Last.fm inyecta al final de ese texto un enlace HTML con la leyenda "Read more". Para evitar que ese link aparezca en la interfaz, el string se corta en el primer `<a` con `bio.split('<a')[0]`. Esto deja solo el texto limpio.

Antes de navegar a la vista, se llama a `saveToHistory(artist)`. Si el artista ya estaba en el historial, primero se lo elimina con `.filter()` y luego se lo vuelve a insertar al inicio con `.unshift()`, garantizando que el más reciente siempre esté primero. El historial se limita a 15 entradas.

Si no hay conexión de red en el momento de cargar el detalle, la función busca al artista en los favoritos guardados o en el historial local (`getCachedArtist`). Si lo encuentra, muestra los datos guardados con un aviso de modo offline. Si no lo encuentra, muestra un mensaje de error apropiado.

Las imágenes de Last.fm a veces devuelven una URL que apunta a una imagen gris genérica (identificable por el hash `2a96ace8` en la URL). La función `getValidImageUrl` detecta eso y en ese caso genera un avatar con iniciales usando la API pública `ui-avatars.com`.

---

### Lista de deseos — Mi Crew

Elegí la Variante B del trabajo (formulario de preferencias personalizadas). Al presionar el botón "Añadir a mi Crew" desde el detalle, se abre un modal con tres campos:

**Prioridad:** campo numérico. La validación con JavaScript verifica que el valor sea un número mayor a cero y, además, que no esté repetido: si ya hay un artista con prioridad 1, no se puede guardar otro con el mismo número. Este control no usa el atributo `required` de HTML; la validación es completamente manual con JS.

**Estilo musical:** botones de selección (Rap, Boombap, Trap). Al hacer clic en uno, se activa visualmente con la clase `active` y se guarda el valor en la variable `selectedStyle`. Si se intenta confirmar sin elegir un estilo, aparece el error correspondiente.

**Nota personal:** textarea con límite de 200 caracteres. El contador debajo del campo se actualiza en tiempo real con el evento `input` y cambia de color a rojo cuando el texto supera los 180 caracteres.

Todos los errores se muestran de forma individual, debajo del campo que los genera, sin limpiar los valores que ya ingresó el usuario. Al confirmar correctamente, el artista se guarda en `localStorage`, la lista se ordena por prioridad y se muestra un toast de confirmación.

Desde la vista "Mi Crew" se puede eliminar cualquier artista individualmente. Cada card muestra la imagen, el nombre, el estilo, el número de prioridad, la biografía y la nota personal.

---

### Historial

El historial se guarda en `localStorage` y persiste entre sesiones. La vista lo renderiza en orden cronológico inverso (el más reciente primero). Desde cada card del historial se puede volver al detalle del artista. La lógica evita duplicados: si un artista ya está en el historial y se vuelve a visitar, se mueve al inicio en lugar de aparecer dos veces.

---

### Página de contacto

La página de contacto presenta mis datos (GitHub, LinkedIn, teléfono) dentro de un card unificado con efecto glassmorphism. Incluye un mapa embebido con `iframe` de Google Maps apuntando a las coordenadas de la Catedral de La Plata (-34.9215, -57.9536).

---

### Diseño y responsividad

El CSS está escrito con enfoque mobile-first. La grilla base usa `grid-template-columns: 1fr` (una sola columna), y a partir de los breakpoints `481px`, `768px` y `1024px` el layout pasa a dos, tres y cuatro columnas respectivamente. No se usó ningún framework de CSS: Bootstrap, Tailwind ni similares.

La paleta visual está basada en un fondo oscuro (`#0D0D0D`) con un color de acento amarillo neón (`#E2FF00`) para los elementos de foco, llamadas a la acción y títulos. La tipografía es Inter de Google Fonts.

---

### Etapa PWA

La app incluye los tres elementos necesarios para funcionar como PWA instalable:

**Web App Manifest (`manifest.json`):** define el nombre, nombre corto, descripción, color de tema, color de fondo, modo `standalone` e íconos en 192px y 512px.

**Service Worker (`sw.js`):** se registra al cargar la página. En el evento `install` abre una caché llamada `rapradar-v1` y almacena los recursos estáticos principales (HTML, CSS, JS, íconos y las fuentes de Google). En el evento `fetch` aplica una estrategia _Cache First_: si el recurso solicitado está en la caché, lo sirve desde ahí; si no, lo busca en la red. En el evento `activate` elimina versiones anteriores de la caché que ya no estén en la lista blanca.

**Funcionamiento offline:** cuando no hay conexión, los recursos del shell de la app se sirven desde la caché del service worker. Para los datos dinámicos (artistas de la API), la lógica en `app.js` detecta el error de red y muestra el contenido guardado en `localStorage` junto con un aviso visual.

---

## Decisiones técnicas que vale la pena mencionar

**Sin frameworks de JS:** la app está construida en Vanilla JS con ES6+. Usé arrow functions, destructuring, template literals, `async/await` y los métodos modernos de arrays (`map`, `filter`, `sort`, `some`). La navegación entre vistas se maneja con una función central en lugar de un router de librería.

**Manejo de errores de red y HTTP:** cada `fetch` tiene su propio bloque `try/catch`. Además de capturar errores de red, se verifica explícitamente `res.ok` para detectar errores HTTP (como un 404 o 500) y lanzar un error con el código de estado.

**Persistencia:** tanto los favoritos como el historial se guardan en `localStorage` como strings JSON. Se usa `JSON.parse` al leer y `JSON.stringify` al escribir, con un array vacío como valor por defecto en caso de que la clave no exista todavía.

**Elementos semánticos:** el HTML usa `<header>`, `<nav>`, `<main>`, `<section>`, `<article>` y `<footer>` donde corresponde. Los resultados de búsqueda y las cards de favoritos e historial se generan como elementos `<article>` dentro de un `<div>` con rol de contenedor de grilla.