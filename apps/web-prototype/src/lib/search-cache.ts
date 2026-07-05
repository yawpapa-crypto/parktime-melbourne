import type { SearchResult } from "@/services/api";

const cache = new Map<string, SearchResult[]>();
const MAX = 40;

export function getCachedSearch(q: string): SearchResult[] | undefined {
  return cache.get(q.trim().toLowerCase());
}

export function setCachedSearch(q: string, results: SearchResult[]) {
  const key = q.trim().toLowerCase();
  if (cache.size >= MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, results);
}
