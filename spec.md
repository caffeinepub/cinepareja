# CinePareja

## Current State
The app has a WatchItem model with fields: id, title, watchType, status, pausedAtMin, notes. The WatchingTab displays items grouped by status and allows adding/editing via a dialog with title, type, status, pausedAtMin, and notes fields. The DataTab shows stats and a romantic export that includes album photos and statistics but does NOT include the currently watching series/episode info or a review field.

## Requested Changes (Diff)

### Add
- New field `review` (text) on WatchItem: a personal opinion/review text about the series or movie
- New field `currentEpisode` (text, optional) on WatchItem: tracks which episode they are currently on (e.g. "T2 E5" or "Episodio 5")
- In WatchingTab form: two new inputs — "Episodio actual" and "Reseña / Opinión" (textarea)
- In WatchingTab item card: show currentEpisode and review text under the title
- In DataTab: show a new section "Viendo ahora" that lists all items with status=watching, showing title + currentEpisode + review snippet
- In the romantic export image (generateRomanticCollage): include a section showing the currently watching items with title, currentEpisode, and review text

### Modify
- WatchItem backend type: add `review: Text` and `currentEpisode: ?Text` fields
- WatchingTab form state: add `review` and `currentEpisode` fields
- WatchingTab item card: display currentEpisode badge and review text
- DataTab generateRomanticCollage: add a section for currently watching items before the album photos
- DataTab: add a visible "Viendo ahora" section in the data view

### Remove
- Nothing removed

## Implementation Plan
1. Update `src/backend/main.mo`: add `review: Text` and `currentEpisode: ?Text` to WatchItem type, update all related functions
2. Update `src/frontend/src/backend.d.ts`: add `review` and `currentEpisode` fields to WatchItem interface
3. Update `src/frontend/src/components/WatchingTab.tsx`: add currentEpisode + review to FormState and dialog, show them in item cards
4. Update `src/frontend/src/components/DataTab.tsx`: add "Viendo ahora" section in the UI, include currentlyWatching in generateRomanticCollage
