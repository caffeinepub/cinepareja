# CinePareja

## Current State
New project. Empty backend and frontend scaffolding only.

## Requested Changes (Diff)

### Add
- **Watchlist module**: Add/edit/delete movies and series to a shared watchlist. Each item has a title, type (movie/series), status (pending/watching/completed), and a "paused at minute" field.
- **Pending list**: A separate list for movies/series the couple wants to watch in the future (title, type, notes).
- **Daily meal menu**: A shared board where both users can write what they plan to eat that day (breakfast, lunch, dinner, notes). One entry per day, editable.
- **Real-time sync**: All data is stored in the backend and polled/refreshed so both users see changes immediately.
- **Couple pairing**: Simple shared access via a shared session/couple code — both users access the same data space.
- **Export/download**: Ability to download all data as a JSON file from the frontend.
- **CRUD for all items**: Add, edit, and delete for watchlist items, pending list items, and meal menu entries.

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan
1. Backend (Motoko):
   - Data types: `WatchItem` (id, title, type, status, pausedAtMinute, notes, updatedAt), `PendingItem` (id, title, type, notes, addedAt), `MealMenu` (id, date, breakfast, lunch, dinner, notes, updatedAt).
   - CRUD functions for each data type: create, update, delete, getAll.
   - All data shared globally (no per-user isolation — shared couple space).
   - `getLastUpdated` function to support frontend polling for real-time sync.

2. Frontend (React/TypeScript):
   - Mobile-first layout with bottom tab navigation (5 tabs: Home, Watching, Pending, Meals, Export).
   - Home tab: summary dashboard showing currently watching items and today's meal.
   - Watching tab: list of movies/series with pause minute tracker; add/edit/delete.
   - Pending tab: wishlist of titles to watch; add/edit/delete.
   - Meals tab: today's meal menu form (breakfast, lunch, dinner, notes); editable.
   - Export tab: download all data as JSON.
   - Poll backend every 10 seconds for updates.
   - Warm blush/rose color scheme, rounded cards, soft shadows.
