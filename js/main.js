function init() {
            const savedLegacy = localStorage.getItem('album_ranker_data_v5');
            const saved = localStorage.getItem(STORAGE_KEY);
            
            if (saved) {
                const parsed = JSON.parse(saved);
                state = { ...state, ...parsed };
            } else if (savedLegacy) {
                const parsed = JSON.parse(savedLegacy);
                state.library = parsed.library || [];
                state.lists = parsed.lists || [];
                state.artists = parsed.artists || {};
                state.mainListType = 'albums';
                state.lists.forEach(l => l.type = 'albums');
            }

            // Migration to Absolute 0-10 Scaling
            if (!state.migratedToAbsolute) {
                state.library.forEach(l => {
                    if (l.defaultSongs) l.defaultSongs.forEach(s => { s.score = (s.score / 10) || 5.0; });
                });
                state.lists.forEach(list => {
                    list.items.forEach(i => {
                        i.score = (i.score / 10) || 5.0;
                        if (i.songs) i.songs.forEach(s => { s.score = (s.score / 10) || 5.0; });
                    });
                });
                for (const a in state.artists) {
                    if (state.artists[a].userScore) state.artists[a].userScore = (state.artists[a].userScore / 10) || 0;
                }
                state.migratedToAbsolute = true;
                saveDataNoRender();
            }

            if (!state.mainListType) {
                if (state.lists.length > 0 && state.lists[0].items.length > 0) {
                    state.mainListType = 'albums';
                    state.lists.forEach(l => l.type = 'albums');
                } else {
                    renderSetupModal();
                }
            }

            if (!state.lists.some(l => l.isMain)) {
                if(state.mainListType) createDefaultMainList();
            }
            
            checkSpotifyAuth();
            setupEventListeners();
            render();
            renderColorPicker();
        }

        // Global exposing
        window.goHome = goHome;
        window.goBack = goBack;
        window.toggleMetrics = toggleMetrics;
        window.toggleCalibration = toggleCalibration;
        window.setViewMode = setViewMode;
        window.openModal = openModal;
        window.openListModal = openListModal;
        window.zoomIn = zoomIn;
        window.zoomOut = zoomOut;
        window.goToArtistProfile = goToArtistProfile;
        window.goToArtistAutoList = goToArtistAutoList;
        window.goToComparison = goToComparison;
        window.goToGlobalArtistRankings = goToGlobalArtistRankings;
        window.handleArtistPicUpload = handleArtistPicUpload;
        window.updateArtistUserScore = updateArtistUserScore;
        window.setGlobalSort = setGlobalSort;
        window.deleteArtist = deleteArtist;
        window.openDiscographyList = openDiscographyList;
        window.selectMainListType = selectMainListType;
        window.openSettingsModal = openSettingsModal;
        window.closeSettingsModal = closeSettingsModal;
        window.authSpotify = authSpotify;
        window.fetchSpotifyData = fetchSpotifyData;

        // Init
        function setupEventListeners() {
            els.btnCloseModal.addEventListener('click', closeModal);
            els.modalOverlay.addEventListener('click', (e) => { if(e.target===els.modalOverlay) closeModal(); });
            els.btnCloseListModal.addEventListener('click', () => { els.listModalOverlay.classList.add('hidden'); });
            els.btnCloseOptionsModal.addEventListener('click', closeOptionsModal);
            els.settingsModalOverlay.addEventListener('click', (e) => { if(e.target===els.settingsModalOverlay) closeSettingsModal(); });
            
            els.coverTrigger.addEventListener('click', () => els.fileInput.click());
            els.fileInput.addEventListener('change', handleImageUpload);
            els.inputCoverUrl.addEventListener('input', (e) => { state.tempItem.cover = e.target.value; updateModalUI(); });
            els.btnSave.addEventListener('click', saveItem);
            els.btnDelete.addEventListener('click', () => { if(state.editId) deleteItem(state.editId); closeModal(); });
            
            ['inputTitle', 'inputLink', 'inputRemarks'].forEach(k => {
                els[k].addEventListener('input', (e) => {
                    const f = k.replace('input', '').toLowerCase();
                    state.tempItem[f] = e.target.value;
                });
            });
            els.inputArtist.addEventListener('input', handleArtistInput);
            document.addEventListener('click', (e) => { if(!e.target.closest('#field-artist-container')) els.artistSuggestions.classList.add('hidden'); });
            
            els.inputSearchLib.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                if(q.length < 2) return els.libraryResults.classList.add('hidden');
                const results = state.library.filter(i => i.title.toLowerCase().includes(q) || (i.artist && i.artist.toLowerCase().includes(q)));
                renderLibraryResults(results);
            });

            els.btnCreateList.addEventListener('click', createNewList);
            els.btnImportList.addEventListener('click', importList);
            els.btnDeleteList.addEventListener('click', deleteList);
            els.btnShareList.addEventListener('click', shareList);
            els.inputRenameList.addEventListener('input', (e) => renameList(e.target.value));
            els.tabCreate.addEventListener('click', () => setListModalTab('create'));
            els.tabImport.addEventListener('click', () => setListModalTab('import'));

            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, {passive:false});
            window.addEventListener('touchend', handleDragEnd);
            
            els.artistPicInput.addEventListener('change', handleArtistPicUpload);
        }

init(); 