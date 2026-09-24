import { Printer } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { DatePresetToggle, parseDatePreset } from '@/components/shared/DatePresetToggle'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { usePrefsStore } from '@/store/prefs-store'
import { type DatePreset, rangeForPreset } from '@/utils/date-range'
import { formatDate } from '@/utils/format'

export interface ReportShellProps {
  title: string
  description?: string
  children: (range: { from: string; to: string }) => ReactNode
  /** Optional CSV/download handler — when omitted, use the table Export control instead */
  onExport?: () => void
}

export function ReportShell({ title, description, children, onExport }: ReportShellProps) {
  const defaultDatePreset = usePrefsStore((s) => s.defaultDatePreset)
  const [preset, setPreset] = useState<DatePreset>(() => parseDatePreset(defaultDatePreset))
  const range = useMemo(() => rangeForPreset(preset), [preset])

  const onPrint = () => window.print()

  return (
    <div className="report-shell print:bg-white">
      <PageHeader
        title={title}
        description={
          description ??
          `${formatDate(range.from, 'long')} – ${formatDate(range.to, 'long')}`
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
            <DatePresetToggle value={preset} onChange={setPreset} compact />
            {onExport ? (
              <Button type="button" variant="outline" size="sm" onClick={onExport}>
                Export
              </Button>
            ) : null}
            <Button type="button" variant="secondary" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4" aria-hidden />
              Print
            </Button>
          </div>
        }
      />
      {children(range)}
    </div>
  )
}
