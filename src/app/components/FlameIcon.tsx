interface FlameIconProps {
  heatLevel: number // 0 to 1
  onClick: () => void
}

export default function FlameIcon({ heatLevel, onClick }: FlameIconProps) {
  // Interpolate colors based on heat level
  // Cold: #8b7355 (muted brown)
  // Hot: #e85d04 (orange-red)
  const coldColor = { r: 139, g: 115, b: 85 }
  const hotColor = { r: 232, g: 93, b: 4 }

  const r = Math.round(coldColor.r + (hotColor.r - coldColor.r) * heatLevel)
  const g = Math.round(coldColor.g + (hotColor.g - coldColor.g) * heatLevel)
  const b = Math.round(coldColor.b + (hotColor.b - coldColor.b) * heatLevel)

  const color = `rgb(${r}, ${g}, ${b})`
  const opacity = 0.4 + heatLevel * 0.6

  return (
    <div
      className="flame-container"
      onClick={onClick}
      title="Enfriar temperatura"
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
        style={{ opacity }}
      >
        <path
          d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 13.0728 17.9012 10.5246 16.2 8.5C14.5 6.5 12.75 4.5 12 2C11.25 4.5 9.5 6.5 7.8 8.5C6.09877 10.5246 4.5 13.0728 4.5 15.5C4.5 19.6421 7.85786 23 12 23Z"
          fill={color}
        />
        <path
          d="M12 23C14.2091 23 16 20.9853 16 18.5C16 17.0728 15.1506 15.5246 14.15 14.25C13.15 13 12.25 11.75 12 10.5C11.75 11.75 10.85 13 9.85 14.25C8.84938 15.5246 8 17.0728 8 18.5C8 20.9853 9.79086 23 12 23Z"
          fill={color}
          style={{ opacity: 0.7 }}
        />
      </svg>
    </div>
  )
}
