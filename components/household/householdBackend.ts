import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
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
  | 'Other'

export type StorageType = 'Fridge' | 'Counter' | 'Basket'
export type PantryStatus = 'Fresh' | 'Expiring Soon' | 'Expired'
export type ActionStatus =
  | 'Assigned'
  | 'Pending'
  | 'Confirmed'
  | 'Collected'
  | 'Cancelled'
export type HouseholdActionType = 'donation' | 'disposal' | 'consumed'

export interface PantryItem {
  id: string
  name: string
  category: PantryCategory
  quantity: string
  quantityValue?: number
  quantityUnit?: string
  storageType: StorageType
  purchaseDate: string
  expiryDate: string
  status: PantryStatus
  itemKind?: 'processed' | 'fresh'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface AlertItem {
  id: string
  pantryItemId: string
  name: string
  category: PantryCategory
  itemKind: 'processed' | 'fresh' | undefined
  quantity: string
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
  quantityValue?: number
  quantityUnit?: string
  partner: string
  pickupDate: string
  status: ActionStatus
  notificationRead?: boolean
  pickupLocation?: {
    label?: string
    buildingNameNumber?: string
    lat?: number
    lng?: number
  }
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  meta: string
  href: string
  actionId: string
  read: boolean
  tone: 'info' | 'success' | 'warning'
}

export interface NewPantryItemInput {
  name: string
  category: PantryCategory
  quantity: string
  storageType: StorageType
  purchaseDate: string
  expiryDate: string
  itemKind?: 'processed' | 'fresh'
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

function householdCollection(userId: string, name: string) {
  return collection(db, 'users', userId, name)
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
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
    category: asString(data.category, 'Other') as PantryCategory,
    quantity: asString(data.quantity, '1 item'),
    quantityValue:
      typeof data.quantityValue === 'number' ? data.quantityValue : undefined,
    quantityUnit: asString(data.quantityUnit) || undefined,
    storageType: asString(data.storageType, 'Counter') as StorageType,
    purchaseDate: asString(data.purchaseDate),
    expiryDate,
    status: statusForExpiry(expiryDate),
    itemKind: asString(data.itemKind) as PantryItem['itemKind'],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function normalizeActionItem(id: string, data: DocumentData): ActionItem {
  const pickupLocation =
    data.pickupLocation && typeof data.pickupLocation === 'object'
      ? (data.pickupLocation as Record<string, unknown>)
      : null

  return {
    id,
    type: asString(data.type, 'donation') as HouseholdActionType,
    pantryItemId: asString(data.pantryItemId) || undefined,
    name: asString(data.name, 'Unnamed item'),
    quantity: asString(data.quantity, '1 item'),
    quantityValue:
      typeof data.quantityValue === 'number' ? data.quantityValue : undefined,
    quantityUnit: asString(data.quantityUnit) || undefined,
    partner: asString(data.partner, 'Partner pending'),
    pickupDate: asString(data.pickupDate),
    status: asString(data.status, 'Pending') as ActionStatus,
    notificationRead: data.notificationRead === true,
    pickupLocation: pickupLocation
      ? {
          label: asString(pickupLocation.label) || undefined,
          buildingNameNumber:
            asString(pickupLocation.buildingNameNumber) || undefined,
          lat: isNumber(pickupLocation.lat) ? pickupLocation.lat : undefined,
          lng: isNumber(pickupLocation.lng) ? pickupLocation.lng : undefined,
        }
      : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function parseQuantity(value: string) {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
  if (!match) return null

  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return null

  return {
    amount,
    unit: match[2].trim(),
  }
}

function quantityFields(value: string) {
  const parsed = parseQuantity(value)
  if (!parsed) return {}

  return {
    quantityValue: parsed.amount,
    quantityUnit: parsed.unit || 'item',
  }
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const earthRadiusKm = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return (
    2 *
    earthRadiusKm *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  )
}

async function findNearestPartner(
  type: 'donation' | 'disposal',
  pickupLocation: { lat: number; lng: number },
) {
  const partnerRole = type === 'donation' ? 'NGO' : 'RecyclingFirm'
  const partnerQuery = query(
    collection(db, 'users'),
    where('role', '==', partnerRole),
    where('approvalStatus', '==', 'approved'),
  )
  const snapshot = await getDocs(partnerQuery)

  const partners = snapshot.docs
    .map((partnerDoc) => {
      const partner = partnerDoc.data()
      if (!isNumber(partner.lat) || !isNumber(partner.lng)) return null

      const distance = distanceKm(
        pickupLocation.lat,
        pickupLocation.lng,
        partner.lat,
        partner.lng,
      )
      const maxPickupRadiusKm = isNumber(partner.maxPickupRadiusKm)
        ? partner.maxPickupRadiusKm
        : null

      if (maxPickupRadiusKm !== null && distance > maxPickupRadiusKm) {
        return null
      }

      return {
        userId: partnerDoc.id,
        name:
          asString(partner.organizationName) ||
          asString(partner.name) ||
          'Approved partner',
        distance,
      }
    })
    .filter(
      (
        partner,
      ): partner is { userId: string; name: string; distance: number } =>
        partner !== null,
    )
    .sort((a, b) => a.distance - b.distance)

  return partners[0] ?? null
}

function formatQuantity(amount: number, unit: string) {
  const rounded = Number(amount.toFixed(2))
  return `${rounded}${unit ? ` ${unit}` : ''}`
}

function remainingQuantity(currentQuantity: string, consumedQuantity: string) {
  const current = parseQuantity(currentQuantity)
  const consumed = parseQuantity(consumedQuantity)

  if (!current || !consumed || consumed.amount <= 0) {
    throw new Error('Enter a valid amount to consume, for example 0.5 kg or 2 pieces.')
  }

  const currentUnit = current.unit.toLowerCase()
  const consumedUnit = consumed.unit.toLowerCase()
  if (currentUnit && consumedUnit && currentUnit !== consumedUnit) {
    throw new Error(`Use the same unit as the pantry quantity: ${current.unit}.`)
  }

  if (consumed.amount > current.amount) {
    throw new Error(`You only have ${currentQuantity} available.`)
  }

  const remainingAmount = current.amount - consumed.amount
  return {
    isFinished: remainingAmount <= 0,
    quantity: formatQuantity(remainingAmount, current.unit || consumed.unit),
  }
}

function pickPartner(type: HouseholdActionType) {
  const partners = type === 'donation' ? donationPartners : disposalPartners
  return partners[Math.floor(Math.random() * partners.length)]
}

function defaultPickupDate() {
  const date = new Date()
  date.setDate(date.getDate() + 2)
  return toDateInputValue(date)
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function relativeDate(daysFromToday: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + daysFromToday)
  return toDateInputValue(date)
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
  const { currentUser, userData } = useAuth()
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [actions, setActions] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      setPantryItems([])
      setActions([])
      setError('Please log in to access household data.')
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
          setPantryItems([])
          setError(
            'Firestore blocked pantry access. Check rules for users/{uid}/pantryItems.',
          )
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
          setActions([])
          setError(
            'Firestore blocked household actions. Check rules for users/{uid}/householdActions.',
          )
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
            itemKind: item.itemKind,
            quantity: item.quantity,
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
            actionId: item.id,
            read: item.notificationRead === true,
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
        ...quantityFields(input.quantity),
        expirySource: input.itemKind === 'fresh' ? 'freshness-estimator' : 'manual',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      if (isPermissionError(err)) {
        throw new Error(
          'Firestore blocked adding this pantry item. Check users/{uid}/pantryItems rules.',
        )
      }
      throw err
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
      const nextQuantityFields = input.quantity
        ? quantityFields(input.quantity)
        : {}
      await updateDoc(doc(db, 'users', currentUser.uid, 'pantryItems', itemId), {
        ...input,
        ...nextQuantityFields,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      if (isPermissionError(err)) {
        throw new Error(
          'Firestore blocked updating this pantry item. Check users/{uid}/pantryItems rules.',
        )
      }
      throw err
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
      pickupDate: input.pickupDate || toDateInputValue(new Date()),
      status,
      notificationRead: false,
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
        ...quantityFields(item.quantity),
        partner: 'Household',
        pickupDate: toDateInputValue(new Date()),
        status: 'Collected',
        notificationRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await deleteDoc(doc(db, 'users', currentUser.uid, 'pantryItems', item.id))
    } catch (err) {
      if (isPermissionError(err)) {
        throw new Error(
          'Firestore blocked recording consumption. Check users/{uid}/householdActions rules.',
        )
      }
      throw err
    }
  }

  async function consumePantryQuantity(
    item: Pick<PantryItem, 'id' | 'name' | 'quantity'>,
    consumedQuantity: string,
  ) {
    const remaining = remainingQuantity(item.quantity, consumedQuantity)

    if (!currentUser) {
      recordLocalAction(
        {
          type: 'consumed',
          pantryItemId: item.id,
          name: item.name,
          quantity: consumedQuantity,
        },
        'Collected',
      )
      setPantryItems((current) => {
        const next = remaining.isFinished
          ? current.filter((pantryItem) => pantryItem.id !== item.id)
          : current.map((pantryItem) =>
              pantryItem.id === item.id
                ? { ...pantryItem, quantity: remaining.quantity }
                : pantryItem,
            )
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
        quantity: consumedQuantity,
        ...quantityFields(consumedQuantity),
        partner: 'Household',
        pickupDate: toDateInputValue(new Date()),
        status: 'Collected',
        notificationRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      if (remaining.isFinished) {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'pantryItems', item.id))
      } else {
        await updateDoc(doc(db, 'users', currentUser.uid, 'pantryItems', item.id), {
          quantity: remaining.quantity,
          ...quantityFields(remaining.quantity),
          updatedAt: serverTimestamp(),
        })
      }
    } catch (err) {
      if (isPermissionError(err)) {
        throw new Error(
          'Firestore blocked recording consumption. Check users/{uid}/householdActions rules.',
        )
      }
      throw err
    }
  }

  async function flagAction(input: NewActionInput) {
    if (
      input.pantryItemId &&
      actions.some(
        (item) =>
          item.type === input.type &&
          item.pantryItemId === input.pantryItemId &&
          item.status !== 'Cancelled',
      )
    ) {
      return
    }

    if (input.type !== 'donation' && input.type !== 'disposal') {
      throw new Error('Only donation and disposal requests can be routed to partners.')
    }

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
      const latestUserDoc = await getDoc(doc(db, 'users', currentUser.uid))
      const latestUserData = latestUserDoc.exists()
        ? latestUserDoc.data()
        : userData
      const pickupLocation =
        isNumber(latestUserData?.lat) && isNumber(latestUserData?.lng)
          ? {
              label: asString(latestUserData?.location),
              buildingNameNumber: asString(latestUserData?.buildingNameNumber),
              lat: latestUserData.lat,
              lng: latestUserData.lng,
            }
          : null

      if (!pickupLocation) {
        throw new Error(
          'Save your household pickup pin in your profile before creating a pickup request.',
        )
      }

      const routedPartner = await findNearestPartner(input.type, pickupLocation)
      if (!routedPartner) {
        throw new Error(
          `No approved ${
            input.type === 'donation' ? 'NGO' : 'recycling company'
          } with a saved service location is available for this request.`,
        )
      }

      await addDoc(householdCollection(currentUser.uid, 'householdActions'), {
        type: input.type,
        pantryItemId: input.pantryItemId ?? null,
        name: input.name,
        quantity: input.quantity,
        ...quantityFields(input.quantity),
        partner: routedPartner.name,
        partnerUserId: routedPartner.userId,
        pickupDate: input.pickupDate || defaultPickupDate(),
        pickupLocation,
        routingMethod: 'nearest_partner',
        routingDistanceKm: Number(routedPartner.distance.toFixed(2)),
        routingStatus: 'offered',
        status: 'Assigned',
        notificationRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      if (isPermissionError(err)) {
        throw new Error(
          'Firestore blocked this request. Check users/{uid}/householdActions rules.',
        )
      }
      throw err
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

  async function removeActionAndRestoreToPantry(action: ActionItem) {
    const alreadyInPantry =
      !!action.pantryItemId &&
      pantryItems.some((item) => item.id === action.pantryItemId)

    if (!currentUser) {
      setActions((current) => {
        const next = current.filter((item) => item.id !== action.id)
        writeLocalItems(localActionsKey, next)
        return next
      })
      if (!alreadyInPantry) {
        const restoredItem: PantryItem = {
          id: action.pantryItemId || createLocalId('pantry'),
          name: action.name,
          category: 'Other',
          quantity: action.quantity,
          ...quantityFields(action.quantity),
          storageType: 'Counter',
          purchaseDate: toDateInputValue(new Date()),
          expiryDate: defaultPickupDate(),
          status: 'Fresh',
          itemKind: 'processed',
        }
        setPantryItems((current) => {
          const next = [restoredItem, ...current]
          writeLocalItems(localPantryKey, next)
          return next
        })
      }
      return
    }

    try {
      await updateDoc(
        doc(db, 'users', currentUser.uid, 'householdActions', action.id),
        {
          status: 'Cancelled',
          updatedAt: serverTimestamp(),
        },
      )
      if (!alreadyInPantry) {
        await addDoc(householdCollection(currentUser.uid, 'pantryItems'), {
          name: action.name,
          category: 'Other',
          quantity: action.quantity,
          storageType: 'Counter',
          purchaseDate: toDateInputValue(new Date()),
          expiryDate: defaultPickupDate(),
          itemKind: 'processed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
    } catch (err) {
      if (!isPermissionError(err)) throw err
      setActions((current) => {
        const next = current.filter((item) => item.id !== action.id)
        writeLocalItems(localActionsKey, next)
        return next
      })
      if (!alreadyInPantry) {
        const restoredItem: PantryItem = {
          id: action.pantryItemId || createLocalId('pantry'),
          name: action.name,
          category: 'Other',
          quantity: action.quantity,
          storageType: 'Counter',
          purchaseDate: toDateInputValue(new Date()),
          expiryDate: defaultPickupDate(),
          status: 'Fresh',
          itemKind: 'processed',
        }
        setPantryItems((current) => {
          const next = [restoredItem, ...current]
          writeLocalItems(localPantryKey, next)
          return next
        })
      }
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
      notificationRead: false,
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
            ...quantityFields(item.quantity),
            expirySource: item.itemKind === 'fresh' ? 'freshness-estimator' : 'manual',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        ),
        ...actionSamples.map((item) =>
          addDoc(householdCollection(currentUser.uid, 'householdActions'), {
            ...item,
            ...quantityFields(item.quantity),
            pantryItemId: item.pantryItemId ?? null,
            status: 'Pending',
            notificationRead: false,
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

  async function updateNotificationRead(actionId: string, read: boolean) {
    if (!currentUser) {
      setActions((current) => {
        const next = current.map((item) =>
          item.id === actionId ? { ...item, notificationRead: read } : item,
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
          notificationRead: read,
          updatedAt: serverTimestamp(),
        },
      )
    } catch (err) {
      if (!isPermissionError(err)) throw err
      setActions((current) => {
        const next = current.map((item) =>
          item.id === actionId ? { ...item, notificationRead: read } : item,
        )
        writeLocalItems(localActionsKey, next)
        return next
      })
    }
  }

  async function markAllNotificationsRead() {
    const readableActions = actions.filter(
      (item) =>
        (item.type === 'donation' || item.type === 'disposal') &&
        !item.notificationRead,
    )
    await Promise.all(
      readableActions.map((item) => updateNotificationRead(item.id, true)),
    )
  }

  return {
    pantryItems,
    alerts,
    notifications,
    donationItems: actions.filter((item) => item.type === 'donation'),
    disposalItems: actions.filter((item) => item.type === 'disposal'),
    consumedItems: actions.filter((item) => item.type === 'consumed'),
    loading,
    error,
    addPantryItem,
    updatePantryItem,
    markConsumed,
    consumePantryQuantity,
    flagAction,
    updateActionStatus,
    removeActionAndRestoreToPantry,
    updateNotificationRead,
    markAllNotificationsRead,
    seedMockData,
  }
}
