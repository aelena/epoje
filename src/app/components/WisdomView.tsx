import { useEffect, useRef, useState } from 'react'
import { OracleRound } from '../types'
import Controls from './Controls'
import WisdomSlider from './WisdomSlider'

interface WisdomViewProps {
  situation: string
  rounds: OracleRound[]
  heatLevel: number
  isLoading: boolean
  error: string | null
  reservoirActive: boolean
  onSliderChange: (index: number) => void
  onMore: () => void
  onLess: () => void
  onCooldown: () => void
  onCopy: (roundIndex: number) => Promise<boolean>
  onReset: () => void
}

export default function WisdomView({
  situation,
  rounds,
  heatLevel,
  isLoading,
  error,
  reservoirActive,
  onSliderChange,
  onMore,
  onLess,
  onCooldown,
  onCopy,
  onReset,
}: WisdomViewProps) {
  const logRef = useRef<HTMLDivElement>(null)
  const [copyState, setCopyState] = useState<{ index: number; ok: boolean } | null>(null)
  const liveIndex = rounds.length - 1

  // Keep the newest answer (or the "contemplating" line) in view
  useEffect(() => {
    const log = logRef.current
    // Direct assignment: smooth scrollTo is skipped in throttled/background tabs
    if (log) log.scrollTop = log.scrollHeight
  }, [rounds.length, isLoading])

  useEffect(() => {
    if (copyState === null) return
    const timer = setTimeout(() => setCopyState(null), 1800)
    return () => clearTimeout(timer)
  }, [copyState])

  const handleCopy = async (index: number) => {
    setCopyState({ index, ok: await onCopy(index) })
  }

  return (
    <>
      <p className="situation">{situation}</p>

      <div className="oracle-log" ref={logRef} aria-live="polite">
        {rounds.map((round, i) => {
          const isLive = i === liveIndex
          return (
            <div key={i} className={`oracle-entry ${isLive ? 'live' : ''}`}>
              <p className="oracle-phrase">{round.wisdoms[round.selectedIndex]}</p>

              {isLive && round.wisdoms.length > 1 && !isLoading && (
                <WisdomSlider
                  count={round.wisdoms.length}
                  selectedIndex={round.selectedIndex}
                  onChange={onSliderChange}
                />
              )}

              <button
                className="oracle-copy"
                onClick={() => handleCopy(i)}
                title="Copy your situation and this phrase to the clipboard"
              >
                {copyState?.index === i ? (copyState.ok ? 'copied ✓' : 'clipboard blocked') : 'copy'}
              </button>
            </div>
          )
        })}

        {isLoading && (
          <div className="oracle-entry live">
            <p className="oracle-phrase loading">contemplating...</p>
          </div>
        )}

        {error && !isLoading && <p className="wisdom-error">{error}</p>}
      </div>

      <Controls
        heatLevel={heatLevel}
        isLoading={isLoading}
        onMore={onMore}
        onLess={onLess}
        onCooldown={onCooldown}
      />

      {reservoirActive && (
        <div className="reservoir-indicator">
          reservoir active
        </div>
      )}

      <button
        className="btn-link"
        onClick={onReset}
        style={{ marginTop: '2rem' }}
      >
        new beginning
      </button>
    </>
  )
}
