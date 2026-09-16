```dataviewjs
// --- 1. SEARCH INPUT UI ---
const searchContainer = dv.el("div", "", { cls: "music-search-container" });
searchContainer.style.marginBottom = "20px";

const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.placeholder = "🔍 Search artist or album...";
searchInput.style.width = "100%";
searchInput.style.padding = "10px 14px";
searchInput.style.fontSize = "14px";
searchInput.style.borderRadius = "6px";
searchInput.style.border = "1px solid var(--background-modifier-border)";
searchInput.style.backgroundColor = "var(--background-primary)";
searchInput.style.color = "var(--text-normal)";
searchContainer.appendChild(searchInput);

// --- 2. CONTAINER FOR THE GRID ---
const gridContainer = dv.el("div", "", { cls: "music-log-grid" });

// Rating label lookup map
const ratingLabels = {
    0.5: "HATE IT",
    1: "DISLIKE",
    1.5: "NOT GOOD",
    2: "OKAY",
    2.5: "DECENT",
    3: "GOOD",
    3.5: "REALLY GOOD",
    4: "GREAT",
    4.5: "AMAZING",
    5: "ALL TIME BANGER"
};

// Helper to parse DD/MM/YYYY into a real Date object for correct sorting
const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date(0);
    return new Date(parts[2], parts[1] - 1, parts[0]);
};

// Function to render the grid based on search input and folder source
function renderGrid(filterText = "") {
    gridContainer.innerHTML = ""; // Clear current grid

    // Pull pages from your Music Logs folder and filter out templates
    const pages = dv.pages('"Music Logs"').where(p => p.artist && p.album && p.artist !== "{{VALUE:artist}}");

    const filteredPages = pages.filter(p => {
        const query = filterText.toLowerCase();
        const artist = (p.artist || "").toLowerCase();
        const album = (p.album || "").toLowerCase();
        return artist.includes(query) || album.includes(query);
    });

    if (filteredPages.length === 0) {
        gridContainer.innerHTML = "<p style='color: var(--text-muted); padding: 10px;'>No matching music logs found.</p>";
        return;
    }

    // Sort chronologically using true Date objects (descending: newest first)
    const sortedPages = filteredPages.sort(p => {
        const dateVal = p.listen_date || p["listen-date"];
        return parseDate(dateVal).getTime();
    }, 'desc');

    for (let p of sortedPages) {
        let cover = p.cover ? `<img src="${p.cover}" class="log-card-cover"/>` : `<div class="log-card-nocover">🎵</div>`;
        let artist = p.artist || "Unknown Artist";
        let album = p.album || "Unknown Album";
        
        // Rating calculation with half-star handling
        let rawRating = Number(p.rating) || 0;
        let wholeStars = Math.floor(rawRating);
        let hasHalf = rawRating % 1 !== 0;
        let ratingStr = "⭐".repeat(wholeStars) + (hasHalf ? "½" : "");
        
        // Grab the label and wrap it in inline styles for bold and orange color
        let textLabel = ratingLabels[rawRating] ? ratingLabels[rawRating] : "";
        let ratingLabel = textLabel ? ` <span style="color: #ff8c00; font-weight: bold; margin-left: 6px;">— ${textLabel}</span>` : "";
        
        let date = p.listen_date || p["listen-date"] || "";
        let year = p.releaseYear || p["release-year"] || "";

        let card = gridContainer.createEl("div", { cls: "music-log-card" });
        
        // Make the card clickable to open the respective note
        card.style.cursor = "pointer";
        card.onclick = () => app.workspace.openLinkText(p.file.name, "", false);

        card.innerHTML = `
            <div class="card-image">${cover}</div>
            <div class="card-content">
                <div class="card-artist">${artist}</div>
                <div class="card-album">${album}</div>
                ${year ? `<div class="card-year">Release Year: ${year}</div>` : ''}
                <div class="card-meta-grid">
                    <div class="meta-block">
                        <span class="meta-label">Rating</span>
                        <span class="card-rating">${ratingStr}${ratingLabel}</span>
                    </div>
                    <div class="meta-block">
                        <span class="meta-label">Listened on</span>
                        <span class="card-date">${date}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// --- 3. EVENT LISTENER FOR LIVE FILTERING ---
searchInput.addEventListener("input", (e) => {
    renderGrid(e.target.value);
});

// Initial render on load
renderGrid();