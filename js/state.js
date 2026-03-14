const STORAGE_KEY = 'prog_rank_data_v1';
const LIST_COLORS = ['bg-neutral-800', 'bg-red-900/40', 'bg-orange-900/40', 'bg-amber-900/40', 'bg-green-900/40', 'bg-emerald-900/40', 'bg-teal-900/40', 'bg-cyan-900/40', 'bg-sky-900/40', 'bg-blue-900/40', 'bg-indigo-900/40', 'bg-violet-900/40', 'bg-purple-900/40', 'bg-fuchsia-900/40', 'bg-pink-900/40', 'bg-rose-900/40'];

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

const showToast = (message) => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'bg-neutral-800 border border-neutral-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 notification-toast pointer-events-auto';
    toast.innerHTML = `<i data-lucide="info" class="w-5 h-5 text-purple-400"></i> <span class="text-sm font-medium">${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons({ root: toast });
    setTimeout(() => toast.remove(), 3000);
};

let state = {
    mainListType: null, // 'albums' | 'songs'
    library: [],
    lists: [],
    artists: {}, 
    migratedToAbsolute: false, 
    
    history: [], 
    currentView: 'dashboard', 
    activeListId: null,
    activeAlbumId: null,
    activeArtistName: null,
    
    viewMode: 'horizontal',
    showMetrics: false,
    zoomLevel: 1,
    isReadOnly: false, 
    globalSort: 'avg', 
    calibrateGlobal: false, 
    
    isDragging: false,
    draggedId: null,
    dragStartX: 0,
    dragLastX: 0,
    edgeDirection: 0,
    edgePushFrame: null,
    isClickCandidate: false,
    dragStartStats: null,
    
    modalOpen: false,
    editMode: false,
    editId: null,
    tempItem: { title: '', artist: '', link: '', cover: '', remarks: '', songs: null },
    originalItemForEdit: null,
    
    listModalOpen: false,
    listOptionsOpen: false,
    optionsListId: null,
    deleteConfirmState: false,
    draggedListIdx: null
};

const spotifyState = {
    clientId: localStorage.getItem('spotify_client_id') || '',
    accessToken: localStorage.getItem('spotify_access_token') || '',
    tokenExpiry: localStorage.getItem('spotify_token_expiry') || 0
};

// DOM Element References
const els = {
    header: document.getElementById('header-container'),
    mainContent: document.getElementById('main-content'),
    searchResults: document.getElementById('global-search-results'),
    setupModalOverlay: document.getElementById('setup-modal-overlay'),
    modalOverlay: document.getElementById('modal-overlay'),
    modalContent: document.getElementById('modal-content'),
    modalTitle: document.getElementById('modal-title'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    coverSection: document.getElementById('cover-section'),
    coverTrigger: document.getElementById('cover-upload-trigger'),
    fileInput: document.getElementById('file-input'),
    inputCoverUrl: document.getElementById('input-cover-url'),
    coverUrlContainer: document.getElementById('cover-url-container'),
    coverPreviewContainer: document.getElementById('cover-preview-container'),
    coverPreview: document.getElementById('cover-preview'),
    coverPlaceholder: document.getElementById('cover-placeholder'),
    coverLabelText: document.getElementById('cover-label-text'),
    inputTitle: document.getElementById('input-title'),
    inputArtist: document.getElementById('input-artist'),
    artistSuggestions: document.getElementById('artist-suggestions'),
    inputLink: document.getElementById('input-link'),
    inputRemarks: document.getElementById('input-remarks'),
    fieldArtist: document.getElementById('field-artist-container'),
    fieldLink: document.getElementById('field-link-container'),
    labelTitle: document.getElementById('label-title'),
    btnSave: document.getElementById('btn-save'),
    btnDelete: document.getElementById('btn-delete'),
    searchSection: document.getElementById('library-search-section'),
    inputSearchLib: document.getElementById('input-search-library'),
    libraryResults: document.getElementById('library-results'),
    listModalOverlay: document.getElementById('list-modal-overlay'),
    btnCloseListModal: document.getElementById('btn-close-list-modal'),
    inputListName: document.getElementById('input-list-name'),
    inputImportJson: document.getElementById('input-import-json'),
    btnCreateList: document.getElementById('btn-create-list'),
    btnImportList: document.getElementById('btn-import-list'),
    tabCreate: document.getElementById('tab-create'),
    tabImport: document.getElementById('tab-import'),
    viewCreateList: document.getElementById('view-create-list'),
    viewImportList: document.getElementById('view-import-list'),
    listModalHeading: document.getElementById('list-modal-heading'),
    listOptionsOverlay: document.getElementById('list-options-modal-overlay'),
    btnCloseOptionsModal: document.getElementById('btn-close-options-modal'),
    inputRenameList: document.getElementById('input-rename-list'),
    colorPickerContainer: document.getElementById('color-picker-container'),
    btnDeleteList: document.getElementById('btn-delete-list'),
    btnShareList: document.getElementById('btn-share-list'),
    btnPinList: document.getElementById('btn-pin-list'),
    artistPicInput: document.getElementById('artist-pic-input'),
    settingsModalOverlay: document.getElementById('settings-modal-overlay'),
    inputSpotifyClientId: document.getElementById('input-spotify-client-id'),
    inputSpotifyAutofill: document.getElementById('input-spotify-autofill')
};