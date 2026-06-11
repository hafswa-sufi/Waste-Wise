export interface PantryItem {
  id: string
  name: string
  category: 'Vegetables' | 'Grains' | 'Dairy' | 'Fruits' | 'Proteins' | 'Pantry'
  quantity: string
  storageType: 'Fridge' | 'Counter' | 'Basket'
  purchaseDate: string
  expiryDate: string
  status: 'Fresh' | 'Expiring Soon' | 'Expired'
}

export const mockPantryItems: PantryItem[] = [
  {
    id: 'p1',
    name: 'Sukuma Wiki',
    category: 'Vegetables',
    quantity: '1 bunch',
    storageType: 'Fridge',
    purchaseDate: '06 Jun 2026',
    expiryDate: '10 Jun 2026',
    status: 'Expiring Soon',
  },
  {
    id: 'p2',
    name: 'Tomatoes',
    category: 'Vegetables',
    quantity: '2kg',
    storageType: 'Counter',
    purchaseDate: '05 Jun 2026',
    expiryDate: '12 Jun 2026',
    status: 'Fresh',
  },
  {
    id: 'p3',
    name: 'Maize Flour',
    category: 'Grains',
    quantity: '2 packets',
    storageType: 'Counter',
    purchaseDate: '01 Jun 2026',
    expiryDate: '01 Dec 2026',
    status: 'Fresh',
  },
  {
    id: 'p4',
    name: 'Milk',
    category: 'Dairy',
    quantity: '1L',
    storageType: 'Fridge',
    purchaseDate: '01 Jun 2026',
    expiryDate: '05 Jun 2026',
    status: 'Expired',
  },
  {
    id: 'p5',
    name: 'Mangoes',
    category: 'Fruits',
    quantity: '1.5kg',
    storageType: 'Basket',
    purchaseDate: '04 Jun 2026',
    expiryDate: '09 Jun 2026',
    status: 'Expiring Soon',
  },
  {
    id: 'p6',
    name: 'Eggs',
    category: 'Proteins',
    quantity: '1 tray',
    storageType: 'Counter',
    purchaseDate: '28 May 2026',
    expiryDate: '18 Jun 2026',
    status: 'Fresh',
  },
  {
    id: 'p7',
    name: 'Rice',
    category: 'Grains',
    quantity: '5kg',
    storageType: 'Counter',
    purchaseDate: '15 May 2026',
    expiryDate: '15 May 2027',
    status: 'Fresh',
  },
  {
    id: 'p8',
    name: 'Onions',
    category: 'Vegetables',
    quantity: '1kg',
    storageType: 'Basket',
    purchaseDate: '20 May 2026',
    expiryDate: '20 Jun 2026',
    status: 'Fresh',
  },
  {
    id: 'p9',
    name: 'Bread',
    category: 'Grains',
    quantity: '1 loaf',
    storageType: 'Counter',
    purchaseDate: '02 Jun 2026',
    expiryDate: '06 Jun 2026',
    status: 'Expired',
  },
]

export interface AlertItem {
  id: string
  name: string
  category: string
  countdown: string
  storageLocation: string
  status: 'expired' | 'expiring-soon' | 'this-week'
}

export const mockAlertItems: AlertItem[] = [
  {
    id: 'a1',
    name: 'Milk',
    category: 'Dairy',
    countdown: 'Expired 3 days ago',
    storageLocation: 'Fridge — Top shelf',
    status: 'expired',
  },
  {
    id: 'a2',
    name: 'Bread',
    category: 'Grains',
    countdown: 'Expired 2 days ago',
    storageLocation: 'Counter — Bread box',
    status: 'expired',
  },
  {
    id: 'a3',
    name: 'Sukuma Wiki',
    category: 'Vegetables',
    countdown: 'Expires in 2 days',
    storageLocation: 'Fridge — Crisper drawer',
    status: 'expiring-soon',
  },
  {
    id: 'a4',
    name: 'Mangoes',
    category: 'Fruits',
    countdown: 'Expires in 1 day',
    storageLocation: 'Basket — Kitchen island',
    status: 'expiring-soon',
  },
  {
    id: 'a5',
    name: 'Tomatoes',
    category: 'Vegetables',
    countdown: 'Expires in 4 days',
    storageLocation: 'Counter — Near window',
    status: 'this-week',
  },
  {
    id: 'a6',
    name: 'Yogurt',
    category: 'Dairy',
    countdown: 'Expires in 5 days',
    storageLocation: 'Fridge — Middle shelf',
    status: 'this-week',
  },
]

export interface ActionItem {
  id: string
  name: string
  quantity: string
  partner: string
  pickupDate: string
  status: 'Pending' | 'Confirmed' | 'Collected'
}

export const mockDonationItems: ActionItem[] = [
  {
    id: 'd1',
    name: 'Maize Flour',
    quantity: '5 packets',
    partner: 'Food Banking Kenya',
    pickupDate: '10 Jun 2026',
    status: 'Pending',
  },
  {
    id: 'd2',
    name: 'Rice',
    quantity: '10kg',
    partner: 'Hand in Hand Eastern Africa',
    pickupDate: '12 Jun 2026',
    status: 'Confirmed',
  },
  {
    id: 'd3',
    name: 'Beans',
    quantity: '5kg',
    partner: 'Food Banking Kenya',
    pickupDate: '01 Jun 2026',
    status: 'Collected',
  },
  {
    id: 'd4',
    name: 'Canned Tomatoes',
    quantity: '4 tins',
    partner: 'Food Banking Kenya',
    pickupDate: '15 Jun 2026',
    status: 'Pending',
  },
  {
    id: 'd5',
    name: 'Cooking Oil',
    quantity: '2L',
    partner: 'Hand in Hand Eastern Africa',
    pickupDate: '05 Jun 2026',
    status: 'Collected',
  },
]

export const mockDisposalItems: ActionItem[] = [
  {
    id: 'dp1',
    name: 'Spoiled Milk',
    quantity: '2L',
    partner: 'Taka Taka Solutions',
    pickupDate: '09 Jun 2026',
    status: 'Pending',
  },
  {
    id: 'dp2',
    name: 'Rotten Cabbage',
    quantity: '1 head',
    partner: 'Mr. Green Africa',
    pickupDate: '11 Jun 2026',
    status: 'Confirmed',
  },
  {
    id: 'dp3',
    name: 'Moldy Bread',
    quantity: '2 loaves',
    partner: 'Eco Post',
    pickupDate: '02 Jun 2026',
    status: 'Collected',
  },
  {
    id: 'dp4',
    name: 'Vegetable Peels',
    quantity: '3kg',
    partner: 'Taka Taka Solutions',
    pickupDate: '10 Jun 2026',
    status: 'Pending',
  },
  {
    id: 'dp5',
    name: 'Spoiled Meat',
    quantity: '1kg',
    partner: 'Mr. Green Africa',
    pickupDate: '04 Jun 2026',
    status: 'Collected',
  },
]
