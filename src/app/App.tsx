import { useState, useCallback } from 'react'
import { AppState, DEFAULT_TEMP, DEFAULT_TOP_P } from './types'
import { useWisdom } from './hooks/useWisdom'
import EntryView from './components/EntryView'
import WisdomView from './components/WisdomView'

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function App() {
  const [state, setState] = useState<AppState>({
    situation: '',
    currentWisdom: null,
    wisdomHistory: [],
    isLoading: false,
    hasStarted: false,
    temperature: DEFAULT_TEMP,
    topP: DEFAULT_TOP_P,
    sessionId: generateSessionId(),
  })

  const { generateWisdom, logAction } = useWisdom()

  const handleSituationChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, situation: value }))
  }, [])

  const handleContemplate = useCallback(async () => {
    if (!state.situation.trim() || state.isLoading) return

    setState(prev => ({ ...prev, isLoading: true, hasStarted: true }))

    try {
      const response = await generateWisdom({
        situation: state.situation,
        previous_wisdoms: state.wisdomHistory,
        action: 'initial',
        temperature: state.temperature,
        top_p: state.topP,
        session_id: state.sessionId,
      })

      setState(prev => ({
        ...prev,
        currentWisdom: response.wisdom,
        wisdomHistory: [...prev.wisdomHistory, response.wisdom],
        isLoading: false,
      }))
    } catch {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.situation, state.wisdomHistory, state.temperature, state.topP, state.sessionId, state.isLoading, generateWisdom])

  const handleMore = useCallback(async () => {
    if (state.isLoading) return

    const tempIncrease = 0.05 + Math.random() * 0.1
    const topPIncrease = 0.02 + Math.random() * 0.01
    const newTemp = Math.min(state.temperature + tempIncrease, 1.3)
    const newTopP = Math.min(state.topP + topPIncrease, 1.0)

    setState(prev => ({
      ...prev,
      isLoading: true,
      temperature: newTemp,
      topP: newTopP,
    }))

    try {
      const response = await generateWisdom({
        situation: state.situation,
        previous_wisdoms: state.wisdomHistory,
        action: 'more',
        temperature: newTemp,
        top_p: newTopP,
        session_id: state.sessionId,
      })

      setState(prev => ({
        ...prev,
        currentWisdom: response.wisdom,
        wisdomHistory: [...prev.wisdomHistory, response.wisdom],
        isLoading: false,
      }))
    } catch {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.situation, state.wisdomHistory, state.temperature, state.topP, state.sessionId, state.isLoading, generateWisdom])

  const handleLess = useCallback(async () => {
    if (state.isLoading) return

    const tempDecrease = 0.03 + Math.random() * 0.05
    const topPDecrease = 0.01 + Math.random() * 0.01
    const newTemp = Math.max(state.temperature - tempDecrease, 0.3)
    const newTopP = Math.max(state.topP - topPDecrease, 0.7)

    setState(prev => ({
      ...prev,
      isLoading: true,
      temperature: newTemp,
      topP: newTopP,
    }))

    try {
      const response = await generateWisdom({
        situation: state.situation,
        previous_wisdoms: state.wisdomHistory,
        action: 'less',
        temperature: newTemp,
        top_p: newTopP,
        session_id: state.sessionId,
      })

      setState(prev => ({
        ...prev,
        currentWisdom: response.wisdom,
        wisdomHistory: [...prev.wisdomHistory, response.wisdom],
        isLoading: false,
      }))
    } catch {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.situation, state.wisdomHistory, state.temperature, state.topP, state.sessionId, state.isLoading, generateWisdom])

  const handleCooldown = useCallback(() => {
    setState(prev => ({
      ...prev,
      temperature: DEFAULT_TEMP,
      topP: DEFAULT_TOP_P,
    }))
    logAction({
      session_id: state.sessionId,
      action: 'cooldown',
      data: {},
    })
  }, [state.sessionId, logAction])

  const handleExport = useCallback(async () => {
    if (!state.currentWisdom) return

    const text = `${state.situation}\n\n${state.currentWisdom}`
    await navigator.clipboard.writeText(text)

    logAction({
      session_id: state.sessionId,
      action: 'export',
      data: { wisdom: state.currentWisdom },
    })
  }, [state.situation, state.currentWisdom, state.sessionId, logAction])

  const handleReset = useCallback(() => {
    logAction({
      session_id: state.sessionId,
      action: 'reset',
      data: { wisdomCount: state.wisdomHistory.length },
    })

    setState({
      situation: '',
      currentWisdom: null,
      wisdomHistory: [],
      isLoading: false,
      hasStarted: false,
      temperature: DEFAULT_TEMP,
      topP: DEFAULT_TOP_P,
      sessionId: generateSessionId(),
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
          wisdom={state.currentWisdom}
          wisdomHistory={state.wisdomHistory}
          heatLevel={heatLevel}
          isLoading={state.isLoading}
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
