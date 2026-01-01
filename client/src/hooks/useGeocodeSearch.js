import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/apiClient";

export function useGeocodeSearch(query, token, debounceMs = 400) {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const normalizedQuery = useMemo(() => (query || "").trim(), [query]);

  useEffect(() => {
    if (!normalizedQuery || !token) {
      setResults([]);
      setStatus("idle");
      setError(null);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setStatus("loading");
      setError(null);
      try {
        const response = await apiClient("/geocode/search", {
          query: { query: normalizedQuery },
          token,
          signal: controller.signal,
        });
        setResults(response?.results || []);
        setStatus("success");
      } catch (err) {
        if (err.name === "AbortError") return;
        setResults([]);
        setStatus("error");
        setError(err);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [normalizedQuery, token, debounceMs]);

  return {
    results,
    status,
    error,
    isLoading: status === "loading",
  };
}
