// --- Modals & CRUD ---
function openModal(item = null) {
    state.modalOpen = true;
    state.editMode = !!item;
    state.editId = item ? item.id : null;
    
    if (item) {
        state.tempItem = { ...item, remarks: item.remarks || '', songs: item.songs || [] };
        state.originalItemForEdit = { ...item };
    } else {
        state.tempItem = { title: '', artist: '', link: '', cover: '', remarks: '', songs: null };
        state.originalItemForEdit = null;
    }
    updateModalUI();
    els.modalOverlay.classList.remove('hidden');
    setTimeout(() => els.modalOverlay.classList.remove('opacity-0'), 10);
}

function closeModal() {
    state.modalOpen = false;
    els.modalOverlay.classList.add('opacity-0');
    setTimeout(() => els.modalOverlay.classList.add('hidden'), 200);
    els.artistSuggestions.classList.add('hidden');
    els.inputSpotifyAutofill.value = '';
}

function updateModalUI() {
    const list = getActiveList();
    const listType = list ? list.type : 'albums';
    const isSongInAlbumView = state.currentView === 'album'; 
    const isSongModeList = listType === 'songs';

    if (isSongInAlbumView || isSongModeList) {
        els.modalTitle.innerText = state.editMode ? 'Edit Song' : 'Add Song';
        els.labelTitle.innerHTML = 'Song Title <span class="text-red-500">*</span>';
        els.inputTitle.placeholder = "e.g. Reckoner";
    } else {
        els.modalTitle.innerText = state.editMode ? 'Edit Album' : 'Add Album';
        els.labelTitle.innerHTML = 'Album Title <span class="text-red-500">*</span>';
        els.inputTitle.placeholder = "e.g. In Rainbows";
    }
    
    if (state.isReadOnly) els.modalTitle.innerText = 'View Details';

    els.searchSection.classList.toggle('hidden', state.editMode || isSongInAlbumView || state.isReadOnly);
    els.coverSection.classList.toggle('hidden', isSongInAlbumView);
    els.coverLabelText.innerText = isSongModeList ? "Cover Art (Optional)" : "Cover Art *";
    els.fieldArtist.classList.toggle('hidden', isSongInAlbumView);
    
    els.inputTitle.value = state.tempItem.title || '';
    els.inputArtist.value = state.tempItem.artist || '';
    els.inputLink.value = state.tempItem.link || '';
    els.inputRemarks.value = state.tempItem.remarks || '';
    
    const isBase64 = state.tempItem.cover && state.tempItem.cover.startsWith('data:');
    els.inputCoverUrl.value = isBase64 ? '' : (state.tempItem.cover || '');

    if (state.tempItem.cover && !isSongInAlbumView) {
        els.coverPreview.src = state.tempItem.cover;
        els.coverPreviewContainer.classList.remove('hidden');
        els.coverPlaceholder.classList.add('hidden');
    } else {
        els.coverPreviewContainer.classList.add('hidden');
        els.coverPlaceholder.classList.remove('hidden');
    }

    if (state.isReadOnly) {
        els.btnSave.classList.add('hidden');
        els.btnDelete.classList.add('hidden');
        ['inputTitle', 'inputArtist', 'inputRemarks', 'inputLink'].forEach(k => els[k].disabled = true);
    } else {
        els.btnSave.classList.remove('hidden');
        els.btnDelete.classList.toggle('hidden', !state.editMode);
        ['inputTitle', 'inputArtist', 'inputRemarks', 'inputLink'].forEach(k => els[k].disabled = false);
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            state.tempItem.cover = reader.result;
            els.inputCoverUrl.value = '';
            updateModalUI();
        };
        reader.readAsDataURL(file);
    }
}

function saveItem() {
    const list = getActiveList();
    const listType = list ? list.type : 'albums';
    const isSongInAlbumView = state.currentView === 'album';

    if (!state.tempItem.title) return showToast("Title is required!");
    if (!isSongInAlbumView && !state.isReadOnly && !state.tempItem.artist) return showToast("Artist is required!");
    
    const urlValue = els.inputCoverUrl.value.trim();
    if (urlValue) state.tempItem.cover = urlValue;
    
    if (!isSongInAlbumView && !state.editMode && !state.tempItem.cover && listType === 'albums') {
        return showToast("Cover Image is required for Albums!");
    }

    if (isSongInAlbumView) {
        const album = getActiveAlbum();
        if (state.editMode) {
            album.songs = album.songs.map(s => s.id === state.editId ? { ...s, title: state.tempItem.title, remarks: state.tempItem.remarks, link: state.tempItem.link } : s);
        } else {
            album.songs.push({ id: generateId(), title: state.tempItem.title, score: 5.0, remarks: state.tempItem.remarks, link: state.tempItem.link });
        }
    } else {
        if (state.editMode) {
            list.items = list.items.map(i => i.id === state.editId ? { ...i, ...state.tempItem } : i);
            if (state.originalItemForEdit) {
                const orig = state.originalItemForEdit;
                const curr = state.tempItem;
                if (orig.title !== curr.title || orig.artist !== curr.artist || orig.cover !== curr.cover) {
                    updateLibraryEntry(orig.title, orig.artist, curr.title, curr.artist, curr.cover, curr.link);
                }
            }
        } else {
            const randColor = ['purple', 'blue', 'green', 'pink', 'orange'][Math.floor(Math.random() * 5)];
            const newItem = {
                id: generateId(),
                score: 5.0,
                color: `from-${randColor}-500 to-gray-700`,
                songs: state.tempItem.songs || [],
                ...state.tempItem
            };
            list.items.push(newItem);
            addToLibrary(newItem);
        }
    }
    saveData();
    closeModal();
}

function deleteItem(id) {
    if (state.currentView === 'album') {
        const album = getActiveAlbum();
        album.songs = album.songs.filter(s => s.id !== id);
    } else {
        const list = getActiveList();
        list.items = list.items.filter(i => i.id !== id);
    }
    saveData();
}

function updateLibraryEntry(oldTitle, oldArtist, newTitle, newArtist, newCover, newLink) {
    const entry = state.library.find(l => l.title.toLowerCase() === oldTitle.toLowerCase() && l.artist.toLowerCase() === oldArtist.toLowerCase());
    if (entry) {
        entry.title = newTitle; entry.artist = newArtist;
        if (newCover) entry.cover = newCover;
        if (newLink) entry.link = newLink;
    } else {
        addToLibrary({ title: newTitle, artist: newArtist, cover: newCover, link: newLink });
    }
}



function handleArtistPicUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        if (!state.artists[state.activeArtistName]) state.artists[state.activeArtistName] = { userScore: 0 };
        state.artists[state.activeArtistName].profilePic = reader.result;
        saveData();
        renderArtistProfile();
    };
    reader.readAsDataURL(file);
}

function handleArtistInput(e) {
    const query = e.target.value.toLowerCase();
    state.tempItem.artist = e.target.value;
    if (query.length < 1) return els.artistSuggestions.classList.add('hidden');
    
    const allArtistsSet = new Set();
    state.library.forEach(l => { if (l.artist) l.artist.split(',').forEach(a => allArtistsSet.add(a.trim())); });
    const artists = [...allArtistsSet];
    
    const matches = artists.filter(a => a.toLowerCase().includes(query));
    if (matches.length > 0) {
        els.artistSuggestions.innerHTML = '';
        matches.forEach(artist => {
            const div = document.createElement('div');
            div.className = 'px-4 py-2 hover:bg-neutral-700 cursor-pointer text-sm text-white';
            div.innerText = artist;
            div.onclick = () => {
                // Append if comma is typed, otherwise replace
                const current = els.inputArtist.value;
                const lastComma = current.lastIndexOf(',');
                if (lastComma !== -1) els.inputArtist.value = current.substring(0, lastComma + 1) + ' ' + artist;
                else els.inputArtist.value = artist;
                
                state.tempItem.artist = els.inputArtist.value;
                els.artistSuggestions.classList.add('hidden');
            };
            els.artistSuggestions.appendChild(div);
        });
        els.artistSuggestions.classList.remove('hidden');
    } else els.artistSuggestions.classList.add('hidden');
}

function renderLibraryResults(results) {
    els.libraryResults.innerHTML = '';
    els.libraryResults.classList.remove('hidden');
    if (results.length === 0) return els.libraryResults.innerHTML = '<div class="text-xs text-neutral-500 p-2 text-center">No matches found.</div>';
    results.forEach(libItem => {
        const el = document.createElement('div');
        el.className = 'flex items-center gap-3 p-2 rounded hover:bg-neutral-800 cursor-pointer';
        el.innerHTML = `
            <img src="${libItem.cover || ''}" class="w-8 h-8 rounded object-cover bg-neutral-700">
            <div class="flex-1 min-w-0"><div class="text-sm font-bold text-white truncate">${libItem.title}</div><div class="text-xs text-neutral-500 truncate">${libItem.artist}</div></div>
            <i data-lucide="plus" class="w-4 h-4 text-purple-500"></i>
        `;
        el.onclick = () => {
            state.tempItem = { ...libItem, remarks: '' };
            state.editMode = false;
            els.inputCoverUrl.value = (libItem.cover && !libItem.cover.startsWith('data:')) ? libItem.cover : '';
            updateModalUI();
            els.libraryResults.classList.add('hidden');
        };
        els.libraryResults.appendChild(el);
    });
    lucide.createIcons({ root: els.libraryResults });
}