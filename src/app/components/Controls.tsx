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
        title="Menos aleatorio"
        aria-label="Generar con menos creatividad"
      >
        −
      </button>

      <FlameIcon heatLevel={heatLevel} onClick={onCooldown} />

      <button
        className="control-btn"
        onClick={onMore}
        disabled={isLoading}
        title="Más aleatorio"
        aria-label="Generar con más creatividad"
      >
        +
      </button>
    </div>
  )
}
