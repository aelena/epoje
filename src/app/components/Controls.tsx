import FlameIcon from './FlameIcon'

interface ControlsProps {
  heatLevel: number
  isLoading: boolean
  onMore: () => void
  onLess: () => void
  onCooldown: () => void
}

// Small glyphs for the two sides: a water drop cools, a flame heats
function DropGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5C12 2.5 5.5 10.2 5.5 14.8a6.5 6.5 0 0 0 13 0C18.5 10.2 12 2.5 12 2.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function FlameGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.5 2c.6 3.2-1.2 5-2.9 7C8 10.9 6 13 6 15.6a6 6 0 0 0 12 0c0-2.4-1.1-4.2-2.3-5.6.1 1.7-.6 3-1.8 3.6.5-3.5-.6-7.3-1.4-11.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Controls({
  heatLevel,
  isLoading,
  onMore,
  onLess,
  onCooldown,
}: ControlsProps) {
  return (
    <div className="controls">
      <button
        className="control-btn control-cool"
        onClick={onLess}
        disabled={isLoading}
        title="Cooler: calmer, more grounded"
        aria-label="Generate with less creativity"
      >
        <DropGlyph />
      </button>

      <FlameIcon heatLevel={heatLevel} onClick={onCooldown} />

      <button
        className="control-btn control-heat"
        onClick={onMore}
        disabled={isLoading}
        title="Hotter: stranger, more daring"
        aria-label="Generate with more creativity"
      >
        <FlameGlyph />
      </button>
    </div>
  )
}
