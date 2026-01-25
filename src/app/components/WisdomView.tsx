import Controls from './Controls'
import WisdomSlider from './WisdomSlider'

interface WisdomViewProps {
  situation: string
  wisdoms: string[]
  selectedIndex: number
  heatLevel: number
  isLoading: boolean
  reservoirActive: boolean
  onSliderChange: (index: number) => void
  onMore: () => void
  onLess: () => void
  onCooldown: () => void
  onExport: () => void
  onReset: () => void
}

export default function WisdomView({
  situation,
  wisdoms,
  selectedIndex,
  heatLevel,
  isLoading,
  reservoirActive,
  onSliderChange,
  onMore,
  onLess,
  onCooldown,
  onExport,
  onReset,
}: WisdomViewProps) {
  const currentWisdom = wisdoms[selectedIndex] || null

  return (
    <>
      <p className="situation-reminder">{situation}</p>

      <div className="wisdom">
        {isLoading ? (
          <span className="loading">contemplating...</span>
        ) : (
          currentWisdom
        )}
      </div>

      {currentWisdom && !isLoading && (
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

      {wisdoms.length > 1 && !isLoading && (
        <WisdomSlider
          count={wisdoms.length}
          selectedIndex={selectedIndex}
          onChange={onSliderChange}
          disabled={isLoading}
        />
      )}

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
