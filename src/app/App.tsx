import { useState, useCallback } from 'react'
import { AppState, DEFAULT_TEMP } from './types'
import { useWisdom } from './hooks/useWisdom'
import EntryView from './components/EntryView'
import WisdomView from './components/WisdomView'

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function App() {
  const [state, setState] = useState<AppState>({
    situation: '',
    currentWisdoms: [],
    selectedIndex: 0,
    wisdomHistory: [],
    isLoading: false,
    hasStarted: false,
    temperature: DEFAULT_TEMP,
    sessionId: generateSessionId(),
    reservoirActive: false,
  })

  const { generateWisdoms, logAction } = useWisdom()

  const handleSituationChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, situation: value }))
  }, [])

  const handleContemplate = useCallback(async () => {
    if (!state.situation.trim() || state.isLoading) return

    setState(prev => ({ ...prev, isLoading: true, hasStarted: true }))

    try {
      const response = await generateWisdoms({
        situation: state.situation,
        previous_wisdoms: state.wisdomHistory,
        action: 'initial',
        temperature: state.temperature,
        session_id: state.sessionId,
        count: 5,
      })

      setState(prev => ({
        ...prev,
        currentWisdoms: response.wisdoms,
        selectedIndex: response.selected_index,
        wisdomHistory: [...prev.wisdomHistory, ...response.wisdoms],
        isLoading: false,
        reservoirActive: response.reservoir_active,
      }))
    } catch {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.situation, state.wisdomHistory, state.temperature, state.sessionId, state.isLoading, generateWisdoms])

  const handleMore = useCallback(async () => {
    if (state.isLoading) return

    const tempIncrease = 0.05 + Math.random() * 0.1
    const newTemp = Math.min(state.temperature + tempIncrease, 1.3)

    setState(prev => ({
      ...prev,
      isLoading: true,
      temperature: newTemp,
    }))

    try {
      const response = await generateWisdoms({
        situation: state.situation,
        previous_wisdoms: state.wisdomHistory,
        action: 'more',
        temperature: newTemp,
        session_id: state.sessionId,
        count: 5,
      })

      setState(prev => ({
        ...prev,
        currentWisdoms: response.wisdoms,
        selectedIndex: response.selected_index,
        wisdomHistory: [...prev.wisdomHistory, ...response.wisdoms],
        isLoading: false,
        reservoirActive: response.reservoir_active,
      }))
    } catch {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.situation, state.wisdomHistory, state.temperature, state.sessionId, state.isLoading, generateWisdoms])

  const handleLess = useCallback(async () => {
    if (state.isLoading) return

    const tempDecrease = 0.03 + Math.random() * 0.05
    const newTemp = Math.max(state.temperature - tempDecrease, 0.3)

    setState(prev => ({
      ...prev,
      isLoading: true,
      temperature: newTemp,
    }))

    try {
      const response = await generateWisdoms({
        situation: state.situation,
        previous_wisdoms: state.wisdomHistory,
        action: 'less',
        temperature: newTemp,
        session_id: state.sessionId,
        count: 5,
      })

      setState(prev => ({
        ...prev,
        currentWisdoms: response.wisdoms,
        selectedIndex: response.selected_index,
        wisdomHistory: [...prev.wisdomHistory, ...response.wisdoms],
        isLoading: false,
        reservoirActive: response.reservoir_active,
      }))
    } catch {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.situation, state.wisdomHistory, state.temperature, state.sessionId, state.isLoading, generateWisdoms])

  const handleCooldown = useCallback(() => {
    setState(prev => ({
      ...prev,
      temperature: DEFAULT_TEMP,
    }))
    logAction({
      session_id: state.sessionId,
      action: 'cooldown',
      data: {},
    })
  }, [state.sessionId, logAction])

  const handleSliderChange = useCallback((index: number) => {
    setState(prev => ({ ...prev, selectedIndex: index }))
  }, [])

  const handleExport = useCallback(async () => {
    const currentWisdom = state.currentWisdoms[state.selectedIndex]
    if (!currentWisdom) return

    const text = `${state.situation}\n\n${currentWisdom}`
    await navigator.clipboard.writeText(text)

    logAction({
      session_id: state.sessionId,
      action: 'export',
      data: { wisdom: currentWisdom, index: state.selectedIndex },
    })
  }, [state.situation, state.currentWisdoms, state.selectedIndex, state.sessionId, logAction])

  const handleReset = useCallback(() => {
    logAction({
      session_id: state.sessionId,
      action: 'reset',
      data: { wisdomCount: state.wisdomHistory.length },
    })

    setState({
      situation: '',
      currentWisdoms: [],
      selectedIndex: 0,
      wisdomHistory: [],
      isLoading: false,
      hasStarted: false,
      temperature: DEFAULT_TEMP,
      sessionId: generateSessionId(),
      reservoirActive: false,
    })
  }, [state.sessionId, state.wisdomHistory.length, logAction])

  const heatLevel = (state.temperature - 0.3) / 1.0

  return (
    <div className="app">
      {!state.hasStarted ? (
        <EntryView
          situation={state.situation}
          onSituationChange={handleSituationChange}
          onContemplate={handleContemplate}
          isLoading={state.isLoading}
        />
      ) : (
        <WisdomView
          situation={state.situation}
          wisdoms={state.currentWisdoms}
          selectedIndex={state.selectedIndex}
          heatLevel={heatLevel}
          isLoading={state.isLoading}
          reservoirActive={state.reservoirActive}
          onSliderChange={handleSliderChange}
          onMore={handleMore}
          onLess={handleLess}
          onCooldown={handleCooldown}
          onExport={handleExport}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

export default App
