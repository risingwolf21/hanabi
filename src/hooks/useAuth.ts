import { useState, useEffect } from 'react'
import {
  signInAnonymously, onAuthStateChanged, type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthState {
  user: User | null
  displayName: string
  loading: boolean
  authError: string | null
  signIn: () => Promise<User>
  setDisplayName: (name: string) => void
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayNameState] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      if (currentUser) {
        setUser(currentUser)
        setAuthError(null)
        const stored = localStorage.getItem(`hanabi_name_${currentUser.uid}`)
        if (stored) setDisplayNameState(stored)
      }
      setLoading(false)
    })

    // Attempt silent sign-in on mount; errors surface via authError
    signInAnonymously(auth).catch(e => {
      const msg = e instanceof Error ? e.message : 'Anonymous sign-in failed'
      setAuthError(msg)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function signIn(): Promise<User> {
    setAuthError(null)
    try {
      const credential = await signInAnonymously(auth)
      return credential.user
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Anonymous sign-in failed'
      setAuthError(msg)
      throw new Error(msg)
    }
  }

  function setDisplayName(name: string) {
    setDisplayNameState(name)
    if (user) localStorage.setItem(`hanabi_name_${user.uid}`, name)
  }

  return { user, displayName, loading, authError, signIn, setDisplayName }
}
