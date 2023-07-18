'use client'

import { Provider } from "jotai"
import { GlobalToastProvider } from "@/components/Toast"

export default function Providers({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  return (
    <GlobalToastProvider>
      <Provider>
        {children}
      </Provider>
    </GlobalToastProvider>
  )
}

