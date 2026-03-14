# Prog Rank

A browser-based music ranking tool. No backend, no account, no install. Open and start ranking.

**Live:** https://prog-rank.vercel.app

---

## Features

- Two ranking modes: albums or songs
- Score-based axis view — drag items to set scores visually
- Vertical ranked list view
- Multiple lists with create, rename, delete, pin, reorder, color
- Import / export lists as JSON
- Artist profiles with auto-calculated averages and manual ratings
- Global artist rankings with calibration toggle
- Discography lists auto-generated per artist
- Side-by-side list comparison view
- Spotify integration — auto-fills metadata from a Spotify link
- Global search across all lists and items
- All data saved to localStorage, nothing leaves your browser

---

## How It Works

### First Launch

You pick one of two modes. **This cannot be changed later for your Main List.**

- **Album Mode** — rank albums on the main list, then drill into each album to rank its songs (Artists' stats will now be based on their albums)
- **Song Mode** — rank individual songs directly on the main list (Artists' stats will now be based on their songs)

---

### Scoring & The Axis View

Every item has a score from `0` to `10+`. You set it by dragging the item left or right on the horizontal axis. Higher score = higher position on screen.

- Dragging past 0 or 10 has friction (5x resistance) so you don't accidentally blow past the normal range
- If you hold the cursor at the screen edge while dragging, the axis auto-scrolls
- A short tap/click without dragging opens the item detail modal instead
- Toggle **Metrics** in the header to show the numeric score above each item
- **Zoom in/out** controls let you expand or compress the axis spacing

The **Vertical view** (list icon in header) shows the same items sorted by score as a ranked `#1, #2, #3...` list.

---

### Lists

The dashboard shows all your lists as cards.

- **Main List** — always pinned, cannot be deleted
- Create additional lists for albums or songs independently (e.g. a list just for 2024 releases, or a specific genre)
- Drag cards on the dashboard to reorder them
- Click `···` on any card to rename, recolor, pin, share (export), or delete
- **Pin** keeps a list at the top of the dashboard

**Import / Export** — Export outputs the list as a JSON string you can copy. Import accepts that same JSON to recreate the list on another device or browser.

---

### Adding Items

Click **Add** in any list. Fields:

| Field | Notes |
|---|---|
| Cover Art | Upload a file or paste a URL |
| Title | Required |
| Artist | Required. Multiple artists: separate with commas |
| Spotify Link | Optional. Shown as a link on the item card |
| Remarks | Free text notes / mini review |

When adding a song inside an album view, cover art and artist fields are hidden — the song inherits them from the album.

When adding to a secondary list, a **library search** appears first so you can pull in something you've already added elsewhere rather than re-entering it.

---

### Spotify Auto-Fill

Connect Spotify once in **Settings** (gear icon on dashboard). After that, paste any Spotify album or track URL into the Auto-Fill field when adding an item and hit **Fetch**.

- For albums: fills title, artist, cover art, Spotify link, and pre-loads all tracks as songs with a default score of 5.0
- For tracks: fills title, artist, and cover art

**Setup:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → create an app
2. Set the Redirect URI to exactly: `https://prog-rank.vercel.app/` (or your own deployment URL)
3. Copy your Client ID → paste it in Prog Rank Settings → Connect

Uses PKCE OAuth — no backend needed, no secret key exposed. Metadata fetching works on free Spotify accounts.

---

### Artist Profiles

Click any artist name anywhere in the app to open their profile.

- **Calculated avg** — auto-derived from all their items in your Main List
- **Your Rating** — a separate manual score (0–15 range) you set independently via slider or input
- Links to their auto-generated album ranking and song ranking views from the Main List
- **Discography List** — creates a new list pre-populated with all that artist's items from your library
- **Compare** — opens the comparison view

You can upload a custom profile photo. If none is set, it falls back to the first cover art found for that artist.

---

### Global Artist Rankings

Trophy icon on the dashboard header. Ranks every artist by their average score across your Main List.

- Sort by **Avg Score** or **Your Rating**
- **Calibrate to 100** — scales all scores so the top artist = 100, useful for relative comparison
- In Song Mode, only artists with 4+ ranked songs appear (avoids skewed averages from single entries)

---

### Data

Everything is saved to `localStorage` automatically. Nothing is sent anywhere.

To back up: export each list as JSON from the list options menu and save the strings somewhere.

To move to another browser or device: export and re-import.

---

## Stack

- Vanilla JS, no framework
- Tailwind CSS (CDN)
- Lucide Icons (CDN)
- Spotify Web API (PKCE)
- localStorage

---

## Running Locally

No build step. Just open the file:

```bash
open index.html
```

Or serve it:

```bash
npx serve .
# or
python3 -m http.server
```

For Spotify to work locally, add `http://localhost:PORT/` as a Redirect URI in your Spotify app settings.
