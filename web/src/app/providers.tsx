'use client'

import { Provider } from "jotai"
import { GlobalToastProvider } from "@/components/Toast"
import { GlobalErrorProvider } from "@/hooks/useError"

export default function Providers({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  return (
    <GlobalToastProvider>
      <GlobalErrorProvider>
        <Provider>
          {children}
        </Provider>
      </GlobalErrorProvider>
    </GlobalToastProvider>
  )
}

