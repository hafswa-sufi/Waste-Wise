export function authErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('auth/email-already-in-use')) {
    return 'That email is already registered. Try logging in instead.'
  }
  if (message.includes('auth/invalid-email')) {
    return 'Enter a valid email address.'
  }
  if (message.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters.'
  }
  if (
    message.includes('auth/invalid-credential') ||
    message.includes('auth/wrong-password') ||
    message.includes('auth/user-not-found')
  ) {
    return 'Email or password is incorrect.'
  }
  if (message.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in was closed before it finished.'
  }
  if (message.includes('auth/network-request-failed')) {
    return 'Network error. Check your connection and try again.'
  }
  if (message === 'PENDING_APPROVAL') {
    return 'Your account is still pending approval.'
  }

  return message || fallback
}
