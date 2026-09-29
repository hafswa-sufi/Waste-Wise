import { useEffect, useState } from 'react'
import { enableAnalytics } from '../firebase/firebase'

const CONSENT_COOKIE = 'wastewise.cookieConsent'
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180

interface CookieConsentValue {
  analytics: boolean
  preferences: boolean
}

const defaultConsent: CookieConsentValue = {
  analytics: false,
  preferences: false,
}

function readConsent(): CookieConsentValue | null {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE}=`))

  if (!cookie) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('=')))
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.analytics === 'boolean' &&
      typeof parsed.preferences === 'boolean'
    ) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

function saveConsent(value: CookieConsentValue) {
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    JSON.stringify(value),
  )}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax`
}

export function CookieConsent() {
  const [consent, setConsent] = useState<CookieConsentValue | null>(() => readConsent())
  const [showPreferences, setShowPreferences] = useState(false)
  const [draft, setDraft] = useState(defaultConsent)

  useEffect(() => {
    if (consent?.analytics) {
      void enableAnalytics()
    }
  }, [consent])

  const applyConsent = (value: CookieConsentValue) => {
    saveConsent(value)
    setConsent(value)
    setShowPreferences(false)
  }

  if (consent && !showPreferences) return null

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-100 bg-white p-4 shadow-2xl"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-sm font-extrabold text-gray-900">Your privacy choices</h2>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            WasteWise uses essential storage to operate the site. With your permission, we
            can use analytics and preference cookies to improve the service. You can change
            your choices at any time.
          </p>
        </div>

        {!showPreferences ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyConsent(defaultConsent)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(consent ?? defaultConsent)
                setShowPreferences(true)
              }}
              className="rounded-lg border border-emerald-700 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
            >
              Manage preferences
            </button>
            <button
              type="button"
              onClick={() => applyConsent({ analytics: true, preferences: true })}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Accept all
            </button>
          </div>
        ) : (
          <div className="min-w-64 space-y-3">
            <label className="flex items-center justify-between gap-4 text-xs font-semibold text-gray-700">
              <span>Essential</span>
              <input type="checkbox" checked disabled aria-label="Essential cookies always enabled" />
            </label>
            <label className="flex items-center justify-between gap-4 text-xs font-semibold text-gray-700">
              <span>Analytics</span>
              <input
                type="checkbox"
                checked={draft.analytics}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, analytics: event.target.checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-xs font-semibold text-gray-700">
              <span>Preferences</span>
              <input
                type="checkbox"
                checked={draft.preferences}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, preferences: event.target.checked }))
                }
              />
            </label>
            <button
              type="button"
              onClick={() => applyConsent(draft)}
              className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Save choices
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
