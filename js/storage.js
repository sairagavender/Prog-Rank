function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        library: state.library,
        lists: state.lists,
        artists: state.artists,
        mainListType: state.mainListType,
        migratedToAbsolute: state.migratedToAbsolute
    }));
    render();
}

function saveDataNoRender() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        library: state.library,
        lists: state.lists,
        artists: state.artists,
        mainListType: state.mainListType,
        migratedToAbsolute: state.migratedToAbsolute
    }));
}

function addToLibrary(item) {
    const exists = state.library.some(l => l.title.toLowerCase() === item.title.toLowerCase() && l.artist.toLowerCase() === item.artist.toLowerCase());
    if (!exists) {
        state.library.push({
            id: generateId(),
            title: item.title,
            artist: item.artist,
            cover: item.cover,
            link: item.link,
            defaultSongs: item.songs ? JSON.parse(JSON.stringify(item.songs)) : []
        });
    }
}