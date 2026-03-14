// --- List Modal Functions ---
function openListModal() {
    setListModalTab('create');
    els.listModalOverlay.classList.remove('hidden');
    setTimeout(() => els.listModalOverlay.classList.remove('opacity-0'), 10);
}

function setListModalTab(tab) {
    if (tab === 'create') {
        els.tabCreate.className = 'text-sm font-bold text-white border-b-2 border-purple-500 pb-2 -mb-2.5';
        els.tabImport.className = 'text-sm font-bold text-neutral-500 hover:text-white pb-2';
        els.viewCreateList.classList.remove('hidden');
        els.viewImportList.classList.add('hidden');
        els.listModalHeading.innerText = 'Create New List';
        els.inputListName.value = '';
        els.inputListName.focus();
        const radios = document.getElementsByName('new-list-type');
        for(let r of radios) if (r.value === (state.mainListType || 'albums')) r.checked = true;
    } else {
        els.tabImport.className = 'text-sm font-bold text-white border-b-2 border-purple-500 pb-2 -mb-2.5';
        els.tabCreate.className = 'text-sm font-bold text-neutral-500 hover:text-white pb-2';
        els.viewImportList.classList.remove('hidden');
        els.viewCreateList.classList.add('hidden');
        els.listModalHeading.innerText = 'Import List';
        els.inputImportJson.value = '';
        els.inputImportJson.focus();
    }
}

function createNewList() {
    const name = els.inputListName.value.trim();
    if (!name) return;
    const typeRadio = document.querySelector('input[name="new-list-type"]:checked');
    state.lists.push({ id: generateId(), name: name, items: [], color: 'bg-neutral-800', type: typeRadio ? typeRadio.value : 'albums' });
    saveData();
    els.listModalOverlay.classList.add('hidden');
}

function importList() {
    try {
        const json = els.inputImportJson.value.trim();
        if(!json) return;
        const data = JSON.parse(json);
        if (!data.items || !Array.isArray(data.items)) throw new Error("Invalid Format");

        let baseName = data.name || "Imported List";
        let newName = baseName;
        let counter = 1;
        while(state.lists.find(l => l.name === newName)) { counter++; newName = `${baseName} ${counter}`; }

        const newItems = data.items.map(item => ({
            ...item,
            id: generateId(),
            songs: (item.songs || []).map(s => ({ ...s, id: generateId() }))
        }));

        newItems.forEach(item => addToLibrary(item));
        state.lists.push({ id: generateId(), name: newName, color: data.color || 'bg-neutral-800', items: newItems, type: data.type || 'albums' });
        saveData();
        els.listModalOverlay.classList.add('hidden');
        showToast(`Imported "${newName}" successfully!`);
    } catch (e) { alert("Invalid JSON format."); }
}

// --- List Options ---
function openListOptions(e, listId) {
    e.stopPropagation();
    state.optionsListId = listId;
    state.listOptionsOpen = true;
    state.deleteConfirmState = false; 
    
    const list = state.lists.find(l => l.id === listId);
    els.inputRenameList.value = list.name;
    
    els.btnPinList.innerHTML = `<i data-lucide="pin" class="w-4 h-4"></i> ${list.isPinned ? 'Unpin List' : 'Pin to Top'}`;
    els.btnPinList.className = `w-full flex items-center justify-center gap-2 ${list.isPinned ? 'bg-purple-600 hover:bg-purple-500' : 'bg-neutral-800 hover:bg-neutral-700'} text-white py-2.5 rounded-lg font-bold transition-colors`;
    els.btnPinList.onclick = () => togglePinList();

    if(list.isMain) els.btnDeleteList.classList.add('hidden');
    else {
        els.btnDeleteList.classList.remove('hidden');
        els.btnDeleteList.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4"></i> Delete List`;
        els.btnDeleteList.className = "w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2.5 rounded-lg font-bold transition-colors";
    }
    
    els.listOptionsOverlay.classList.remove('hidden');
    setTimeout(() => els.listOptionsOverlay.classList.remove('opacity-0'), 10);
    lucide.createIcons({ root: els.listOptionsOverlay });
}

function togglePinList() {
    const list = state.lists.find(l => l.id === state.optionsListId);
    if(list) { list.isPinned = !list.isPinned; saveData(); closeOptionsModal(); }
}

function closeOptionsModal() {
    state.listOptionsOpen = false;
    state.optionsListId = null;
    els.listOptionsOverlay.classList.add('opacity-0');
    setTimeout(() => els.listOptionsOverlay.classList.add('hidden'), 200);
}

function renameList(newName) {
    const list = state.lists.find(l => l.id === state.optionsListId);
    if(list) { list.name = newName; renderDashboard(); lucide.createIcons({ root: els.mainContent }); }
}

function updateListColor(colorClass) {
    const list = state.lists.find(l => l.id === state.optionsListId);
    if(list) { list.color = colorClass; renderDashboard(); lucide.createIcons({ root: els.mainContent }); }
}

function deleteList() {
    const list = state.lists.find(l => l.id === state.optionsListId);
    if(list.isMain) return showToast("Cannot delete the Main List.");

    if (!state.deleteConfirmState) {
        state.deleteConfirmState = true;
        els.btnDeleteList.innerText = "Confirm Delete?";
        els.btnDeleteList.className = "w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-bold transition-colors";
        return;
    }
    state.lists = state.lists.filter(l => l.id !== state.optionsListId);
    saveData();
    closeOptionsModal();
    showToast("List deleted.");
}

function shareList() {
    const list = state.lists.find(l => l.id === state.optionsListId);
    if(!list) return;
    const cleanItems = list.items.map(item => {
        const copy = { ...item };
        if (copy.cover && copy.cover.startsWith('data:')) copy.cover = null; 
        return copy;
    });
    const exportData = { name: list.name, color: list.color, items: cleanItems, type: list.type };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => showToast("List data copied!"));
}

function renderColorPicker() {
    els.colorPickerContainer.innerHTML = '';
    LIST_COLORS.forEach(color => {
        const btn = document.createElement('button');
        btn.className = `w-8 h-8 rounded-full ${color} border-2 border-transparent hover:border-white transition-all`;
        btn.onclick = () => updateListColor(color);
        els.colorPickerContainer.appendChild(btn);
    });
}

function createDefaultMainList() {
    state.lists.push({
        id: generateId(),
        name: state.mainListType === 'albums' ? "My Album Rankings" : "My Song Rankings",
        items: [],
        color: 'bg-neutral-800',
        isMain: true,
        isPinned: true,
        type: state.mainListType
    });
    saveData();
}

function selectMainListType(type) {
    state.mainListType = type;
    els.setupModalOverlay.classList.add('opacity-0');
    setTimeout(() => els.setupModalOverlay.classList.add('hidden'), 200);
    state.lists = [];
    createDefaultMainList();
    saveData();
    render();
}

function renderSetupModal() {
    els.setupModalOverlay.classList.remove('hidden');
    setTimeout(() => els.setupModalOverlay.classList.remove('opacity-0'), 10);
    lucide.createIcons({ root: els.setupModalOverlay });
}