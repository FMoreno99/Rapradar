const API_KEY = 'b03bf9eaecbc4475d6d9e97a82894b53';
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

let paginaActual = 1;
let currentArtistForFav = '';
let selectedStyle = '';
let currentArtistData = null;

let lastSearchResults = [];
let lastSearchParams  = { query: '', limit: '10', genre: 'rap', order: 'relevance', country: '' };

function getValidImageUrl(imageArray, artistName) {
    let url = (imageArray && imageArray.length > 0) ? imageArray[imageArray.length - 1]['#text'] : '';
    if (!url || url.includes('2a96ace8')) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=1a1a1a&color=E2FF00&size=300&font-size=0.33`;
    }
    return url;
}

function navigate(viewId) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const vista = document.getElementById(`${viewId}-view`);
    if (vista) {
        vista.style.display = 'block';
        window.scrollTo(0, 0);
    }
    if (viewId === 'home')      loadFeaturedArtists();
    if (viewId === 'historico') renderHistory();
    if (viewId === 'favoritos') renderFavorites();
    if (viewId === 'busca')     restoreSearchResults();
}

function restoreSearchResults() {
    if (lastSearchResults.length === 0) return;

    document.getElementById('search-input').value   = lastSearchParams.query;
    document.getElementById('limit-filter').value   = lastSearchParams.limit;
    document.getElementById('genre-filter').value   = lastSearchParams.genre;
    document.getElementById('order-filter').value   = lastSearchParams.order;
    document.getElementById('country-filter').value = lastSearchParams.country;

    const container = document.getElementById('search-results');
    container.innerHTML = '';
    renderArtists(lastSearchResults, 'search-results');
    document.getElementById('pagination-container').style.display = 'block';
}

async function loadFeaturedArtists() {
    const container = document.getElementById('featured-list');
    container.innerHTML = '<p class="loading-msg">Cargando artistas destacados...</p>';
    const url = `${BASE_URL}?method=tag.gettopartists&tag=rap&api_key=${API_KEY}&format=json&limit=10`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        renderArtists(data.topartists.artist, 'featured-list');
    } catch (e) {
        const history = JSON.parse(localStorage.getItem('history')) || [];
        if (history.length > 0) {
            container.innerHTML = '<p class="offline-msg">⚠️ Sin conexión. Mostrando artistas visitados recientemente.</p>';
            renderArtists(history, 'featured-list');
        } else {
            container.innerHTML = '<p class="error-msg-global">No se pudieron cargar los artistas. Verificá tu conexión e intentá de nuevo.</p>';
        }
        console.error(e);
    }
}

async function searchArtists(reset = true) {
    if (reset) {
        paginaActual = 1;
        document.getElementById('search-results').innerHTML = '';
    }

    const query   = document.getElementById('search-input').value.trim();
    const limit   = document.getElementById('limit-filter').value;
    const genre   = document.getElementById('genre-filter').value;
    const orden   = document.getElementById('order-filter').value;
    const country = document.getElementById('country-filter').value.trim();

    lastSearchParams = { query, limit, genre, order: orden, country };

    const container = document.getElementById('search-results');
    if (reset) container.innerHTML = '<p class="loading-msg">Buscando...</p>';

    let url;
    if (query) {
        url = `${BASE_URL}?method=artist.search&artist=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=${limit}&page=${paginaActual}`;
    } else if (country) {
        url = `${BASE_URL}?method=geo.gettopartists&country=${encodeURIComponent(country)}&api_key=${API_KEY}&format=json&limit=${limit}&page=${paginaActual}`;
    } else {
        url = `${BASE_URL}?method=tag.gettopartists&tag=${genre}&api_key=${API_KEY}&format=json&limit=${limit}&page=${paginaActual}`;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Cada endpoint de Last.fm devuelve los artistas en una clave distinta
        const resultados = data.results?.artistmatches?.artist
                        || data.topartists?.artist
                        || [];

        if (!resultados || resultados.length === 0) {
            container.innerHTML = '<p class="error-msg-global">No se encontraron artistas. Probá con otro nombre o filtro.</p>';
            document.getElementById('pagination-container').style.display = 'none';
            lastSearchResults = [];
            return;
        }

        let ordenados = [...resultados];
        if (orden === 'az') {
            ordenados.sort((a, b) => a.name.localeCompare(b.name));
        } else if (orden === 'za') {
            ordenados.sort((a, b) => b.name.localeCompare(a.name));
        }

        if (reset) {
            container.innerHTML = '';
            lastSearchResults = [];
        }

        lastSearchResults = [...lastSearchResults, ...ordenados];

        renderArtists(ordenados, 'search-results', !reset);
        document.getElementById('pagination-container').style.display = 'block';
    } catch (e) {
        container.innerHTML = '<p class="error-msg-global">Error de red. Verificá tu conexión e intentá nuevamente.</p>';
        lastSearchResults = [];
    }
}

function loadMoreResults() {
    paginaActual++;
    searchArtists(false);
}

async function viewDetail(artistName) {
    const url = `${BASE_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const artist = data.artist;
        currentArtistData = artist;

        const img = getValidImageUrl(artist.image, artist.name);

        let bio = artist.bio?.content || 'Sin biografía disponible para este artista.';
        bio = bio.split('<a')[0].trim();

        document.getElementById('detail-content').innerHTML = `
            <div class="detail-wrapper">
                <img src="${img}" alt="${artist.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=1a1a1a&color=E2FF00&size=500'">
                <h2>${artist.name}</h2>
                <div class="bio">${bio}</div>
                <div class="actions" style="display:flex; gap:10px; margin-top:20px;">
                    <button onclick="openFavoriteForm('${artist.name.replace(/'/g, "\\'")}')" class="btn-primary">AÑADIR A MI CREW</button>
                    <button onclick="navigate('busca')" class="btn-secondary">VOLVER AL LISTADO</button>
                </div>
            </div>
        `;
        saveToHistory(artist);
        navigate('detalle');
    } catch (e) {
        const cached = getCachedArtist(artistName);
        if (cached) {
            document.getElementById('detail-content').innerHTML = `
                <div class="detail-wrapper">
                    <img src="${cached.image}" alt="${cached.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(cached.name)}&background=1a1a1a&color=E2FF00&size=500'">
                    <h2>${cached.name}</h2>
                    <p class="offline-msg" style="margin-bottom:20px;">⚠️ Sin conexión. Mostrando datos guardados localmente.</p>
                    <div class="bio">${cached.bio || 'Biografía no disponible sin conexión.'}</div>
                    <div class="actions" style="display:flex; gap:10px; margin-top:20px;">
                        <button onclick="navigate('busca')" class="btn-secondary">VOLVER AL LISTADO</button>
                    </div>
                </div>
            `;
            navigate('detalle');
        } else {
            document.getElementById('detail-content').innerHTML = '<p class="error-msg-global">Sin conexión. No hay datos guardados para este artista.</p>';
            navigate('detalle');
        }
        console.error(e);
    }
}

function getCachedArtist(name) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const fav = favorites.find(f => f.name === name);
    if (fav) return fav;
    const history = JSON.parse(localStorage.getItem('history')) || [];
    return history.find(h => h.name === name) || null;
}

function openFavoriteForm(artistName) {
    currentArtistForFav = artistName;
    document.getElementById('modal-artist-name').innerText = artistName;
    document.getElementById('modal-artist-img').src = getValidImageUrl(currentArtistData.image, artistName);

    document.getElementById('fav-priority').value = '';
    document.getElementById('fav-note').value = '';
    document.getElementById('char-counter').textContent = '0/200';
    selectedStyle = '';
    document.querySelectorAll('.btn-style').forEach(b => b.classList.remove('active'));
    clearFieldError('priority-error');
    clearFieldError('style-error');

    document.getElementById('fav-modal').style.display = 'flex';
}

function selectStyle(style) {
    selectedStyle = style;
    document.querySelectorAll('.btn-style').forEach(b => {
        b.classList.toggle('active', b.innerText === style.toUpperCase());
    });
    clearFieldError('style-error');
}

function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function clearFieldError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
}

function confirmFavorite() {
    const priorityVal = document.getElementById('fav-priority').value;
    const priority    = parseInt(priorityVal);
    const note        = document.getElementById('fav-note').value.trim();

    clearFieldError('priority-error');
    clearFieldError('style-error');

    let hasError  = false;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (priorityVal === '' || isNaN(priority) || priority <= 0) {
        showFieldError('priority-error', 'Ingresá un número mayor a cero.');
        hasError = true;
    } else if (favorites.some(f => f.priority === priority)) {
        showFieldError('priority-error', `La prioridad ${priority} ya está en uso. Elegí otro número.`);
        hasError = true;
    }

    if (!selectedStyle) {
        showFieldError('style-error', 'Seleccioná un estilo musical.');
        hasError = true;
    }

    if (hasError) return;

    const img = getValidImageUrl(currentArtistData.image, currentArtistForFav);
    let bio = currentArtistData.bio?.content || 'Sin biografía.';
    bio = bio.split('<a')[0].trim();

    favorites.push({ name: currentArtistForFav, priority, category: selectedStyle, note, image: img, bio });
    favorites.sort((a, b) => a.priority - b.priority);
    localStorage.setItem('favorites', JSON.stringify(favorites));

    closeFavModal();
    showToast(`¡${currentArtistForFav} fue reclutado para tu Crew!`);
}

function closeFavModal() {
    document.getElementById('fav-modal').style.display = 'none';
}

function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const container = document.getElementById('favorites-list');
    container.innerHTML = '';

    if (favorites.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay artistas en tu crew todavía. Explorá y reclutá tus MCs favoritos.</p>';
        return;
    }

    favorites.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'artist-card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=1a1a1a&color=E2FF00&size=300'">
            <h3 style="color:var(--neon-yellow)">${item.name}</h3>
            <p><span class="badge">${item.category}</span> | Rank: #${item.priority}</p>
            <div class="fav-bio">${item.bio}</div>
            <p class="fav-note">" ${item.note || 'Sin nota'} "</p>
            <button onclick="removeFavorite(${index})" class="btn-secondary" style="width:100%; margin-top:auto;">ELIMINAR</button>
        `;
        container.appendChild(card);
    });
}

function removeFavorite(index) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const nombre  = favorites[index].name;
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    showToast(`${nombre} fue eliminado de tu Crew.`);
}

function saveToHistory(artist) {
    let history = JSON.parse(localStorage.getItem('history')) || [];
    history = history.filter(item => item.name !== artist.name);
    history.unshift({
        name: artist.name,
        image: getValidImageUrl(artist.image, artist.name)
    });
    localStorage.setItem('history', JSON.stringify(history.slice(0, 15)));
}

function renderHistory() {
    const history   = JSON.parse(localStorage.getItem('history')) || [];
    const container = document.getElementById('history-list');

    if (history.length === 0) {
        container.innerHTML = '<p class="empty-msg">Todavía no visitaste ningún artista. ¡Explorá y volvé acá!</p>';
        return;
    }
    renderArtists(history, 'history-list');
}

function renderArtists(artists, containerId, append = false) {
    const container = document.getElementById(containerId);
    if (!append) container.innerHTML = '';

    artists.forEach(artist => {
        const card = document.createElement('article');
        card.className = 'artist-card';

        const imgUrl = typeof artist.image === 'string'
            ? artist.image
            : getValidImageUrl(artist.image, artist.name);

        card.innerHTML = `
            <img src="${imgUrl}" alt="${artist.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=1a1a1a&color=E2FF00&size=300'">
            <h3>${artist.name}</h3>
            <button onclick="viewDetail('${artist.name.replace(/'/g, "\\'")}')" class="btn-primary" style="margin-top:auto;">DETALLES</button>
        `;
        container.appendChild(card);
    });
}

function initCharCounter() {
    const textarea = document.getElementById('fav-note');
    const counter  = document.getElementById('char-counter');
    if (!textarea || !counter) return;

    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        counter.textContent = `${len}/200`;
        counter.style.color = len > 180 ? '#ff6b6b' : '#777';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    navigate('home');
    initCharCounter();

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', e => {
            const target = e.target.getAttribute('href').replace('#', '');
            if (target) {
                e.preventDefault();
                navigate(target);
            }
        });
    });
});