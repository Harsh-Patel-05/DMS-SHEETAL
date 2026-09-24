import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useMemo, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import type { Product, Status } from '@/types'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  CodeCell,
  RowActions,
} from '@/components/shared/RowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { FormSection, FormStepper } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { Can } from '@/components/auth/Can'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { useDmsStore } from '@/store/dms-store'
import { FILTER_CONTEXT } from '@/config/advanced-filter-presets'
import { downloadCsv } from '@/utils/bulk-export'
import {
  buildProductSalesMap,
  resolveProductFilterValue,
} from '@/utils/advanced-filter-resolvers'
import { formatCurrency, formatNumber } from '@/utils/format'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().min(1, 'Brand is required'),
  unitId: z.string().min(1, 'Unit is required'),
  gstRateId: z.string().min(1, 'GST rate is required'),
  hsnCode: z.string().min(1, 'HSN is required'),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0),
  openingStock: z.coerce.number().min(0),
  minimumStock: z.coerce.number().min(0),
  status: z.enum(['active', 'inactive']),
  description: z.string().optional(),
})

type ProductForm = z.infer<typeof productSchema> & { id?: string }

type BulkModal = 'status' | 'category' | null

const PRODUCT_STEPS = [
  { id: 'basic', label: 'Basic', description: 'Identity' },
  { id: 'pricing', label: 'Pricing', description: 'Rates' },
  { id: 'tax', label: 'Tax', description: 'GST / HSN' },
  { id: 'inventory', label: 'Inventory', description: 'Stock' },
  { id: 'additional', label: 'More', description: 'Notes' },
] as const

export default function ProductsPage() {
  const products = useDmsStore((s) => s.products)
  const sales = useDmsStore((s) => s.sales)
  const categories = useDmsStore((s) => s.categories)
  const brands = useDmsStore((s) => s.brands)
  const units = useDmsStore((s) => s.units)
  const gstRates = useDmsStore((s) => s.gstRates)
  const upsert = useDmsStore((s) => s.upsertProduct)
  const remove = useDmsStore((s) => s.deleteProduct)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [formStep, setFormStep] = useState<(typeof PRODUCT_STEPS)[number]['id']>('basic')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkModal, setBulkModal] = useState<BulkModal>(null)
  const [bulkStatus, setBulkStatus] = useState<Status>('active')
  const [bulkCategoryId, setBulkCategoryId] = useState(categories[0]?.id ?? '')
  const [pendingBulkRows, setPendingBulkRows] = useState<Product[]>([])

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'active',
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      openingStock: 0,
      minimumStock: 5,
      categoryId: categories[0]?.id ?? '',
      brandId: brands[0]?.id ?? '',
      unitId: units[0]?.id ?? '',
      gstRateId: gstRates[0]?.id ?? '',
      hsnCode: '8418',
    },
  })

  const isDirty = open && form.formState.isDirty
  const { dialog: unsavedDialog, confirmIfDirty } = useUnsavedChanges(isDirty)
  const requestCloseForm = () => confirmIfDirty(() => setOpen(false))

  const categoryId = form.watch('categoryId')
  const brandId = form.watch('brandId')
  const unitId = form.watch('unitId')
  const gstRateId = form.watch('gstRateId')
  const isEdit = Boolean(form.watch('id'))

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.name,
        description: c.description,
        group: c.status === 'active' ? 'Active' : 'Inactive',
      })),
    [categories],
  )
  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.id, label: b.name, group: b.status === 'active' ? 'Active' : 'Inactive' })),
    [brands],
  )
  const unitOptions = useMemo(
    () => units.map((u) => ({ value: u.id, label: u.name, description: u.shortName, group: 'Units' })),
    [units],
  )
  const gstOptions = useMemo(
    () =>
      gstRates.map((g) => ({
        value: g.id,
        label: g.name,
        description: `${g.rate}%`,
        group: 'GST',
      })),
    [gstRates],
  )

  const lookup = useMemo(
    () => ({
      cat: Object.fromEntries(categories.map((c) => [c.id, c.name])),
      brand: Object.fromEntries(brands.map((b) => [b.id, b.name])),
    }),
    [categories, brands],
  )

  const productSalesMap = useMemo(() => buildProductSalesMap(sales), [sales])

  const getAdvancedFilterValue = useCallback(
    (row: Product, fieldId: string) =>
      resolveProductFilterValue(row, fieldId, {
        categoryName: lookup.cat[row.categoryId] ?? '',
        brandName: lookup.brand[row.brandId] ?? '',
        salesMap: productSalesMap,
      }),
    [lookup, productSalesMap],
  )

  const openEdit = (id?: string) => {
    setFormStep('basic')
    const p = id ? products.find((x) => x.id === id) : undefined
    if (p) {
      form.reset({
        id: p.id,
        name: p.name,
        sku: p.sku,
        categoryId: p.categoryId,
        brandId: p.brandId,
        unitId: p.unitId,
        gstRateId: p.gstRateId,
        hsnCode: p.hsnCode,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        mrp: p.mrp,
        openingStock: p.openingStock,
        minimumStock: p.minimumStock,
        status: p.status,
        description: p.description,
      })
    } else {
      form.reset({
        name: '',
        sku: '',
        status: 'active',
        purchasePrice: 0,
        sellingPrice: 0,
        mrp: 0,
        openingStock: 0,
        minimumStock: 5,
        categoryId: categories[0]?.id ?? '',
        brandId: brands[0]?.id ?? '',
        unitId: units[0]?.id ?? '',
        gstRateId: gstRates[0]?.id ?? '',
        hsnCode: '8418',
      })
    }
    setOpen(true)
  }

  const onSave = form.handleSubmit((values) => {
    setSaving(true)
    const existing = values.id ? products.find((p) => p.id === values.id) : undefined
    upsert({
      ...(values.id ? { id: values.id } : {}),
      name: values.name,
      sku: values.sku,
      categoryId: values.categoryId,
      brandId: values.brandId,
      unitId: values.unitId,
      gstRateId: values.gstRateId,
      hsnCode: values.hsnCode,
      purchasePrice: values.purchasePrice,
      sellingPrice: values.sellingPrice,
      mrp: values.mrp,
      openingStock: values.openingStock,
      minimumStock: values.minimumStock,
      status: values.status,
      description: values.description,
      currentStock: existing?.currentStock ?? values.openingStock,
    })
    setSaving(false)
    toast({ title: 'Product saved', variant: 'success' })
    setOpen(false)
  })

  const patchProducts = (rows: Product[], patch: Partial<Product>) => {
    for (const p of rows) {
      upsert({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        categoryId: patch.categoryId ?? p.categoryId,
        brandId: p.brandId,
        unitId: p.unitId,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        mrp: p.mrp,
        gstRateId: p.gstRateId,
        hsnCode: p.hsnCode,
        openingStock: p.openingStock,
        minimumStock: p.minimumStock,
        description: p.description,
        imageUrl: p.imageUrl,
        status: (patch.status as Status | undefined) ?? p.status,
        currentStock: p.currentStock,
      })
    }
  }

  const exportProducts = (rows: Product[]) => {
    downloadCsv(
      `products-export-${rows.length}.csv`,
      ['SKU', 'Name', 'Category', 'Brand', 'Stock', 'Purchase', 'Selling', 'MRP', 'Status'],
      rows.map((r) => [
        r.sku,
        r.name,
        lookup.cat[r.categoryId] ?? '',
        lookup.brand[r.brandId] ?? '',
        String(r.currentStock),
        String(r.purchasePrice),
        String(r.sellingPrice),
        String(r.mrp),
        r.status,
      ]),
    )
    toast({ title: `Exported ${rows.length} product(s)`, variant: 'success' })
  }

  return (
    <div>
      {unsavedDialog}
      <PageHeader
        title="Products"
        description="SKU catalogue, pricing, tax, and stock levels"
        actions={
          <Can module="products" action="create">
            <Button type="button" size="sm" className="gap-1" onClick={() => openEdit()}>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </Can>
        }
      />
      <DataTable
        data={products}
        getRowId={(r) => r.id}
        emptyModule="products"
        emptyOnPrimaryClick={() => openEdit()}
        storageKey="products"
        filterContextId={FILTER_CONTEXT.products}
        getAdvancedFilterValue={getAdvancedFilterValue}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            id: 'export',
            label: 'Bulk export',
            variant: 'outline',
            onClick: (rows) => exportProducts(rows),
          },
          {
            id: 'status',
            label: 'Change status',
            variant: 'outline',
            onClick: (rows) => {
              setPendingBulkRows(rows)
              setBulkStatus('active')
              setBulkModal('status')
            },
          },
          {
            id: 'category',
            label: 'Change category',
            variant: 'outline',
            onClick: (rows) => {
              setPendingBulkRows(rows)
              setBulkCategoryId(categories[0]?.id ?? '')
              setBulkModal('category')
            },
          },
          {
            id: 'delete',
            label: 'Bulk delete',
            variant: 'danger',
            onClick: (rows) => {
              setPendingBulkRows(rows)
              setBulkDeleteOpen(true)
            },
          },
        ]}
        columns={[
          {
            id: 'sku',
            header: 'SKU',
            accessor: 'sku',
            sortable: true,
            sticky: 'left',
            cell: (r) => <CodeCell value={r.sku} />,
          },
          { id: 'name', header: 'Name', accessor: 'name', sortable: true },
          {
            id: 'cat',
            header: 'Category',
            getFilterValue: (r) => r.categoryId,
            filterOptions: categories.map((c) => ({ label: c.name, value: c.id })),
            cell: (r) => lookup.cat[r.categoryId] ?? '—',
          },
          { id: 'brand', header: 'Brand', cell: (r) => lookup.brand[r.brandId] ?? '—' },
          { id: 'stock', header: 'Stock', cell: (r) => formatNumber(r.currentStock) },
          { id: 'price', header: 'Selling', cell: (r) => formatCurrency(r.sellingPrice) },
          {
            id: 'status',
            header: 'Status',
            accessor: 'status',
            filterOptions: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
            getFilterValue: (r) => r.status,
            cell: (r) => <StatusBadge kind="party" status={r.status} />,
          },
          {
            id: 'actions',
            header: ACTION_COLUMN_HEADER,
            headerClassName: ACTION_COLUMN_HEADER_CLASS,
            className: ACTION_COLUMN_CLASS,
            hideable: false,
            sticky: 'right',
            cell: (r) => (
              <RowActions
                onView={() => navigate(`/master/products/${r.id}`)}
                onEdit={() => openEdit(r.id)}
                onDelete={() => setDeleteId(r.id)}
              />
            ),
          },
        ]}
      />

      <Modal
        open={open}
        onClose={requestCloseForm}
        title={isEdit ? 'Edit product' : 'New product'}
        size="lg"
        mobileSheet
      >
        <form onSubmit={onSave} className="mobile-form space-y-4">
          <FormStepper
            steps={[...PRODUCT_STEPS]}
            current={formStep}
            onStepClick={(id) => setFormStep(id as (typeof PRODUCT_STEPS)[number]['id'])}
          />

          {formStep === 'basic' ? (
            <FormSection
              step={1}
              title="Basic Information"
              description="Name, SKU, category, brand, and unit of measure."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Name" required hint="As shown on invoices" error={form.formState.errors.name?.message}>
                  <Input {...form.register('name')} />
                </FormField>
                <FormField label="SKU" required hint="Unique stock keeping code" error={form.formState.errors.sku?.message}>
                  <Input {...form.register('sku')} />
                </FormField>
                <FormField label="Category" required error={form.formState.errors.categoryId?.message}>
                  <SearchableSelect
                    value={categoryId}
                    onChange={(v) => form.setValue('categoryId', v, { shouldDirty: true, shouldValidate: true })}
                    recentScope="categories"
                    placeholder="Select category…"
                    searchPlaceholder="Search categories…"
                    options={categoryOptions}
                    creatable
                    createLabel={(q) => `Create category “${q}”`}
                    onCreate={(q) => {
                      toast({
                        title: 'Create from Categories master',
                        description: `Add “${q}” under Master → Categories, then select it here.`,
                        variant: 'info',
                      })
                    }}
                  />
                </FormField>
                <FormField label="Brand" required error={form.formState.errors.brandId?.message}>
                  <SearchableSelect
                    value={brandId}
                    onChange={(v) => form.setValue('brandId', v, { shouldDirty: true, shouldValidate: true })}
                    recentScope="brands"
                    placeholder="Select brand…"
                    searchPlaceholder="Search brands…"
                    options={brandOptions}
                  />
                </FormField>
                <FormField label="Unit" required error={form.formState.errors.unitId?.message}>
                  <SearchableSelect
                    value={unitId}
                    onChange={(v) => form.setValue('unitId', v, { shouldDirty: true, shouldValidate: true })}
                    recentScope="units"
                    placeholder="Select unit…"
                    options={unitOptions}
                  />
                </FormField>
                <FormField label="Status" required>
                  <Select {...form.register('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormField>
              </div>
            </FormSection>
          ) : null}

          {formStep === 'pricing' ? (
            <FormSection step={2} title="Pricing" description="Purchase, selling, and MRP values.">
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="Purchase price" required hint="Cost from supplier">
                  <Input type="number" step="0.01" {...form.register('purchasePrice')} />
                </FormField>
                <FormField label="Selling price" required hint="Default invoice rate">
                  <Input type="number" step="0.01" {...form.register('sellingPrice')} />
                </FormField>
                <FormField label="MRP" required>
                  <Input type="number" step="0.01" {...form.register('mrp')} />
                </FormField>
              </div>
            </FormSection>
          ) : null}

          {formStep === 'tax' ? (
            <FormSection step={3} title="Tax" description="GST slab and HSN for compliance.">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="GST rate" required error={form.formState.errors.gstRateId?.message}>
                  <SearchableSelect
                    value={gstRateId}
                    onChange={(v) => form.setValue('gstRateId', v, { shouldDirty: true, shouldValidate: true })}
                    recentScope="gst-rates"
                    placeholder="Select GST…"
                    options={gstOptions}
                  />
                </FormField>
                <FormField label="HSN" required hint="HSN / SAC code" error={form.formState.errors.hsnCode?.message}>
                  <Input {...form.register('hsnCode')} />
                </FormField>
              </div>
            </FormSection>
          ) : null}

          {formStep === 'inventory' ? (
            <FormSection step={4} title="Inventory" description="Opening and reorder levels.">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Opening stock"
                  required
                  hint={isEdit ? 'Does not change current stock on edit' : 'Sets initial current stock'}
                >
                  <Input type="number" {...form.register('openingStock')} disabled={isEdit} />
                </FormField>
                <FormField label="Minimum stock" required hint="Low-stock alerts use this threshold">
                  <Input type="number" {...form.register('minimumStock')} />
                </FormField>
              </div>
            </FormSection>
          ) : null}

          {formStep === 'additional' ? (
            <FormSection step={5} title="Additional Information" description="Optional notes for the product catalogue.">
              <FormField label="Description" hint="Shown on product detail">
                <Textarea {...form.register('description')} rows={4} />
              </FormField>
            </FormSection>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex gap-2">
              {formStep !== 'basic' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const idx = PRODUCT_STEPS.findIndex((s) => s.id === formStep)
                    if (idx > 0) setFormStep(PRODUCT_STEPS[idx - 1].id)
                  }}
                >
                  Back
                </Button>
              ) : null}
              {formStep !== 'additional' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const idx = PRODUCT_STEPS.findIndex((s) => s.id === formStep)
                    if (idx < PRODUCT_STEPS.length - 1) setFormStep(PRODUCT_STEPS[idx + 1].id)
                  }}
                >
                  Next
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={requestCloseForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save product'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={bulkModal === 'status'}
        onClose={() => setBulkModal(null)}
        title="Bulk status change"
        description={`Update status for ${pendingBulkRows.length} product(s).`}
        size="sm"
      >
        <FormField label="New status">
          <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as Status)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setBulkModal(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              patchProducts(pendingBulkRows, { status: bulkStatus })
              setBulkModal(null)
              setSelectedIds([])
              toast({ title: `Status updated for ${pendingBulkRows.length} product(s)`, variant: 'success' })
            }}
          >
            Apply
          </Button>
        </div>
      </Modal>

      <Modal
        open={bulkModal === 'category'}
        onClose={() => setBulkModal(null)}
        title="Bulk category change"
        description={`Assign category for ${pendingBulkRows.length} product(s).`}
        size="sm"
      >
        <FormField label="Category" required hint="Search or pick a category">
          <SearchableSelect
            value={bulkCategoryId}
            onChange={setBulkCategoryId}
            recentScope="categories"
            placeholder="Select category…"
            options={categoryOptions}
          />
        </FormField>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setBulkModal(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!bulkCategoryId) return
              patchProducts(pendingBulkRows, { categoryId: bulkCategoryId })
              setBulkModal(null)
              setSelectedIds([])
              toast({ title: `Category updated for ${pendingBulkRows.length} product(s)`, variant: 'success' })
            }}
          >
            Apply
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete product?"
        description="This cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) remove(deleteId)
          setDeleteId(null)
          toast({ title: 'Deleted', variant: 'success' })
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Delete selected products?"
        description={`You are about to permanently delete ${pendingBulkRows.length} product(s). This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete all"
        onConfirm={() => {
          pendingBulkRows.forEach((r) => remove(r.id))
          setBulkDeleteOpen(false)
          setSelectedIds([])
          toast({ title: `${pendingBulkRows.length} product(s) deleted`, variant: 'success' })
        }}
      />
    </div>
  )
}
