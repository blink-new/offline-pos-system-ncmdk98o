import Dexie, { Table } from 'dexie';

// Database interfaces
export interface Product {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  barcode?: string;
  taxCategory: string;
  supplier?: string;
  minStockLevel: number;
  currentStock: number;
  image?: string; // base64 encoded
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface Customer {
  id?: number;
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType: 'regular' | 'vip' | 'wholesale';
  loyaltyPoints: number;
  registrationDate: number; // timestamp
  lastPurchase?: number; // timestamp
}

export interface Transaction {
  id?: number;
  transactionId: string;
  customerId?: number;
  items: TransactionItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'cash';
  status: 'completed' | 'voided' | 'refunded';
  timestamp: number; // timestamp
  cashierId?: string;
  notes?: string;
}

export interface TransactionItem {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
}

export interface StockAdjustment {
  id?: number;
  productId: number;
  adjustmentType: 'increase' | 'decrease' | 'correction';
  quantity: number;
  reason: string;
  timestamp: number; // timestamp
  userId?: string;
}

export interface PurchaseOrder {
  id?: number;
  orderId: string;
  supplier: string;
  status: 'pending' | 'received' | 'partial';
  items: PurchaseOrderItem[];
  orderDate: number; // timestamp
  expectedDate?: number; // timestamp
  receivedDate?: number; // timestamp
  total: number;
}

export interface PurchaseOrderItem {
  productId: number;
  sku: string;
  name: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
  updatedAt: number; // timestamp
}

// Database class
export class POSDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  transactions!: Table<Transaction>;
  stockAdjustments!: Table<StockAdjustment>;
  purchaseOrders!: Table<PurchaseOrder>;
  settings!: Table<Settings>;

  constructor() {
    super('POSDatabase');
    
    this.version(1).stores({
      products: '++id, sku, name, category, barcode, currentStock, minStockLevel',
      customers: '++id, customerId, name, email, phone, customerType',
      transactions: '++id, transactionId, customerId, timestamp, status',
      stockAdjustments: '++id, productId, timestamp',
      purchaseOrders: '++id, orderId, supplier, status, orderDate',
      settings: '++id, key'
    });

    // Hooks for automatic timestamps
    this.products.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = Date.now();
      obj.updatedAt = Date.now();
    });

    this.products.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.updatedAt = Date.now();
    });
  }
}

export const db = new POSDatabase();

// Utility functions
export const generateSKU = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `SKU-${timestamp}-${random}`.toUpperCase();
};

export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TXN-${timestamp}-${random}`.toUpperCase();
};

export const generateCustomerId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 3);
  return `CUST-${timestamp}-${random}`.toUpperCase();
};

export const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 3);
  return `PO-${timestamp}-${random}`.toUpperCase();
};

// Sample data initialization
export const initializeSampleData = async () => {
  const productCount = await db.products.count();
  
  if (productCount === 0) {
    const sampleProducts: Omit<Product, 'id'>[] = [
      {
        sku: 'PROD-001',
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        category: 'Electronics',
        unitPrice: 99.99,
        costPrice: 60.00,
        barcode: '1234567890123',
        taxCategory: 'standard',
        supplier: 'TechCorp',
        minStockLevel: 10,
        currentStock: 25,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        sku: 'PROD-002',
        name: 'Coffee Mug - Ceramic',
        description: 'Premium ceramic coffee mug, 12oz capacity',
        category: 'Home & Kitchen',
        unitPrice: 12.99,
        costPrice: 7.50,
        barcode: '2345678901234',
        taxCategory: 'standard',
        supplier: 'KitchenWare Inc',
        minStockLevel: 20,
        currentStock: 45,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        sku: 'PROD-003',
        name: 'Notebook - A5 Lined',
        description: 'Professional lined notebook, 200 pages',
        category: 'Stationery',
        unitPrice: 8.99,
        costPrice: 4.50,
        barcode: '3456789012345',
        taxCategory: 'standard',
        supplier: 'Paper Plus',
        minStockLevel: 30,
        currentStock: 15, // Low stock for demo
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        sku: 'PROD-004',
        name: 'USB-C Cable - 6ft',
        description: 'Fast charging USB-C cable, 6 feet length',
        category: 'Electronics',
        unitPrice: 19.99,
        costPrice: 12.00,
        barcode: '4567890123456',
        taxCategory: 'standard',
        supplier: 'TechCorp',
        minStockLevel: 15,
        currentStock: 35,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        sku: 'PROD-005',
        name: 'Desk Lamp - LED',
        description: 'Adjustable LED desk lamp with touch controls',
        category: 'Home & Office',
        unitPrice: 45.99,
        costPrice: 28.00,
        barcode: '5678901234567',
        taxCategory: 'standard',
        supplier: 'LightCorp',
        minStockLevel: 8,
        currentStock: 12,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    await db.products.bulkAdd(sampleProducts);

    // Add sample customers
    const sampleCustomers: Omit<Customer, 'id'>[] = [
      {
        customerId: 'CUST-001',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1-555-0123',
        address: '123 Main St, City, State 12345',
        customerType: 'regular',
        loyaltyPoints: 150,
        registrationDate: new Date('2024-01-15').getTime(),
        lastPurchase: new Date('2024-01-20').getTime()
      },
      {
        customerId: 'CUST-002',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+1-555-0456',
        address: '456 Oak Ave, City, State 12345',
        customerType: 'vip',
        loyaltyPoints: 850,
        registrationDate: new Date('2023-11-10').getTime(),
        lastPurchase: new Date('2024-01-18').getTime()
      }
    ];

    await db.customers.bulkAdd(sampleCustomers);

    // Add default settings
    const defaultSettings: Omit<Settings, 'id'>[] = [
      { key: 'tax_rate', value: '8.5', updatedAt: Date.now() },
      { key: 'currency', value: 'USD', updatedAt: Date.now() },
      { key: 'company_name', value: 'My Store', updatedAt: Date.now() },
      { key: 'company_address', value: '123 Business St, City, State 12345', updatedAt: Date.now() },
      { key: 'company_phone', value: '+1-555-STORE', updatedAt: Date.now() }
    ];

    await db.settings.bulkAdd(defaultSettings);
  }
};