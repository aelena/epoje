interface FlameIconProps {
  heatLevel: number // 0 to 1 (DEFAULT_TEMP sits at 0.4)
  onClick: () => void
}

// Colour stops along the heat scale: cold water blue, a neutral warm sand at
// the default temperature, then fire. Interpolated in RGB, so blue→sand
// passes through quiet stone greys rather than greens or purples.
const STOPS: [number, [number, number, number]][] = [
  [0.0, [62, 126, 196]],   // #3e7ec4 cold blue
  [0.2, [112, 138, 160]],  // #708aa0 slate
  [0.4, [168, 131, 78]],   // #a8834e sand (default)
  [0.7, [226, 112, 32]],   // #e27020 orange
  [1.0, [222, 62, 18]],    // #de3e12 red-orange
]

export function heatColor(heatLevel: number): string {
  const h = Math.max(0, Math.min(1, heatLevel))
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i]
    if (h <= p1) {
      const [p0, c0] = STOPS[i - 1]
      const t = (h - p0) / (p1 - p0)
      const [r, g, b] = c0.map((v, k) => Math.round(v + (c1[k] - v) * t))
      return `rgb(${r}, ${g}, ${b})`
    }
  }
  const [r, g, b] = STOPS[STOPS.length - 1][1]
  return `rgb(${r}, ${g}, ${b})`
}

export default function FlameIcon({ heatLevel, onClick }: FlameIconProps) {
  const color = heatColor(heatLevel)
  // Strongest at both extremes, quietest at the default
  const opacity = 0.55 + Math.abs(heatLevel - 0.4) * 0.75

  return (
    <div
      className="flame-container"
      onClick={onClick}
      title="Return to the default temperature"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity, transition: 'opacity 0.6s ease' }}
      >
        <path
          d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 13.0728 17.9012 10.5246 16.2 8.5C14.5 6.5 12.75 4.5 12 2C11.25 4.5 9.5 6.5 7.8 8.5C6.09877 10.5246 4.5 13.0728 4.5 15.5C4.5 19.6421 7.85786 23 12 23Z"
          fill={color}
          style={{ transition: 'fill 0.6s ease' }}
        />
        <path
          d="M12 23C14.2091 23 16 20.9853 16 18.5C16 17.0728 15.1506 15.5246 14.15 14.25C13.15 13 12.25 11.75 12 10.5C11.75 11.75 10.85 13 9.85 14.25C8.84938 15.5246 8 17.0728 8 18.5C8 20.9853 9.79086 23 12 23Z"
          fill={color}
          style={{ opacity: 0.7, transition: 'fill 0.6s ease' }}
        />
      </svg>
    </div>
  )
}
