# RapRadar — Sonidos de la Calle

**Materia:** Aplicaciones Móviles 
**Institución:** UNAJ  
**Alumno:** Felipe Da Silva Moreno  
**API utilizada:** Last.fm API 

---

## Por qué elegí esta temática

Soy fanático del rap desde chico. Cuando vi que Last.fm era una de las opciones, no dudé. Es una API con muchísimos datos: biografías, géneros, popularidad, imágenes. Además me permitía construir algo que yo mismo usaría, lo cual hizo que las decisiones de diseño fueran más naturales.

---

## Estructura del proyecto

```
rapradar/
├── index.html        → estructura y vistas de la SPA
├── app.js            → toda la lógica JS
├── style.css         → estilos, mobile-first
├── manifest.json     → configuración PWA
├── sw.js             → service worker para cache offline
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Cómo pensé cada sección

### Home 

Decidí que la home no fuera solo una pantalla de bienvenida. Apenas carga, hace un `fetch` real a la API de Last.fm pidiendo el top 10 de artistas de rap. La idea era que el usuario entrara y ya viera contenido sin tener que hacer nada. La frase "SONIDOS DE LA CALLE" y el diseño del hero lo pensé para que se sintiera como entrar a una revista de cultura urbana, no a una app genérica.

### Búsqueda y filtros 

Implementé cuatro filtros:

- **Buscador por nombre:** el campo de texto principal. Si escribís algo, la app llama a `artist.search`. Si lo dejás vacío, muestra el top del género elegido.
- **Cantidad de resultados:** selector para ver 10 o 20 artistas por página.
- **Género:** Rap, Trap, Drill o Boom Bap. Cuando no hay texto escrito, este selector define qué ranking se muestra.
- **Ordenamiento:** permite ordenar los resultados por relevancia (el orden que trae la API, que equivale a popularidad), por nombre de A a Z, o de Z a A. Este ordenamiento lo hice del lado del cliente con `.sort()` y `localeCompare()` porque la API no expone ese parámetro directamente.

### Resultados

Muestro los primeros 10 o 20 resultados según el selector. Para navegar el resto implementé un botón "Cargar más" que incrementa `paginaActual` y hace un nuevo fetch agregando los resultados al grid existente, sin borrar los anteriores. Preferí este enfoque al scroll infinito porque en mobile el scroll infinito puede volverse confuso.

### Detalle del artista 

Al tocar una card, la app navega a la vista de detalle y hace otro `fetch` al endpoint `artist.getinfo`, que trae la bio completa, los oyentes mensuales y más. Un problema que tuve fue que Last.fm mete un link de "Read more on Last.fm" al final del texto de la bio. Lo resolví cortando el string en el primer `<a` que encuentra:

```js
bio = bio.split('<a')[0].trim();
```

No es la solución más elegante pero funciona perfecto para este caso. Desde esta vista se puede agregar el artista a la crew o volver al listado.

### Mi Crew — Lista de deseos

Elegí la Variante B porque me pareció más creativa para el tema. En vez de un formulario de consulta, el usuario "recluta" artistas para su crew personal asignándoles un número de prioridad y un estilo (Rap, Boombap o Trap).

Las validaciones las hice todas en JavaScript, sin depender de los atributos HTML:
- La prioridad tiene que ser un número mayor a cero.
- No puede haber dos artistas con la misma prioridad. Esa restricción la pensé yo — me pareció que tenía sentido que en tu ranking personal cada puesto sea único.
- El estilo es obligatorio.

Si hay errores, aparecen debajo de cada campo en rojo, sin alert(). La nota personal tiene un contador de caracteres que va actualizando en tiempo real y se pone rojo cuando te acercás al límite de 200.

### Historial 

El historial se registra automáticamente cada vez que abrís el detalle de un artista. Usé `.unshift()` para que el último visitado siempre aparezca primero. Si entrás dos veces al mismo artista, lo saco de donde estaba y lo pongo al principio de nuevo para no tener duplicados. Lo limito a 15 entradas porque guardar más no le agrega valor al usuario.

### Contacto 

En vez de distribuir la información en varios bloques sueltos, armé un "super card" con efecto glassmorphism que unifica mis datos de contacto (GitHub, LinkedIn, teléfono) con la ubicación en el mapa. El mapa apunta exactamente a las coordenadas indicadas en la consigna: `-34.9215, -57.9536` (Catedral de La Plata).

### Diseño responsivo

- Hasta 480px: 1 columna
- De 481px a 767px: 2 columnas
- De 768px a 1023px: 3 columnas
- 1024px en adelante: 4 columnas

El enfoque fue mobile-first: primero diseñé para el celular y después fui agregando columnas a medida que crece el viewport.

---

## Problemas técnicos que tuve que resolver

**El problema de las imágenes de Last.fm**

Last.fm no tiene permiso para mostrar fotos de todos los artistas. Cuando no tiene imagen, a veces devuelve una URL que termina en un archivo llamado `2a96ace8` (una estrella gris genérica). Detectar eso y reemplazarlo fue clave para que las cards no se vieran rotas:

```js
if (!url || url.includes('2a96ace8')) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}...`;
}
```

El fallback genera un avatar con las iniciales del artista en los colores de la app.

**El adaptador de imágenes en renderArtists**

Cuando renderizo artistas que vienen de la API, la imagen es un array de objetos. Cuando vienen del localStorage (historial), la guardé directamente como string. Para que la misma función `renderArtists` manejara los dos casos sin duplicar código:

```js
const imgUrl = typeof artist.image === 'string'
    ? artist.image
    : getValidImageUrl(artist.image, artist.name);
```

---

## Etapa PWA (PLUS)

Agregué tres cosas para convertir la app en una PWA instalable:

**manifest.json** — define el nombre, los íconos (192px y 512px, archivos locales en `/icons/`), el color de tema `#E2FF00` y el modo `standalone` para que se abra sin la barra del navegador.

**sw.js** — el service worker implementa una estrategia cache-first: intercepta cada request y lo responde desde la cache si existe. Si no existe, va a la red y lo guarda. En la activación limpia versiones viejas de la cache.

**Funcionamiento offline** — los archivos del shell (HTML, CSS, JS, íconos y fuentes externas) quedan cacheados en la instalación. Si el usuario abre la app sin conexión, la interfaz carga. Si intenta buscar, aparece el mensaje de error de red que implementé en cada función de fetch.

---
