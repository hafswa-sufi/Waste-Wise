import { getAnalytics, isSupported } from 'firebase/analytics'
import type { Analytics } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ??
    'AIzaSyBf7WC0Ga-Sclz4oT7y8D7h7-IjBQLYdgI',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    'wastewise-48380.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'wastewise-48380',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    'wastewise-48380.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '339267734330',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    '1:339267734330:web:af288bbb19801acebd9e03',
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-VPE5YP23GG',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

let analyticsPromise: Promise<Analytics | null> | undefined

// Analytics is initialized only after the user grants analytics consent.
export const enableAnalytics = () => {
  if (!analyticsPromise) {
    analyticsPromise =
      typeof window === 'undefined'
        ? Promise.resolve(null)
        : isSupported().then((supported) => (supported ? getAnalytics(app) : null))
  }

  return analyticsPromise
}

export default app
