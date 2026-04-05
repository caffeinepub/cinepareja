# CinePareja

## Current State
- App has WatchingTab, FinishedTab, PendingTab, HomeTab showing movie/series cards with emoji icons
- WatchItem has: id, title, watchType, status, pausedAtMin, notes, currentEpisode, review, rating
- PendingItem has: id, title, watchType, notes
- No poster images for movies/series — only emoji (🎬/📺)

## Requested Changes (Diff)

### Add
- Fetch movie/series poster from TMDB API when user types a title in the add/edit form
- Show a small poster image in cards across WatchingTab, FinishedTab, PendingTab, and HomeTab
- Store the poster URL in the WatchItem and PendingItem (as optional field `posterUrl`)
- Auto-search TMDB when user finishes typing the title (debounced), show poster preview in the form
- TMDB API key: use the public TMDB API with API key (free key) — use fetch from frontend directly

### Modify
- WatchItem type: add optional `posterUrl?: string` field
- PendingItem type: add optional `posterUrl?: string` field  
- WatchingTab form: show poster preview after title is typed; allow clearing it
- FinishedTab card: show poster image if available
- PendingTab form and card: show poster image if available
- HomeTab hero card: show poster image if available for currently watching item
- Backend: add `posterUrl` field to WatchItem V4 and PendingItem

### Remove
- Nothing removed

## Implementation Plan
1. Update backend Motoko: add V4 WatchItem with posterUrl, migrate V3->V4; update PendingItem with posterUrl
2. Create frontend TMDB hook: `useTMDBPoster(title, type)` — calls TMDB search API, returns first result's poster_path
3. Update WatchingTab: add posterUrl to FormState; auto-fetch poster on title change; show poster preview in form; pass posterUrl when saving; show poster in cards
4. Update FinishedTab: show poster in cards
5. Update PendingTab: add posterUrl to FormState; auto-fetch poster; show poster in form and cards
6. Update HomeTab: show poster in hero card if available
