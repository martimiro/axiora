'use client'
import { useState, useEffect } from 'react'

export function useLocale() {
  const [locale, setLocaleState] = useState<'ca' | 'es' | 'en'>('ca')

  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    if (cookie) {
      const val = cookie.split('=')[1].trim() as 'ca' | 'es' | 'en'
      setLocaleState(val)
    }
  }, [])

  function setLocale(newLocale: 'ca' | 'es' | 'en') {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
    setLocaleState(newLocale)
    window.location.reload()
  }

  return { locale, setLocale }
}
