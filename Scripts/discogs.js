module.exports = async (params) => {
    const { quickAddApi } = params;
    
    const query = await quickAddApi.inputPrompt("Search Discogs for Album or Artist (or type 'manual' for manual entry):");
    if (!query) return;

    // --- MANUAL ENTRY OVERRIDE ROUTE ---
    if (query.trim().toLowerCase() === "manual") {
        const manArtist = await quickAddApi.inputPrompt("Manual Entry - Artist Name:");
        if (!manArtist) return;

        const manAlbum = await quickAddApi.inputPrompt("Manual Entry - Album Name:");
        if (!manAlbum) return;

        const manYear = await quickAddApi.inputPrompt("Manual Entry - Release Year:", "2024");
        if (!manYear) return;

        // Helper for today's date
        const getTodayDate = () => {
            const d = new Date();
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        global.lastListenDate = global.lastListenDate || getTodayDate();
        const manDate = await quickAddApi.inputPrompt("Manual Entry - Listen date (DD/MM/YYYY):", "DD/MM/YYYY", global.lastListenDate);
        if (!manDate) return;
        global.lastListenDate = manDate;

        const manRating = await quickAddApi.inputPrompt("Manual Entry - Rating out of 5:", "5", "5");
        if (!manRating) return;

        const manReview = await quickAddApi.wideInputPrompt("Manual Entry - Review / Thoughts (optional):", "");

        // Publish prompt for manual route
        const manPublish = await quickAddApi.yesNoPrompt("Publish?", "Do you want to publish this review?");

        const manCover = await quickAddApi.inputPrompt("Manual Entry - Cover Art URL (leave blank if none):", "https://");

        // Set all parameters for your template capture
        const sanitize = (str) => str ? str.replace(/[*"\\/<>:|?]/g, "").trim() : "";

        params.variables["artist"] = manArtist;
        params.variables["album"] = manAlbum;
        params.variables["releaseYear"] = manYear;
        params.variables["listenDate"] = manDate; // Stays DD/MM/YYYY in frontmatter
        params.variables["rating"] = Number(manRating);
        params.variables["review"] = manReview || "";
        params.variables["publish"] = manPublish; // true or false
        params.variables["cover"] = manCover && manCover !== "https://" ? manCover : "";
        params.variables["fileName"] = `${sanitize(manArtist)} - ${sanitize(manAlbum)}`;
        
        return; 
    }

    // --- STANDARD DISCOGS SEARCH ROUTE ---
    const searchMasters = await quickAddApi.yesNoPrompt("Search Mode", "Restrict search to Master releases? (Uncheck/No to search all releases)");

    const searchType = searchMasters ? "master" : "release";
    const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=${searchType}&per_page=10`;
    const token = "irrIPGSziSPcJZSpAEHCzePjfPXZvswikaAsLChl"; 

    try {
        const response = await fetch(url, {
            headers: {
                 "User-Agent": "ObsidianMusicLog/1.0",
                 "Authorization": `Discogs token=${token}`
            }
        });
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            new Notice("No albums found on Discogs. Type 'manual' to add it by hand!");
            return;
        }

        const choices = data.results.map(release => ({
            text: `${release.title} (${release.year || 'Unknown Year'})`,
            release: release
        }));

        const selected = await quickAddApi.suggester(
            choices.map(c => c.text),
            choices.map(c => c.release)
        );

        if (!selected) return;

        const sanitize = (str) => str ? str.replace(/[*"\\/<>:|?]/g, "").trim() : "";

        const rawArtist = selected.title.includes(" - ") ? selected.title.split(" - ")[0] : "Unknown Artist";
        const rawAlbum = selected.title.includes(" - ") ? selected.title.split(" - ")[1] : selected.title;

        params.variables["artist"] = rawArtist;
        params.variables["album"] = rawAlbum;
        params.variables["releaseYear"] = selected.year || "";
        params.variables["cover"] = selected.cover_image || "";

        const getTodayDate = () => {
            const d = new Date();
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const addOneDay = (dateStr) => {
            const parts = dateStr.split('/');
            if (parts.length !== 3) return getTodayDate();
            const d = new Date(parts[2], parts[1] - 1, parts[0]);
            d.setDate(d.getDate() + 1);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        if (!global.lastListenDate) {
            global.lastListenDate = getTodayDate();
        } else {
            global.lastListenDate = addOneDay(global.lastListenDate);
        }
        
        const dateInput = await quickAddApi.inputPrompt("Listen date (DD/MM/YYYY):", "DD/MM/YYYY", global.lastListenDate);
        if (!dateInput) return;
        
        global.lastListenDate = dateInput;
        params.variables["listenDate"] = global.lastListenDate; // Stays DD/MM/YYYY in frontmatter

        params.variables["fileName"] = `${sanitize(rawArtist)} - ${sanitize(rawAlbum)}`;

        params.variables["rating"] = await quickAddApi.inputPrompt("Rating out of 5:", "5", "5");
        
        const reviewInput = await quickAddApi.wideInputPrompt("Review / Thoughts (optional):", "");
        params.variables["review"] = reviewInput || "";

        // Publish prompt for standard route
        const publishInput = await quickAddApi.yesNoPrompt("Publish?", "Do you want to publish this review?");
        params.variables["publish"] = publishInput;

    } catch (error) {
        console.error(error);
        new Notice("Failed to connect to Discogs API.");
    }
}