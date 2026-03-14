// --- Core Dragging & Score Application Logic ---
function applyDragDelta(deltaScore) {
    const listItems = state.currentView === 'album' ? getActiveAlbum().songs : getActiveList().items;
    const item = listItems.find(i => i.id === state.draggedId);
    if (!item) return;

    let currentScore = item.score;
    
    // Friction mechanics: If going beyond 0 or 10, slow the drag speed down
    if ((currentScore >= 10 && deltaScore > 0) || (currentScore <= 0 && deltaScore < 0)) {
        deltaScore *= 0.5;
    }

    item.score = currentScore + deltaScore;

    // Instantly render visual DOM updates live without tearing down
    const liveStats = getPaddedStats();
    listItems.forEach(it => {
        const node = document.getElementById(`node-${it.id}`);
        if (node) {
            const percent = ((it.score - liveStats.paddedMin) / liveStats.paddedRange) * 100;
            node.style.left = `calc(${percent}%)`;
            if (it.id === state.draggedId) {
                node.style.marginTop = `0px`; // pull out of the stack during dragging
                if (state.showMetrics) {
                    const m = node.querySelector('.metric-val');
                    if (m) m.innerText = getMetric(item.score);
                }
            }
        }
    });
}

function edgePushLoop() {
    if (!state.isDragging) return;
    
    // Auto-scroll push effect while holding cursor at the edge
    if (state.edgeDirection !== 0) {
        const container = document.getElementById('axis-container');
        if (container) {
            const rect = container.getBoundingClientRect();
            const pixelsPerUnit = rect.width / state.dragStartStats.paddedRange;
            // Automatically add the equivalent of 12 pixels per frame of movement
            const deltaScore = (state.edgeDirection * 12) / pixelsPerUnit;
            applyDragDelta(deltaScore);
        }
    }
    
    state.edgePushFrame = requestAnimationFrame(edgePushLoop);
}

function handleDragStart(e, id) {
    if (e.target.closest('.tooltip-container')) return; 
    if (state.viewMode !== 'horizontal' || state.isReadOnly) return;
    
    state.isDragging = true;
    state.draggedId = id;
    state.isClickCandidate = true;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    state.dragStartX = clientX;
    state.dragLastX = clientX;
    state.edgeDirection = 0;
    state.dragStartStats = getPaddedStats(); 
    
    const node = document.getElementById(`node-${id}`);
    if (node) { node.style.zIndex = 100; node.classList.add('dragging'); }
    
    document.body.style.cursor = 'grabbing';
    
    // Start the boundary edge-pushing loop
    if (state.edgePushFrame) cancelAnimationFrame(state.edgePushFrame);
    state.edgePushFrame = requestAnimationFrame(edgePushLoop);
}

function handleDragMove(e) {
    if (!state.isDragging || !state.draggedId || !state.dragStartStats) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    
    if (state.isClickCandidate && Math.abs(clientX - state.dragStartX) > 5) state.isClickCandidate = false;

    const deltaX = clientX - state.dragLastX;
    state.dragLastX = clientX;

    // Determine if the mouse cursor is at the edges of the screen (triggers push loop)
    const edgeThreshold = 40;
    if (clientX < edgeThreshold) state.edgeDirection = -1; // Pushing left
    else if (clientX > window.innerWidth - edgeThreshold) state.edgeDirection = 1; // Pushing right
    else state.edgeDirection = 0;

    if (deltaX !== 0) {
        const container = document.getElementById('axis-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        
        // Map the raw mouse pixel movement to the line's metric scale
        const pixelsPerUnit = rect.width / state.dragStartStats.paddedRange;
        const deltaScore = deltaX / pixelsPerUnit;
        
        applyDragDelta(deltaScore);
    }
}

function handleDragEnd() {
    if (state.isDragging) {
        document.body.style.cursor = '';
        cancelAnimationFrame(state.edgePushFrame); // Stop the infinite scroll edge-pusher
        state.edgeDirection = 0;
        
        if (state.isClickCandidate) {
            const list = getActiveList();
            const isSong = state.currentView === 'album' || (list && list.type === 'songs');
            if (isSong) { const s = getCurrentItems().find(x => x.id === state.draggedId); openModal(s); }
            else if (state.currentView === 'list') goToAlbum(state.draggedId);
        } else {
            saveData(); 
            render(); // Re-render naturally settles and bounds the newly positioned line
        }
        
        const node = document.getElementById(`node-${state.draggedId}`);
        if (node) node.classList.remove('dragging');
        state.isDragging = false;
        state.draggedId = null;
        state.dragStartStats = null;
    }
}