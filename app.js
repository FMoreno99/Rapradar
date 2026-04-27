// ==========================================
// CONFIGURAÇÕES E ESTADO GLOBAL
// ==========================================
const API_KEY = 'b03bf9eaecbc4475d6d9e97a82894b53';
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

let paginaActual = 1;
let currentArtistForFav = '';
let selectedStyle = '';
let currentArtistData = null;

// Função de Fallback para Imagens (Gera iniciais se o Last.fm falhar)
function getValidImageUrl(imageArray, artistName) {
    let url = (imageArray && imageArray.length > 0) ? imageArray[imageArray.length - 1]['#text'] : '';
    // Se a imagem for a "estrela genérica" ou estiver vazia, gera o avatar neon
    if (!url || url.includes("2a96ace8")) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=1a1a1a&color=E2FF00&size=300&font-size=0.33`;
    }
    return url;
}

// ==========================================
// NAVEGAÇÃO
// ==========================================
function navigate(viewId) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const vistaActiva = document.getElementById(`${viewId}-view`);
    if (vistaActiva) {
        vistaActiva.style.display = 'block';
        window.scrollTo(0, 0);
    }

    if (viewId === 'home') loadFeaturedArtists();
    if (viewId === 'historico') renderHistory();
    if (viewId === 'favoritos') renderFavorites();
}

// ==========================================
// CHAMADAS DE API
// ==========================================
async function loadFeaturedArtists() {
    const container = document.getElementById('featured-list');
    container.innerHTML = '<p class="loading-msg">Cargando artistas destacados...</p>';
    const url = `${BASE_URL}?method=tag.gettopartists&tag=rap&api_key=${API_KEY}&format=json&limit=10`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        renderArtists(data.topartists.artist, 'featured-list');
    } catch (e) { console.error("Erro ao carregar home:", e); }
}

async function searchArtists(reset = true) {
    if (reset) {
        paginaActual = 1;
        document.getElementById('search-results').innerHTML = '';
    }
    const query = document.getElementById('search-input').value.trim();
    const limit = document.getElementById('limit-filter').value;
    const genre = document.getElementById('genre-filter').value;
    const orden = document.getElementById('order-filter').value;

    const container = document.getElementById('search-results');
    if (reset) container.innerHTML = '<p class="loading-msg">Buscando...</p>';

    // Si hay texto buscamos por nombre, si no traemos el top del género elegido
    let url = query
        ? `${BASE_URL}?method=artist.search&artist=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=${limit}&page=${paginaActual}`
        : `${BASE_URL}?method=tag.gettopartists&tag=${genre}&api_key=${API_KEY}&format=json&limit=${limit}&page=${paginaActual}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const resultados = data.results ? data.results.artistmatches.artist : data.topartists.artist;
        renderArtists(resultados, 'search-results', !reset);
        document.getElementById('pagination-container').style.display = 'block';
    } catch (e) { alert("Error al buscar."); }
}

function loadMoreResults() { paginaActual++; searchArtists(false); }

async function viewDetail(artistName) {
    navigate('detalle');
    document.getElementById('detail-content').innerHTML = '<p class="loading-msg">Cargando información del artista...</p>';

    const url = `${BASE_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const artist = data.artist;
        currentArtistData = artist;

        let detailImg = getValidImageUrl(artist.image, artist.name);
        let bioHtml = artist.bio && artist.bio.content ? artist.bio.content : 'Sin biografía.';
        bioHtml = bioHtml.split('<a')[0].trim(); 

        document.getElementById('detail-content').innerHTML = `
            <div class="detail-wrapper">
                <img src="${img}" alt="${artist.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=1a1a1a&color=E2FF00&size=500'">
                <h2>${artist.name}</h2>
                <div class="bio">${bio}</div>
                <div class="actions">
                    <button onclick="openFavoriteForm('${artist.name.replace(/'/g, "\\'")}')" class="btn-primary">AÑADIR A MI CREW</button>
                    <button onclick="navigate('busca')" class="btn-secondary">VOLVER</button>
                </div>
            </div>
        `;
        saveToHistory(artist); 
        navigate('detalle');
    } catch (e) { console.error("Erro no detalhe:", e); }
}

// ==========================================
// MI CREW (FAVORITOS)
// ==========================================
function openFavoriteForm(artistName) {
    currentArtistForFav = artistName;
    document.getElementById('modal-artist-name').innerText = artistName;
    
    let imgForModal = getValidImageUrl(currentArtistData.image, artistName);
    document.getElementById('modal-artist-img').src = imgForModal;

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
    if (favorites.some(f => f.priority === priority)) {
        return alert(`La prioridad ${priority} ya está en uso. Elige otro número.`);
    }

    if (isNaN(priority) || priority <= 0 || !selectedStyle) {
        return alert("Completa la prioridad y el estilo.");
    }

    let imgToSave = getValidImageUrl(currentArtistData.image, currentArtistForFav);
    let bioToSave = (currentArtistData.bio && currentArtistData.bio.content) ? currentArtistData.bio.content : 'Sin biografía.';
    bioToSave = bioToSave.split('<a')[0].trim();

    favorites.push({ name: currentArtistForFav, priority, category: selectedStyle, note, image: img, bio });
    favorites.sort((a, b) => a.priority - b.priority);
    localStorage.setItem('favorites', JSON.stringify(favorites));

    closeFavModal();
    showToast(`¡${currentArtistForFav} fue reclutado para tu Crew!`);
}

function closeFavModal() { document.getElementById('fav-modal').style.display = 'none'; }

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

// ==========================================
// HISTÓRICO
// ==========================================
function saveToHistory(artist) {
    let history = JSON.parse(localStorage.getItem('history')) || [];
    // Si ya estaba, lo sacamos para que quede primero de vuelta
    history = history.filter(item => item.name !== artist.name);
    
    // CORREÇÃO: Salva a URL final (string) para persistência
    let finalImageUrl = getValidImageUrl(artist.image, artist.name);
    
    history.unshift({ 
        name: artist.name, 
        image: finalImageUrl 
    });
    
    // Limitar persistencia a 15 items
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

// ==========================================
// RENDERIZADOR UNIVERSAL (CORRIGIDO)
// ==========================================
function renderArtists(artists, containerId, append = false) {
    const container = document.getElementById(containerId);
    if (!append) container.innerHTML = '';

    artists.forEach(artist => {
        const card = document.createElement('article');
        card.className = 'artist-card';
        
        // CORREÇÃO PARA O RECENTES:
        // Se 'artist.image' já for uma string (URL do Histórico), usa ela.
        // Se for um objeto (Vindo da API), passa pela função de validação.
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

// Init / Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    navigate('home');
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', e => {
            const target = e.target.getAttribute('href').replace('#', '');
            if (target) { e.preventDefault(); navigate(target); }
        });
    });
});
