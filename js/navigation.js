// --- Navigation ---
function navigateTo(view, params = {}) {
    state.history.push({
        view: state.currentView,
        activeListId: state.activeListId,
        activeAlbumId: state.activeAlbumId,
        activeArtistName: state.activeArtistName,
        isReadOnly: state.isReadOnly,
        zoomLevel: state.zoomLevel,
        calibrateGlobal: state.calibrateGlobal
    });

    state.currentView = view;
    state.activeListId = params.listId || null;
    state.activeAlbumId = params.albumId || null;
    state.activeArtistName = params.artistName || null;
    state.isReadOnly = params.readOnly || false;
    state.zoomLevel = params.zoom || 1;
    
    els.searchResults.classList.add('hidden');
    render();
}

function goBack() {
    if (state.history.length > 0) {
        const prev = state.history.pop();
        state.currentView = prev.view;
        state.activeListId = prev.activeListId;
        state.activeAlbumId = prev.activeAlbumId;
        state.activeArtistName = prev.activeArtistName;
        state.isReadOnly = prev.isReadOnly;
        state.zoomLevel = prev.zoomLevel;
        state.calibrateGlobal = prev.calibrateGlobal;
        render();
    } else {
        goHome(); 
    }
}

function goHome() {
    state.history = []; 
    state.currentView = 'dashboard';
    state.activeListId = null;
    state.activeAlbumId = null;
    state.activeArtistName = null;
    state.isReadOnly = false;
    els.searchResults.classList.add('hidden');
    render();
}

function goToList(listId) { navigateTo('list', { listId }); }

function goToAlbum(albumId, listId = null) {
    const list = state.lists.find(l => l.id === (listId || state.activeListId));
    if (list && list.type === 'songs') {
        const song = list.items.find(i => i.id === albumId);
        if(song) openModal(song);
        return;
    }
    navigateTo('album', { albumId, listId: listId || state.activeListId });
}

function goToArtistProfile(artistName) { navigateTo('artistProfile', { artistName }); }

function goToArtistAutoList(type) {
    if (state.mainListType === 'songs' && type === 'albums') return;
    navigateTo('artistAutoList', { listId: 'auto-' + type, readOnly: true, artistName: state.activeArtistName });
}

function goToComparison() { navigateTo('comparison', { artistName: state.activeArtistName }); }

function goToGlobalArtistRankings() { navigateTo('globalArtistRankings'); }

// --- Data Helpers ---
function getActiveList() {
    if (state.activeListId && state.activeListId.startsWith('auto-')) {
        const mainList = state.lists.find(l => l.isMain) || state.lists[0];
        const artistName = state.activeArtistName;
        
        if (state.activeListId === 'auto-albums') {
            const artistAlbums = mainList.items.filter(i => checkArtistMatch(i.artist, artistName));
            return { name: `${artistName} Albums (Main)`, items: artistAlbums, isAuto: true, type: 'albums' };
        } else if (state.activeListId === 'auto-songs') {
            if (state.mainListType === 'albums') {
                const artistAlbums = mainList.items.filter(i => checkArtistMatch(i.artist, artistName));
                let allSongs = [];
                artistAlbums.forEach(alb => {
                    if(alb.songs) allSongs = allSongs.concat(alb.songs.map(s => ({...s, cover: alb.cover, artist: artistName})));
                });
                return { name: `${artistName} Songs (Main)`, items: allSongs, isAuto: true, type: 'songs' };
            } else {
                    const artistSongs = mainList.items.filter(i => checkArtistMatch(i.artist, artistName));
                    return { name: `${artistName} Songs (Main)`, items: artistSongs, isAuto: true, type: 'songs' };
            }
        }
    }
    return state.lists.find(l => l.id === state.activeListId);
}

function getActiveAlbum() {
    const list = getActiveList();
    if (!list) return null;
    if (list.type === 'songs' || state.activeListId === 'auto-songs') return null;
    return list.items.find(a => a.id === state.activeAlbumId);
}

function getCurrentItems() {
    if (state.currentView === 'album') {
        const album = getActiveAlbum();
        return album ? album.songs : [];
    } else if (state.currentView === 'list' || state.currentView === 'artistAutoList') {
        const list = getActiveList();
        return list ? list.items : [];
    }
    return [];
}