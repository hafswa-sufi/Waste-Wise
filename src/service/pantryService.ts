import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

// ── Types ──────────────────────────────────────────────────────────────────

export interface PantryItem {
  id: string
  name: string
  category: 'Vegetables' | 'Grains' | 'Dairy' | 'Fruits' | 'Proteins' | 'Pantry'
  quantity: string
  storageType: 'Fridge' | 'Counter' | 'Basket'
  purchaseDate: string
  expiryDate: string
  status: 'Fresh' | 'Expiring Soon' | 'Expired' | 'Consumed' | 'Donated' | 'Disposed'
  userId: string
  createdAt?: Timestamp
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function calculateStatus(expiryDate: string): 'Fresh' | 'Expiring Soon' | 'Expired' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Expired'
  if (diffDays <= 3) return 'Expiring Soon'
  return 'Fresh'
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── CRUD Operations ────────────────────────────────────────────────────────

export async function getPantryItems(userId: string): Promise<PantryItem[]> {
  const q = query(
    collection(db, 'pantryItems'),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PantryItem[]
}

export async function addPantryItem(
  userId: string,
  item: Omit<PantryItem, 'id' | 'userId' | 'createdAt' | 'status'>
): Promise<string> {
  const status = calculateStatus(item.expiryDate)
  const docRef = await addDoc(collection(db, 'pantryItems'), {
    ...item,
    userId,
    status,
    purchaseDate: formatDate(item.purchaseDate),
    expiryDate: formatDate(item.expiryDate),
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updatePantryItem(
  itemId: string,
  updates: Partial<Omit<PantryItem, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const ref = doc(db, 'pantryItems', itemId)
  if (updates.expiryDate) {
    updates.status = calculateStatus(updates.expiryDate)
    updates.expiryDate = formatDate(updates.expiryDate)
  }
  await updateDoc(ref, updates)
}

export async function updateItemStatus(
  itemId: string,
  status: 'Consumed' | 'Donated' | 'Disposed'
): Promise<void> {
  const ref = doc(db, 'pantryItems', itemId)
  await updateDoc(ref, { status })
}

export async function deletePantryItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'pantryItems', itemId))
}

// ── Filtered Queries ───────────────────────────────────────────────────────

export async function getExpiryAlerts(userId: string): Promise<PantryItem[]> {
  const items = await getPantryItems(userId)
  return items.filter(
    (item) => item.status === 'Expiring Soon' || item.status === 'Expired'
  )
}

export async function getDonatedItems(userId: string): Promise<PantryItem[]> {
  const items = await getPantryItems(userId)
  return items.filter((item) => item.status === 'Donated')
}

export async function getDisposedItems(userId: string): Promise<PantryItem[]> {
  const items = await getPantryItems(userId)
  return items.filter((item) => item.status === 'Disposed')
}

// ── Freshness Estimation ───────────────────────────────────────────────────

export interface FreshnessResult {
  classification: 'Fresh' | 'Mid-Fresh' | 'Spoiled'
  daysRemaining: number
  recommendation: string
}

// Keys must match the `value` field in FreshnessTab's produceOptions array
const SHELF_LIFE: Record<string, Record<string, number>> = {
  sukuma:   { Fridge: 4,  Counter: 1,  Basket: 1  },
  tomatoes: { Fridge: 10, Counter: 4,  Basket: 3  },
  onions:   { Fridge: 30, Counter: 21, Basket: 14 },
  managu:   { Fridge: 3,  Counter: 1,  Basket: 1  },
  avocado:  { Fridge: 7,  Counter: 4,  Basket: 3  },
  bananas:  { Fridge: 7,  Counter: 4,  Basket: 3  },
  cabbage:  { Fridge: 14, Counter: 5,  Basket: 4  },
  carrots:  { Fridge: 14, Counter: 5,  Basket: 4  },
  spinach:  { Fridge: 5,  Counter: 1,  Basket: 1  },
}

export function estimateFreshness(
  produceValue: string,
  storageMethod: string,
  purchaseDate: string
): FreshnessResult {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const purchase = new Date(purchaseDate)
  purchase.setHours(0, 0, 0, 0)

  const daysSincePurchase = Math.floor(
    (today.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24)
  )

  const shelfLife =
    SHELF_LIFE[produceValue]?.[storageMethod] ??
    (storageMethod === 'Fridge' ? 7 : storageMethod === 'Counter' ? 3 : 2)

  const daysRemaining = shelfLife - daysSincePurchase

  let classification: FreshnessResult['classification']
  let recommendation: string

  if (daysRemaining <= 0) {
    classification = 'Spoiled'
    recommendation = 'This item has likely spoiled. Dispose responsibly or compost.'
  } else if (daysRemaining <= Math.ceil(shelfLife * 0.3)) {
    classification = 'Mid-Fresh'
    recommendation = `Use within ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Consider cooking or donating soon.`
  } else {
    classification = 'Fresh'
    recommendation = `Approximately ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining. Store properly to extend shelf life.`
  }

  return { classification, daysRemaining, recommendation }
}