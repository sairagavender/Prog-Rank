// --- Spotify Integration ---
function openSettingsModal() {
    els.inputSpotifyClientId.value = spotifyState.clientId;
    els.settingsModalOverlay.classList.remove('hidden');
    setTimeout(() => els.settingsModalOverlay.classList.remove('opacity-0'), 10);
    lucide.createIcons({ root: els.settingsModalOverlay });
}

function closeSettingsModal() {
    els.settingsModalOverlay.classList.add('opacity-0');
    setTimeout(() => els.settingsModalOverlay.classList.add('hidden'), 200);
}

// --- Spotify PKCE Auth Helpers ---
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function checkSpotifyAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
        showToast(`Spotify Auth Error: ${error}`);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (code) {
        const cid = localStorage.getItem('spotify_client_id');
        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        const redirectUri = window.location.origin + window.location.pathname;

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: cid,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                    code_verifier: codeVerifier,
                }),
            });

            if (!response.ok) throw new Error('Token exchange failed');
            
            const data = await response.json();
            
            localStorage.setItem('spotify_access_token', data.access_token);
            if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);
            localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));
            
            spotifyState.accessToken = data.access_token;
            spotifyState.tokenExpiry = Date.now() + (data.expires_in * 1000);
            
            window.history.replaceState({}, document.title, window.location.pathname);
            showToast("Spotify connected successfully!");
        } catch (err) {
            console.error(err);
            showToast("Failed to verify Spotify login.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } else if (spotifyState.accessToken && Date.now() > spotifyState.tokenExpiry) {
        spotifyState.accessToken = '';
        localStorage.removeItem('spotify_access_token');
    }
}

async function authSpotify() {
    const cid = els.inputSpotifyClientId.value.trim();
    if (!cid) return showToast("Enter Client ID");
    localStorage.setItem('spotify_client_id', cid);

    const codeVerifier = generateRandomString(64);
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const redirectUri = window.location.origin + window.location.pathname;
    
    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.append("client_id", cid);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("redirect_uri", redirectUri);
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("code_challenge", codeChallenge);

    window.location.href = url.toString();
}

async function fetchSpotifyData() {
    const urlStr = els.inputSpotifyAutofill.value.trim();
    if (!urlStr) return showToast("Paste a Spotify link first!");
    if (!spotifyState.accessToken) return showToast("Please connect to Spotify in Settings first!");
    
    try {
        const btn = document.querySelector('#spotify-autofill-section button');
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>';
        lucide.createIcons({ root: btn.parentNode });

        const urlObj = new URL(urlStr);
        const pathParts = urlObj.pathname.split('/');
        const type = pathParts[1]; 
        const id = pathParts[2];
        
        if (!['album', 'track'].includes(type) || !id) throw new Error("Invalid Link");

        const res = await fetch(`https://api.spotify.com/v1/${type}s/${id}`, {
            headers: { 'Authorization': `Bearer ${spotifyState.accessToken}` }
        });
        
        if (res.status === 401) return showToast("Spotify token expired. Please reconnect in settings.");
        const data = await res.json();
        
        if (type === 'album') {
            els.inputTitle.value = data.name;
            els.inputArtist.value = data.artists.map(a => a.name).join(', ');
            if (data.images && data.images.length > 0) {
                state.tempItem.cover = data.images[0].url;
                els.inputCoverUrl.value = data.images[0].url;
                els.coverPreview.src = data.images[0].url;
                els.coverPreviewContainer.classList.remove('hidden');
                els.coverPlaceholder.classList.add('hidden');
            }
            els.inputLink.value = data.external_urls.spotify;
            
            if (data.tracks && data.tracks.items) {
                state.tempItem.songs = data.tracks.items.map(t => ({
                    id: generateId(),
                    title: t.name,
                    artist: t.artists.map(a => a.name).join(', '),
                    score: 5.0,
                    remarks: '',
                    link: t.external_urls.spotify
                }));
                showToast(`Auto-filled details & ${data.tracks.items.length} songs!`);
            }
        } else if (type === 'track') {
            els.inputTitle.value = data.name;
            els.inputArtist.value = data.artists.map(a => a.name).join(', ');
            if (data.album && data.album.images && data.album.images.length > 0) {
                state.tempItem.cover = data.album.images[0].url;
                els.inputCoverUrl.value = data.album.images[0].url;
                els.coverPreview.src = data.album.images[0].url;
                els.coverPreviewContainer.classList.remove('hidden');
                els.coverPlaceholder.classList.add('hidden');
            }
            els.inputLink.value = data.external_urls.spotify;
            showToast("Track details fetched!");
        }

        state.tempItem.title = els.inputTitle.value;
        state.tempItem.artist = els.inputArtist.value;
        state.tempItem.link = els.inputLink.value;
        
        btn.innerHTML = 'Fetch';
        els.inputSpotifyAutofill.value = '';
        
    } catch (e) {
        console.error(e);
        showToast("Failed to fetch Spotify data.");
        const btn = document.querySelector('#spotify-autofill-section button');
        btn.innerHTML = 'Fetch';
    }
}
