import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../../src/firebase/firebase'
import { useAuth } from '../../src/context/useAuth'

export type PantryCategory =
  | 'Vegetables'
  | 'Grains'
  | 'Dairy'
  | 'Fruits'
  | 'Proteins'
  | 'Pantry'

export type StorageType = 'Fridge' | 'Counter' | 'Basket'
export type PantryStatus = 'Fresh' | 'Expiring Soon' | 'Expired'
export type ActionStatus = 'Pending' | 'Confirmed' | 'Collected'
export type HouseholdActionType = 'donation' | 'disposal' | 'consumed'

export interface PantryItem {
  id: string
  name: string
  category: PantryCategory
  quantity: string
  storageType: StorageType
  purchaseDate: string
  expiryDate: string
  status: PantryStatus
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface AlertItem {
  id: string
  pantryItemId: string
  name: string
  category: PantryCategory
  countdown: string
  storageLocation: string
  status: 'expired' | 'expiring-soon' | 'this-week'
}

export interface ActionItem {
  id: string
  type: HouseholdActionType
  pantryItemId?: string
  name: string
  quantity: string
  partner: string
  pickupDate: string
  status: ActionStatus
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  meta: string
  href: string
  tone: 'info' | 'success' | 'warning'
}

export interface NewPantryItemInput {
  name: string
  category: PantryCategory
  quantity: string
  storageType: StorageType
  purchaseDate: string
  expiryDate: string
}

export interface NewActionInput {
  type: HouseholdActionType
  pantryItemId?: string
  name: string
  quantity: string
  partner?: string
  pickupDate?: string
}

const donationPartners = ['Food Banking Kenya', 'Hand in Hand Eastern Africa']
const disposalPartners = ['Taka Taka Solutions', 'Mr. Green Africa']
const localPantryKey = 'wastewise.household.pantryItems'
const localActionsKey = 'wastewise.household.actions'

const demoSeedKey = 'wastewise.household.demoSeeded'
const demoSeedVersion = 'v2'

function householdCollection(userId: string, name: string) {
  return collection(db, 'users', userId, name)
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function toDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysUntil(dateOnly: string) {
  const expiry = toDateOnly(dateOnly)
  if (!expiry) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
}

function formatDate(value: string) {
  const date = toDateOnly(value)
  if (!date) return value
  return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function statusForExpiry(expiryDate: string): PantryStatus {
  const days = daysUntil(expiryDate)
  if (days === null) return 'Fresh'
  if (days < 0) return 'Expired'
  if (days <= 3) return 'Expiring Soon'
  return 'Fresh'
}

function alertStatusForExpiry(expiryDate: string): AlertItem['status'] | null {
  const days = daysUntil(expiryDate)
  if (days === null || days > 7) return null
  if (days < 0) return 'expired'
  if (days <= 3) return 'expiring-soon'
  return 'this-week'
}

function countdownForExpiry(expiryDate: string) {
  const days = daysUntil(expiryDate)
  if (days === null) return formatDate(expiryDate)
  if (days < -1) return `Expired ${Math.abs(days)} days ago`
  if (days === -1) return 'Expired yesterday'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

function normalizePantryItem(id: string, data: DocumentData): PantryItem {
  const expiryDate = asString(data.expiryDate)
  return {
    id,
    name: asString(data.name, 'Unnamed item'),
    category: asString(data.category, 'Pantry') as PantryCategory,
    quantity: asString(data.quantity, '1 item'),
    storageType: asString(data.storageType, 'Counter') as StorageType,
    purchaseDate: asString(data.purchaseDate),
    expiryDate,
    status: statusForExpiry(expiryDate),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function normalizeActionItem(id: string, data: DocumentData): ActionItem {
  return {
    id,
    type: asString(data.type, 'donation') as HouseholdActionType,
    pantryItemId: asString(data.pantryItemId) || undefined,
    name: asString(data.name, 'Unnamed item'),
    quantity: asString(data.quantity, '1 item'),
    partner: asString(data.partner, 'Partner pending'),
    pickupDate: asString(data.pickupDate),
    status: asString(data.status, 'Pending') as ActionStatus,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function pickPartner(type: HouseholdActionType) {
  const partners = type === 'donation' ? donationPartners : disposalPartners
  return partners[Math.floor(Math.random() * partners.length)]
}

function defaultPickupDate() {
  const date = new Date()
  date.setDate(date.getDate() + 2)
  return date.toISOString().slice(0, 10)
}

function relativeDate(daysFromToday: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + daysFromToday)
  return date.toISOString().slice(0, 10)
}

function samplePantryItems(): NewPantryItemInput[] {
  return [
    {
      name: 'Sukuma Wiki',
      category: 'Vegetables',
      quantity: '1 bunch',
      storageType: 'Fridge',
      purchaseDate: relativeDate(-3),
      expiryDate: relativeDate(3),
    },
    {
      name: 'Maize Flour',
      category: 'Grains',
      quantity: '2 packets',
      storageType: 'Counter',
      purchaseDate: relativeDate(-14),
      expiryDate: relativeDate(120),
    },
    {
      name: 'Rice',
      category: 'Grains',
      quantity: '5kg',
      storageType: 'Counter',
      purchaseDate: relativeDate(-20),
      expiryDate: relativeDate(180),
    },
    {
      name: 'Milk',
      category: 'Dairy',
      quantity: '1L',
      storageType: 'Fridge',
      purchaseDate: relativeDate(-2),
      expiryDate: relativeDate(1),
    },
    {
      name: 'Mangoes',
      category: 'Fruits',
      quantity: '1.5kg',
      storageType: 'Basket',
      purchaseDate: relativeDate(-1),
      expiryDate: relativeDate(0),
    },
    {
      name: 'Tomatoes',
      category: 'Vegetables',
      quantity: '2kg',
      storageType: 'Counter',
      purchaseDate: relativeDate(-2),
      expiryDate: relativeDate(2),
    },
    {
      name: 'Beans',
      category: 'Proteins',
      quantity: '1.5kg',
      storageType: 'Counter',
      purchaseDate: relativeDate(-10),
      expiryDate: relativeDate(90),
    },
    {
      name: 'Yoghurt',
      category: 'Dairy',
      quantity: '4 cups',
      storageType: 'Fridge',
      purchaseDate: relativeDate(-4),
      expiryDate: relativeDate(-1),
    },
    {
      name: 'Bananas',
      category: 'Fruits',
      quantity: '6 pieces',
      storageType: 'Basket',
      purchaseDate: relativeDate(-2),
      expiryDate: relativeDate(1),
    },
  ]
}

function sampleActions(): NewActionInput[] {
  return [
    {
      type: 'donation',
      name: 'Rice',
      quantity: '5kg',
      partner: 'Food Banking Kenya',
      pickupDate: relativeDate(2),
    },
    {
      type: 'donation',
      name: 'Beans',
      quantity: '1.5kg',
      partner: 'Hand in Hand Eastern Africa',
      pickupDate: relativeDate(4),
    },
    {
      type: 'disposal',
      name: 'Vegetable peels',
      quantity: '2kg',
      partner: 'Taka Taka Solutions',
      pickupDate: relativeDate(1),
    },
    {
      type: 'disposal',
      name: 'Expired yoghurt cups',
      quantity: '4 cups',
      partner: 'Mr. Green Africa',
      pickupDate: relativeDate(3),
    },
  ]
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readLocalItems<T>(key: string): T[] {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T[]) : []
  } catch {
    return []
  }
}

function writeLocalItems<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function isPermissionError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'permission-denied'
  )
}

export function displayDate(value: string) {
  return formatDate(value)
}

export function useHouseholdBackend() {
  const { currentUser } = useAuth()
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [actions, setActions] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      setPantryItems(readLocalItems<PantryItem>(localPantryKey))
      setActions(readLocalItems<ActionItem>(localActionsKey))
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    let pantryLoaded = false
    let actionsLoaded = false

    const markLoaded = () => {
      if (pantryLoaded && actionsLoaded) setLoading(false)
    }

    const pantryQuery = query(
      householdCollection(currentUser.uid, 'pantryItems'),
      orderBy('createdAt', 'desc'),
    )
    const actionsQuery = query(
      householdCollection(currentUser.uid, 'householdActions'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribePantry = onSnapshot(
      pantryQuery,
      (snapshot) => {
        setPantryItems(
          snapshot.docs.map((item) => normalizePantryItem(item.id, item.data())),
        )
        pantryLoaded = true
        markLoaded()
      },
      (err) => {
        if (isPermissionError(err)) {
          setPantryItems(readLocalItems<PantryItem>(localPantryKey))
          setError(null)
        } else {
          setError(err.message)
        }
        pantryLoaded = true
        markLoaded()
      },
    )

    const unsubscribeActions = onSnapshot(
      actionsQuery,
      (snapshot) => {
        setActions(
          snapshot.docs.map((item) => normalizeActionItem(item.id, item.data())),
        )
        actionsLoaded = true
        markLoaded()
      },
      (err) => {
        if (isPermissionError(err)) {
          setActions(readLocalItems<ActionItem>(localActionsKey))
          setError(null)
        } else {
          setError(err.message)
        }
        actionsLoaded = true
        markLoaded()
      },
    )

    return () => {
      unsubscribePantry()
      unsubscribeActions()
    }
  }, [currentUser])

  const alerts = useMemo<AlertItem[]>(
    () =>
      pantryItems
        .map((item) => {
          const status = alertStatusForExpiry(item.expiryDate)
          if (!status) return null
          return {
            id: `alert-${item.id}`,
            pantryItemId: item.id,
            name: item.name,
            category: item.category,
            countdown: countdownForExpiry(item.expiryDate),
            storageLocation: `${item.storageType} - Household pantry`,
            status,
          }
        })
        .filter((item): item is AlertItem => item !== null),
    [pantryItems],
  )

  const notifications = useMemo<NotificationItem[]>(
    () =>
      actions
        .filter((item) => item.type === 'donation' || item.type === 'disposal')
        .slice(0, 6)
        .map((item) => {
          const isDonation = item.type === 'donation'
          const isCollected = item.status === 'Collected'
          const title = isDonation ? 'Donation pickup' : 'Disposal pickup'
          const statusText =
            item.status === 'Confirmed'
              ? 'is confirmed and on the way'
              : item.status === 'Collected'
                ? 'has been collected'
                : 'is waiting for partner confirmation'

          return {
            id: `notification-${item.id}`,
            title,
            message: `${item.partner} ${statusText} for ${item.name}.`,
            meta: `${displayDate(item.pickupDate)} - Household location route`,
            href: `/household/notifications?item=${item.id}`,
            tone: isCollected ? 'success' : item.status === 'Confirmed' ? 'info' : 'warning',
          }
        }),
    [actions],
  )

  async function addPantryItem(input: NewPantryItemInput) {
    if (!currentUser) {
      const nextItem: PantryItem = {
        id: createLocalId('pantry'),
        ...input,
        status: statusForExpiry(input.expiryDate),
      }
      setPantryItems((current) => {
        const next = [nextItem, ...current]
        writeLocalItems(localPantryKey, next)
        return next
      })
      return
    }

    try {
      await addDoc(householdCollection(currentUser.uid, 'pantryItems'), {
        ...input,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      if (!isPermissionError(err)) throw err
      const nextItem: PantryItem = {
        id: createLocalId('pantry'),
        ...input,
        status: statusForExpiry(input.expiryDate),
      }
      setPantryItems((current) => {
        const next = [nextItem, ...current]
        writeLocalItems(localPantryKey, next)
        return next
      })
    }
  }

  async function updatePantryItem(
    itemId: string,
    input: Partial<NewPantryItemInput>,
  ) {
    if (!currentUser) {
      setPantryItems((current) => {
        const next = current.map((item) => {
          if (item.id !== itemId) return item
          const expiryDate = input.expiryDate ?? item.expiryDate
          return {
            ...item,
            ...input,
            status: statusForExpiry(expiryDate),
          }
        })
        writeLocalItems(localPantryKey, next)
        return next
      })
      return
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid, 'pantryItems', itemId), {
        ...input,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      if (!isPermissionError(err)) throw err
      setPantryItems((current) => {
        const next = current.map((item) => {
          if (item.id !== itemId) return item
          const expiryDate = input.expiryDate ?? item.expiryDate
          return {
            ...item,
            ...input,
            status: statusForExpiry(expiryDate),
          }
        })
        writeLocalItems(localPantryKey, next)
        return next
      })
    }
  }

  function recordLocalAction(input: NewActionInput, status: ActionStatus) {
    const nextItem: ActionItem = {
      id: createLocalId(input.type),
      type: input.type,
      pantryItemId: input.pantryItemId,
      name: input.name,
      quantity: input.quantity,
      partner: input.partner || 'Household',
      pickupDate: input.pickupDate || new Date().toISOString().slice(0, 10),
      status,
    }
    setActions((current) => {
      const next = [nextItem, ...current]
      writeLocalItems(localActionsKey, next)
      return next
    })
  }

  async function markConsumed(item: Pick<PantryItem, 'id' | 'name' | 'quantity'>) {
    if (!currentUser) {
      recordLocalAction(
        {
          type: 'consumed',
          pantryItemId: item.id,
          name: item.name,
          quantity: item.quantity,
        },
        'Collected',
      )
      setPantryItems((current) => {
        const next = current.filter((pantryItem) => pantryItem.id !== item.id)
        writeLocalItems(localPantryKey, next)
        return next
      })
      return
    }

    try {
      await addDoc(householdCollection(currentUser.uid, 'householdActions'), {
        type: 'consumed',
        pantryItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        partner: 'Household',
        pickupDate: new Date().toISOString().slice(0, 10),
        status: 'Collected',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await deleteDoc(doc(db, 'users', currentUser.uid, 'pantryItems', item.id))
    } catch (err) {
      if (!isPermissionError(err)) throw err
      recordLocalAction(
        {
          type: 'consumed',
          pantryItemId: item.id,
          name: item.name,
          quantity: item.quantity,
        },
        'Collected',
      )
      setPantryItems((current) => {
        const next = current.filter((pantryItem) => pantryItem.id !== item.id)
        writeLocalItems(localPantryKey, next)
        return next
      })
    }
  }

  async function flagAction(input: NewActionInput) {
    if (!currentUser) {
      recordLocalAction(
        {
          ...input,
          partner: input.partner || pickPartner(input.type),
          pickupDate: input.pickupDate || defaultPickupDate(),
        },
        'Pending',
      )
      return
    }

    try {
      await addDoc(householdCollection(currentUser.uid, 'householdActions'), {
        type: input.type,
        pantryItemId: input.pantryItemId ?? null,
        name: input.name,
        quantity: input.quantity,
        partner: input.partner || pickPartner(input.type),
        pickupDate: input.pickupDate || defaultPickupDate(),
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      if (!isPermissionError(err)) throw err
      recordLocalAction(
        {
          ...input,
          partner: input.partner || pickPartner(input.type),
          pickupDate: input.pickupDate || defaultPickupDate(),
        },
        'Pending',
      )
    }
  }

  async function updateActionStatus(actionId: string, status: ActionStatus) {
    if (!currentUser) {
      setActions((current) => {
        const next = current.map((item) =>
          item.id === actionId ? { ...item, status } : item,
        )
        writeLocalItems(localActionsKey, next)
        return next
      })
      return
    }

    try {
      await updateDoc(
        doc(db, 'users', currentUser.uid, 'householdActions', actionId),
        {
          status,
          updatedAt: serverTimestamp(),
        },
      )
    } catch (err) {
      if (!isPermissionError(err)) throw err
      setActions((current) => {
        const next = current.map((item) =>
          item.id === actionId ? { ...item, status } : item,
        )
        writeLocalItems(localActionsKey, next)
        return next
      })
    }
  }

  async function seedMockData() {
    const pantrySamples = samplePantryItems()
    const actionSamples = sampleActions()
    const pantryRows: PantryItem[] = pantrySamples.map((item) => ({
      id: createLocalId('pantry'),
      ...item,
      status: statusForExpiry(item.expiryDate),
    }))
    const actionRows: ActionItem[] = actionSamples.map((item) => ({
      id: createLocalId(item.type),
      type: item.type,
      pantryItemId: item.pantryItemId,
      name: item.name,
      quantity: item.quantity,
      partner: item.partner || pickPartner(item.type),
      pickupDate: item.pickupDate || defaultPickupDate(),
      status: 'Pending',
    }))

    if (!currentUser) {
      setPantryItems((current) => {
        const next = [...pantryRows, ...current]
        writeLocalItems(localPantryKey, next)
        return next
      })
      setActions((current) => {
        const next = [...actionRows, ...current]
        writeLocalItems(localActionsKey, next)
        return next
      })
      return
    }

    try {
      await Promise.all([
        ...pantrySamples.map((item) =>
          addDoc(householdCollection(currentUser.uid, 'pantryItems'), {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        ),
        ...actionSamples.map((item) =>
          addDoc(householdCollection(currentUser.uid, 'householdActions'), {
            ...item,
            pantryItemId: item.pantryItemId ?? null,
            status: 'Pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        ),
      ])
    } catch (err) {
      if (!isPermissionError(err)) throw err
      setPantryItems((current) => {
        const next = [...pantryRows, ...current]
        writeLocalItems(localPantryKey, next)
        return next
      })
      setActions((current) => {
        const next = [...actionRows, ...current]
        writeLocalItems(localActionsKey, next)
        return next
      })
    }
  }

  useEffect(() => {
    if (loading) return

    const seedKey = `${demoSeedKey}.${demoSeedVersion}.${currentUser?.uid ?? 'local'}`
    if (window.localStorage.getItem(seedKey)) return
    if (pantryItems.length >= 8 && actions.length >= 4) {
      window.localStorage.setItem(seedKey, 'true')
      return
    }

    window.localStorage.setItem(seedKey, 'true')
    void seedMockData()
  }, [actions.length, currentUser?.uid, loading, pantryItems.length])

  return {
    pantryItems,
    alerts,
    notifications,
    donationItems: actions.filter((item) => item.type === 'donation'),
    disposalItems: actions.filter((item) => item.type === 'disposal'),
    loading,
    error,
    addPantryItem,
    updatePantryItem,
    markConsumed,
    flagAction,
    updateActionStatus,
    seedMockData,
  }
}
