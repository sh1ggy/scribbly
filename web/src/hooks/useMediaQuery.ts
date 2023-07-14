import { useEffect, useState } from 'react'

/// This has issues running in layout components but not in pages
export function useMediaQuery(query: string): boolean {
  const [matchesQuery, setMatchesQuery] = useState(false);

  // Set size at the first client-side load
  useEffect(() => {
    const match = (e: MediaQueryListEvent | { matches: boolean }) => {
      setMatchesQuery(e.matches)
    }

    match(window.matchMedia(query))

    window
      .matchMedia(query)
      .addEventListener('change', match);

    return () => {
      window
        .matchMedia(query)
        .removeEventListener('change', match);
    }
  }, [query])

  return matchesQuery
}