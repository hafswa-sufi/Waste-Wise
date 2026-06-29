import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
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
  }
}
