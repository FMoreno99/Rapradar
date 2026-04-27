// Config & Global State
const API_KEY = 'b03bf9eaecbc4475d6d9e97a82894b53';
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';
let paginaActual = 1;
let currentArtistForFav = '';
let selectedStyle = '';
let currentArtistData = null; 

// Helpers & Utils
function getValidImageUrl(imageArray, artistName) {
    let url = (imageArray && imageArray.length > 0) ? imageArray[imageArray.length - 1]['#text'] : '';
    
    // Fallback generador de avatares para imágenes rotas/bloqueadas de Last.fm
    if (!url || url.includes("2a96ace8")) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=1a1a1a&color=E2FF00&size=300&font-size=0.33`;
    }
    return url;
}

// SPA Router
function navigate(viewId) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const vistaActiva = document.getElementById(`${viewId}-view`);
    
    if (vistaActiva) {
        vistaActiva.style.display = 'block';
        window.scrollTo(0, 0);
    }

    // View Controllers
    if (viewId === 'home') loadFeaturedArtists();
    if (viewId === 'historico') renderHistory();
    if (viewId === 'favoritos') renderFavorites();
}

// API Services
async function loadFeaturedArtists() {
    const url = `${BASE_URL}?method=tag.gettopartists&tag=rap&api_key=${API_KEY}&format=json&limit=10`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        renderArtists(data.topartists.artist, 'featured-list');
    } catch (e) { 
        console.error("Fetch error (loadFeaturedArtists):", e); 
    }
}

async function searchArtists(reset = true) {
    if (reset) { 
        paginaActual = 1; 
        document.getElementById('search-results').innerHTML = ''; 
    }
    
    const query = document.getElementById('search-input').value.trim();
    const limit = document.getElementById('limit-filter').value;
    const genre = document.getElementById('genre-filter').value;

    let url = query 
        ? `${BASE_URL}?method=artist.search&artist=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=${limit}&page=${paginaActual}`
        : `${BASE_URL}?method=tag.gettopartists&tag=${genre}&api_key=${API_KEY}&format=json&limit=${limit}&page=${paginaActual}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const resultados = data.results ? data.results.artistmatches.artist : data.topartists.artist;
        
        renderArtists(resultados, 'search-results', !reset);
        document.getElementById('pagination-container').style.display = 'block';
    } catch (e) { 
        alert("Error de red al buscar. Intente nuevamente."); 
    }
}

function loadMoreResults() { 
    paginaActual++; 
    searchArtists(false); 
}

async function viewDetail(artistName) {
    const url = `${BASE_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const artist = data.artist;
        
        currentArtistData = artist; 

        let detailImg = getValidImageUrl(artist.image, artist.name);
        let bioHtml = artist.bio && artist.bio.content ? artist.bio.content : 'Sin biografía.';
        
        // Limpieza de markup inyectado por la API
        bioHtml = bioHtml.split('<a')[0].trim(); 

        document.getElementById('detail-content').innerHTML = `
            <div class="detail-wrapper">
                <img src="${detailImg}" alt="${artist.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=1a1a1a&color=E2FF00&size=500'">
                <h2>${artist.name}</h2>
                <div class="bio">${bioHtml}</div>
                <div class="actions" style="display:flex; gap:10px; margin-top:20px;">
                    <button onclick="openFavoriteForm('${artist.name.replace(/'/g, "\\'")}')" class="btn-primary">AÑADIR A MI CREW</button>
                    <button onclick="navigate('busca')" class="btn-secondary">VOLVER</button>
                </div>
            </div>
        `;
        saveToHistory(artist); 
        navigate('detalle');
    } catch (e) { 
        console.error("Fetch error (viewDetail):", e); 
    }
}

// Module: Favorites (Mi Crew)
function openFavoriteForm(artistName) {
    currentArtistForFav = artistName;
    document.getElementById('modal-artist-name').innerText = artistName;
    document.getElementById('modal-artist-img').src = getValidImageUrl(currentArtistData.image, artistName);
    
    // Reset modal state
    document.getElementById('fav-priority').value = '';
    document.getElementById('fav-note').value = '';
    selectedStyle = ''; 
    document.querySelectorAll('.btn-style').forEach(b => b.classList.remove('active'));
    
    document.getElementById('fav-modal').style.display = 'flex';
}

function selectStyle(style) {
    selectedStyle = style;
    document.querySelectorAll('.btn-style').forEach(b => b.classList.toggle('active', b.innerText === style.toUpperCase()));
}

function confirmFavorite() {
    const priority = parseInt(document.getElementById('fav-priority').value);
    const note = document.getElementById('fav-note').value.trim();

    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // Reglas de negocio: Prioridad única
    if (favorites.some(f => f.priority === priority)) {
        return alert(`La prioridad ${priority} ya está en uso. Elige otro número.`);
    }

    if (isNaN(priority) || priority <= 0 || !selectedStyle) {
        return alert("Completa la prioridad y el estilo.");
    }

    let imgToSave = getValidImageUrl(currentArtistData.image, currentArtistForFav);
    let bioToSave = (currentArtistData.bio && currentArtistData.bio.content) ? currentArtistData.bio.content : 'Sin biografía.';
    bioToSave = bioToSave.split('<a')[0].trim();

    const newItem = { 
        name: currentArtistForFav, priority, category: selectedStyle, note, image: imgToSave, bio: bioToSave
    };

    favorites.push(newItem);
    favorites.sort((a, b) => a.priority - b.priority); 
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    closeFavModal();
    alert("¡Guardado en tu Crew!");
}

function closeFavModal() { 
    document.getElementById('fav-modal').style.display = 'none'; 
}

function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const container = document.getElementById('favorites-list');
    container.innerHTML = '';
    
    if (favorites.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay artistas en tu crew.</p>';
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
            <button onclick="removeFavorite(${index})" class="btn-secondary" style="width:100%; margin-top: auto;">ELIMINAR</button>
        `;
        container.appendChild(card);
    });
}

function removeFavorite(index) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

// Module: History Tracker
function saveToHistory(artist) {
    let history = JSON.parse(localStorage.getItem('history')) || [];
    history = history.filter(item => item.name !== artist.name);
    
    history.unshift({ 
        name: artist.name, 
        image: getValidImageUrl(artist.image, artist.name) 
    });
    
    // Limitar persistencia a 15 items
    localStorage.setItem('history', JSON.stringify(history.slice(0, 15)));
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('history')) || [];
    renderArtists(history, 'history-list');
}

// Shared UI Renderers
function renderArtists(artists, containerId, append = false) {
    const container = document.getElementById(containerId);
    if (!append) container.innerHTML = ''; 
    
    artists.forEach(artist => {
        const card = document.createElement('article');
        card.className = 'artist-card';
        
        // Adaptador de payload (API object vs LocalStorage string)
        let imgUrl = typeof artist.image === 'string' 
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

// Init / Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    navigate('home');
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = e.target.getAttribute('href').replace('#', '');
            if (target) { 
                e.preventDefault(); 
                navigate(target); 
            }
        });
    });
});
