import { useState, useCallback } from 'react'
import { AppState, DEFAULT_TEMP, MIN_TEMP, MAX_TEMP, GenerateRequest, RESERVOIR_MIN_ACTIVE } from './types'
import { useWisdom } from './hooks/useWisdom'
import { useTheme } from './hooks/useTheme'
import { useReservoir } from './contexts/ReservoirContext'
import EntryView from './components/EntryView'
import WisdomView from './components/WisdomView'
import ReservoirView from './components/ReservoirView'

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function initialState(): AppState {
  return {
    situation: '',
    rounds: [],
    wisdomHistory: [],
    isLoading: false,
    hasStarted: false,
    temperature: DEFAULT_TEMP,
    sessionId: generateSessionId(),
    reservoirActive: false,
    error: null,
  }
}

function App() {
  const [state, setState] = useState<AppState>(initialState)
  const [showReservoir, setShowReservoir] = useState(false)
  const { items: reservoirItems } = useReservoir()
  const { generateWisdoms, logAction } = useWisdom()
  const { theme, toggle: toggleTheme } = useTheme()

  const handleSituationChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, situation: value }))
  }, [])

  const generate = useCallback(async (action: GenerateRequest['action'], temperature: number) => {
    if (!state.situation.trim() || state.isLoading) return

    setState(prev => ({ ...prev, isLoading: true, hasStarted: true, temperature, error: null }))

    try {
      const response = await generateWisdoms({
        situation: state.situation,
        previous_wisdoms: state.wisdomHistory,
        action,
        temperature,
        session_id: state.sessionId,
        count: 5,
      })

      setState(prev => ({
        ...prev,
        rounds: [...prev.rounds, { wisdoms: response.wisdoms, selectedIndex: response.selected_index }],
        wisdomHistory: [...prev.wisdomHistory, ...response.wisdoms],
        isLoading: false,
        reservoirActive: response.reservoir_active,
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'The oracle is silent. Try again.',
      }))
    }
  }, [state.situation, state.wisdomHistory, state.sessionId, state.isLoading, generateWisdoms])

  const handleContemplate = useCallback(() => generate('initial', state.temperature), [generate, state.temperature])

  const handleMore = useCallback(() => {
    const tempIncrease = 0.05 + Math.random() * 0.1
    generate('more', Math.min(state.temperature + tempIncrease, MAX_TEMP))
  }, [generate, state.temperature])

  const handleLess = useCallback(() => {
    const tempDecrease = 0.03 + Math.random() * 0.05
    generate('less', Math.max(state.temperature - tempDecrease, MIN_TEMP))
  }, [generate, state.temperature])

  const handleCooldown = useCallback(() => {
    setState(prev => ({ ...prev, temperature: DEFAULT_TEMP }))
    logAction({ session_id: state.sessionId, action: 'cooldown', data: {} })
  }, [state.sessionId, logAction])

  const handleSliderChange = useCallback((index: number) => {
    // Flipping alternatives only applies to the live (latest) round
    setState(prev => {
      if (!prev.rounds.length) return prev
      const rounds = [...prev.rounds]
      rounds[rounds.length - 1] = { ...rounds[rounds.length - 1], selectedIndex: index }
      return { ...prev, rounds }
    })
  }, [])

  // Copies "situation + phrase" (post-it / workshop format). Returns success for UI feedback.
  const handleCopy = useCallback(async (roundIndex: number): Promise<boolean> => {
    const round = state.rounds[roundIndex]
    const wisdom = round?.wisdoms[round.selectedIndex]
    if (!wisdom) return false

    try {
      await navigator.clipboard.writeText(`${state.situation}\n\n${wisdom}`)
    } catch {
      return false
    }

    logAction({
      session_id: state.sessionId,
      action: 'export',
      data: { wisdom, round: roundIndex, index: round.selectedIndex },
    })
    return true
  }, [state.situation, state.rounds, state.sessionId, logAction])

  const handleReset = useCallback(() => {
    logAction({
      session_id: state.sessionId,
      action: 'reset',
      data: { wisdomCount: state.wisdomHistory.length },
    })
    setState(initialState())
  }, [state.sessionId, state.wisdomHistory.length, logAction])

  const themeToggle = (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'light' : 'dark'}
    >
      {theme === 'dark' ? '○' : '●'}
    </button>
  )

  if (showReservoir) {
    return (
      <div className="app">
        {themeToggle}
        <ReservoirView onClose={() => setShowReservoir(false)} />
      </div>
    )
  }

  const heatLevel = (state.temperature - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)

  return (
    <div className="app">
      {themeToggle}
      {!state.hasStarted ? (
        <EntryView
          situation={state.situation}
          onSituationChange={handleSituationChange}
          onContemplate={handleContemplate}
          isLoading={state.isLoading}
          reservoirCount={reservoirItems.length}
          reservoirActive={reservoirItems.length >= RESERVOIR_MIN_ACTIVE}
          onOpenReservoir={() => setShowReservoir(true)}
        />
      ) : (
        <WisdomView
          situation={state.situation}
          rounds={state.rounds}
          heatLevel={heatLevel}
          isLoading={state.isLoading}
          error={state.error}
          reservoirActive={state.reservoirActive}
          onSliderChange={handleSliderChange}
          onMore={handleMore}
          onLess={handleLess}
          onCooldown={handleCooldown}
          onCopy={handleCopy}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

export default App
