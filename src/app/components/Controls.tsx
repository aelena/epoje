import FlameIcon from './FlameIcon'

interface ControlsProps {
  heatLevel: number
  isLoading: boolean
  onMore: () => void
  onLess: () => void
  onCooldown: () => void
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
        className="control-btn"
        onClick={onLess}
        disabled={isLoading}
        title="Less random"
        aria-label="Generate with less creativity"
      >
        −
      </button>

      <FlameIcon heatLevel={heatLevel} onClick={onCooldown} />

      <button
        className="control-btn"
        onClick={onMore}
        disabled={isLoading}
        title="More random"
        aria-label="Generate with more creativity"
      >
        +
      </button>
    </div>
  )
}
