import type {
  Customer,
  Distributor,
  Supplier,
  Role,
  User,
  BusinessSettings,
  Location,
  AppNotification,
  AuditLog,
  ExportJob,
  Purchase,
  Sale,
  Invoice,
  Payment,
  Expense,
  StockMovement,
  LedgerEntry,
  SalesReturn,
  PurchaseReturn,
  StockAdjustment,
  StockTransfer,
} from '@/types'

export const seedCustomers: Customer[] = [
  {
    id: 'cus_1', type: 'customer', name: 'Ramesh Hardware Mart', mobile: '9876543210',
    email: 'ramesh.hw@gmail.com', address: '12 MG Road, Near City Mall', city: 'Indore', state: 'Madhya Pradesh',
    gstNumber: '23AABCR1234A1Z5', creditLimit: 200000, openingBalance: 12500, currentBalance: 28450,
    paymentTerms: 'Net 30', status: 'active', createdAt: '2025-11-02T10:00:00.000Z', updatedAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'cus_2', type: 'customer', name: 'Shree Cooling Point', mobile: '9826012345',
    email: 'shreecooling@yahoo.com', address: '45 Palasia Square', city: 'Indore', state: 'Madhya Pradesh',
    gstNumber: '23AADCS9876B1Z2', creditLimit: 150000, openingBalance: 0, currentBalance: 15200,
    paymentTerms: 'Net 15', status: 'active', createdAt: '2025-12-15T10:00:00.000Z', updatedAt: '2026-09-08T10:00:00.000Z',
  },
  {
    id: 'cus_3', type: 'customer', name: 'Agarwal Electronics', mobile: '9123456780',
    email: 'agarwal.electronics@gmail.com', address: '78 Civil Lines', city: 'Bhopal', state: 'Madhya Pradesh',
    gstNumber: '23AAECA4567C1Z8', creditLimit: 300000, openingBalance: 5000, currentBalance: 47800,
    paymentTerms: 'Net 45', status: 'active', createdAt: '2025-10-20T10:00:00.000Z', updatedAt: '2026-09-12T10:00:00.000Z',
  },
  {
    id: 'cus_4', type: 'customer', name: 'Krishna Electricals', mobile: '9988776655',
    address: '3 Station Road', city: 'Ujjain', state: 'Madhya Pradesh',
    creditLimit: 75000, openingBalance: 0, currentBalance: 0,
    paymentTerms: 'Cash', status: 'active', createdAt: '2026-01-08T10:00:00.000Z', updatedAt: '2026-01-08T10:00:00.000Z',
  },
  {
    id: 'cus_5', type: 'customer', name: 'Patel Home Appliances', mobile: '9765432109',
    email: 'patel.home@outlook.com', address: '22 Ring Road', city: 'Dewas', state: 'Madhya Pradesh',
    gstNumber: '23AABCP7788D1Z1', creditLimit: 100000, openingBalance: 8200, currentBalance: 8200,
    paymentTerms: 'Net 21', status: 'active', createdAt: '2025-09-14T10:00:00.000Z', updatedAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'cus_6', type: 'customer', name: 'Modern Fans & Coolers', mobile: '9811122233',
    address: '9 Market Yard', city: 'Ratlam', state: 'Madhya Pradesh',
    creditLimit: 50000, openingBalance: 0, currentBalance: 9600,
    paymentTerms: 'Net 7', status: 'inactive', createdAt: '2025-08-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z',
  },
]

export const seedDistributors: Distributor[] = [
  {
    id: 'dis_1', type: 'distributor', name: 'Malwa Distributors', companyName: 'Malwa Distributors Pvt Ltd',
    contactPerson: 'Suresh Malhotra', mobile: '9876501234', email: 'orders@malwadist.in',
    address: 'Plot 14, Industrial Area Phase 2', city: 'Indore', state: 'Madhya Pradesh',
    gstNumber: '23AABCM1122E1Z9', pan: 'AABCM1122E', creditLimit: 500000, openingBalance: 45000,
    currentBalance: 112500, paymentTerms: 'Net 30', status: 'active',
    createdAt: '2025-06-01T10:00:00.000Z', updatedAt: '2026-09-11T10:00:00.000Z',
  },
  {
    id: 'dis_2', type: 'distributor', name: 'Central India Trading', companyName: 'Central India Trading Co.',
    contactPerson: 'Ankit Jain', mobile: '9827098765', email: 'ankit@cittrading.com',
    address: '88 New Market', city: 'Bhopal', state: 'Madhya Pradesh',
    gstNumber: '23AACCC3344F1Z3', pan: 'AACCC3344F', creditLimit: 350000, openingBalance: 0,
    currentBalance: 67800, paymentTerms: 'Net 45', status: 'active',
    createdAt: '2025-07-12T10:00:00.000Z', updatedAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'dis_3', type: 'distributor', name: 'Narmada Agencies', companyName: 'Narmada Agencies',
    contactPerson: 'Priya Sharma', mobile: '9755512345', email: 'priya@narmadaagencies.in',
    address: '5 Transport Nagar', city: 'Jabalpur', state: 'Madhya Pradesh',
    gstNumber: '23AADFN5566G1Z7', pan: 'AADFN5566G', creditLimit: 250000, openingBalance: 15000,
    currentBalance: 15000, paymentTerms: 'Net 30', status: 'active',
    createdAt: '2025-11-20T10:00:00.000Z', updatedAt: '2026-01-15T10:00:00.000Z',
  },
]

export const seedSuppliers: Supplier[] = [
  {
    id: 'sup_1', type: 'supplier', name: 'Orient Electric Ltd', companyName: 'Orient Electric Limited',
    contactPerson: 'Rajeev Mehra', mobile: '9810011223', email: 'dealer@orientelectric.com',
    address: 'Corporate Office, Okhla Phase III', city: 'New Delhi', state: 'Delhi',
    gstNumber: '07AAACO1234A1Z1', pan: 'AAACO1234A', creditLimit: 1000000, openingBalance: 0,
    currentBalance: 85600, paymentTerms: 'Net 45', status: 'active',
    createdAt: '2025-05-01T10:00:00.000Z', updatedAt: '2026-09-09T10:00:00.000Z',
  },
  {
    id: 'sup_2', type: 'supplier', name: 'Symphony Limited', companyName: 'Symphony Limited',
    contactPerson: 'Neha Patel', mobile: '9825012345', email: 'channel@symphonylimited.com',
    address: 'FP 12, TP 50, Bodakdev', city: 'Ahmedabad', state: 'Gujarat',
    gstNumber: '24AABCS5678B1Z4', pan: 'AABCS5678B', creditLimit: 800000, openingBalance: 22000,
    currentBalance: 125400, paymentTerms: 'Net 30', status: 'active',
    createdAt: '2025-05-15T10:00:00.000Z', updatedAt: '2026-09-07T10:00:00.000Z',
  },
  {
    id: 'sup_3', type: 'supplier', name: 'Sheetal Manufacturing', companyName: 'Sheetal Cool Manufacturing',
    contactPerson: 'Vikram Sheetal', mobile: '9425011122', email: 'factory@sheetalcool.in',
    address: 'Sector E, Sanwer Road Industrial Area', city: 'Indore', state: 'Madhya Pradesh',
    gstNumber: '23AADFS9012C1Z6', pan: 'AADFS9012C', creditLimit: 600000, openingBalance: 0,
    currentBalance: 42300, paymentTerms: 'Net 15', status: 'active',
    createdAt: '2025-04-10T10:00:00.000Z', updatedAt: '2026-09-13T10:00:00.000Z',
  },
  {
    id: 'sup_4', type: 'supplier', name: 'Havells India Ltd', companyName: 'Havells India Limited',
    contactPerson: 'Amit Khurana', mobile: '9811199887', email: 'partners@havells.com',
    address: 'QRG Towers, Sector 59', city: 'Noida', state: 'Uttar Pradesh',
    gstNumber: '09AAACH3456D1Z0', pan: 'AAACH3456D', creditLimit: 900000, openingBalance: 10000,
    currentBalance: 10000, paymentTerms: 'Net 60', status: 'active',
    createdAt: '2025-06-20T10:00:00.000Z', updatedAt: '2026-02-01T10:00:00.000Z',
  },
]

export const seedRoles: Role[] = [
  {
    id: 'role_1', name: 'Super Admin', description: 'Full system access', status: 'active',
    permissions: [
      'dashboard', 'products', 'stock', 'purchase', 'sales', 'invoices', 'payments',
      'customers', 'distributors', 'suppliers', 'returns', 'expenses', 'reports',
      'users', 'settings', 'audit_logs', 'approvals',
    ].map((module) => ({
      module: module as Role['permissions'][0]['module'],
      view: true, create: true, edit: true, delete: true,
    })),
  },
  {
    id: 'role_2', name: 'Admin', description: 'Administrative access except critical settings', status: 'active',
    permissions: [
      'dashboard', 'products', 'stock', 'purchase', 'sales', 'invoices', 'payments',
      'customers', 'distributors', 'suppliers', 'returns', 'expenses', 'reports',
      'users', 'settings', 'audit_logs', 'approvals',
    ].map((module) => ({
      module: module as Role['permissions'][0]['module'],
      view: true, create: true, edit: true, delete: module !== 'settings',
    })),
  },
  {
    id: 'role_3', name: 'Manager', description: 'Operations and reports', status: 'active',
    permissions: [
      'dashboard', 'products', 'stock', 'purchase', 'sales', 'invoices', 'payments',
      'customers', 'distributors', 'suppliers', 'returns', 'expenses', 'reports',
      'users', 'settings', 'audit_logs', 'approvals',
    ].map((module) => {
      const write = !['users', 'settings', 'audit_logs'].includes(module)
      return { module: module as Role['permissions'][0]['module'], view: true, create: write, edit: write, delete: write && module !== 'dashboard' }
    }),
  },
  {
    id: 'role_4', name: 'Sales Executive', description: 'Sales, customers, invoices', status: 'active',
    permissions: [
      'dashboard', 'products', 'stock', 'purchase', 'sales', 'invoices', 'payments',
      'customers', 'distributors', 'suppliers', 'returns', 'expenses', 'reports',
      'users', 'settings', 'audit_logs', 'approvals',
    ].map((module) => {
      const allowed = ['dashboard', 'products', 'sales', 'invoices', 'customers', 'payments', 'returns', 'reports', 'approvals'].includes(module)
      const write = ['sales', 'invoices', 'customers', 'payments', 'returns', 'approvals'].includes(module)
      return { module: module as Role['permissions'][0]['module'], view: allowed, create: write, edit: write, delete: false }
    }),
  },
  {
    id: 'role_5', name: 'Stock Manager', description: 'Inventory and stock operations', status: 'active',
    permissions: [
      'dashboard', 'products', 'stock', 'purchase', 'sales', 'invoices', 'payments',
      'customers', 'distributors', 'suppliers', 'returns', 'expenses', 'reports',
      'users', 'settings', 'audit_logs', 'approvals',
    ].map((module) => {
      const allowed = ['dashboard', 'products', 'stock', 'purchase', 'suppliers', 'returns', 'reports', 'approvals'].includes(module)
      const write = ['stock', 'purchase', 'products', 'returns', 'approvals'].includes(module)
      return { module: module as Role['permissions'][0]['module'], view: allowed, create: write, edit: write, delete: false }
    }),
  },
  {
    id: 'role_6', name: 'Accountant', description: 'Payments, expenses, reports', status: 'active',
    permissions: [
      'dashboard', 'products', 'stock', 'purchase', 'sales', 'invoices', 'payments',
      'customers', 'distributors', 'suppliers', 'returns', 'expenses', 'reports',
      'users', 'settings', 'audit_logs', 'approvals',
    ].map((module) => {
      const allowed = ['dashboard', 'sales', 'purchase', 'invoices', 'payments', 'expenses', 'reports', 'customers', 'suppliers', 'approvals'].includes(module)
      const write = ['payments', 'expenses'].includes(module)
      return { module: module as Role['permissions'][0]['module'], view: allowed, create: write, edit: write, delete: false }
    }),
  },
  {
    id: 'role_7', name: 'Viewer', description: 'Read-only access', status: 'active',
    permissions: [
      'dashboard', 'products', 'stock', 'purchase', 'sales', 'invoices', 'payments',
      'customers', 'distributors', 'suppliers', 'returns', 'expenses', 'reports',
      'users', 'settings', 'audit_logs', 'approvals',
    ].map((module) => ({
      module: module as Role['permissions'][0]['module'],
      view: !['users', 'settings'].includes(module),
      create: false, edit: false, delete: false,
    })),
  },
]

export const seedUsers: User[] = [
  { id: 'usr_1', name: 'Amit Sheetal', email: 'admin@sheetalcool.in', username: 'superadmin', password: 'admin123', roleId: 'role_1', roleName: 'Super Admin', phone: '9425000001', status: 'active', lastLogin: '2026-09-15T08:30:00.000Z', createdAt: '2025-01-01T10:00:00.000Z', updatedAt: '2026-09-15T08:30:00.000Z' },
  { id: 'usr_2', name: 'Neha Verma', email: 'neha@sheetalcool.in', username: 'admin', password: 'admin123', roleId: 'role_2', roleName: 'Admin', phone: '9425000002', status: 'active', lastLogin: '2026-09-14T11:00:00.000Z', createdAt: '2025-02-01T10:00:00.000Z', updatedAt: '2026-09-14T11:00:00.000Z' },
  { id: 'usr_3', name: 'Rahul Kapoor', email: 'rahul@sheetalcool.in', username: 'manager', password: 'manager123', roleId: 'role_3', roleName: 'Manager', phone: '9425000003', status: 'active', createdAt: '2025-03-01T10:00:00.000Z', updatedAt: '2025-03-01T10:00:00.000Z' },
  { id: 'usr_4', name: 'Priya Singh', email: 'priya@sheetalcool.in', username: 'sales', password: 'sales123', roleId: 'role_4', roleName: 'Sales Executive', phone: '9425000004', status: 'active', createdAt: '2025-04-01T10:00:00.000Z', updatedAt: '2025-04-01T10:00:00.000Z' },
  { id: 'usr_5', name: 'Sandeep Yadav', email: 'sandeep@sheetalcool.in', username: 'stock', password: 'stock123', roleId: 'role_5', roleName: 'Stock Manager', phone: '9425000005', status: 'active', createdAt: '2025-05-01T10:00:00.000Z', updatedAt: '2025-05-01T10:00:00.000Z' },
  { id: 'usr_6', name: 'Meena Joshi', email: 'meena@sheetalcool.in', username: 'accounts', password: 'accounts123', roleId: 'role_6', roleName: 'Accountant', phone: '9425000006', status: 'active', createdAt: '2025-06-01T10:00:00.000Z', updatedAt: '2025-06-01T10:00:00.000Z' },
  { id: 'usr_7', name: 'Guest Viewer', email: 'viewer@sheetalcool.in', username: 'viewer', password: 'viewer123', roleId: 'role_7', roleName: 'Viewer', status: 'active', createdAt: '2025-07-01T10:00:00.000Z', updatedAt: '2025-07-01T10:00:00.000Z' },
]

export const seedSettings: BusinessSettings = {
  businessName: 'DMS.SHEETAL COOL',
  address: 'Sector E, Sanwer Road Industrial Area, Indore, Madhya Pradesh 452015',
  phone: '+91 731 420 8800',
  email: 'info@sheetalcool.in',
  gstNumber: '23AADFS9012C1Z6',
  pan: 'AADFS9012C',
  invoicePrefix: 'SC',
  invoiceStartingNumber: 1042,
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  lowStockThreshold: 10,
  allowNegativeStock: false,
  paymentMethods: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'],
  taxEnabled: true,
  enforceCreditLimit: true,
  sessionTimeoutMinutes: 30,
  salesDefaultPaymentTerms: 'Net 30',
  purchaseDefaultPaymentTerms: 'Net 45',
  notificationPrefs: {
    lowStock: true,
    newSale: true,
    paymentDue: true,
    system: true,
  },
  discountLimits: {
    'Sales Executive': 5,
    Manager: 15,
    Accountant: 10,
    'Stock Manager': 0,
    Viewer: 0,
    Admin: null,
    'Super Admin': null,
  },
}

export const seedLocations: Location[] = [
  { id: 'loc_1', name: 'Main Warehouse — Indore', type: 'warehouse', status: 'active' },
  { id: 'loc_2', name: 'Godown — Dewas Road', type: 'godown', status: 'active' },
  { id: 'loc_3', name: 'Showroom — Palasia', type: 'showroom', status: 'active' },
]

export const seedNotifications: AppNotification[] = [
  {
    id: 'ntf_1',
    type: 'low_stock',
    category: 'stock',
    severity: 'warning',
    priority: 'high',
    title: 'Low stock alert',
    message: 'Bajaj Grace Neo 400mm Table Fan is below minimum stock (8 pcs).',
    read: false,
    link: '/inventory/low-stock',
    related: { type: 'product', id: 'prd_6', label: 'BJ-GN-400', href: '/master/products/prd_6' },
    createdAt: '2026-09-15T07:00:00.000Z',
  },
  {
    id: 'ntf_2',
    type: 'low_stock',
    category: 'stock',
    severity: 'critical',
    priority: 'urgent',
    title: 'Critical stock alert',
    message: 'Cooler Motor 1/12 HP is critically low (4 pcs).',
    read: false,
    link: '/inventory/low-stock',
    related: { type: 'product', id: 'prd_9', label: 'Cooler Motor 1/12 HP', href: '/inventory/low-stock' },
    createdAt: '2026-09-15T07:05:00.000Z',
  },
  {
    id: 'ntf_3',
    type: 'new_sale',
    category: 'sales',
    severity: 'success',
    priority: 'normal',
    title: 'Sale confirmed',
    message: 'Invoice SC-1041 created for Agarwal Electronics — ₹47,800.',
    read: false,
    link: '/transactions/sales/sal_1/edit',
    related: { type: 'sale', id: 'sal_1', label: 'SC-1041', href: '/transactions/sales/sal_1/edit' },
    createdAt: '2026-09-14T16:20:00.000Z',
  },
  {
    id: 'ntf_4',
    type: 'payment_received',
    category: 'payments',
    severity: 'success',
    priority: 'normal',
    title: 'Payment received',
    message: '₹15,000 received from Ramesh Hardware Mart via UPI.',
    read: true,
    link: '/transactions/payments',
    related: { type: 'payment', label: 'PAY-R-0312', href: '/transactions/payments' },
    createdAt: '2026-09-13T12:10:00.000Z',
  },
  {
    id: 'ntf_5',
    type: 'new_purchase',
    category: 'purchase',
    severity: 'success',
    priority: 'normal',
    title: 'Purchase confirmed',
    message: 'Purchase PO-2088 from Symphony Limited confirmed.',
    read: true,
    link: '/transactions/purchases/pur_1/edit',
    related: { type: 'purchase', id: 'pur_1', label: 'PO-2088', href: '/transactions/purchases/pur_1/edit' },
    createdAt: '2026-09-12T11:00:00.000Z',
  },
  {
    id: 'ntf_6',
    type: 'payment_due',
    category: 'payments',
    severity: 'warning',
    priority: 'high',
    title: 'Payment due reminder',
    message: 'Supplier Orient Electric Ltd has outstanding ₹85,600.',
    read: false,
    link: '/finance/outstanding',
    related: { type: 'supplier', id: 'sup_1', label: 'Orient Electric Ltd', href: '/parties/suppliers' },
    createdAt: '2026-09-11T09:00:00.000Z',
  },
  {
    id: 'ntf_7',
    type: 'approval',
    category: 'approvals',
    severity: 'info',
    priority: 'high',
    title: 'Approval pending',
    message: 'APR-1001 — Purchase PO-2090 approval awaits review.',
    read: false,
    link: '/admin/approvals',
    related: { type: 'approval', id: 'apr_1', label: 'APR-1001', href: '/admin/approvals' },
    createdAt: '2026-09-15T09:25:00.000Z',
  },
  {
    id: 'ntf_8',
    type: 'invoice',
    category: 'invoices',
    severity: 'info',
    priority: 'normal',
    title: 'Invoice generated',
    message: 'Invoice SC-1041 is ready to print and share.',
    read: true,
    link: '/transactions/invoices',
    related: { type: 'invoice', label: 'SC-1041', href: '/transactions/invoices' },
    createdAt: '2026-09-14T16:22:00.000Z',
  },
  {
    id: 'ntf_9',
    type: 'system',
    category: 'system',
    severity: 'info',
    priority: 'low',
    title: 'Demo data loaded',
    message: 'DMS.SHEETAL COOL local workspace is ready.',
    read: true,
    link: '/dashboard',
    createdAt: '2026-09-10T08:00:00.000Z',
  },
]

export const seedAuditLogs: AuditLog[] = [
  {
    id: 'aud_1',
    date: '2026-09-16T08:30:00.000Z',
    userId: 'usr_1',
    userName: 'Amit Sheetal',
    module: 'Auth',
    action: 'Login',
    description: 'Super Admin logged in',
  },
  {
    id: 'aud_2',
    date: '2026-09-14T16:20:00.000Z',
    userId: 'usr_4',
    userName: 'Priya Singh',
    module: 'Sales',
    action: 'Sale Created',
    reference: 'SC-1041',
    description: 'Sale confirmed for Agarwal Electronics',
  },
  {
    id: 'aud_3',
    date: '2026-09-13T12:10:00.000Z',
    userId: 'usr_6',
    userName: 'Meena Joshi',
    module: 'Payments',
    action: 'Payment Received',
    reference: 'PAY-R-0312',
    description: 'Payment of ₹25,000 recorded',
  },
  {
    id: 'aud_4',
    date: '2026-09-12T11:00:00.000Z',
    userId: 'usr_5',
    userName: 'Sandeep Yadav',
    module: 'Purchase',
    action: 'Purchase Created',
    reference: 'PO-2088',
    description: 'Purchase from Symphony Limited confirmed',
  },
  {
    id: 'aud_5',
    date: '2026-09-10T14:00:00.000Z',
    userId: 'usr_2',
    userName: 'Neha Verma',
    module: 'Products',
    action: 'Product Updated',
    reference: 'SC-DC-70',
    description: 'Updated selling price for Sheetal Desert Cooler 70L',
  },
  {
    id: 'aud_6',
    date: '2026-09-09T10:30:00.000Z',
    userId: 'usr_5',
    userName: 'Sandeep Yadav',
    module: 'Stock',
    action: 'Stock Adjusted',
    reference: 'ADJ-014',
    description: 'Stock decrease for damaged cooler pads',
  },
  {
    id: 'aud_7',
    date: '2026-09-15T11:15:00.000Z',
    userId: 'usr_2',
    userName: 'Neha Verma',
    module: 'Products',
    action: 'Product Created',
    reference: 'prd_new',
    description: 'Created Voltas Cooler 55L',
  },
  {
    id: 'aud_8',
    date: '2026-09-15T09:25:00.000Z',
    userId: 'usr_5',
    userName: 'Sandeep Yadav',
    module: 'Approvals',
    action: 'Approval Submitted',
    reference: 'APR-1001',
    description: 'APR-1001 submitted',
  },
  {
    id: 'aud_9',
    date: '2026-09-14T10:00:00.000Z',
    userId: 'usr_3',
    userName: 'Rahul Kapoor',
    module: 'Approvals',
    action: 'Approval Approved',
    reference: 'APR-1002',
    description: 'APR-1002 approved',
  },
  {
    id: 'aud_10',
    date: '2026-09-11T15:40:00.000Z',
    userId: 'usr_4',
    userName: 'Priya Singh',
    module: 'Customers',
    action: 'Customer Created',
    reference: 'cus_new',
    description: 'Created Malwa Electricals',
  },
]

export const seedExports: ExportJob[] = [
  {
    id: 'expj_1',
    fileName: 'products-export-2026-09-14.csv',
    moduleId: 'products',
    moduleLabel: 'Products',
    status: 'completed',
    createdAt: '2026-09-14T10:15:00.000Z',
    completedAt: '2026-09-14T10:15:02.000Z',
    rowCount: 12,
    csvContent: 'SKU,Name\nSC-DC-70,Sheetal Desert Cooler 70L',
  },
  {
    id: 'expj_2',
    fileName: 'customers-export-2026-09-15.csv',
    moduleId: 'customers',
    moduleLabel: 'Customers',
    status: 'completed',
    createdAt: '2026-09-15T08:40:00.000Z',
    completedAt: '2026-09-15T08:40:01.000Z',
    rowCount: 6,
    csvContent: 'Name,Mobile\nRamesh Hardware Mart,9876543210',
  },
  {
    id: 'expj_3',
    fileName: 'sales-export-2026-09-16.csv',
    moduleId: 'sales',
    moduleLabel: 'Sales',
    status: 'failed',
    createdAt: '2026-09-16T07:05:00.000Z',
    completedAt: '2026-09-16T07:05:01.000Z',
    errorMessage: 'Simulated export failure — retry to generate again.',
  },
]

/** Sample transactions seeded for demo dashboards — additional ones created at runtime */
export const seedPurchases: Purchase[] = [
  {
    id: 'pur_1', purchaseNo: 'PO-2088', date: '2026-09-12', supplierId: 'sup_2', supplierName: 'Symphony Limited',
    invoiceNo: 'SYM/2026/4412', items: [
      { id: 'pli_1', productId: 'prd_3', productName: 'Symphony Diet 3D 55i+', sku: 'SYM-D3D-55', quantity: 8, rate: 9800, discount: 0, gstRate: 18, amount: 78400 },
    ],
    subtotal: 78400, discount: 0, cgst: 7056, sgst: 7056, igst: 0, otherCharges: 500, roundOff: 0,
    grandTotal: 93012, paid: 50000, due: 43012, status: 'partial', createdAt: '2026-09-12T11:00:00.000Z', updatedAt: '2026-09-12T11:00:00.000Z',
  },
  {
    id: 'pur_2', purchaseNo: 'PO-2087', date: '2026-09-05', supplierId: 'sup_3', supplierName: 'Sheetal Manufacturing',
    invoiceNo: 'SCM/26/118', items: [
      { id: 'pli_2', productId: 'prd_1', productName: 'Sheetal Desert Cooler 70L', sku: 'SC-DC-70', quantity: 15, rate: 6200, discount: 1500, gstRate: 18, amount: 91500 },
      { id: 'pli_3', productId: 'prd_2', productName: 'Sheetal Personal Cooler 22L', sku: 'SC-PC-22', quantity: 20, rate: 2800, discount: 0, gstRate: 18, amount: 56000 },
    ],
    subtotal: 147500, discount: 1500, cgst: 13275, sgst: 13275, igst: 0, otherCharges: 0, roundOff: 0,
    grandTotal: 174050, paid: 174050, due: 0, status: 'paid', createdAt: '2026-09-05T10:00:00.000Z', updatedAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'pur_3', purchaseNo: 'PO-2086', date: '2026-09-05', supplierId: 'sup_1', supplierName: 'Orient Electric Ltd',
    invoiceNo: 'OR/INV/9021', items: [
      { id: 'pli_4', productId: 'prd_4', productName: 'Orient Electric Aeroquiet 1200mm', sku: 'OR-AQ-1200', quantity: 40, rate: 1850, discount: 2000, gstRate: 18, amount: 72000 },
    ],
    subtotal: 72000, discount: 2000, cgst: 6480, sgst: 6480, igst: 0, otherCharges: 800, roundOff: 0,
    grandTotal: 85760, paid: 0, due: 85760, status: 'unpaid', createdAt: '2026-09-05T10:00:00.000Z', updatedAt: '2026-09-05T10:00:00.000Z',
  },
]

export const seedSales: Sale[] = [
  {
    id: 'sal_1', invoiceNo: 'SC-1041', date: '2026-09-14', customerId: 'cus_3', customerName: 'Agarwal Electronics',
    items: [
      { id: 'sli_1', productId: 'prd_1', productName: 'Sheetal Desert Cooler 70L', sku: 'SC-DC-70', quantity: 4, rate: 7999, discount: 500, gstRate: 18, amount: 31496 },
      { id: 'sli_2', productId: 'prd_4', productName: 'Orient Electric Aeroquiet 1200mm', sku: 'OR-AQ-1200', quantity: 6, rate: 2499, discount: 0, gstRate: 18, amount: 14994 },
    ],
    subtotal: 46490, discount: 500, cgst: 4184.1, sgst: 4184.1, igst: 0, otherCharges: 0, roundOff: -0.2,
    grandTotal: 54858, paid: 7000, due: 47858, status: 'partial', createdAt: '2026-09-14T16:20:00.000Z', updatedAt: '2026-09-14T16:20:00.000Z',
  },
  {
    id: 'sal_2', invoiceNo: 'SC-1040', date: '2026-09-13', customerId: 'cus_1', customerName: 'Ramesh Hardware Mart',
    items: [
      { id: 'sli_3', productId: 'prd_6', productName: 'Bajaj Grace Neo 400mm Table Fan', sku: 'BJ-GN-400', quantity: 10, rate: 1899, discount: 0, gstRate: 18, amount: 18990 },
      { id: 'sli_4', productId: 'prd_11', productName: 'Modular Fan Regulator 5-Step', sku: 'EA-FR-5S', quantity: 20, rate: 149, discount: 0, gstRate: 18, amount: 2980 },
    ],
    subtotal: 21970, discount: 0, cgst: 1977.3, sgst: 1977.3, igst: 0, otherCharges: 0, roundOff: 0.4,
    grandTotal: 25925, paid: 25925, due: 0, status: 'paid', createdAt: '2026-09-13T11:00:00.000Z', updatedAt: '2026-09-13T11:00:00.000Z',
  },
  {
    id: 'sal_3', invoiceNo: 'SC-1039', date: '2026-09-10', customerId: 'cus_2', customerName: 'Shree Cooling Point',
    items: [
      { id: 'sli_5', productId: 'prd_12', productName: 'Sheetal Tower Cooler 45L', sku: 'SC-TC-45', quantity: 2, rate: 6999, discount: 0, gstRate: 18, amount: 13998 },
    ],
    subtotal: 13998, discount: 0, cgst: 1259.82, sgst: 1259.82, igst: 0, otherCharges: 200, roundOff: 0.36,
    grandTotal: 16718, paid: 1518, due: 15200, status: 'partial', createdAt: '2026-09-10T15:00:00.000Z', updatedAt: '2026-09-10T15:00:00.000Z',
  },
  {
    id: 'sal_4', invoiceNo: 'SC-1038', date: '2026-09-15', customerId: 'cus_4', customerName: 'Krishna Electricals',
    items: [
      { id: 'sli_6', productId: 'prd_2', productName: 'Sheetal Personal Cooler 22L', sku: 'SC-PC-22', quantity: 3, rate: 3699, discount: 0, gstRate: 18, amount: 11097 },
    ],
    subtotal: 11097, discount: 0, cgst: 998.73, sgst: 998.73, igst: 0, otherCharges: 0, roundOff: 0.54,
    grandTotal: 13095, paid: 13095, due: 0, status: 'paid', createdAt: '2026-09-15T09:15:00.000Z', updatedAt: '2026-09-15T09:15:00.000Z',
  },
]

export const seedInvoices: Invoice[] = seedSales.map((s) => {
  const customer = seedCustomers.find((c) => c.id === s.customerId)
  return {
    id: `inv_${s.id}`,
    invoiceNo: s.invoiceNo,
    saleId: s.id,
    date: s.date,
    customerId: s.customerId,
    customerName: s.customerName,
    customerAddress: customer ? `${customer.address}, ${customer.city}, ${customer.state}` : '',
    customerGst: customer?.gstNumber,
    items: s.items,
    subtotal: s.subtotal,
    discount: s.discount,
    cgst: s.cgst,
    sgst: s.sgst,
    igst: s.igst,
    otherCharges: s.otherCharges,
    roundOff: s.roundOff,
    grandTotal: s.grandTotal,
    paid: s.paid,
    balance: s.due,
    status: s.status,
    createdAt: s.createdAt,
  }
})

export const seedPayments: Payment[] = [
  { id: 'pay_1', paymentNo: 'PAY-R-0312', type: 'received', partyType: 'customer', partyId: 'cus_1', partyName: 'Ramesh Hardware Mart', date: '2026-09-13', amount: 15000, method: 'upi', reference: 'UPI/AXIS/882134', notes: 'Against SC-1040', createdAt: '2026-09-13T12:10:00.000Z' },
  { id: 'pay_2', paymentNo: 'PAY-P-0290', type: 'paid', partyType: 'supplier', partyId: 'sup_3', partyName: 'Sheetal Manufacturing', date: '2026-09-06', amount: 174050, method: 'bank_transfer', reference: 'NEFT/HDFC/44121', createdAt: '2026-09-06T10:00:00.000Z' },
  { id: 'pay_3', paymentNo: 'PAY-R-0310', type: 'received', partyType: 'customer', partyId: 'cus_3', partyName: 'Agarwal Electronics', date: '2026-09-14', amount: 7000, method: 'cash', createdAt: '2026-09-14T16:25:00.000Z' },
  { id: 'pay_4', paymentNo: 'PAY-P-0288', type: 'paid', partyType: 'supplier', partyId: 'sup_2', partyName: 'Symphony Limited', date: '2026-09-12', amount: 50000, method: 'cheque', reference: 'CHQ-552189', createdAt: '2026-09-12T14:00:00.000Z' },
]

export const seedExpenses: Expense[] = [
  { id: 'exp_1', date: '2026-09-01', category: 'rent', description: 'Warehouse rent — March 2026', amount: 45000, paymentMethod: 'bank_transfer', reference: 'RENT/MAR26', createdAt: '2026-09-01T10:00:00.000Z' },
  { id: 'exp_2', date: '2026-09-05', category: 'salary', description: 'Staff salary advance — warehouse', amount: 28000, paymentMethod: 'bank_transfer', createdAt: '2026-09-05T10:00:00.000Z' },
  { id: 'exp_3', date: '2026-09-08', category: 'transport', description: 'Freight — Bhopal delivery', amount: 4200, paymentMethod: 'cash', createdAt: '2026-09-08T10:00:00.000Z' },
  { id: 'exp_4', date: '2026-09-10', category: 'electricity', description: 'Electricity bill — Indore godown', amount: 8600, paymentMethod: 'upi', reference: 'MPPKVVCL/8821', createdAt: '2026-09-10T10:00:00.000Z' },
  { id: 'exp_5', date: '2026-09-12', category: 'marketing', description: 'Dealer meet banners & flyers', amount: 6500, paymentMethod: 'cash', createdAt: '2026-09-12T10:00:00.000Z' },
  { id: 'exp_6', date: '2026-09-15', category: 'office', description: 'Stationery and packing material', amount: 1850, paymentMethod: 'upi', createdAt: '2026-09-15T08:00:00.000Z' },
]

export const seedMovements: StockMovement[] = [
  { id: 'mov_1', date: '2026-09-12', productId: 'prd_3', productName: 'Symphony Diet 3D 55i+', reference: 'PO-2088', type: 'purchase', quantityIn: 8, quantityOut: 0, balance: 14, createdAt: '2026-09-12T11:00:00.000Z' },
  { id: 'mov_2', date: '2026-09-14', productId: 'prd_1', productName: 'Sheetal Desert Cooler 70L', reference: 'SC-1041', type: 'sale', quantityIn: 0, quantityOut: 4, balance: 38, createdAt: '2026-09-14T16:20:00.000Z' },
  { id: 'mov_3', date: '2026-09-14', productId: 'prd_4', productName: 'Orient Electric Aeroquiet 1200mm', reference: 'SC-1041', type: 'sale', quantityIn: 0, quantityOut: 6, balance: 86, createdAt: '2026-09-14T16:20:00.000Z' },
  { id: 'mov_4', date: '2026-09-13', productId: 'prd_6', productName: 'Bajaj Grace Neo 400mm Table Fan', reference: 'SC-1040', type: 'sale', quantityIn: 0, quantityOut: 10, balance: 8, createdAt: '2026-09-13T11:00:00.000Z' },
  { id: 'mov_5', date: '2026-09-09', productId: 'prd_8', productName: 'Honeycomb Cooling Pad 30x30', reference: 'ADJ-014', type: 'adjustment', quantityIn: 0, quantityOut: 12, balance: 164, notes: 'Damaged pads written off', createdAt: '2026-09-09T10:30:00.000Z' },
  { id: 'mov_6', date: '2026-09-15', productId: 'prd_2', productName: 'Sheetal Personal Cooler 22L', reference: 'SC-1038', type: 'sale', quantityIn: 0, quantityOut: 3, balance: 52, createdAt: '2026-09-15T09:15:00.000Z' },
]

export const seedLedger: LedgerEntry[] = [
  { id: 'led_1', date: '2026-09-14', partyType: 'customer', partyId: 'cus_3', partyName: 'Agarwal Electronics', reference: 'SC-1041', description: 'Sale invoice', debit: 54858, credit: 0, balance: 47800, createdAt: '2026-09-14T16:20:00.000Z' },
  { id: 'led_2', date: '2026-09-14', partyType: 'customer', partyId: 'cus_3', partyName: 'Agarwal Electronics', reference: 'PAY-R-0310', description: 'Payment received', debit: 0, credit: 7000, balance: 47800, createdAt: '2026-09-14T16:25:00.000Z' },
  { id: 'led_3', date: '2026-09-13', partyType: 'customer', partyId: 'cus_1', partyName: 'Ramesh Hardware Mart', reference: 'SC-1040', description: 'Sale invoice', debit: 25925, credit: 0, balance: 28450, createdAt: '2026-09-13T11:00:00.000Z' },
  { id: 'led_4', date: '2026-09-13', partyType: 'customer', partyId: 'cus_1', partyName: 'Ramesh Hardware Mart', reference: 'PAY-R-0312', description: 'Payment received', debit: 0, credit: 15000, balance: 28450, createdAt: '2026-09-13T12:10:00.000Z' },
  { id: 'led_5', date: '2026-09-12', partyType: 'supplier', partyId: 'sup_2', partyName: 'Symphony Limited', reference: 'PO-2088', description: 'Purchase invoice', debit: 0, credit: 93012, balance: 125400, createdAt: '2026-09-12T11:00:00.000Z' },
  { id: 'led_6', date: '2026-09-12', partyType: 'supplier', partyId: 'sup_2', partyName: 'Symphony Limited', reference: 'PAY-P-0288', description: 'Payment made', debit: 50000, credit: 0, balance: 125400, createdAt: '2026-09-12T14:00:00.000Z' },
  { id: 'led_7', date: '2026-09-05', partyType: 'supplier', partyId: 'sup_1', partyName: 'Orient Electric Ltd', reference: 'PO-2086', description: 'Purchase invoice', debit: 0, credit: 85760, balance: 85600, createdAt: '2026-09-05T10:00:00.000Z' },
]

export const seedSalesReturns: SalesReturn[] = []
export const seedPurchaseReturns: PurchaseReturn[] = []
export const seedAdjustments: StockAdjustment[] = [
  { id: 'adj_1', date: '2026-09-09', productId: 'prd_8', productName: 'Honeycomb Cooling Pad 30x30', adjustmentType: 'decrease', quantity: 12, reason: 'Damaged / unsellable', notes: 'Water damage in godown', createdAt: '2026-09-09T10:30:00.000Z' },
]
export const seedTransfers: StockTransfer[] = [
  { id: 'trn_1', transferNo: 'TR-101', date: '2026-09-11', fromLocation: 'Main Warehouse — Indore', toLocation: 'Showroom — Palasia', productId: 'prd_1', productName: 'Sheetal Desert Cooler 70L', quantity: 5, reason: 'Showroom replenishment', status: 'completed', createdAt: '2026-09-11T10:00:00.000Z', updatedAt: '2026-09-11T14:00:00.000Z' },
  { id: 'trn_2', transferNo: 'TR-102', date: '2026-09-14', fromLocation: 'Main Warehouse — Indore', toLocation: 'Godown — Dewas Road', productId: 'prd_4', productName: 'Orient Electric Aeroquiet 1200mm', quantity: 20, reason: 'Space optimization', status: 'requested', createdAt: '2026-09-14T09:00:00.000Z', updatedAt: '2026-09-14T09:00:00.000Z' },
]
