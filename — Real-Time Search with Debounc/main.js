const input = document.querySelector("#searchInput");
const resultsEl = document.querySelector("#results");
const recentEl = document.querySelector("#recentSection");

let controller = null;
let lastResults = [];
let focusIndex = -1;

// LocalStorage
function getRecent () {
    return JSON.parse(localStorage.getItem("musicSearchRecent") || "[]");
}

function addRecent(query) {
    const recent = [query, ...getRecent().filter(q => q !== query)].slice(0, 6);
    localStorage.setItem("musicSearchRecent", JSON.stringify(recent));
    renderRecent();
}

function renderRecent() {
    const recent = getRecent();
    recentEl.style.display = recent.length ? "block" : "none";

    document.querySelector("#recentTags").innerHTML =
        recent.map(q => `<button class='recent-tag' data-query='${q}'>${q}</button>`).join('');
}

// Debounce
function debounce (fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    }
}

// Search
async function search(query) {
    if(!query.trim()) {
        resultsEl.innerHTML = "";
        return;
    }

    if(controller) controller.abort();
    controller = new AbortController();

    resultsEl.innerHTML = `<div class="status">Searching...</div>`;
    focusIndex = -1;

    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=8&media=music`;
        const res = await fetch(url, {signal: controller.signal});
        const data = await res.json();

        lastResults = data.results;
        renderResults(data.results, query);

    } catch (error) {
        if(error.name === "AbortError") return;
        resultsEl.innerHTML = `<div class="status">Search failed. Try again.</div>`;
    }
}

function renderResults(results, query) {
    if(!results.length) {
        resultsEl.innerHTML = `<div class="status">No results for "${query}"`;
        return;
    }

    resultsEl.innerHTML = results.map((r, i) => `
        <div class='result-item' data-index='${i}'>
            <img src='${r.artworkUrl60}' loading='lazy'>
            <div>
                <div>${r.trackName || r.collectionName || r.artistName}</div>
                <div>${r.artistName}</div>
            </div>
        </div>
    `).join('');
}

// Keyboard
input.addEventListener("keydown", (e) => {
    const items = resultsEl.querySelectorAll(".result-item");
    if(!items.length) return;

    if(e.key === "ArrowDown") {
        e.preventDefault();
        items[focusIndex]?.classList.remove("is-focused");
        focusIndex = Math.min(focusIndex + 1, items.length - 1);
        items[focusIndex]?.classList.add("is-focused");
    }

    if(e.key === "ArrowUp") {
        e.preventDefault();
        items[focusIndex]?.classList.remove("is-focused");
        focusIndex = Math.max(focusIndex - 1, 0);
        items[focusIndex]?.classList.add("is-focused");
    }

    if(e.key === "Enter" && focusIndex >= 0) {
        const result = lastResults[focusIndex];
        addRecent(input.value);
        alert(`Selected: ${result.trackName || result.artistName}`);
    }

    if(e.key === "Escape") {
        resultsEl.innerHTML = "";
        input.blur();
    }
});

const debouncedSearch = debounce(search, 300);
input.addEventListener("input", (e) => debouncedSearch(e.target.value));

// Result click
resultsEl.addEventListener("click", e => {
    const item = e.target.closest(".result-item");
    if(!item) return;

    const idx = Number(item.dataset.index);
    const result = lastResults[idx];

    addRecent(input.value);
    alert(`Selected: ${result.trackName || result.artistName}`);
});

// Recent click
document.querySelector("#recentTags").addEventListener("click", e => {
    const tag = e.target.closest(".recent-tag");
    if(!tag) return;

    input.value = tag.dataset.query;
    search(tag.dataset.query);
});

renderRecent();