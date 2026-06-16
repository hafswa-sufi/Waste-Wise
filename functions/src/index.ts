import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'

initializeApp()

const db = getFirestore()

function todayDateOnly() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(now)
}

function addDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

async function queueEmail(to: string | undefined, subject: string, text: string) {
  if (!to) return
  await db.collection('mail').add({
    to,
    message: {
      subject,
      text,
    },
    createdAt: FieldValue.serverTimestamp(),
  })
}

export const createExpiredFoodDisposalSuggestions = onSchedule(
  {
    schedule: 'every day 02:00',
    timeZone: 'Africa/Nairobi',
  },
  async () => {
    const today = todayDateOnly()
    const usersSnapshot = await db.collection('users').get()

    await Promise.all(
      usersSnapshot.docs.map(async (userDoc) => {
        const user = userDoc.data()
        const pantrySnapshot = await userDoc.ref
          .collection('pantryItems')
          .where('expiryDate', '<', today)
          .get()

        await Promise.all(
          pantrySnapshot.docs.map(async (pantryDoc) => {
            const pantryItem = pantryDoc.data()
            const existingSuggestion = await userDoc.ref
              .collection('householdActions')
              .where('pantryItemId', '==', pantryDoc.id)
              .where('type', '==', 'disposal')
              .where('source', '==', 'expired-food-scheduler')
              .limit(1)
              .get()

            if (!existingSuggestion.empty) return

            await userDoc.ref.collection('householdActions').add({
              type: 'disposal',
              pantryItemId: pantryDoc.id,
              name: pantryItem.name ?? 'Expired pantry item',
              quantity: pantryItem.quantity ?? '1 item',
              partner: 'Partner pending',
              pickupDate: today,
              status: 'Pending',
              source: 'expired-food-scheduler',
              notificationRead: false,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            })
            await queueEmail(
              user.email,
              'WasteWise expired food disposal alert',
              `${pantryItem.name ?? 'A pantry item'} expired and has been queued as a disposal suggestion.`,
            )
          }),
        )
      }),
    )
  },
)

export const sendHouseholdExpiryAlertEmails = onSchedule(
  {
    schedule: 'every day 08:00',
    timeZone: 'Africa/Nairobi',
  },
  async () => {
    const today = todayDateOnly()
    const warningDate = addDays(today, 3)
    const usersSnapshot = await db.collection('users').get()

    await Promise.all(
      usersSnapshot.docs.map(async (userDoc) => {
        const user = userDoc.data()
        const pantrySnapshot = await userDoc.ref
          .collection('pantryItems')
          .where('expiryDate', '>=', today)
          .where('expiryDate', '<=', warningDate)
          .get()

        if (pantrySnapshot.empty) return

        const items = pantrySnapshot.docs
          .map((doc) => {
            const item = doc.data()
            return `- ${item.name ?? 'Pantry item'} expires on ${item.expiryDate ?? 'its expiry date'}`
          })
          .join('\n')

        await queueEmail(
          user.email,
          'WasteWise pantry expiry alerts',
          `These pantry items need attention soon:\n\n${items}`,
        )
      }),
    )
  },
)

export const emailHouseholdActionCreated = onDocumentCreated(
  'users/{userId}/householdActions/{actionId}',
  async (event) => {
    const action = event.data?.data()
    if (!action || (action.type !== 'donation' && action.type !== 'disposal')) return

    const userDoc = await db.collection('users').doc(event.params.userId).get()
    const user = userDoc.data()
    const actionLabel = action.type === 'donation' ? 'Donation' : 'Disposal'

    await queueEmail(
      user?.email,
      `WasteWise ${action.type} request created`,
      `${actionLabel} request created for ${action.name ?? 'your item'} (${action.quantity ?? '1 item'}). Partner: ${action.partner ?? 'Partner pending'}.`,
    )
  },
)

export const emailHouseholdActionStatusUpdated = onDocumentUpdated(
  'users/{userId}/householdActions/{actionId}',
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after || before.status === after.status) return
    if (after.type !== 'donation' && after.type !== 'disposal') return

    const userDoc = await db.collection('users').doc(event.params.userId).get()
    const user = userDoc.data()
    const actionLabel = after.type === 'donation' ? 'Donation' : 'Disposal'

    await queueEmail(
      user?.email,
      `WasteWise ${after.type} status update`,
      `${actionLabel} for ${after.name ?? 'your item'} is now ${after.status ?? 'updated'}. Partner: ${after.partner ?? 'Partner pending'}.`,
    )
  },
)
