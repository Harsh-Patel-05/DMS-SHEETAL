import {
  Ban,
  Copy,
  Download,
  ExternalLink,
  Printer,
  Share2,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Invoice } from '@/types'
import { InvoiceDocument } from '@/components/billing/InvoiceDocument'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Drawer } from '@/components/ui/drawer'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'
import {
  downloadInvoiceHtml,
  printInvoiceDocument,
  shareInvoiceDocument,
} from '@/utils/invoice-document'

export interface InvoicePreviewDrawerProps {
  open: boolean
  invoice: Invoice | null
  onClose: () => void
  /** Called after successful cancel so parent can clear selection */
  onCancelled?: (invoiceId: string) => void
}

export function InvoicePreviewDrawer({
  open,
  invoice,
  onClose,
  onCancelled,
}: InvoicePreviewDrawerProps) {
  const settings = useDmsStore((s) => s.settings)
  const cancelSale = useDmsStore((s) => s.cancelSale)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!invoice) {
    return (
      <Drawer open={open} onClose={onClose} title="Invoice preview" widthClassName="w-full max-w-3xl">
        <p className="text-sm text-ink-muted">No invoice selected.</p>
      </Drawer>
    )
  }

  const isCancelled = invoice.status === 'cancelled'
  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/transactions/invoices/${invoice.id}`
      : `/transactions/invoices/${invoice.id}`

  const handlePrint = () => {
    const ok = printInvoiceDocument(invoice, settings)
    if (!ok) toast({ title: 'Allow pop-ups to print', variant: 'error' })
    else toast({ title: 'Print dialog opened', variant: 'success' })
  }

  const handleDownload = () => {
    downloadInvoiceHtml(invoice, settings)
    toast({ title: 'Invoice downloaded', description: 'Open the HTML file and Print → Save as PDF for A4.', variant: 'success' })
  }

  const handleShare = async () => {
    const result = await shareInvoiceDocument(invoice, settings, pageUrl)
    if (result === 'shared') toast({ title: 'Invoice shared', variant: 'success' })
    else if (result === 'copied')
      toast({ title: 'Invoice details copied', description: 'Share link and totals are on the clipboard.', variant: 'success' })
    else toast({ title: 'Unable to share', variant: 'error' })
  }

  const handleDuplicate = () => {
    const sale = useDmsStore.getState().sales.find((s) => s.id === invoice.saleId)
    navigate('/transactions/sales/new', {
      state: {
        customerId: invoice.customerId,
        duplicateFromInvoiceId: invoice.id,
        notes: sale?.notes
          ? `Duplicated from ${invoice.invoiceNo}. ${sale.notes}`
          : `Duplicated from ${invoice.invoiceNo}`,
        items: invoice.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          sku: i.sku,
          quantity: i.quantity,
          rate: i.rate,
          discount: i.discount,
          gstRate: i.gstRate,
          notes: i.notes,
        })),
      },
    })
    onClose()
    toast({ title: 'Duplicating invoice', description: 'Review the new sale draft, then confirm.', variant: 'success' })
  }

  const handleCancel = () => {
    const result = cancelSale(invoice.saleId)
    if (!result.ok) {
      toast({ title: 'Cannot cancel', description: result.message, variant: 'error' })
      return
    }
    toast({ title: 'Invoice cancelled', variant: 'success' })
    setCancelOpen(false)
    onCancelled?.(invoice.id)
    onClose()
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={`Invoice ${invoice.invoiceNo}`}
        description="A4 preview — print or download before sharing with the customer."
        widthClassName="w-full max-w-4xl"
      >
        <div className="space-y-3">
          <div className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 border-b border-border bg-surface-elevated px-1 pb-3">
            <Button type="button" size="sm" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleDuplicate}>
              <Copy className="h-4 w-4" />
              Duplicate
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              className="gap-1.5"
              disabled={isCancelled}
              onClick={() => setCancelOpen(true)}
            >
              <Ban className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-auto gap-1.5"
              onClick={() => {
                onClose()
                navigate(`/transactions/invoices/${invoice.id}`)
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Full page
            </Button>
          </div>

          <div className="invoice-stage p-3 sm:p-5">
            <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              A4 preview
            </p>
            <InvoiceDocument invoice={invoice} settings={settings} />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel this invoice?"
        description={`Invoice ${invoice.invoiceNo} and its linked sale will be cancelled. Stock and party balances will be reversed where applicable.`}
        confirmLabel="Cancel invoice"
        variant="danger"
      />
    </>
  )
}
