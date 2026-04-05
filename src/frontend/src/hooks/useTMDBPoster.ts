import { useEffect, useRef, useState } from "react";
import { WatchType } from "../backend.d";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

interface TMDBResult {
  poster_path: string | null;
}

interface TMDBResponse {
  results: TMDBResult[];
}

export function useTMDBPoster(title: string, watchType: WatchType) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!title.trim() || title.trim().length < 2) {
      setPosterUrl(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      // Abort previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      const mediaType = watchType === WatchType.movie ? "movie" : "tv";
      const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(title.trim())}&page=1`;

      try {
        const res = await fetch(url, { signal: abortRef.current.signal });
        if (!res.ok) throw new Error("TMDB fetch failed");
        const data: TMDBResponse = await res.json();
        const first = data.results?.[0];
        if (first?.poster_path) {
          setPosterUrl(`${TMDB_IMAGE_BASE}${first.poster_path}`);
        } else {
          setPosterUrl(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setPosterUrl(null);
        }
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, watchType]);

  return { posterUrl, isLoading };
}
