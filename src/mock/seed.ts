import type {
  Brand,
  BusinessSettings,
  Category,
  Customer,
  Distributor,
  Expense,
  GstRate,
  LedgerEntry,
  Payment,
  Product,
  Purchase,
  Role,
  Sale,
  StockMovement,
  Supplier,
  Unit,
  User,
  AppNotification,
  AuditLog,
  Location,
  Permission,
  PermissionModule,
} from '@/types'
import { nowISO, todayISO } from '@/utils/cn'

const ts = nowISO()
const today = todayISO()

function allPerms(full: boolean): Permission[] {
  const modules: PermissionModule[] = [
    'dashboard', 'products', 'stock', 'purchase', 'sales', 'invoices', 'payments',
    'customers', 'distributors', 'suppliers', 'returns', 'expenses', 'reports',
    'users', 'settings', 'audit_logs', 'approvals',
  ]
  return modules.map((module) => ({
    module,
    view: true,
    create: full,
    edit: full,
    delete: full && module !== 'dashboard',
  }))
}

function limitedPerms(allowed: PermissionModule[], write: boolean): Permission[] {
  const modules: PermissionModule[] = [
    'dashboard', 'products', 'stock', 'purchase', 'sales', 'invoices', 'payments',
    'customers', 'distributors', 'suppliers', 'returns', 'expenses', 'reports',
    'users', 'settings', 'audit_logs', 'approvals',
  ]
  return modules.map((module) => {
    const ok = allowed.includes(module)
    return {
      module,
      view: ok || module === 'dashboard',
      create: ok && write,
      edit: ok && write,
      delete: ok && write && module !== 'dashboard',
    }
  })
}

export const seedCategories: Category[] = [
  { id: 'cat_1', name: 'Air Coolers', description: 'Desert & personal coolers', parentId: null, status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'cat_2', name: 'Ceiling Fans', description: 'Residential & commercial fans', parentId: null, status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'cat_3', name: 'Table Fans', description: 'Portable table fans', parentId: null, status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'cat_4', name: 'Spare Parts', description: 'Motors, pumps, pads', parentId: null, status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'cat_5', name: 'Electrical Accessories', description: 'Switches, wires, controllers', parentId: null, status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'cat_6', name: 'Cooler Pads', description: 'Honeycomb cooling pads', parentId: 'cat_4', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'cat_7', name: 'Water Pumps', description: 'Cooler water pumps', parentId: 'cat_4', status: 'active', createdAt: ts, updatedAt: ts },
]

export const seedBrands: Brand[] = [
  { id: 'br_1', name: 'Sheetal Cool', description: 'House brand cooling products', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'br_2', name: 'Orient Electric', description: 'Fans & appliances', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'br_3', name: 'Havells', description: 'Electrical & fans', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'br_4', name: 'Symphony', description: 'Air coolers', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'br_5', name: 'Bajaj Electricals', description: 'Fans & home appliances', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'br_6', name: 'Usha', description: 'Fans & coolers', status: 'active', createdAt: ts, updatedAt: ts },
]

export const seedUnits: Unit[] = [
  { id: 'un_1', name: 'Piece', shortName: 'Pcs', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'un_2', name: 'Box', shortName: 'Box', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'un_3', name: 'Set', shortName: 'Set', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'un_4', name: 'Kilogram', shortName: 'Kg', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'un_5', name: 'Meter', shortName: 'Mtr', status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'un_6', name: 'Pack', shortName: 'Pk', status: 'active', createdAt: ts, updatedAt: ts },
]

export const seedGstRates: GstRate[] = [
  { id: 'gst_0', name: 'GST 0%', rate: 0, status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'gst_5', name: 'GST 5%', rate: 5, status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'gst_12', name: 'GST 12%', rate: 12, status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'gst_18', name: 'GST 18%', rate: 18, status: 'active', createdAt: ts, updatedAt: ts },
  { id: 'gst_28', name: 'GST 28%', rate: 28, status: 'active', createdAt: ts, updatedAt: ts },
]

export const seedProducts: Product[] = [
  {
    id: 'prd_1', name: 'Sheetal Desert Cooler 70L', sku: 'SC-DC-70', barcode: '8901001001001',
    categoryId: 'cat_1', brandId: 'br_1', unitId: 'un_1', purchasePrice: 6200, sellingPrice: 7999, mrp: 8999,
    gstRateId: 'gst_18', hsnCode: '84796000', openingStock: 45, currentStock: 38, minimumStock: 10,
    description: 'High-efficiency desert cooler with honeycomb pads, 70 litre tank.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_2', name: 'Sheetal Personal Cooler 22L', sku: 'SC-PC-22', barcode: '8901001001002',
    categoryId: 'cat_1', brandId: 'br_1', unitId: 'un_1', purchasePrice: 2800, sellingPrice: 3699, mrp: 4299,
    gstRateId: 'gst_18', hsnCode: '84796000', openingStock: 60, currentStock: 52, minimumStock: 15,
    description: 'Compact personal cooler for bedrooms and offices.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_3', name: 'Symphony Diet 3D 55i+', sku: 'SYM-D3D-55', barcode: '8901001001003',
    categoryId: 'cat_1', brandId: 'br_4', unitId: 'un_1', purchasePrice: 9800, sellingPrice: 12499, mrp: 14999,
    gstRateId: 'gst_18', hsnCode: '84796000', openingStock: 20, currentStock: 14, minimumStock: 5,
    description: 'Inverter desert cooler with MagiCool technology.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_4', name: 'Orient Electric Aeroquiet 1200mm', sku: 'OR-AQ-1200', barcode: '8901001001004',
    categoryId: 'cat_2', brandId: 'br_2', unitId: 'un_1', purchasePrice: 1850, sellingPrice: 2499, mrp: 2899,
    gstRateId: 'gst_18', hsnCode: '84145100', openingStock: 100, currentStock: 86, minimumStock: 20,
    description: 'BLDC ceiling fan with remote, low noise.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_5', name: 'Havells Efficiencia Neo 1200mm', sku: 'HV-EN-1200', barcode: '8901001001005',
    categoryId: 'cat_2', brandId: 'br_3', unitId: 'un_1', purchasePrice: 2100, sellingPrice: 2799, mrp: 3299,
    gstRateId: 'gst_18', hsnCode: '84145100', openingStock: 80, currentStock: 71, minimumStock: 15,
    description: 'Energy-efficient ceiling fan with decorative finish.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_6', name: 'Bajaj Grace Neo 400mm Table Fan', sku: 'BJ-GN-400', barcode: '8901001001006',
    categoryId: 'cat_3', brandId: 'br_5', unitId: 'un_1', purchasePrice: 1450, sellingPrice: 1899, mrp: 2199,
    gstRateId: 'gst_18', hsnCode: '84145100', openingStock: 55, currentStock: 8, minimumStock: 12,
    description: 'Oscillating table fan with high-speed motor.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_7', name: 'Usha Mist Air Flo 400mm', sku: 'US-MAF-400', barcode: '8901001001007',
    categoryId: 'cat_3', brandId: 'br_6', unitId: 'un_1', purchasePrice: 1320, sellingPrice: 1749, mrp: 1999,
    gstRateId: 'gst_18', hsnCode: '84145100', openingStock: 40, currentStock: 33, minimumStock: 10,
    description: '3-speed table fan with aerodynamic blades.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_8', name: 'Honeycomb Cooling Pad 30x30', sku: 'SP-HCP-3030', barcode: '8901001001008',
    categoryId: 'cat_6', brandId: 'br_1', unitId: 'un_6', purchasePrice: 180, sellingPrice: 275, mrp: 320,
    gstRateId: 'gst_12', hsnCode: '84219900', openingStock: 200, currentStock: 164, minimumStock: 50,
    description: 'Premium cellulose honeycomb pad for desert coolers.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_9', name: 'Cooler Water Pump 18W', sku: 'SP-CWP-18', barcode: '8901001001009',
    categoryId: 'cat_7', brandId: 'br_1', unitId: 'un_1', purchasePrice: 220, sellingPrice: 349, mrp: 399,
    gstRateId: 'gst_18', hsnCode: '84137000', openingStock: 150, currentStock: 128, minimumStock: 30,
    description: 'Submersible cooler pump compatible with most brands.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_10', name: 'Cooler Motor 1/12 HP', sku: 'SP-CM-112', barcode: '8901001001010',
    categoryId: 'cat_4', brandId: 'br_1', unitId: 'un_1', purchasePrice: 780, sellingPrice: 1099, mrp: 1299,
    gstRateId: 'gst_18', hsnCode: '85014000', openingStock: 35, currentStock: 4, minimumStock: 8,
    description: 'Copper winding cooler motor for desert coolers.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_11', name: 'Modular Fan Regulator 5-Step', sku: 'EA-FR-5S', barcode: '8901001001011',
    categoryId: 'cat_5', brandId: 'br_3', unitId: 'un_1', purchasePrice: 95, sellingPrice: 149, mrp: 179,
    gstRateId: 'gst_18', hsnCode: '85371000', openingStock: 300, currentStock: 265, minimumStock: 50,
    description: 'White modular fan regulator, ISI marked.', status: 'active', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'prd_12', name: 'Sheetal Tower Cooler 45L', sku: 'SC-TC-45', barcode: '8901001001012',
    categoryId: 'cat_1', brandId: 'br_1', unitId: 'un_1', purchasePrice: 5400, sellingPrice: 6999, mrp: 7999,
    gstRateId: 'gst_18', hsnCode: '84796000', openingStock: 25, currentStock: 19, minimumStock: 6,
    description: 'Slim tower cooler with remote and timer.', status: 'active', createdAt: ts, updatedAt: ts,
  },
]
