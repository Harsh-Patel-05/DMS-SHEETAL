import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { ThemeSync } from '@/components/layout/ThemeSync'
import { ToastProvider } from '@/components/ui/toast'
import '@/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ThemeSync />
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
