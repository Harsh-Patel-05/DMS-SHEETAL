import { useMemo, useState } from 'react'
import {
  Ban,
  Copy,
  Download,
  Eye,
  Printer,
  Share2,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { InvoiceDocument } from '@/components/billing/InvoiceDocument'
import { InvoicePreviewDrawer } from '@/components/billing/InvoicePreviewDrawer'
import { ActivityTimeline } from '@/components/shared/ActivityTimeline'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'
import { buildInvoiceActivity } from '@/utils/activity-timeline'
import {
  downloadInvoiceHtml,
  printInvoiceDocument,
  shareInvoiceDocument,
} from '@/utils/invoice-document'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const invoice = useDmsStore((s) => s.invoices.find((i) => i.id === id))
  const settings = useDmsStore((s) => s.settings)
  const cancelSale = useDmsStore((s) => s.cancelSale)
  const sales = useDmsStore((s) => s.sales)
  const payments = useDmsStore((s) => s.payments)
  const auditLogs = useDmsStore((s) => s.auditLogs)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const linkedSale = useMemo(
    () => (invoice ? sales.find((s) => s.id === invoice.saleId) : undefined),
    [invoice, sales],
  )

  const activity = useMemo(
    () =>
      invoice
        ? buildInvoiceActivity({
            invoice,
            sale: linkedSale,
            payments,
            auditLogs,
          })
        : [],
    [invoice, linkedSale, payments, auditLogs],
  )

  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        description="This invoice may have been deleted or the link is invalid."
        action={
          <Link to="/transactions/invoices">
            <Button type="button">Back to invoices</Button>
          </Link>
        }
      />
    )
  }

  const isCancelled = invoice.status === 'cancelled'
  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/transactions/invoices/${invoice.id}`
      : `/transactions/invoices/${invoice.id}`

  const handlePrint = () => {
    setPreviewOpen(true)
  }

  const handleDownload = () => {
    downloadInvoiceHtml(invoice, settings)
    toast({
      title: 'Invoice downloaded',
      description: 'Open the HTML file and use Print → Save as PDF for A4.',
      variant: 'success',
    })
  }

  const handleShare = async () => {
    const result = await shareInvoiceDocument(invoice, settings, pageUrl)
    if (result === 'shared') toast({ title: 'Invoice shared', variant: 'success' })
    else if (result === 'copied')
      toast({
        title: 'Invoice details copied',
        description: 'Share link and totals are on the clipboard.',
        variant: 'success',
      })
    else toast({ title: 'Unable to share', variant: 'error' })
  }

  const handleDuplicate = () => {
    navigate('/transactions/sales/new', {
      state: {
        customerId: invoice.customerId,
        duplicateFromInvoiceId: invoice.id,
        notes: linkedSale?.notes
          ? `Duplicated from ${invoice.invoiceNo}. ${linkedSale.notes}`
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
  }

  const handleCancel = () => {
    const result = cancelSale(invoice.saleId)
    if (!result.ok) {
      toast({ title: 'Cannot cancel', description: result.message, variant: 'error' })
      return
    }
    toast({ title: 'Invoice cancelled', variant: 'success' })
    setCancelOpen(false)
  }

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.invoiceNo}`}
        description="Review the A4 layout, then print, download, or share"
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Link to="/transactions/invoices">
              <Button type="button" variant="outline" size="sm">
                Back
              </Button>
            </Link>
            <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
              <Eye className="h-4 w-4" aria-hidden />
              Preview
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const ok = printInvoiceDocument(invoice, settings)
                if (!ok) toast({ title: 'Allow pop-ups to print', variant: 'error' })
              }}
            >
              <Printer className="h-4 w-4" aria-hidden />
              Print
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" aria-hidden />
              Download
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" aria-hidden />
              Share
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="h-4 w-4" aria-hidden />
              Duplicate
            </Button>
            <Button type="button" variant="danger" size="sm" disabled={isCancelled} onClick={() => setCancelOpen(true)}>
              <Ban className="h-4 w-4" aria-hidden />
              Cancel
            </Button>
          </div>
        }
      />

      <div className="rounded-md bg-surface-muted p-4 sm:p-8 print:bg-transparent print:p-0">
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wider text-ink-muted print:hidden">
          A4 preview
        </p>
        <InvoiceDocument invoice={invoice} settings={settings} className="print:shadow-none print:border-0" />
      </div>

      <div className="mt-6 print:hidden">
        <ActivityTimeline events={activity} compact maxHeightClassName="max-h-80" />
      </div>

      <InvoicePreviewDrawer
        open={previewOpen}
        invoice={invoice}
        onClose={() => setPreviewOpen(false)}
        onCancelled={() => setPreviewOpen(false)}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel this invoice?"
        description={`Invoice ${invoice.invoiceNo} and its linked sale will be cancelled. Stock and party balances will be reversed where applicable.`}
        confirmLabel="Cancel invoice"
        variant="danger"
      />
    </div>
  )
}
