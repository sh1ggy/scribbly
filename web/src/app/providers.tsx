'use client'

import { Provider } from "jotai"

export default function Providers({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  return (
    <Provider>
      {children}
    </Provider>
  )
}

