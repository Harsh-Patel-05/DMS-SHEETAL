import type {
  Brand,
  Category,
  Customer,
  Distributor,
  GstRate,
  Product,
  Status,
  Supplier,
  Unit,
} from '@/types'
import { downloadCsv } from '@/utils/bulk-export'
import { parseCsv } from '@/utils/csv'

export type ImportEntity = 'products' | 'customers' | 'suppliers' | 'distributors'

export const IMPORT_ENTITY_LABELS: Record<ImportEntity, string> = {
  products: 'Products',
  customers: 'Customers',
  suppliers: 'Suppliers',
  distributors: 'Distributors',
}

export interface ImportError {
  row: number
  field: string
  value: string
  message: string
  code: 'required' | 'invalid' | 'duplicate_file' | 'duplicate_existing' | 'lookup'
}

export interface ImportRowResult {
  rowNumber: number
  raw: Record<string, string>
  valid: boolean
  duplicate: boolean
  errors: ImportError[]
  /** Normalized payload ready for upsert when valid */
  data?: Record<string, unknown>
}

export interface ImportValidationResult {
  entity: ImportEntity
  totalRows: number
  validRows: number
  invalidRows: number
  duplicateRows: number
  rows: ImportRowResult[]
  errors: ImportError[]
}

export interface ImportLookups {
  products: Product[]
  customers: Customer[]
  suppliers: Supplier[]
  distributors: Distributor[]
  categories: Category[]
  brands: Brand[]
  units: Unit[]
  gstRates: GstRate[]
}

const PRODUCT_HEADERS = [
  'name',
  'sku',
  'barcode',
  'category',
  'brand',
  'unit',
  'purchasePrice',
  'sellingPrice',
  'mrp',
  'gstRate',
  'hsnCode',
  'openingStock',
  'minimumStock',
  'description',
  'status',
] as const

const CUSTOMER_HEADERS = [
  'name',
  'mobile',
  'email',
  'address',
  'city',
  'state',
  'gstNumber',
  'creditLimit',
  'openingBalance',
  'paymentTerms',
  'status',
] as const

const DISTRIBUTOR_HEADERS = [
  'name',
  'companyName',
  'contactPerson',
  'mobile',
  'email',
  'address',
  'city',
  'state',
  'gstNumber',
  'pan',
  'creditLimit',
  'openingBalance',
  'paymentTerms',
  'status',
] as const

const SUPPLIER_HEADERS = [
  'name',
  'companyName',
  'contactPerson',
  'mobile',
  'email',
  'address',
  'city',
  'state',
  'gstNumber',
  'pan',
  'creditLimit',
  'openingBalance',
  'paymentTerms',
  'status',
] as const

export function headersForEntity(entity: ImportEntity): string[] {
  switch (entity) {
    case 'products':
      return [...PRODUCT_HEADERS]
    case 'customers':
      return [...CUSTOMER_HEADERS]
    case 'distributors':
      return [...DISTRIBUTOR_HEADERS]
    case 'suppliers':
      return [...SUPPLIER_HEADERS]
  }
}

export function sampleRowsForEntity(entity: ImportEntity): string[][] {
  switch (entity) {
    case 'products':
      return [
        [
          'Voltas Cooler 55L',
          'VOL-C55',
          '8901001999001',
          'Air Coolers',
          'Symphony',
          'Pcs',
          '7500',
          '9999',
          '10999',
          '18',
          '84796000',
          '25',
          '5',
          'Sample import cooler',
          'active',
        ],
      ]
    case 'customers':
      return [
        [
          'Demo Traders',
          '9000011111',
          'demo@traders.in',
          '11 Sample Road',
          'Indore',
          'Madhya Pradesh',
          '23AAAAA0000A1Z5',
          '100000',
          '0',
          'Net 30',
          'active',
        ],
      ]
    case 'distributors':
      return [
        [
          'Central Distro',
          'Central Distro Pvt Ltd',
          'Amit Shah',
          '9000022222',
          'central@distro.in',
          '88 Warehouse Lane',
          'Indore',
          'Madhya Pradesh',
          '23BBBBB0000B1Z5',
          'BBBBB0000B',
          '500000',
          '0',
          'Net 45',
          'active',
        ],
      ]
    case 'suppliers':
      return [
        [
          'North Supply Co',
          'North Supply Co',
          'Ravi Mehta',
          '9000033333',
          'north@supply.in',
          '5 Industrial Area',
          'Indore',
          'Madhya Pradesh',
          '23CCCCC0000C1Z5',
          'CCCCC0000C',
          '800000',
          '0',
          'Net 30',
          'active',
        ],
      ]
  }
}

export function downloadImportTemplate(entity: ImportEntity) {
  const headers = headersForEntity(entity)
  downloadCsv(`dms-${entity}-import-template.csv`, headers, sampleRowsForEntity(entity))
}

function parseStatus(value: string): Status | null {
  const v = value.trim().toLowerCase()
  if (!v || v === 'active') return 'active'
  if (v === 'inactive') return 'inactive'
  return null
}

function parseNumber(value: string, field: string, row: number, errors: ImportError[]): number | null {
  if (!value.trim()) {
    errors.push({ row, field, value, message: `${field} is required`, code: 'required' })
    return null
  }
  const n = Number(value.replace(/,/g, ''))
  if (!Number.isFinite(n) || n < 0) {
    errors.push({ row, field, value, message: `${field} must be a valid non-negative number`, code: 'invalid' })
    return null
  }
  return n
}

function requireText(value: string, field: string, row: number, errors: ImportError[]): string | null {
  if (!value.trim()) {
    errors.push({ row, field, value, message: `${field} is required`, code: 'required' })
    return null
  }
  return value.trim()
}

function findByName<T extends { id: string; name: string }>(list: T[], name: string): T | undefined {
  const key = name.trim().toLowerCase()
  return list.find((x) => x.name.toLowerCase() === key)
}

function findGst(list: GstRate[], value: string): GstRate | undefined {
  const key = value.trim().toLowerCase()
  const asNum = Number(value)
  return list.find(
    (g) =>
      g.name.toLowerCase() === key ||
      String(g.rate) === value.trim() ||
      (Number.isFinite(asNum) && g.rate === asNum) ||
      g.id.toLowerCase() === key,
  )
}

function findUnit(list: Unit[], value: string): Unit | undefined {
  const key = value.trim().toLowerCase()
  return list.find(
    (u) => u.name.toLowerCase() === key || u.shortName.toLowerCase() === key || u.id.toLowerCase() === key,
  )
}

export function validateImportFile(
  entity: ImportEntity,
  fileText: string,
  lookups: ImportLookups,
): ImportValidationResult {
  const { headers, rows } = parseCsv(fileText)
  const expected = headersForEntity(entity)
  const headerSet = new Set(headers.map((h) => h.trim()))
  const missingHeaders = expected.filter((h) => !headerSet.has(h))

  const results: ImportRowResult[] = []
  const allErrors: ImportError[] = []

  if (missingHeaders.length) {
    allErrors.push({
      row: 0,
      field: 'headers',
      value: headers.join(','),
      message: `Missing columns: ${missingHeaders.join(', ')}`,
      code: 'invalid',
    })
    return {
      entity,
      totalRows: rows.length,
      validRows: 0,
      invalidRows: rows.length,
      duplicateRows: 0,
      rows: rows.map((raw, i) => ({
        rowNumber: i + 2,
        raw,
        valid: false,
        duplicate: false,
        errors: [
          {
            row: i + 2,
            field: 'headers',
            value: '',
            message: `Missing columns: ${missingHeaders.join(', ')}`,
            code: 'invalid',
          },
        ],
      })),
      errors: allErrors,
    }
  }

  const seenKeys = new Map<string, number>()

  rows.forEach((raw, index) => {
    const rowNumber = index + 2 // 1-based + header
    const errors: ImportError[] = []
    let data: Record<string, unknown> | undefined
    let duplicate = false
    let dupKey = ''

    if (entity === 'products') {
      const name = requireText(raw.name ?? '', 'name', rowNumber, errors)
      const sku = requireText(raw.sku ?? '', 'sku', rowNumber, errors)
      const categoryName = requireText(raw.category ?? '', 'category', rowNumber, errors)
      const brandName = requireText(raw.brand ?? '', 'brand', rowNumber, errors)
      const unitName = requireText(raw.unit ?? '', 'unit', rowNumber, errors)
      const gstValue = requireText(raw.gstRate ?? '', 'gstRate', rowNumber, errors)
      const hsnCode = requireText(raw.hsnCode ?? '', 'hsnCode', rowNumber, errors)
      const purchasePrice = parseNumber(raw.purchasePrice ?? '', 'purchasePrice', rowNumber, errors)
      const sellingPrice = parseNumber(raw.sellingPrice ?? '', 'sellingPrice', rowNumber, errors)
      const mrp = parseNumber(raw.mrp ?? '', 'mrp', rowNumber, errors)
      const openingStock = parseNumber(raw.openingStock ?? '0', 'openingStock', rowNumber, errors)
      const minimumStock = parseNumber(raw.minimumStock ?? '0', 'minimumStock', rowNumber, errors)
      const status = parseStatus(raw.status ?? 'active')
      if (raw.status && !status) {
        errors.push({
          row: rowNumber,
          field: 'status',
          value: raw.status,
          message: 'status must be active or inactive',
          code: 'invalid',
        })
      }

      const category = categoryName ? findByName(lookups.categories, categoryName) : undefined
      const brand = brandName ? findByName(lookups.brands, brandName) : undefined
      const unit = unitName ? findUnit(lookups.units, unitName) : undefined
      const gst = gstValue ? findGst(lookups.gstRates, gstValue) : undefined

      if (categoryName && !category) {
        errors.push({
          row: rowNumber,
          field: 'category',
          value: categoryName,
          message: `Category "${categoryName}" not found`,
          code: 'lookup',
        })
      }
      if (brandName && !brand) {
        errors.push({
          row: rowNumber,
          field: 'brand',
          value: brandName,
          message: `Brand "${brandName}" not found`,
          code: 'lookup',
        })
      }
      if (unitName && !unit) {
        errors.push({
          row: rowNumber,
          field: 'unit',
          value: unitName,
          message: `Unit "${unitName}" not found`,
          code: 'lookup',
        })
      }
      if (gstValue && !gst) {
        errors.push({
          row: rowNumber,
          field: 'gstRate',
          value: gstValue,
          message: `GST rate "${gstValue}" not found`,
          code: 'lookup',
        })
      }

      if (sku) {
        dupKey = `sku:${sku.toLowerCase()}`
        const prev = seenKeys.get(dupKey)
        if (prev) {
          duplicate = true
          errors.push({
            row: rowNumber,
            field: 'sku',
            value: sku,
            message: `Duplicate SKU in file (also on row ${prev})`,
            code: 'duplicate_file',
          })
        } else {
          seenKeys.set(dupKey, rowNumber)
        }
        const existing = lookups.products.find((p) => p.sku.toLowerCase() === sku.toLowerCase())
        if (existing) {
          duplicate = true
          errors.push({
            row: rowNumber,
            field: 'sku',
            value: sku,
            message: `SKU already exists (${existing.name})`,
            code: 'duplicate_existing',
          })
        }
      }

      if (
        name &&
        sku &&
        category &&
        brand &&
        unit &&
        gst &&
        purchasePrice !== null &&
        sellingPrice !== null &&
        mrp !== null &&
        openingStock !== null &&
        minimumStock !== null &&
        status &&
        errors.length === 0
      ) {
        data = {
          name,
          sku,
          barcode: raw.barcode || undefined,
          categoryId: category.id,
          brandId: brand.id,
          unitId: unit.id,
          purchasePrice,
          sellingPrice,
          mrp,
          gstRateId: gst.id,
          hsnCode,
          openingStock,
          minimumStock,
          description: raw.description || undefined,
          status,
        }
      }
    } else {
      // parties
      const name = requireText(raw.name ?? '', 'name', rowNumber, errors)
      const mobile = requireText(raw.mobile ?? '', 'mobile', rowNumber, errors)
      const address = requireText(raw.address ?? '', 'address', rowNumber, errors)
      const city = requireText(raw.city ?? '', 'city', rowNumber, errors)
      const state = requireText(raw.state ?? '', 'state', rowNumber, errors)
      const creditLimit = parseNumber(raw.creditLimit ?? '0', 'creditLimit', rowNumber, errors)
      const openingBalance = parseNumber(raw.openingBalance ?? '0', 'openingBalance', rowNumber, errors)
      const paymentTerms = (raw.paymentTerms || 'Net 30').trim()
      const status = parseStatus(raw.status ?? 'active')
      if (raw.status && !status) {
        errors.push({
          row: rowNumber,
          field: 'status',
          value: raw.status,
          message: 'status must be active or inactive',
          code: 'invalid',
        })
      }

      if (mobile && !/^\d{10}$/.test(mobile.replace(/\s+/g, ''))) {
        errors.push({
          row: rowNumber,
          field: 'mobile',
          value: mobile,
          message: 'mobile must be a 10-digit number',
          code: 'invalid',
        })
      }

      let companyName: string | undefined
      let contactPerson: string | undefined
      let pan: string | undefined

      if (entity === 'distributors' || entity === 'suppliers') {
        companyName = requireText(raw.companyName ?? '', 'companyName', rowNumber, errors) ?? undefined
        contactPerson = requireText(raw.contactPerson ?? '', 'contactPerson', rowNumber, errors) ?? undefined
        pan = raw.pan?.trim() || undefined
      }

      if (mobile) {
        const normMobile = mobile.replace(/\s+/g, '')
        dupKey = `mobile:${normMobile}`
        const prev = seenKeys.get(dupKey)
        if (prev) {
          duplicate = true
          errors.push({
            row: rowNumber,
            field: 'mobile',
            value: mobile,
            message: `Duplicate mobile in file (also on row ${prev})`,
            code: 'duplicate_file',
          })
        } else {
          seenKeys.set(dupKey, rowNumber)
        }

        const existingList =
          entity === 'customers'
            ? lookups.customers
            : entity === 'distributors'
              ? lookups.distributors
              : lookups.suppliers
        const existing = existingList.find((p) => p.mobile.replace(/\s+/g, '') === normMobile)
        if (existing) {
          duplicate = true
          errors.push({
            row: rowNumber,
            field: 'mobile',
            value: mobile,
            message: `Mobile already exists (${existing.name})`,
            code: 'duplicate_existing',
          })
        }
      }

      if (
        name &&
        mobile &&
        address &&
        city &&
        state &&
        creditLimit !== null &&
        openingBalance !== null &&
        status &&
        (entity === 'customers' || (companyName && contactPerson)) &&
        errors.length === 0
      ) {
        data = {
          name,
          mobile: mobile.replace(/\s+/g, ''),
          email: raw.email || undefined,
          address,
          city,
          state,
          gstNumber: raw.gstNumber || undefined,
          creditLimit,
          openingBalance,
          paymentTerms,
          status,
          ...(entity !== 'customers'
            ? { companyName, contactPerson, pan }
            : {}),
        }
      }
    }

    const valid = errors.length === 0 && Boolean(data)
    const rowResult: ImportRowResult = {
      rowNumber,
      raw,
      valid,
      duplicate,
      errors,
      data: valid ? data : undefined,
    }
    results.push(rowResult)
    allErrors.push(...errors)
  })

  const validRows = results.filter((r) => r.valid).length
  const duplicateRows = results.filter((r) => r.duplicate).length
  const invalidRows = results.length - validRows

  return {
    entity,
    totalRows: results.length,
    validRows,
    invalidRows,
    duplicateRows,
    rows: results,
    errors: allErrors,
  }
}
