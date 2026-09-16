module.exports = async (params) => {
    const { app } = params;
    const files = app.vault.getMarkdownFiles();
    
    let musicLogs = [];

    for (let file of files) {
        if (file.path.toLowerCase().includes("music logs")) {
            const cache = app.metadataCache.getFileCache(file);
            const frontmatter = cache?.frontmatter;

            // Must have a listen date AND be explicitly published
            if (!frontmatter || !frontmatter["listen-date"] || frontmatter.publish !== true) continue;

            // Generate clean URL slug matching Quartz structure
            let cleanSlug = file.path
                .replace(/\.md$/, "")
                .toLowerCase()
                .replace(/music logs/g, "music-logs")
                .replace(/\s+/g, "-");

            musicLogs.push({
                title: frontmatter.title || file.basename,
                slug: cleanSlug,
                description: `Listen Date: ${frontmatter["listen-date"]} | Rating: ${frontmatter.rating || "N/A"}`,
                listenDate: frontmatter["listen-date"],
                cover: frontmatter.cover || "",
                releaseYear: frontmatter["release-year"] || ""
            });
        }
    }

    // Sort chronologically (newest first)
    musicLogs.sort((a, b) => {
        const parseDate = (dStr) => {
            if (!dStr) return 0;
            const parts = dStr.split('/');
            if (parts.length !== 3) return 0;
            return parseInt(`${parts[2]}${parts[1]}${parts[0]}`, 10);
        };
        return parseDate(b.listenDate) - parseDate(a.listenDate);
    });

    const jsonContent = JSON.stringify(musicLogs, null, 2);
    const jsContent = `window.musicLogs = ${jsonContent};`;

    try {
        // Write both files so everything stays happy
        await app.vault.adapter.write("music-order.json", jsonContent);
        await app.vault.adapter.write("music-data.js", jsContent);
        
        new Notice(`Successfully generated both JSON and JS files for ${musicLogs.length} logs!`);
    } catch (error) {
        console.error("Failed to write music files:", error);
        new Notice("Error updating music files. Check console.");
    }
};