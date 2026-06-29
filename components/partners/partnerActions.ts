import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentReference,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../../src/firebase/firebase'
import { useAuth } from '../../src/context/useAuth'
import type { HouseholdActionType } from '../household/householdBackend'

export type PartnerActionStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Collected'
  | 'Cancelled'

export interface PartnerAction {
  id: string
  householdId: string
  ref: DocumentReference
  type: HouseholdActionType
  pantryItemId?: string | null
  name: string
  quantity: string
  partner: string
  partnerUserId?: string | null
  batchId?: string | null
  batchArea?: string | null
  batchAssignedAt?: Timestamp
  pickupDate: string
  status: PartnerActionStatus
  notificationRead?: boolean
  declinedPartnerIds: string[]
  pickupLocation?: {
    label?: string
    buildingNameNumber?: string
    lat?: number
    lng?: number
  }
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface PartnerActionBatch {
  key: string
  batchId?: string | null
  area: string
  requestCount: number
  householdCount: number
  totalQuantity: number
  mappedCount: number
  nextPickupDate: string
  status: PartnerActionStatus
  items: PartnerAction[]
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizePartnerAction(
  actionRef: DocumentReference,
  data: Record<string, unknown>,
): PartnerAction {
  const householdId = actionRef.parent.parent?.id ?? ''
  const pickupLocation =
    data.pickupLocation && typeof data.pickupLocation === 'object'
      ? (data.pickupLocation as Record<string, unknown>)
      : null

  return {
    id: actionRef.id,
    householdId,
    ref: actionRef,
    type: asString(data.type, 'donation') as HouseholdActionType,
    pantryItemId: asString(data.pantryItemId) || null,
    name: asString(data.name, 'Unnamed item'),
    quantity: asString(data.quantity, '1 item'),
    partner: asString(data.partner, 'Partner pending'),
    partnerUserId: asString(data.partnerUserId) || null,
    batchId: asString(data.batchId) || null,
    batchArea: asString(data.batchArea) || null,
    batchAssignedAt: data.batchAssignedAt as Timestamp | undefined,
    pickupDate: asString(data.pickupDate),
    status: asString(data.status, 'Pending') as PartnerActionStatus,
    notificationRead: data.notificationRead === true,
    declinedPartnerIds: Array.isArray(data.declinedPartnerIds)
      ? data.declinedPartnerIds.filter(
          (partnerId): partnerId is string => typeof partnerId === 'string',
        )
      : [],
    pickupLocation: pickupLocation
      ? {
          label: asString(pickupLocation.label) || undefined,
          buildingNameNumber:
            asString(pickupLocation.buildingNameNumber) || undefined,
          lat: isNumber(pickupLocation.lat) ? pickupLocation.lat : undefined,
          lng: isNumber(pickupLocation.lng) ? pickupLocation.lng : undefined,
        }
      : undefined,
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  }
}

function statusRank(status: PartnerActionStatus) {
  return {
    Pending: 0,
    Confirmed: 1,
    Collected: 2,
    Cancelled: 3,
  }[status]
}

export function displayPartnerDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value || 'Not scheduled'

  return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function parseQuantityValue(value: string) {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)/)
  if (!match) return 0
  const amount = Number(match[1])
  return Number.isFinite(amount) ? amount : 0
}

function pickupArea(action: PartnerAction) {
  return (
    action.batchArea ||
    action.pickupLocation?.buildingNameNumber ||
    action.pickupLocation?.label ||
    'No pickup area saved'
  )
}

export function groupPartnerBatches(
  actions: PartnerAction[],
): PartnerActionBatch[] {
  const groups = new Map<
    string,
    {
      batchId?: string | null
      area: string
      households: Set<string>
      totalQuantity: number
      mappedCount: number
      pickupDates: string[]
      items: PartnerAction[]
    }
  >()

  actions.forEach((action) => {
    const area = pickupArea(action)
    const key =
      action.batchId ||
      `${action.type}:${area.toLowerCase()}:${action.pickupDate || 'unscheduled'}`
    const existing =
      groups.get(key) ??
      {
        batchId: action.batchId,
        area,
        households: new Set<string>(),
        totalQuantity: 0,
        mappedCount: 0,
        pickupDates: [],
        items: [],
      }

    existing.households.add(action.householdId)
    existing.totalQuantity += parseQuantityValue(action.quantity)
    existing.items.push(action)
    if (action.pickupDate) existing.pickupDates.push(action.pickupDate)
    if (
      typeof action.pickupLocation?.lat === 'number' &&
      typeof action.pickupLocation?.lng === 'number'
    ) {
      existing.mappedCount += 1
    }

    groups.set(key, existing)
  })

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const hasOpenItems = group.items.some(
        (item) => item.status !== 'Collected',
      )
      const status: PartnerActionStatus = hasOpenItems
        ? 'Confirmed'
        : 'Collected'

      return {
        key,
        batchId: group.batchId,
        area: group.area,
        requestCount: group.items.length,
        householdCount: group.households.size,
        totalQuantity: group.totalQuantity,
        mappedCount: group.mappedCount,
        nextPickupDate: group.pickupDates.sort()[0] || 'Not scheduled',
        status,
        items: group.items,
      }
    })
    .sort((a, b) => {
      const statusDiff = statusRank(a.status) - statusRank(b.status)
      if (statusDiff !== 0) return statusDiff
      return b.requestCount - a.requestCount
    })
}

export function usePartnerActions(type: 'donation' | 'disposal') {
  const { currentUser, userData } = useAuth()
  const [actions, setActions] = useState<PartnerAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      setActions([])
      setLoading(false)
      setError('Please log in to view partner requests.')
      return
    }

    setLoading(true)
    setError(null)

    const actionsQuery = query(
      collectionGroup(db, 'householdActions'),
      where('type', '==', type),
    )

    return onSnapshot(
      actionsQuery,
      (snapshot) => {
        const nextActions = snapshot.docs
          .map((snapshotDoc) =>
            normalizePartnerAction(snapshotDoc.ref, snapshotDoc.data()),
          )
          .filter((action) => action.status !== 'Cancelled')
          .filter(
            (action) =>
              !action.partnerUserId || action.partnerUserId === currentUser.uid,
          )
          .filter(
            (action) => !action.declinedPartnerIds.includes(currentUser.uid),
          )
          .sort((a, b) => {
            const statusDiff = statusRank(a.status) - statusRank(b.status)
            if (statusDiff !== 0) return statusDiff

            const aCreated = a.createdAt?.toDate?.().getTime() ?? 0
            const bCreated = b.createdAt?.toDate?.().getTime() ?? 0
            return bCreated - aCreated
          })

        setActions(nextActions)
        setLoading(false)
      },
      (snapshotError) => {
        console.error('Partner action load error:', snapshotError)
        setError('Could not load household requests. Check partner rules.')
        setLoading(false)
      },
    )
  }, [currentUser, type])

  const availableActions = useMemo(
    () => actions.filter((action) => !action.partnerUserId),
    [actions],
  )

  const assignedActions = useMemo(
    () =>
      actions.filter((action) => action.partnerUserId === currentUser?.uid),
    [actions, currentUser?.uid],
  )

  async function writeStatusHistory(
    action: PartnerAction,
    previousStatus: PartnerActionStatus,
    nextStatus: PartnerActionStatus,
  ) {
    if (!currentUser || !userData) return

    await addDoc(collection(action.ref, 'statusHistory'), {
      previousStatus,
      status: nextStatus,
      changedByUserId: currentUser.uid,
      changedByRole: userData.role,
      changedAt: serverTimestamp(),
    })
  }

  async function acceptAction(action: PartnerAction) {
    if (!currentUser || !userData) throw new Error('Please log in again.')

    const partnerName =
      userData.organizationName || userData.name || 'Approved partner'

    await updateDoc(action.ref, {
      partner: partnerName,
      partnerUserId: currentUser.uid,
      status: 'Confirmed',
      confirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await writeStatusHistory(action, action.status, 'Confirmed')
  }

  async function markCollected(action: PartnerAction) {
    await updateDoc(action.ref, {
      status: 'Collected',
      collectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await writeStatusHistory(action, action.status, 'Collected')
  }

  async function markBatchCollected(batch: PartnerActionBatch) {
    if (!currentUser || !userData) throw new Error('Please log in again.')

    const openItems = batch.items.filter((item) => item.status !== 'Collected')
    if (openItems.length === 0) return

    const firestoreBatch = writeBatch(db)
    openItems.forEach((action) => {
      firestoreBatch.update(action.ref, {
        status: 'Collected',
        collectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      firestoreBatch.set(doc(collection(action.ref, 'statusHistory')), {
        previousStatus: action.status,
        status: 'Collected',
        changedByUserId: currentUser.uid,
        changedByRole: userData.role,
        notes: `Partner marked ${batch.area} batch as collected.`,
        changedAt: serverTimestamp(),
      })
    })

    await firestoreBatch.commit()
  }

  async function declineAction(action: PartnerAction) {
    if (!currentUser || !userData) throw new Error('Please log in again.')
    if (action.partnerUserId) {
      throw new Error('Assigned requests cannot be declined here.')
    }

    await updateDoc(action.ref, {
      declinedPartnerIds: arrayUnion(currentUser.uid),
      updatedAt: serverTimestamp(),
    })

    await addDoc(collection(action.ref, 'statusHistory'), {
      previousStatus: action.status,
      status: action.status,
      changedByUserId: currentUser.uid,
      changedByRole: userData.role,
      notes: 'Partner declined request.',
      changedAt: serverTimestamp(),
    })
  }

  return {
    actions,
    availableActions,
    assignedActions,
    loading,
    error,
    acceptAction,
    declineAction,
    markCollected,
    markBatchCollected,
  }
}
