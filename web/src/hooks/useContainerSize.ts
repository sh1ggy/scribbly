import { RefObject, useEffect, useRef, useState } from 'react'

interface ContainerDef {
  containerRef: RefObject<HTMLDivElement> 
  size: ContainerSize,
}

interface ContainerSize {
  width: number
  height: number
}

// no 
export function useContainerSize(): ContainerDef {
  const [containerSize, setContainerSize] = useState<ContainerSize>({
    width: 0,
    height: 0,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSize = () => {
    if (containerRef.current == null) return
    setContainerSize({
      width: containerRef.current?.getBoundingClientRect().width,
      height: containerRef.current?.getBoundingClientRect().height,
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

  return { containerRef, size: containerSize }
}