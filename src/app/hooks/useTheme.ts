import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

// Keep in sync with the inline script in index.html (applies it before first paint)
const STORAGE_KEY = 'epoche_theme'
const THEME_COLORS: Record<Theme, string> = { light: '#f7f6f3', dark: '#161513' }

const media = window.matchMedia('(prefers-color-scheme: dark)')

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return media.matches ? 'dark' : 'light'
}

/** Follows the OS until the user picks a theme; then that choice sticks. */
export function useTheme() {
  const [choice, setChoice] = useState<Theme | null>(stored)
  const [system, setSystem] = useState<Theme>(systemTheme)
  const theme = choice ?? system

  useEffect(() => {
    const onChange = () => setSystem(systemTheme())
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (choice) root.dataset.theme = choice
    else delete root.dataset.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  }, [choice, theme])

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setChoice(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not persisted (private mode); still applies for this visit
    }
  }, [theme])

  return { theme, toggle }
}
