// --- Renderers ---
function render() {
    renderHeader();
    if (state.currentView === 'dashboard') renderDashboard();
    else if (state.currentView === 'artistProfile') renderArtistProfile();
    else if (state.currentView === 'globalArtistRankings') renderGlobalArtistRankings();
    else if (state.currentView === 'comparison') renderComparison();
    else renderMainArea();
    lucide.createIcons({ root: document.body });
}

function renderHeader() {
    const isDash = state.currentView === 'dashboard';
    const isProfile = state.currentView === 'artistProfile';
    const isGlobal = state.currentView === 'globalArtistRankings';
    const isComparison = state.currentView === 'comparison';
    
    let title = 'Prog Rank'; let subtitle = '';
    
    if (!isDash) {
        if (isProfile) { title = state.activeArtistName; subtitle = 'Artist Profile'; }
        else if (isGlobal) { title = 'Global Rankings'; subtitle = 'All Artists'; }
        else if (isComparison) { title = 'Comparison'; subtitle = state.activeArtistName; }
        else if (state.currentView === 'list' || state.currentView === 'artistAutoList') {
            const list = getActiveList();
            title = list ? list.name : 'List';
            subtitle = list ? (list.isAuto ? 'Auto-Ranked' : (list.type === 'songs' ? 'Song Ranking' : 'Album Ranking')) : '';
        } else if (state.currentView === 'album') {
            const alb = getActiveAlbum();
            title = alb ? alb.title : 'Album';
            subtitle = 'Song Ranking';
        }
    }

    const backBtn = !isDash ? `<button onclick="goBack()" class="bg-neutral-800 p-2 rounded-lg hover:bg-neutral-700 transition-colors mr-2"><i data-lucide="arrow-left" class="w-5 h-5 text-white"></i></button>` : '';
    const homeBtn = !isDash ? `<button onclick="goHome()" class="bg-neutral-800 p-2 rounded-lg hover:bg-neutral-700 transition-colors mr-4"><i data-lucide="home" class="w-5 h-5 text-white"></i></button>` : '';
    
    const zoomControls = (state.viewMode === 'horizontal' && !isDash && !isProfile && !isGlobal && !isComparison) ? `
        <div class="flex bg-neutral-800 rounded-lg p-1 mr-2 hidden md:flex">
            <button onclick="zoomOut()" class="p-1.5 hover:text-white text-neutral-400"><i data-lucide="minus" class="w-4 h-4"></i></button>
            <span class="px-2 text-xs flex items-center text-neutral-500 font-mono">${state.zoomLevel}x</span>
            <button onclick="zoomIn()" class="p-1.5 hover:text-white text-neutral-400"><i data-lucide="plus" class="w-4 h-4"></i></button>
        </div>` : '';

    const rightActions = isDash ? `
        <button onclick="goToGlobalArtistRankings()" class="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white" title="All Artist Rankings"><i data-lucide="trophy" class="w-5 h-5"></i></button>
        <button onclick="openSettingsModal()" class="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white mr-2" title="Settings / Spotify"><i data-lucide="settings" class="w-5 h-5"></i></button>
        <button onclick="openListModal()" class="flex items-center gap-2 bg-white text-neutral-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-neutral-200 transition-colors"><i data-lucide="plus" class="w-4 h-4"></i> New List</button>
    ` : (isProfile || isGlobal || isComparison) ? '' : `
        <div class="flex items-center gap-2">
            <button onclick="toggleMetrics()" class="hidden md:block px-3 py-1.5 rounded text-sm font-medium ${state.showMetrics ? 'bg-purple-600/20 text-purple-400' : 'text-neutral-400 hover:text-white'}">${state.showMetrics ? 'Metrics: ON' : 'Metrics'}</button>
            ${zoomControls}
            <div class="flex bg-neutral-800 rounded-lg p-1">
                <button onclick="setViewMode('horizontal')" class="p-1.5 rounded ${state.viewMode === 'horizontal' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}"><i data-lucide="columns" class="w-4 h-4"></i></button>
                <button onclick="setViewMode('vertical')" class="p-1.5 rounded ${state.viewMode === 'vertical' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}"><i data-lucide="layout-list" class="w-4 h-4"></i></button>
            </div>
            ${!state.isReadOnly ? `<button onclick="openModal()" class="flex items-center gap-2 bg-white text-neutral-900 px-3 py-2 rounded-full text-sm font-bold hover:bg-neutral-200 transition-colors ml-2"><i data-lucide="plus" class="w-4 h-4"></i> Add</button>` : ''}
        </div>
    `;

    els.header.innerHTML = `
        <div class="flex items-center gap-2">
            ${backBtn} ${homeBtn}
            <div class="flex flex-col overflow-hidden">
                <h1 class="text-xl font-bold tracking-tight text-white truncate">${title}</h1>
                ${subtitle ? `<span class="text-xs text-neutral-400 font-medium tracking-wider uppercase">${subtitle}</span>` : ''}
            </div>
        </div>
        <div class="relative w-full max-w-md mx-4 hidden md:block">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"></i>
            <input type="text" id="dashboard-search" class="w-full bg-neutral-800 border-transparent focus:border-purple-500 focus:ring-0 rounded-full pl-10 pr-4 py-2 text-white placeholder-neutral-500 text-sm transition-all shadow-sm focus:shadow-md" placeholder="Search...">
        </div>
        <div class="flex items-center gap-2">${rightActions}</div>
    `;

    const sInput = document.getElementById('dashboard-search');
    if(sInput) {
        sInput.addEventListener('input', handleGlobalSearch);
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#global-search-results') && !e.target.closest('#dashboard-search')) els.searchResults.classList.add('hidden');
        });
    }
}

function renderDashboard() {
    els.mainContent.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'p-4 md:p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto custom-scrollbar';
    
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20';
    const sortedLists = [...state.lists].sort((a, b) => (b.isPinned === a.isPinned) ? 0 : b.isPinned ? 1 : -1);

    sortedLists.forEach((list) => {
        const card = document.createElement('div');
        card.draggable = true;
        card.className = `${list.color || 'bg-neutral-800'} border ${list.isPinned ? 'border-purple-500 shadow-purple-500/20' : 'border-neutral-700/50'} rounded-2xl p-6 hover:border-white/50 transition-all cursor-pointer group relative overflow-hidden shadow-lg select-none`;
        
        card.addEventListener('dragstart', (e) => { e.dataTransfer.effectAllowed='move'; state.draggedListIdx = state.lists.indexOf(list); });
        card.addEventListener('dragover', (e) => e.preventDefault());
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropIdx = state.lists.indexOf(list);
            if(state.draggedListIdx !== null && state.draggedListIdx !== dropIdx) {
                const item = state.lists[state.draggedListIdx];
                state.lists.splice(state.draggedListIdx, 1);
                state.lists.splice(dropIdx, 0, item);
                saveData();
            }
        });

        card.onclick = (e) => { if(!e.target.closest('.options-btn')) goToList(list.id); };

        let visualHtml = '';
        const covers = list.items.filter(i => i.cover).slice(0, 3);
        if (covers.length > 0) {
                visualHtml = `<div class="flex -space-x-4 mb-4 overflow-hidden py-2 pl-2">
                ${covers.map(c => `<img src="${c.cover}" class="w-12 h-12 rounded-full border-2 border-neutral-800 object-cover relative z-10 shadow-md">`).join('')}
                ${list.items.length > 3 ? `<div class="w-12 h-12 rounded-full bg-neutral-900/50 border-2 border-neutral-800 flex items-center justify-center text-xs text-white z-0 relative backdrop-blur-sm">+${list.items.length - 3}</div>` : ''}
                </div>`;
        } else {
            const icon = list.type === 'songs' ? 'music' : 'disc';
            visualHtml = `<div class="mb-4 py-2"><div class="w-12 h-12 rounded-full bg-neutral-900/30 flex items-center justify-center"><i data-lucide="${icon}" class="w-6 h-6 text-white/50"></i></div></div>`;
        }

        card.innerHTML = `
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                ${list.isPinned ? '<i data-lucide="pin" class="w-4 h-4 text-purple-400 fill-current"></i>' : ''}
                <button class="options-btn p-2 hover:bg-black/20 rounded-full text-white"><i data-lucide="more-horizontal" class="w-5 h-5"></i></button>
            </div>
            ${visualHtml}
            <h3 class="text-xl font-bold text-white mb-1 truncate shadow-black drop-shadow-md">${list.name}</h3>
            <div class="flex items-center gap-2 text-sm text-white/60 font-medium">
                    <span>${list.items.length} Items</span>
                    <span class="w-1 h-1 rounded-full bg-white/40"></span>
                    <span class="uppercase text-[10px] tracking-wider">${list.type || 'albums'}</span>
                    ${list.isMain ? '<span class="ml-auto text-[10px] bg-purple-600 px-1.5 py-0.5 rounded text-white font-bold tracking-wide uppercase">MAIN</span>' : ''}
            </div>
        `;
        card.querySelector('.options-btn').onclick = (e) => openListOptions(e, list.id);
        grid.appendChild(card);
    });

    const addCard = document.createElement('button');
    addCard.onclick = openListModal;
    addCard.className = 'border-2 border-dashed border-neutral-700 rounded-2xl p-6 flex flex-col items-center justify-center text-neutral-500 hover:text-white hover:border-neutral-500 transition-colors min-h-[200px] group';
    addCard.innerHTML = `<div class="bg-neutral-800 p-4 rounded-full mb-4 group-hover:bg-neutral-700 transition-colors shadow-lg"><i data-lucide="plus" class="w-8 h-8"></i></div><span class="font-bold">Create New List</span>`;
    grid.appendChild(addCard);
    container.appendChild(grid);
    els.mainContent.appendChild(container);
}

function renderArtistProfile() {
    els.mainContent.innerHTML = '';
    const artistName = state.activeArtistName;
    const stats = getArtistStats(artistName);
    const userScore = state.artists[artistName]?.userScore || 0;
    const profilePic = getArtistProfilePic(artistName);
    const safeName = artistName.replace(/'/g, "\\'");

    const container = document.createElement('div');
    container.className = 'p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto custom-scrollbar';

    container.innerHTML = `
        <div class="flex flex-col md:flex-row gap-8 mb-12 items-center md:items-start">
            <div class="relative group cursor-pointer w-48 h-48 rounded-full overflow-hidden border-4 border-neutral-800 shadow-2xl flex-shrink-0" onclick="document.getElementById('artist-pic-input').click()">
                ${profilePic ? `<img src="${profilePic}" class="w-full h-full object-cover">` : `<div class="w-full h-full bg-neutral-800 flex items-center justify-center"><i data-lucide="user" class="w-16 h-16 text-neutral-600"></i></div>`}
                <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="camera" class="w-8 h-8 text-white"></i></div>
            </div>
            <div class="flex-1 text-center md:text-left">
                <div class="flex justify-between items-start">
                    <h1 class="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">${artistName}</h1>
                    ${stats.count === 0 ? `<button onclick="deleteArtist('${safeName}')" class="text-red-500 hover:bg-red-500/10 p-2 rounded-lg" title="Delete Artist"><i data-lucide="trash-2" class="w-5 h-5"></i></button>` : ''}
                </div>
                <p class="text-neutral-400 text-lg mb-6">${stats.count} Items Ranked in Main List</p>
                
                <div class="flex flex-col md:flex-row gap-6">
                    <div class="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                        <div class="text-xs text-neutral-500 uppercase tracking-wider mb-1">Calculated Avg</div>
                        <div class="text-3xl font-bold text-purple-400">${stats.avg}</div>
                    </div>
                    <div class="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 flex-1">
                        <div class="flex justify-between items-center mb-2">
                            <div class="text-xs text-neutral-500 uppercase tracking-wider">Your Rating (0-10+)</div>
                            <div class="text-xl font-bold text-white"><span id="user-score-display">${userScore}</span></div>
                        </div>
                        <div class="flex gap-4 items-center">
                            <input type="range" id="artist-score-slider" min="0" max="15" step="0.1" value="${userScore}" class="flex-1" oninput="updateArtistUserScore(this.value)">
                            <input type="number" id="artist-score-input" value="${userScore}" step="0.1" class="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white text-center" oninput="updateArtistUserScore(this.value)">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            ${state.mainListType === 'albums' ? `
            <button onclick="goToArtistAutoList('albums')" class="p-6 bg-neutral-800 rounded-xl border border-neutral-700 hover:border-purple-500 transition-all text-left group">
                <div class="flex justify-between items-start mb-2">
                    <div class="bg-blue-900/30 p-2 rounded-lg"><i data-lucide="disc" class="w-6 h-6 text-blue-400"></i></div>
                    <i data-lucide="arrow-right" class="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors"></i>
                </div>
                <h3 class="text-lg font-bold text-white">Main List Ranking (Albums)</h3>
                <p class="text-sm text-neutral-400">View auto-generated ranking based on your Main List.</p>
            </button>` : ''}
            <button onclick="goToArtistAutoList('songs')" class="p-6 bg-neutral-800 rounded-xl border border-neutral-700 hover:border-purple-500 transition-all text-left group col-span-2 md:col-span-1">
                <div class="flex justify-between items-start mb-2">
                    <div class="bg-green-900/30 p-2 rounded-lg"><i data-lucide="music" class="w-6 h-6 text-green-400"></i></div>
                    <i data-lucide="arrow-right" class="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors"></i>
                </div>
                <h3 class="text-lg font-bold text-white">Main List Ranking (Songs)</h3>
                <p class="text-sm text-neutral-400">View all songs ranked by absolute score.</p>
            </button>
        </div>

        <div class="flex gap-4">
            <button onclick="openDiscographyList()" class="flex-1 py-3 rounded-lg border border-neutral-600 hover:bg-neutral-800 transition-colors font-bold text-neutral-300">Open Discography List</button>
            <button onclick="goToComparison()" class="flex-1 py-3 rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors font-bold">Compare Rankings</button>
        </div>
    `;
    els.mainContent.appendChild(container);
}

function renderGlobalArtistRankings() {
    els.mainContent.innerHTML = '';
    
    const allArtistsSet = new Set();
    state.library.forEach(l => {
        if (l.artist) l.artist.split(',').forEach(a => allArtistsSet.add(a.trim()));
    });
    const allArtists = [...allArtistsSet];
    
    let rankings = allArtists.map(name => {
        const stats = getArtistStats(name);
        return { name, ...stats, userScore: state.artists[name]?.userScore || 0 };
    });

    if (state.mainListType === 'songs') rankings = rankings.filter(r => r.count >= 4);

    const maxAvg = Math.max(...rankings.map(r => parseFloat(r.avg)), 1);

    if (state.globalSort === 'user') rankings.sort((a,b) => b.userScore - a.userScore);
    else rankings.sort((a,b) => b.avg - a.avg);

    const container = document.createElement('div');
    container.className = 'p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto custom-scrollbar';
    const calibratedText = state.calibrateGlobal ? `<span class="text-xs font-normal text-purple-400 ml-2">(Scaled relative to highest)</span>` : '';

    let html = `
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 class="text-2xl font-bold flex items-center">Global Artist Rankings ${calibratedText}</h2>
            <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer bg-neutral-800 px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors">
                        <span class="text-xs font-bold text-white">Calibrate to 100</span>
                        <div class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" ${state.calibrateGlobal ? 'checked' : ''} onchange="toggleCalibration()">
                        <div class="w-9 h-5 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                </label>
                <div class="flex bg-neutral-800 rounded-lg p-1">
                    <button onclick="setGlobalSort('avg')" class="px-3 py-1 text-xs font-bold rounded ${state.globalSort === 'avg' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'}">Avg Score</button>
                    <button onclick="setGlobalSort('user')" class="px-3 py-1 text-xs font-bold rounded ${state.globalSort === 'user' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'}">User Rating</button>
                </div>
            </div>
        </div>
        ${rankings.length === 0 && state.mainListType === 'songs' ? '<div class="text-center text-neutral-500 py-10">Add at least 4 songs for an artist to see them here.</div>' : ''}
        <div class="space-y-4">
    `;
    rankings.forEach((r, i) => {
        const pic = getArtistProfilePic(r.name);
        const safeName = r.name.replace(/'/g, "\\'");
        
        let displayAvg = r.avg;
        if (state.calibrateGlobal) displayAvg = ((r.avg / maxAvg) * 100).toFixed(1);

        html += `
            <div class="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-xl border border-neutral-800">
                <div class="text-2xl font-black text-neutral-600 w-8 text-center">#${i+1}</div>
                <img src="${pic || ''}" class="w-12 h-12 rounded-full object-cover bg-neutral-700">
                <div class="flex-1 cursor-pointer" onclick="goToArtistProfile('${safeName}')">
                    <h3 class="text-lg font-bold text-white hover:text-purple-400 transition-colors">${r.name}</h3>
                    <div class="text-xs text-neutral-500">${r.count} Items</div>
                </div>
                <div class="text-right">
                    <div class="text-xl font-bold text-purple-400">${displayAvg}</div>
                    <div class="text-xs text-neutral-500">Avg Score</div>
                </div>
                <div class="w-px h-8 bg-neutral-700 mx-2"></div>
                <div class="text-right w-16">
                    <div class="text-lg font-bold text-white">${r.userScore > 0 ? r.userScore : '-'}</div>
                    <div class="text-xs text-neutral-500">User</div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
    els.mainContent.appendChild(container);
}

function renderComparison() {
    els.mainContent.innerHTML = '';
    const artistName = state.activeArtistName;
    const mainList = state.lists.find(l => l.isMain);
    const discogList = state.lists.find(l => l.name === `Discography: ${artistName}`);
    
    const mainItems = mainList ? mainList.items.filter(i => checkArtistMatch(i.artist, artistName)) : [];
    const userItems = discogList ? discogList.items : [];
    const allTitles = [...new Set([...mainItems.map(a=>a.title), ...userItems.map(a=>a.title)])];

    const container = document.createElement('div');
    container.className = 'flex flex-col h-full';
    
    let html = `
        <div class="p-4 border-b border-neutral-800 bg-neutral-900 z-10 flex flex-col md:flex-row justify-between items-center gap-2">
            <h2 class="text-xl font-bold">Comparison: ${artistName}</h2>
            <div class="text-xs text-purple-400 italic">Absolute Metric Scale</div>
            <div class="flex gap-8 text-sm uppercase tracking-widest font-bold text-neutral-500">
                <span>Main List</span>
                <span>Discography List</span>
            </div>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div class="space-y-2 max-w-4xl mx-auto">
    `;

    allTitles.forEach(title => {
        const mainItem = mainItems.find(a => a.title === title);
        const userItem = userItems.find(a => a.title === title);
        
        const mainScore = mainItem ? mainItem.score.toFixed(1) : 'N/A';
        const userScore = userItem ? userItem.score.toFixed(1) : 'N/A';
        const cover = mainItem?.cover || userItem?.cover;

        html += `
            <div class="flex items-center bg-neutral-800/40 rounded-lg p-2 border border-neutral-800 hover:border-neutral-600 transition-colors">
                <div class="flex-1 text-right pr-4 font-mono font-bold text-blue-400 text-lg">${mainScore}</div>
                <div class="w-px h-8 bg-neutral-700"></div>
                <div class="flex-initial w-64 px-4 flex items-center gap-3">
                    <img src="${cover || ''}" class="w-10 h-10 rounded object-cover bg-neutral-700">
                    <div class="text-sm font-bold text-white truncate">${title}</div>
                </div>
                <div class="w-px h-8 bg-neutral-700"></div>
                <div class="flex-1 text-left pl-4 font-mono font-bold text-purple-400 text-lg">${userScore}</div>
            </div>
        `;
    });
    html += '</div></div>';
    container.innerHTML = html;
    els.mainContent.appendChild(container);
}

function renderMainArea() {
    els.mainContent.innerHTML = '';
    if (state.viewMode === 'horizontal') renderHorizontalView();
    else renderVerticalView();
}

function renderHorizontalView() {
    const items = getCurrentItems();
    const currentAlbum = getActiveAlbum();
    const activeList = getActiveList();
    
    const wrapper = document.createElement('div');
    wrapper.className = 'absolute inset-0 flex flex-col overflow-hidden';
    
    const guide = document.createElement('div');
    guide.className = 'w-full text-center py-4 text-neutral-600 text-sm uppercase tracking-widest font-medium pointer-events-none select-none z-10 bg-neutral-900/50 backdrop-blur-sm shrink-0 flex justify-center items-center gap-4';
    guide.innerHTML = '<span>Left: Worst &larr;</span> <span class="text-purple-500 font-bold bg-purple-900/20 px-2 py-1 rounded">Absolute Metric Scale</span> <span>&rarr; Right: Best</span>';
    wrapper.appendChild(guide);

    const scrollArea = document.createElement('div');
    scrollArea.className = 'flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar relative flex flex-col justify-center';
    
    const axisContainer = document.createElement('div');
    axisContainer.id = 'axis-container';
    
    const stats = getPaddedStats();
    const widthPercent = 100 * state.zoomLevel;
    
    axisContainer.style.width = `${widthPercent}%`;
    axisContainer.className = 'h-64 relative flex items-center group select-none transition-all duration-300 min-w-full';
    
    const line = document.createElement('div');
    line.className = 'absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent w-full';
    axisContainer.appendChild(line);

    if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'absolute inset-0 flex items-center justify-center text-neutral-600';
        empty.innerText = 'List is empty.';
        axisContainer.appendChild(empty);
    }

    const dynSize = getDynamicSize();

    const exactScores = {};
    items.forEach(item => {
        const s = item.score.toFixed(3);
        if(!exactScores[s]) exactScores[s] = [];
        exactScores[s].push(item);
    });

    items.forEach(item => {
        const percent = ((item.score - stats.paddedMin) / stats.paddedRange) * 100;
        
        const group = exactScores[item.score.toFixed(3)];
        const indexInGroup = group.indexOf(item);
        const offsetX = indexInGroup * 15;
        const offsetY = indexInGroup * 15;
        
        const node = document.createElement('div');
        node.id = `node-${item.id}`;
        node.className = `absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-75 ease-out hover:scale-110 hover:z-[60]`;
        node.style.left = `calc(${percent}% + ${offsetX}px)`;
        node.style.marginTop = `${offsetY}px`;
        node.style.zIndex = 50 - indexInGroup;
        node.style.cursor = state.isReadOnly ? 'pointer' : 'grab';

        const isSong = state.currentView === 'album' || state.activeListId === 'auto-songs' || (activeList && activeList.type === 'songs');
        const coverUrl = item.cover || (currentAlbum ? currentAlbum.cover : '');

        if (!state.isReadOnly) {
            node.addEventListener('mousedown', (e) => handleDragStart(e, item.id));
            node.addEventListener('touchstart', (e) => handleDragStart(e, item.id));
        }
        
        node.addEventListener('click', (e) => {
                if (e.target.closest('.tooltip-container')) return; // Ignore clicks if they happened inside the tooltip popup
                if (isSong) openModal(item);
                else {
                    if (state.currentView === 'artistAutoList' && state.activeListId === 'auto-albums') {
                        const mainList = state.lists.find(l => l.isMain);
                        if (mainList) goToAlbum(item.id, mainList.id);
                    } else if(!state.isDragging) goToAlbum(item.id);
                }
        });

        let visual;
        if (isSong) {
            visual = `<div style="width: ${dynSize * 0.8}px; height: ${dynSize * 0.8}px;" class="rounded-full shadow-2xl overflow-hidden border-2 border-neutral-500 group-hover/album:border-white bg-neutral-800 transition-colors relative flex items-center justify-center">
                ${coverUrl ? `<img src="${coverUrl}" class="w-full h-full object-cover pointer-events-none opacity-70 group-hover/album:opacity-100">` : `<div class="w-full h-full bg-neutral-700 flex items-center justify-center"><i data-lucide="music-2" class="w-1/2 h-1/2 text-white/50"></i></div>`}
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none"><div class="w-2 h-2 bg-white rounded-full shadow-sm"></div></div>
            </div>`;
        } else {
            visual = `<div style="width: ${dynSize}px; height: ${dynSize}px;" class="rounded-full shadow-2xl overflow-hidden border-2 border-neutral-700 group-hover/album:border-white bg-neutral-800 transition-colors relative">
                ${item.cover ? `<img src="${item.cover}" class="w-full h-full object-cover pointer-events-none">` : `<div class="w-full h-full bg-gradient-to-br ${item.color || 'from-gray-700 to-gray-900'} flex items-center justify-center"><i data-lucide="disc" class="w-1/2 h-1/2 text-white/20"></i></div>`}
            </div>`;
        }

        const spotifyLinkHtml = item.link && item.link.includes('spotify') ? `
            <a href="${item.link}" target="_blank" class="inline-flex mt-2 items-center gap-1 text-[10px] bg-green-500/20 text-green-400 hover:bg-green-500/40 px-2 py-1 rounded transition-colors">
                <svg viewBox="0 0 24 24" class="w-3 h-3 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.241 1.2zM20.16 9.6C16.44 7.38 9.54 7.2 5.58 8.4c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.68-1.38 12.18-1.14 16.5 1.44.54.3.72 1.02.42 1.56-.24.6-.96.78-1.68.3z"/></svg>
                Listen
            </a>` : '';

        const tooltipContent = `
            <h3 class="font-bold text-white truncate">${item.title || 'Untitled'}</h3>
            ${!isSong ? `<p class="text-xs text-neutral-400 mb-1 truncate">${item.artist || 'Unknown Artist'}</p>` : ''}
            ${item.remarks ? `<div class="mt-2 p-2 bg-black/50 rounded text-[10px] text-left text-neutral-300 italic line-clamp-3">"${item.remarks}"</div>` : ''}
            ${spotifyLinkHtml}
            <div class="flex justify-center gap-2 mt-2">
                <button class="btn-edit-item p-1.5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white" title="Details"><i data-lucide="${state.isReadOnly ? 'eye' : 'more-vertical'}" class="w-3 h-3"></i></button>
            </div>
        `;

        node.innerHTML = `
            <div class="relative group/album">
                ${visual}
                ${state.showMetrics ? `<div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-800 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-neutral-700 shadow-xl whitespace-nowrap"><span class="metric-val">${getMetric(item.score)}</span></div>` : ''}
                <div class="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 bg-neutral-900/95 backdrop-blur-md border border-neutral-700 p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover/album:opacity-100 group-hover/album:visible transition-all duration-200 transform translate-y-2 group-hover/album:translate-y-0 text-center z-[100] pointer-events-auto tooltip-container">${tooltipContent}</div>
            </div>
            <div class="w-px h-6 bg-neutral-700/50 absolute left-1/2 -translate-x-1/2 -top-3 -z-10 group-hover/album:bg-purple-500/50 transition-colors"></div>
        `;

        node.querySelector('.btn-edit-item').addEventListener('mousedown', e => e.stopPropagation());
        node.querySelector('.btn-edit-item').addEventListener('click', (e) => { e.stopPropagation(); openModal(item); });

        axisContainer.appendChild(node);
    });

    scrollArea.appendChild(axisContainer);
    wrapper.appendChild(scrollArea);
    els.mainContent.appendChild(wrapper);
}

function renderVerticalView() {
    const list = getCurrentItems();
    const activeList = getActiveList();
    const container = document.createElement('div');
    container.className = 'h-full overflow-y-auto custom-scrollbar p-4 md:p-8 max-w-4xl mx-auto space-y-4';
    const sorted = [...list].sort((a, b) => b.score - a.score);

    if (sorted.length === 0) container.innerHTML = `<div class="text-center text-neutral-500 mt-20">List is empty.</div>`;

    sorted.forEach((item, index) => {
        const row = document.createElement('div');
        const isClickable = (state.currentView === 'list' || state.currentView === 'artistAutoList');
        row.className = `group flex items-center gap-4 md:gap-6 bg-neutral-800/40 hover:bg-neutral-800/80 p-4 rounded-2xl border border-neutral-800 hover:border-neutral-600 transition-all ${isClickable ? 'cursor-pointer' : ''}`;
        
        const isSong = state.currentView === 'album' || state.activeListId === 'auto-songs' || (activeList && activeList.type === 'songs');

        if (isClickable) {
            row.onclick = (e) => {
                if (e.target.closest('button') || e.target.closest('a')) return;
                if (isSong) openModal(item);
                else {
                        if (state.currentView === 'artistAutoList' && state.activeListId === 'auto-albums') {
                            const mainList = state.lists.find(l => l.isMain);
                            if(mainList) goToAlbum(item.id, mainList.id);
                        } else goToAlbum(item.id);
                }
            };
        }

        const imgHtml = isSong ? 
            `<div class="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center flex-shrink-0 text-neutral-500 overflow-hidden">${item.cover ? `<img src="${item.cover}" class="w-full h-full object-cover">` : `<i data-lucide="music-2" class="w-5 h-5"></i>`}</div>` : 
            `<div class="w-16 h-16 md:w-24 md:h-24 rounded-xl overflow-hidden bg-neutral-900 shadow-lg flex-shrink-0">${item.cover ? `<img src="${item.cover}" class="w-full h-full object-cover">` : `<div class="w-full h-full bg-gradient-to-br ${item.color || 'from-gray-700 to-gray-900'} flex items-center justify-center"><i data-lucide="disc" class="w-8 h-8 text-white/20"></i></div>`}</div>`;

        row.innerHTML = `
            <div class="text-xl md:text-2xl font-black text-neutral-700 w-8 text-center group-hover:text-neutral-500">#${index + 1}</div>
            ${imgHtml}
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-1">
                    <h3 class="text-lg md:text-2xl font-bold text-white truncate">${item.title}</h3>
                    ${state.showMetrics ? `<span class="text-xs font-bold bg-neutral-900 text-purple-400 px-2 py-0.5 rounded border border-neutral-700">${getMetric(item.score)}</span>` : ''}
                </div>
                ${!isSong ? `<p class="text-base text-neutral-400 mb-2">${item.artist}</p>` : ''}
                ${item.remarks ? `<p class="text-sm text-neutral-500 italic line-clamp-1">"${item.remarks}"</p>` : ''}
            </div>
            <div class="flex flex-col gap-2">
                <button class="btn-list-edit p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"><i data-lucide="${state.isReadOnly ? 'eye' : 'more-vertical'}" class="w-5 h-5"></i></button>
                ${!state.isReadOnly ? `<button class="btn-list-delete p-2 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-5 h-5"></i></button>` : ''}
            </div>
        `;
        row.querySelector('.btn-list-edit').addEventListener('click', (e) => { e.stopPropagation(); openModal(item); });
        if(!state.isReadOnly) row.querySelector('.btn-list-delete').addEventListener('click', (e) => { e.stopPropagation(); deleteItem(item.id); });
        container.appendChild(row);
    });
    els.mainContent.appendChild(container);
}

function getStats() {
    const list = getCurrentItems();
    let min = 0; let max = 10;
    if (list && list.length > 0) {
        const scores = list.map(a => parseFloat(a.score) || 0);
        min = Math.min(0, ...scores);
        max = Math.max(10, ...scores);
    }
    return { min, max, range: max - min || 10 };
}

function getPaddedStats() {
    const stats = getStats();
    // Just add 10% padding so items aren't directly on the screen edge
    const pad = Math.max(1, stats.range * 0.1); 
    return {
        ...stats,
        paddedMin: stats.min - pad,
        paddedMax: stats.max + pad,
        paddedRange: stats.range + (pad * 2)
    };
}

function getMetric(score) {
    return parseFloat(score).toFixed(1);
}

function getDynamicSize() {
    const { range } = getStats();
    const baseSize = 56;
    const scaleFactor = Math.sqrt(10 / Math.max(10, range));
    return Math.max(24, baseSize * scaleFactor);
}

function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase();
    if (query.length < 1) return els.searchResults.classList.add('hidden');
    els.searchResults.innerHTML = '';
    els.searchResults.classList.remove('hidden');

    const lists = state.lists.filter(l => l.name.toLowerCase().includes(query));
    
    const allArtistsSet = new Set();
    state.library.forEach(l => { if (l.artist) l.artist.split(',').forEach(a => allArtistsSet.add(a.trim())); });
    const artists = [...allArtistsSet].filter(a => a.toLowerCase().includes(query));
    
    if(artists.length > 0) {
        els.searchResults.innerHTML += `<div class="px-4 py-2 text-xs font-bold text-neutral-500 uppercase bg-neutral-800/50">Artists</div>`;
        artists.forEach(a => {
            const el = document.createElement('div');
            el.className = 'px-4 py-3 hover:bg-neutral-800 cursor-pointer flex items-center gap-3 border-b border-neutral-800';
            el.innerHTML = `<div class="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center"><i data-lucide="mic-2" class="w-4 h-4 text-purple-400"></i></div><span class="font-bold text-white">${a}</span>`;
            const safeName = a.replace(/'/g, "\\'");
            el.onclick = () => goToArtistProfile(safeName);
            els.searchResults.appendChild(el);
        });
    }
    if(lists.length > 0) {
        els.searchResults.innerHTML += `<div class="px-4 py-2 text-xs font-bold text-neutral-500 uppercase bg-neutral-800/50">Lists</div>`;
        lists.forEach(l => {
            const el = document.createElement('div');
            el.className = 'px-4 py-3 hover:bg-neutral-800 cursor-pointer flex items-center gap-3 border-b border-neutral-800';
            el.innerHTML = `<div class="w-8 h-8 rounded-full ${l.color} flex items-center justify-center"><i data-lucide="list" class="w-4 h-4 text-white"></i></div><span class="font-bold text-white">${l.name}</span>`;
            el.onclick = () => { goToList(l.id); els.searchResults.classList.add('hidden'); };
            els.searchResults.appendChild(el);
        });
    }

    const matchedItems = [];
    const seenItems = new Set();
    
    state.lists.forEach(list => {
        list.items.forEach(item => {
            const key = `${item.title.toLowerCase()}|${item.artist.toLowerCase()}`;
            if (item.title.toLowerCase().includes(query) && !seenItems.has(key)) {
                seenItems.add(key);
                matchedItems.push({ item, listName: list.name, listId: list.id, type: list.type });
            }
        });
    });

    if (matchedItems.length > 0) {
        els.searchResults.innerHTML += `<div class="px-4 py-2 text-xs font-bold text-neutral-500 uppercase bg-neutral-800/50">Items</div>`;
        matchedItems.forEach(match => {
            const el = document.createElement('div');
            el.className = 'px-4 py-3 hover:bg-neutral-800 cursor-pointer flex items-center gap-3 border-b border-neutral-800';
            const icon = match.type === 'songs' ? 'music' : 'disc';
            el.innerHTML = `
                <img src="${match.item.cover || ''}" class="w-8 h-8 rounded object-cover bg-neutral-700">
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-white text-sm">${match.item.title}</div>
                    <div class="text-xs text-neutral-500">in ${match.listName}</div>
                </div>
            `;
            el.onclick = () => { 
                if (match.type === 'songs') goToList(match.listId);
                else goToAlbum(match.item.id, match.listId); 
                els.searchResults.classList.add('hidden'); 
            };
            els.searchResults.appendChild(el);
        });
    }
    lucide.createIcons({ root: els.searchResults });
}

// --- View Actions ---
function toggleMetrics() { state.showMetrics = !state.showMetrics; render(); }
function toggleCalibration() { state.calibrateGlobal = !state.calibrateGlobal; render(); }
function setViewMode(mode) { state.viewMode = mode; render(); }
function zoomIn() { if (state.zoomLevel < 5) { state.zoomLevel += 0.5; render(); } }
function zoomOut() { if (state.zoomLevel > 1) { state.zoomLevel -= 0.5; render(); } }
function setGlobalSort(type) { state.globalSort = type; render(); }