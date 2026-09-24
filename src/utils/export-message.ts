import type { ToastItem } from '@/components/ui/toast'

/** Honest toast when a real file download completed. */
export function exportDownloadedToast(filename?: string): Omit<ToastItem, 'id'> {
  return {
    title: 'Download started',
    description: filename ? `Saving ${filename}` : 'Your file is downloading.',
    variant: 'success',
  }
}
