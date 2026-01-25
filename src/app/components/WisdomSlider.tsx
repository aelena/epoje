interface WisdomSliderProps {
  count: number
  selectedIndex: number
  onChange: (index: number) => void
  disabled?: boolean
}

export default function WisdomSlider({
  count,
  selectedIndex,
  onChange,
  disabled = false,
}: WisdomSliderProps) {
  return (
    <div className="wisdom-slider">
      <div className="slider-track">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            className={`slider-dot ${i === selectedIndex ? 'active' : ''}`}
            onClick={() => onChange(i)}
            disabled={disabled}
            aria-label={`View wisdom ${i + 1}`}
          >
            <span className="slider-dot-inner" />
          </button>
        ))}
      </div>
      <div className="slider-label">
        {selectedIndex + 1} / {count}
      </div>
    </div>
  )
}
