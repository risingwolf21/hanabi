import { useState, useEffect } from 'react'
import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthState {
  user: User | null
  displayName: string
  loading: boolean
  setDisplayName: (name: string) => void
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayNameState] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (currentUser) {
        setUser(currentUser)
        const stored = localStorage.getItem(`hanabi_name_${currentUser.uid}`)
        if (stored) setDisplayNameState(stored)
      } else {
        try {
          await signInAnonymously(auth)
        } catch {
          // Silent — user stays null, UI will retry on action
        }
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  function setDisplayName(name: string) {
    setDisplayNameState(name)
    if (user) localStorage.setItem(`hanabi_name_${user.uid}`, name)
  }

  return { user, displayName, loading, setDisplayName }
}
