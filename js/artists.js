function checkArtistMatch(itemArtistString, targetArtistName) {
    if (!itemArtistString) return false;
    const target = targetArtistName.toLowerCase().trim();
    const artists = itemArtistString.split(',').map(a => a.trim().toLowerCase());
    return artists.includes(target);
}

function getArtistStats(artistName) {
    const mainList = state.lists.find(l => l.isMain);
    if (!mainList) return { avg: 0, count: 0 };
    const artistItems = mainList.items.filter(i => checkArtistMatch(i.artist, artistName));
    if (artistItems.length === 0) return { avg: 0, count: 0 };
    
    const total = artistItems.reduce((sum, item) => sum + parseFloat(item.score || 0), 0);
    return {
        avg: (total / artistItems.length).toFixed(1),
        count: artistItems.length
    };
}

function getArtistProfilePic(artistName) {
    const artistData = state.artists[artistName];
    if (artistData && artistData.profilePic) return artistData.profilePic;
    const matches = state.library.filter(l => checkArtistMatch(l.artist, artistName) && l.cover);
    if (matches.length > 0) return matches[0].cover;
    return null;
}

function updateArtistUserScore(val) {
    if (!state.artists[state.activeArtistName]) state.artists[state.activeArtistName] = { userScore: 0 };
    const numVal = parseFloat(val);
    state.artists[state.activeArtistName].userScore = numVal;
    const display = document.getElementById('user-score-display');
    const slider = document.getElementById('artist-score-slider');
    const input = document.getElementById('artist-score-input');
    if(display) display.innerText = numVal;
    if(slider && document.activeElement !== slider) slider.value = numVal;
    if(input && document.activeElement !== input) input.value = numVal;
    saveDataNoRender();
}

function deleteArtist(artistName) {
    const safeName = artistName.replace(/'/g, "\\'");
    if(confirm(`Are you sure you want to delete ${artistName}? This will not remove their items from lists.`)) {
        delete state.artists[artistName];
        saveData();
        if(state.currentView === 'artistProfile' && state.activeArtistName === artistName) goBack();
        showToast("Artist profile data deleted.");
    }
}

function openDiscographyList() {
    const artistName = state.activeArtistName;
    const listName = `Discography: ${artistName}`;
    let list = state.lists.find(l => l.name === listName);

    if (!list) {
        const artistItems = state.library.filter(a => checkArtistMatch(a.artist, artistName));
        if (artistItems.length === 0) return showToast("No items found for this artist in library.");
        
        list = {
            id: generateId(),
            name: listName,
            color: 'bg-neutral-800',
            type: state.mainListType || 'albums',
            items: artistItems.map(libItem => ({
                id: generateId(),
                score: 5.0,
                color: 'from-gray-700 to-gray-900',
                title: libItem.title,
                artist: libItem.artist,
                cover: libItem.cover,
                link: libItem.link,
                songs: libItem.defaultSongs ? JSON.parse(JSON.stringify(libItem.defaultSongs)) : []
            }))
        };
        state.lists.push(list);
        saveData();
        showToast(`Created new list: ${listName}`);
    } else {
        const artistItems = state.library.filter(a => checkArtistMatch(a.artist, artistName));
        let addedCount = 0;
        artistItems.forEach(libItem => {
            const exists = list.items.find(i => i.title.toLowerCase() === libItem.title.toLowerCase());
            if (!exists) {
                list.items.push({
                    id: generateId(),
                    score: 5.0,
                    color: 'from-gray-700 to-gray-900',
                    title: libItem.title,
                    artist: libItem.artist,
                    cover: libItem.cover,
                    link: libItem.link,
                    songs: libItem.defaultSongs ? JSON.parse(JSON.stringify(libItem.defaultSongs)) : []
                });
                addedCount++;
            }
        });
        if(addedCount > 0) {
            saveData();
            showToast(`Added ${addedCount} new items to list.`);
        }
    }
    goToList(list.id);
}
