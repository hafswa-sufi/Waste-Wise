import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
  getDocs,
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
  | 'Assigned'
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
  distanceKm?: number | null
  pickupDate: string
  status: PartnerActionStatus
  imageUrl?: string | null
  imageName?: string | null
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
  const partnerUserId = asString(data.partnerUserId) || null
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
    partner: partnerUserId
      ? asString(data.partner, 'Assigned partner')
      : 'Awaiting assignment',
    partnerUserId,
    batchId: asString(data.batchId) || null,
    batchArea: asString(data.batchArea) || null,
    batchAssignedAt: data.batchAssignedAt as Timestamp | undefined,
    pickupDate: asString(data.pickupDate),
    status: asString(data.status, 'Pending') as PartnerActionStatus,
    imageUrl:
      asString(data.imageUrl) ||
      asString(data.photoUrl) ||
      asString(data.foodImageUrl) ||
      null,
    imageName:
      asString(data.imageName) ||
      asString(data.photoName) ||
      asString(data.foodImageName) ||
      null,
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
    Assigned: 0,
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

function distanceBetweenKm(
  from: { lat?: number; lng?: number },
  to: { lat?: number; lng?: number },
) {
  if (
    !isNumber(from.lat) ||
    !isNumber(from.lng) ||
    !isNumber(to.lat) ||
    !isNumber(to.lng)
  ) {
    return null
  }

  const earthRadiusKm = 6371
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180
  const fromLat = (from.lat * Math.PI) / 180
  const toLat = (to.lat * Math.PI) / 180
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((earthRadiusKm * c).toFixed(1))
}

export function displayDistance(value?: number | null) {
  return typeof value === 'number' ? `${value.toFixed(1)} km away` : 'Distance unknown'
}

export function displayPartnerStatus(status: PartnerActionStatus) {
  if (status === 'Pending') return 'Awaiting response'
  if (status === 'Assigned') return 'Awaiting response'
  if (status === 'Confirmed') return 'Scheduled'
  if (status === 'Collected') return 'Collected'
  if (status === 'Cancelled') return 'Cancelled'
  return status
}

function pickupArea(action: PartnerAction) {
  return (
    action.batchArea ||
    action.pickupLocation?.buildingNameNumber ||
    action.pickupLocation?.label ||
    'No pickup area saved'
  )
}

export function partnerActionErrorMessage(error: unknown, actionLabel: string) {
  const message = error instanceof Error ? error.message : String(error)
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : ''

  if (message.includes('Please log in again')) {
    return 'Your session has expired. Please log in again, then try the pickup update once more.'
  }
  if (message.includes('Only the assigned partner')) {
    return 'This request is assigned to another partner, so your account cannot change it.'
  }
  if (message.includes('No other approved nearby partner')) {
    return 'There is no other approved nearby partner to receive this request right now.'
  }
  if (code === 'permission-denied' || message.includes('permission-denied')) {
    return `Your account is not allowed to update this ${actionLabel}. Make sure the organisation is approved and this request is assigned to you.`
  }
  if (
    code === 'unavailable' ||
    message.includes('unavailable') ||
    message.includes('network')
  ) {
    return 'The connection dropped before the update finished. Check your internet and try again.'
  }

  return `This ${actionLabel} could not be updated. Refresh the page and confirm it is still assigned to your organisation before trying again.`
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

async function findNextNearestPartner(
  action: PartnerAction,
  excludePartnerIds: string[],
) {
  const partnerRole = action.type === 'donation' ? 'NGO' : 'RecyclingFirm'
  const lat = action.pickupLocation?.lat
  const lng = action.pickupLocation?.lng

  if (!isNumber(lat) || !isNumber(lng)) return null

  const partnerQuery = query(
    collection(db, 'users'),
    where('role', '==', partnerRole),
    where('approvalStatus', '==', 'approved'),
  )
  const snapshot = await getDocs(partnerQuery)

  return (
    snapshot.docs
      .map((partnerDoc) => {
        const partner = partnerDoc.data()
        if (excludePartnerIds.includes(partnerDoc.id)) return null
        if (!isNumber(partner.lat) || !isNumber(partner.lng)) return null

        const distance = distanceKm(lat, lng, partner.lat, partner.lng)
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
      .sort((a, b) => a.distance - b.distance)[0] ?? null
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
      where('partnerUserId', '==', currentUser.uid),
    )

    return onSnapshot(
      actionsQuery,
      (snapshot) => {
        const partnerPin = {
          lat: userData?.lat,
          lng: userData?.lng,
        }
        const nextActions = snapshot.docs
          .map((snapshotDoc) =>
            normalizePartnerAction(snapshotDoc.ref, snapshotDoc.data()),
          )
          .map((action) => ({
            ...action,
            partner: action.partnerUserId ? action.partner : 'Awaiting assignment',
            distanceKm: distanceBetweenKm(partnerPin, action.pickupLocation ?? {}),
          }))
          .filter((action) => action.status !== 'Cancelled')
          .filter(
            (action) =>
              action.partnerUserId === currentUser.uid,
          )
          .filter(
            (action) => !action.declinedPartnerIds.includes(currentUser.uid),
          )
          .sort((a, b) => {
            const statusDiff = statusRank(a.status) - statusRank(b.status)
            if (statusDiff !== 0) return statusDiff

            const aDistance =
              typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY
            const bDistance =
              typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY
            const distanceDiff = aDistance - bDistance
            if (distanceDiff !== 0) return distanceDiff

            const aCreated = a.createdAt?.toDate?.().getTime() ?? 0
            const bCreated = b.createdAt?.toDate?.().getTime() ?? 0
            return bCreated - aCreated
          })

        setActions(nextActions)
        setLoading(false)
      },
      (snapshotError) => {
        console.error('Partner action load error:', snapshotError)
        setError(
          'We could not load your assigned household requests. Confirm your organisation is approved, then refresh the page.',
        )
        setLoading(false)
      },
    )
  }, [currentUser, type, userData?.lat, userData?.lng])

  const availableActions = useMemo(
    () =>
      actions.filter(
        (action) => action.status === 'Assigned' || action.status === 'Pending',
      ),
    [actions],
  )

  const assignedActions = useMemo(
    () =>
      actions.filter(
        (action) => action.status !== 'Assigned' && action.status !== 'Pending',
      ),
    [actions],
  )

  async function writeStatusHistory(
    action: PartnerAction,
    previousStatus: PartnerActionStatus,
    nextStatus: PartnerActionStatus,
  ) {
    if (!currentUser || !userData) return

    try {
      await addDoc(collection(action.ref, 'statusHistory'), {
        previousStatus,
        status: nextStatus,
        changedByUserId: currentUser.uid,
        changedByRole: userData.role,
        changedAt: serverTimestamp(),
      })
    } catch (historyError) {
      console.warn('Status history was not recorded:', historyError)
    }
  }

  async function acceptAction(action: PartnerAction, scheduledDate?: string) {
    if (!currentUser || !userData) throw new Error('Please log in again.')

    const partnerName =
      userData.organizationName || userData.name || 'Approved partner'
    const pickupDate = scheduledDate || action.pickupDate

    await updateDoc(action.ref, {
      partner: partnerName,
      partnerUserId: currentUser.uid,
      pickupDate,
      status: 'Confirmed',
      routingStatus: 'accepted',
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

  async function updatePickupDate(action: PartnerAction, pickupDate: string) {
    if (!pickupDate) throw new Error('Choose a pickup date first.')
    await updateDoc(action.ref, {
      pickupDate,
      updatedAt: serverTimestamp(),
    })
  }

  async function updateBatchPickupDate(
    batch: PartnerActionBatch,
    pickupDate: string,
  ) {
    if (!pickupDate) throw new Error('Choose a pickup date first.')
    const openItems = batch.items.filter((item) => item.status !== 'Collected')
    if (openItems.length === 0) return

    const firestoreBatch = writeBatch(db)
    openItems.forEach((action) => {
      firestoreBatch.update(action.ref, {
        pickupDate,
        updatedAt: serverTimestamp(),
      })
    })
    await firestoreBatch.commit()
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
    })

    await firestoreBatch.commit()
    await Promise.all(
      openItems.map((action) =>
        writeStatusHistory(action, action.status, 'Collected'),
      ),
    )
  }

  async function declineAction(action: PartnerAction) {
    if (!currentUser || !userData) throw new Error('Please log in again.')
    if (action.partnerUserId !== currentUser.uid) {
      throw new Error('Only the assigned partner can decline this request.')
    }

    const declinedPartnerIds = [
      ...new Set([...action.declinedPartnerIds, currentUser.uid]),
    ]
    const nextPartner = await findNextNearestPartner(action, declinedPartnerIds)

    if (!nextPartner) {
      throw new Error('No other approved nearby partner is available for this request.')
    }

    await updateDoc(action.ref, {
      declinedPartnerIds: arrayUnion(currentUser.uid),
      partner: nextPartner.name,
      partnerUserId: nextPartner.userId,
      status: 'Assigned',
      routingStatus: 'rerouted',
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
    updatePickupDate,
    updateBatchPickupDate,
  }
}
