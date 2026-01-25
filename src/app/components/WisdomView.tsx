import Controls from './Controls'

interface WisdomViewProps {
  situation: string
  wisdom: string | null
  wisdomHistory: string[]
  heatLevel: number
  isLoading: boolean
  onMore: () => void
  onLess: () => void
  onCooldown: () => void
  onExport: () => void
  onReset: () => void
}

export default function WisdomView({
  situation,
  wisdom,
  wisdomHistory,
  heatLevel,
  isLoading,
  onMore,
  onLess,
  onCooldown,
  onExport,
  onReset,
}: WisdomViewProps) {
  const historyLength = wisdomHistory.length
  const maxDots = 10

  return (
    <>
      <p className="situation-reminder">{situation}</p>

      <div className="wisdom">
        {isLoading ? (
          <span className="loading">contemplating...</span>
        ) : (
          wisdom
        )}
      </div>

      {wisdom && !isLoading && (
        <button className="btn export-btn" onClick={onExport}>
          save
        </button>
      )}

      <Controls
        heatLevel={heatLevel}
        isLoading={isLoading}
        onMore={onMore}
        onLess={onLess}
        onCooldown={onCooldown}
      />

      {historyLength > 1 && (
        <div className="history-dots">
          {Array.from({ length: Math.min(historyLength, maxDots) }).map((_, i) => (
            <div
              key={i}
              className={`history-dot ${i === historyLength - 1 ? 'active' : ''}`}
            />
          ))}
          {historyLength > maxDots && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              +{historyLength - maxDots}
            </span>
          )}
        </div>
      )}

      <button
        className="btn-link"
        onClick={onReset}
        style={{ marginTop: '3rem' }}
      >
        new beginning
      </button>
    </>
  )
}
