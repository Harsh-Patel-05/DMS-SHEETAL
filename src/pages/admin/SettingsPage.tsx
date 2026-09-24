import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Building2,
  CreditCard,
  FileText,
  KeyRound,
  Package,
  Palette,
  Percent,
  Receipt,
  Settings2,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { useUnsavedChanges, formSnapshot } from '@/hooks/use-unsaved-changes'
import { useDmsStore } from '@/store/dms-store'
import type { PaymentMethod, RoleName } from '@/types'
import { cn } from '@/utils/cn'
import { DEFAULT_DISCOUNT_LIMITS } from '@/utils/discount-control'
import { MODULE_LABELS } from '@/utils/permissions'

const DISCOUNT_ROLE_ROWS: RoleName[] = [
  'Sales Executive',
  'Manager',
  'Accountant',
  'Stock Manager',
  'Admin',
  'Super Admin',
  'Viewer',
]

const PAYMENT_METHOD_OPTIONS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'card', label: 'Card' },
  { id: 'other', label: 'Other' },
]

export type SettingsSectionId =
  | 'business'
  | 'invoice'
  | 'tax'
  | 'inventory'
  | 'sales'
  | 'purchase'
  | 'payments'
  | 'notifications'
  | 'appearance'
  | 'users'
  | 'permissions'

const SECTIONS: {
  id: SettingsSectionId
  label: string
  description: string
  icon: typeof Building2
}[] = [
  { id: 'business', label: 'Business', description: 'Company profile & contact', icon: Building2 },
  { id: 'invoice', label: 'Invoice', description: 'Numbering & formats', icon: FileText },
  { id: 'tax', label: 'Tax', description: 'GST & tax behaviour', icon: Percent },
  { id: 'inventory', label: 'Inventory', description: 'Stock rules & alerts', icon: Package },
  { id: 'sales', label: 'Sales', description: 'Credit & discount limits', icon: ShoppingCart },
  { id: 'purchase', label: 'Purchase', description: 'Supplier defaults', icon: Truck },
  { id: 'payments', label: 'Payments', description: 'Accepted methods', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', description: 'Alert preferences', icon: Bell },
  { id: 'appearance', label: 'Appearance', description: 'Theme & layout', icon: Palette },
  { id: 'users', label: 'Users', description: 'Accounts & access', icon: Users },
  { id: 'permissions', label: 'Permissions', description: 'Role matrix overview', icon: KeyRound },
]

function settingsFormFromStore(settings: ReturnType<typeof useDmsStore.getState>['settings']) {
  return {
    ...settings,
    discountLimits: { ...DEFAULT_DISCOUNT_LIMITS, ...(settings.discountLimits ?? {}) },
    enforceCreditLimit: settings.enforceCreditLimit !== false,
    sessionTimeoutMinutes: settings.sessionTimeoutMinutes ?? 30,
    salesDefaultPaymentTerms: settings.salesDefaultPaymentTerms ?? 'Net 30',
    purchaseDefaultPaymentTerms: settings.purchaseDefaultPaymentTerms ?? 'Net 45',
    notificationPrefs: {
      lowStock: settings.notificationPrefs?.lowStock !== false,
      newSale: settings.notificationPrefs?.newSale !== false,
      paymentDue: settings.notificationPrefs?.paymentDue !== false,
      system: settings.notificationPrefs?.system !== false,
    },
    paymentMethods: settings.paymentMethods?.length
      ? [...settings.paymentMethods]
      : (['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'] as PaymentMethod[]),
  }
}

export default function SettingsPage() {
  const settings = useDmsStore((s) => s.settings)
  const updateSettings = useDmsStore((s) => s.updateSettings)
  const users = useDmsStore((s) => s.users)
  const roles = useDmsStore((s) => s.roles)
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const sectionParam = (params.get('section') as SettingsSectionId | null) ?? 'business'
  const section = SECTIONS.some((s) => s.id === sectionParam) ? sectionParam : 'business'

  const [form, setForm] = useState(() => settingsFormFromStore(settings))
  const [baseline, setBaseline] = useState(() => formSnapshot(settingsFormFromStore(settings)))

  useEffect(() => {
    const next = settingsFormFromStore(settings)
    setForm(next)
    setBaseline(formSnapshot(next))
  }, [settings])

  const isDirty = useMemo(() => formSnapshot(form) !== baseline, [form, baseline])
  const { dialog: unsavedDialog } = useUnsavedChanges(isDirty)

  const setSection = (id: SettingsSectionId) => {
    setParams({ section: id }, { replace: true })
  }

  const save = () => {
    updateSettings(form)
    setBaseline(formSnapshot(form))
    toast({ title: 'Settings saved', variant: 'success' })
  }

  const setDiscountLimit = (role: RoleName, raw: string) => {
    const trimmed = raw.trim().toLowerCase()
    const value =
      trimmed === '' || trimmed === 'unlimited' || trimmed === 'null' ? null : Number(raw)
    setForm((f) => ({
      ...f,
      discountLimits: {
        ...f.discountLimits,
        [role]: value !== null && Number.isFinite(value) ? value : null,
      },
    }))
  }

  const togglePaymentMethod = (method: PaymentMethod) => {
    setForm((f) => {
      const has = f.paymentMethods.includes(method)
      const paymentMethods = has
        ? f.paymentMethods.filter((m) => m !== method)
        : [...f.paymentMethods, method]
      return { ...f, paymentMethods: paymentMethods.length ? paymentMethods : f.paymentMethods }
    })
  }

  const activeMeta = SECTIONS.find((s) => s.id === section)!

  return (
    <div className="space-y-6">
      {unsavedDialog}
      <PageHeader
        title="Settings Center"
        description={`${activeMeta.label} — ${activeMeta.description}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/demo" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Demo Mode
            </Link>
            {(section === 'business' ||
              section === 'invoice' ||
              section === 'tax' ||
              section === 'inventory' ||
              section === 'sales' ||
              section === 'purchase' ||
              section === 'payments' ||
              section === 'notifications') && (
              <Button size="sm" onClick={save} disabled={!isDirty}>
                Save {activeMeta.label.toLowerCase()}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Desktop sidebar */}
        <nav
          className="hidden w-56 shrink-0 lg:block"
          aria-label="Settings sections"
        >
          <ul className="space-y-0.5 rounded-md border border-border bg-surface-elevated p-2">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              const active = s.id === section
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                      active
                        ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                        : 'text-ink-muted hover:bg-surface hover:text-ink',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {s.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Mobile tabs */}
        <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 lg:hidden">
          <div className="flex w-max gap-1 rounded-md border border-border bg-surface-elevated p-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium',
                  s.id === section
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-muted hover:bg-surface',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <section className="min-w-0 flex-1 rounded-md border border-border bg-surface-elevated p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3 border-b border-border pb-3">
            {(() => {
              const Icon = activeMeta.icon
              return (
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
              )
            })()}
            <div>
              <h2 className="font-semibold text-ink">{activeMeta.label}</h2>
              <p className="text-sm text-ink-muted">{activeMeta.description}</p>
            </div>
          </div>

          {section === 'business' && (
            <div className="max-w-xl space-y-3">
              <FormField label="Business name">
                <Input
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
              </FormField>
              <FormField label="Address">
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Phone">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </FormField>
                <FormField label="Email">
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </FormField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="GSTIN">
                  <Input
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                  />
                </FormField>
                <FormField label="PAN">
                  <Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
                </FormField>
              </div>
              <FormField label="Logo URL (optional)">
                <Input
                  value={form.logoUrl ?? ''}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value || undefined })}
                  placeholder="https://…"
                />
              </FormField>
              <FormField label="Session timeout (minutes)">
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={form.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sessionTimeoutMinutes: Math.max(5, Number(e.target.value) || 30),
                    })
                  }
                />
              </FormField>
            </div>
          )}

          {section === 'invoice' && (
            <div className="max-w-xl space-y-3">
              <FormField label="Invoice prefix">
                <Input
                  value={form.invoicePrefix}
                  onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                />
              </FormField>
              <FormField label="Starting number">
                <Input
                  type="number"
                  value={form.invoiceStartingNumber}
                  onChange={(e) =>
                    setForm({ ...form, invoiceStartingNumber: Number(e.target.value) || 1 })
                  }
                />
              </FormField>
              <FormField label="Currency">
                <Select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Select>
              </FormField>
              <FormField label="Date format">
                <Select
                  value={form.dateFormat}
                  onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </Select>
              </FormField>
            </div>
          )}

          {section === 'tax' && (
            <div className="max-w-xl space-y-4">
              <Checkbox
                label="Enable tax (GST) on invoices"
                checked={form.taxEnabled}
                onChange={(e) => setForm({ ...form, taxEnabled: e.target.checked })}
              />
              <p className="text-sm text-ink-muted">
                GST rates are managed in master data.{' '}
                <Link to="/master/gst-rates" className="font-medium text-brand-700 underline dark:text-brand-300">
                  Open GST rates
                </Link>
              </p>
              <div className="rounded-md bg-surface px-3 py-2 text-sm text-ink-muted">
                Business GSTIN: <span className="font-mono text-ink">{form.gstNumber || '—'}</span>
              </div>
            </div>
          )}

          {section === 'inventory' && (
            <div className="max-w-xl space-y-4">
              <FormField label="Low stock threshold (default)">
                <Input
                  type="number"
                  min={0}
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    setForm({ ...form, lowStockThreshold: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </FormField>
              <Checkbox
                label="Allow negative stock"
                checked={form.allowNegativeStock}
                onChange={(e) => setForm({ ...form, allowNegativeStock: e.target.checked })}
              />
              <p className="text-sm text-ink-muted">
                Product-level minimums still apply on the stock screens.{' '}
                <Link to="/inventory/low-stock" className="font-medium text-brand-700 underline dark:text-brand-300">
                  View low stock
                </Link>
              </p>
            </div>
          )}

          {section === 'sales' && (
            <div className="max-w-2xl space-y-4">
              <FormField label="Default payment terms">
                <Input
                  value={form.salesDefaultPaymentTerms}
                  onChange={(e) => setForm({ ...form, salesDefaultPaymentTerms: e.target.value })}
                  placeholder="Net 30"
                />
              </FormField>
              <Checkbox
                label="Enforce credit limit on confirm sale"
                checked={form.enforceCreditLimit !== false}
                onChange={(e) => setForm((f) => ({ ...f, enforceCreditLimit: e.target.checked }))}
              />
              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink">Discount limits by role (%)</h3>
                <p className="mb-3 text-xs text-ink-muted">
                  Leave blank or type &quot;unlimited&quot; for no cap. Exceeding the limit requires approval.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DISCOUNT_ROLE_ROWS.map((role) => {
                    const val = form.discountLimits?.[role]
                    return (
                      <FormField key={role} label={role}>
                        <Input
                          value={val === null || val === undefined ? 'unlimited' : String(val)}
                          onChange={(e) => setDiscountLimit(role, e.target.value)}
                          placeholder="e.g. 5 or unlimited"
                        />
                      </FormField>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {section === 'purchase' && (
            <div className="max-w-xl space-y-3">
              <FormField label="Default payment terms">
                <Input
                  value={form.purchaseDefaultPaymentTerms}
                  onChange={(e) => setForm({ ...form, purchaseDefaultPaymentTerms: e.target.value })}
                  placeholder="Net 45"
                />
              </FormField>
              <p className="text-sm text-ink-muted">
                Used as guidance for purchase forms and supplier onboarding. Manage suppliers in{' '}
                <Link to="/parties/suppliers" className="font-medium text-brand-700 underline dark:text-brand-300">
                  Parties → Suppliers
                </Link>
                .
              </p>
            </div>
          )}

          {section === 'payments' && (
            <div className="max-w-xl space-y-3">
              <p className="text-sm text-ink-muted">Select methods available when recording payments.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENT_METHOD_OPTIONS.map((m) => (
                  <Checkbox
                    key={m.id}
                    label={m.label}
                    checked={form.paymentMethods.includes(m.id)}
                    onChange={() => togglePaymentMethod(m.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div className="max-w-xl space-y-3">
              <Checkbox
                label="Low stock alerts"
                checked={form.notificationPrefs.lowStock}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    notificationPrefs: { ...f.notificationPrefs, lowStock: e.target.checked },
                  }))
                }
              />
              <Checkbox
                label="New sale confirmations"
                checked={form.notificationPrefs.newSale}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    notificationPrefs: { ...f.notificationPrefs, newSale: e.target.checked },
                  }))
                }
              />
              <Checkbox
                label="Payment due reminders"
                checked={form.notificationPrefs.paymentDue}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    notificationPrefs: { ...f.notificationPrefs, paymentDue: e.target.checked },
                  }))
                }
              />
              <Checkbox
                label="System notices"
                checked={form.notificationPrefs.system}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    notificationPrefs: { ...f.notificationPrefs, system: e.target.checked },
                  }))
                }
              />
              <p className="pt-2 text-sm text-ink-muted">
                <Link to="/admin/notifications" className="font-medium text-brand-700 underline dark:text-brand-300">
                  Open notification center
                </Link>
              </p>
            </div>
          )}

          {section === 'appearance' && (
            <div className="max-w-xl space-y-3">
              <p className="text-sm text-ink-muted">
                Theme, sidebar, dashboard widgets, table density, and landing page are managed in Personalization.
              </p>
              <Link to="/admin/personalization" className={cn(buttonVariants())}>
                <Palette className="h-4 w-4" />
                Open Personalization
              </Link>
            </div>
          )}

          {section === 'users' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-surface px-3 py-2">
                  <p className="text-xs text-ink-muted">Users</p>
                  <p className="font-display text-xl font-semibold tabular-nums">{users.length}</p>
                </div>
                <div className="rounded-md bg-surface px-3 py-2">
                  <p className="text-xs text-ink-muted">Active</p>
                  <p className="font-display text-xl font-semibold tabular-nums">
                    {users.filter((u) => u.status === 'active').length}
                  </p>
                </div>
                <div className="rounded-md bg-surface px-3 py-2">
                  <p className="text-xs text-ink-muted">Roles</p>
                  <p className="font-display text-xl font-semibold tabular-nums">{roles.length}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/users" className={cn(buttonVariants())}>
                  Manage users
                </Link>
                <Link to="/admin/roles" className={cn(buttonVariants({ variant: 'outline' }))}>
                  Roles
                </Link>
              </div>
            </div>
          )}

          {section === 'permissions' && (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">
                Role-based menu visibility and page access use these modules. Edit the full matrix on the Permissions
                page.
              </p>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-left text-xs uppercase text-ink-muted">
                    <tr>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Modules with view</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{r.name}</td>
                        <td className="px-3 py-2 text-ink-muted">
                          {r.permissions
                            .filter((p) => p.view)
                            .map((p) => MODULE_LABELS[p.module])
                            .join(', ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Link to="/admin/permissions" className={cn(buttonVariants())}>
                <Settings2 className="h-4 w-4" />
                Open permission matrix
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
