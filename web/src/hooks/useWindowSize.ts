import { useEffect, useState } from 'react'

interface WindowSize {
  width: number
  height: number
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  })

  const handleSize = () => {
    if (!window) return;
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }

  // Set size at the first client-side load
  useEffect(() => {
    handleSize()
    window.addEventListener('resize', handleSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      window.removeEventListener('resize', handleSize)
    }
  }, [])

  return windowSize
}