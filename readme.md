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

### 1. Home (Punto de partida)
La Home no es solo una presentación. Apenas carga, dispara un `fetch` para traer los 10 artistas más "pegados" de Rap. La idea es que el usuario entre y ya vea movimiento, sin tener que buscar nada de entrada. Cumple la función de "Resultados destacados" que pedía la consigna.

### 2. Búsqueda y Filtros (El corazón de la App)
Acá implementé los tres filtros que se pedían. Los pensé así:
* **Buscador:** Por nombre del artista.
* **Resultados:** Podés elegir ver 10 o 20 ítems.
* **Género:** Un selector para filtrar por Trap, Drill o Boombap.

Lo bueno es que si dejás el nombre vacío pero elegís un género, la app te trae el ranking mundial de esa categoría automáticamente. Agregué un botón de "Cargar más" para que la navegación sea fluida y no explote la pantalla del celular con mil fotos.

### 3. Detalle (Data completa)
Cuando elegís un artista, la app vuela a buscar toda su info. Acá me esforcé por mostrar la **biografía completa**. Un detalle: Last.fm manda el texto con un link de "Read more" que queda horrible en una app móvil, así que usé lógica de JS para limpiar ese string y mostrar solo el contenido real, logrando una interfaz mucho más limpia.

### 4. Mi Crew - Favoritos (Variante B)
Elegí la Variante B de la consigna (preferencias personalizadas). Al reclutar un artista, el usuario tiene que elegir una prioridad y un estilo. 
* **Validación manual:** No usé solo el `required` de HTML. Programé validaciones en JS para que la prioridad sea un número mayor a cero y, lo más importante, **que no se repita**. No podés tener a dos tipos ocupando el mismo puesto en el ranking.

### 5. Recientes (Historial)
Es totalmente automático. Cada vez que entrás a un detalle, se guarda en el LocalStorage. Usé el método `.unshift()` para que el último que visitaste sea siempre el primero que ves al entrar a la vista de Recientes.

### 6. Contacto (Estudio y Ubicación)
En lugar de cuadros sueltos, armé un "Super Card" con efecto de vidrio que unifica mi data (LinkedIn, GitHub, Teléfono) con el mapa. El mapa está clavado en la **Catedral de La Plata** con las coordenadas exactas que pedía el TP.

---
