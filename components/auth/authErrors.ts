export function authErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('auth/unauthorized-domain')) {
    return 'This website is not allowed to use Firebase sign-in yet. Add this domain in Firebase Authentication settings.'
  }
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
  if (message.includes('permission-denied')) {
    return 'You do not have access to do that with this account. Log in with the right account or ask an admin to approve your access.'
  }
  if (message === 'PENDING_APPROVAL') {
    return 'Your organisation account is still waiting for admin approval. You will be able to log in after approval.'
  }

  return message || fallback
}
