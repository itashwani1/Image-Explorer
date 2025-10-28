
const ACCESS_KEY = "iRbNUDd1ib-EeWD6LmiIyuTpeZFp31ftCEe6VS1BsHs"; 
const PER_PAGE = 30;
let page = 2;
let totalPages = Infinity;
let query = "";
let loading = false;

const grid = document.getElementById("grid");
const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("search-btn");
const randomBtn = document.getElementById("random-btn");
const loader = document.getElementById("loader");
const favToggle = document.getElementById("fav-toggle");
const favCount = document.getElementById("fav-count");
const favPanel = document.getElementById("favorites-panel");
const favList = document.getElementById("fav-list");
const favEmpty = document.getElementById("fav-empty");
const closeFavs = document.getElementById("close-favs");
const clearFavs = document.getElementById("clear-favs");
const themeToggle = document.getElementById("theme-toggle");

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalClose = document.getElementById("modal-close");
const modalAuthor = document.getElementById("modal-author");
const modalDesc = document.getElementById("modal-desc");
const downloadBtn = document.getElementById("download-btn");
const unsplashLink = document.getElementById("unsplash-link");
const endMsg = document.getElementById("end-msg");

// local favorites
let favorites = JSON.parse(localStorage.getItem("ie_favs") || "{}");

// restore theme
if (localStorage.getItem("ie_theme") === "light") document.body.classList.add("light");
themeToggle.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
updateFavUI();

// Helper to escape HTML
function escapeHtml(s){ return String(s || "").replace(/[&<>\\\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }

// fetch photos from Unsplash
async function fetchPhotos(q = "", pageNum = 1) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${pageNum}&per_page=${PER_PAGE}&client_id=${ACCESS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// render photo cards
function renderPhotos(arr, append = true) {
  if (!append) grid.innerHTML = "";
  if (!arr || arr.length === 0) return;
  arr.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img loading="lazy" src="${p.urls.small}" alt="${escapeHtml(p.alt_description || 'photo')}" />
      <div class="card-meta">
        <div class="meta-left">
          <img class="avatar" src="${p.user.profile_image?.small || ''}" alt="${escapeHtml(p.user.name)}" />
          <div style="display:flex;flex-direction:column;">
            <div style="font-weight:700">${escapeHtml(p.user.name)}</div>
            <div style="font-size:12px;color:var(--muted)">❤ ${p.likes}</div>
          </div>
        </div>
        <div>
          <button class="like-btn" title="Save to favorites" data-id="${p.id}">❤</button>
        </div>
      </div>
    `;

    // open modal unless clicking like button
    card.addEventListener("click", (e) => {
      if (e.target.closest(".like-btn")) return;
      openModal(p);
    });

    const likeBtn = card.querySelector(".like-btn");
    likeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(p);
      likeBtn.classList.toggle("active", !!favorites[p.id]);
      updateFavUI();
    });
    if (favorites[p.id]) likeBtn.classList.add("active");

    grid.appendChild(card);
  });
}

// search
async function doSearch(q, reset = true) {
  if (loading) return;
  query = q || "";
  page = 2;
  totalPages = Infinity;
  endMsg.hidden = true;
  if (reset) grid.innerHTML = "";
  try {
    loading = true; showLoader(true);
    const data = await fetchPhotos(query, page);
    totalPages = data.total_pages || Infinity;
    renderPhotos(data.results, false);
    page++;
    if (!data.results.length) endMsg.hidden = false;
  } catch (err) {
    console.error(err);
    alert("Failed to fetch images. Check console for details.");
  } finally {
    loading = false; showLoader(false);
  }
}

// load more for infinite scroll
async function loadMore() {
  if (loading) return;
  if (page > totalPages) return;
  try {
    loading = true; showLoader(true);
    const data = await fetchPhotos(query, page);
    renderPhotos(data.results, true);
    page++;
    if (page > totalPages) endMsg.hidden = false;
  } catch (err) {
    console.error(err);
  } finally {
    loading = false; showLoader(false);
  }
}

function showLoader(show) { loader.hidden = !show; }

// modal
function openModal(photo) {
  modalImg.src = photo.urls.regular;
  modalAuthor.textContent = photo.user.name;
  modalDesc.textContent = photo.alt_description || photo.description || "";
  downloadBtn.href = photo.links.download + `?client_id=${ACCESS_KEY}`;
  unsplashLink.href = photo.links.html + "?utm_source=image_explorer&utm_medium=referral";
  modal.style.display = "flex"; modal.setAttribute("aria-hidden", "false");
}
function closeModal(){ modal.style.display = "none"; modal.setAttribute("aria-hidden", "true"); modalImg.src = ""; }
modalClose.addEventListener("click", closeModal);
window.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// favorites
function toggleFavorite(photo) {
  if (favorites[photo.id]) delete favorites[photo.id];
  else {
    favorites[photo.id] = {
      id: photo.id,
      small: photo.urls.small,
      regular: photo.urls.regular,
      author: photo.user.name,
      unsplash: photo.links.html,
      download: photo.links.download
    };
  }
  localStorage.setItem("ie_favs", JSON.stringify(favorites));
  renderFavList();
}
function updateFavUI() {
  const count = Object.keys(favorites).length;
  favCount.textContent = count;
  renderFavList();
}
function renderFavList(){
  favList.innerHTML = "";
  const keys = Object.keys(favorites);
  if (!keys.length) { favEmpty.style.display = "block"; favList.style.display = "none"; return; }
  favEmpty.style.display = "none"; favList.style.display = "flex";
  keys.forEach(k=>{
    const p = favorites[k];
    const item = document.createElement("div");
    item.className = "fav-item";
    item.innerHTML = `
      <img src="${p.small}" alt="${escapeHtml(p.author)}" />
      <div style="flex:1">
        <div style="font-weight:700">${escapeHtml(p.author)}</div>
        <div style="margin-top:6px;display:flex;gap:8px;">
          <a class="btn primary" href="${p.download}?client_id=${ACCESS_KEY}" target="_blank">Download</a>
          <a class="btn ghost" href="${p.unsplash}" target="_blank">Unsplash</a>
          <button class="btn ghost remove" data-id="${p.id}">Remove</button>
        </div>
      </div>`;
    item.querySelector(".remove").addEventListener("click", ()=>{
      delete favorites[p.id];
      localStorage.setItem("ie_favs", JSON.stringify(favorites));
      updateFavUI();
    });
    favList.appendChild(item);
  });
}

// theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  themeToggle.textContent = isLight ? "☀️" : "🌙";
  localStorage.setItem("ie_theme", isLight ? "light" : "dark");
});

// favorites panel handlers
favToggle.addEventListener("click", ()=> favPanel.classList.toggle("hidden"));
closeFavs?.addEventListener("click", ()=> favPanel.classList.add("hidden"));
clearFavs?.addEventListener("click", ()=>{
  if(!confirm("Clear all favorites?")) return;
  favorites = {}; localStorage.setItem("ie_favs", JSON.stringify(favorites)); updateFavUI();
});

// search & random
searchBtn.addEventListener("click", ()=> doSearch(searchInput.value.trim(), true));
searchInput.addEventListener("keydown", (e)=> { if(e.key === "Enter") doSearch(searchInput.value.trim(), true); });
randomBtn.addEventListener("click", ()=>{
  const samples = ["mountains","ocean","city","cats","dogs","food","sunset","travel","architecture"];
  const q = samples[Math.floor(Math.random()*samples.length)];
  searchInput.value = q; doSearch(q, true);
});

// infinite scroll (debounced)
let scrollTimer = null;
window.addEventListener("scroll", ()=>{
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(()=>{
    const nearBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 900);
    if (nearBottom && !loading && page <= totalPages) loadMore();
  }, 150);
});

// initial load
(async function init(){
  renderFavList();
  const defaultQuery = "nature";
  searchInput.value = defaultQuery;
  await doSearch(defaultQuery, true);
})();
