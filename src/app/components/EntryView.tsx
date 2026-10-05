import { MAX_CHARS } from '../types'

interface EntryViewProps {
  situation: string
  onSituationChange: (value: string) => void
  onContemplate: () => void
  isLoading: boolean
  reservoirCount: number
  reservoirActive: boolean
  onOpenReservoir: () => void
}

export default function EntryView({
  situation,
  onSituationChange,
  onContemplate,
  isLoading,
  reservoirCount,
  reservoirActive,
  onOpenReservoir,
}: EntryViewProps) {
  const charCount = situation.length
  const isOverLimit = charCount > MAX_CHARS
  const canSubmit = situation.trim().length > 0 && !isOverLimit && !isLoading

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
      onContemplate()
    }
  }

  return (
    <>
      <h1 className="title">Oblique Angles</h1>
      <p className="subtitle">perspectives to unlock</p>

      <textarea
        className="textarea"
        placeholder="What's blocking you?"
        value={situation}
        onChange={(e) => onSituationChange(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_CHARS + 20}
        autoFocus
      />

      <div className={`char-counter ${isOverLimit ? 'warning' : ''}`}>
        {charCount}/{MAX_CHARS}
      </div>

      <button
        className="btn"
        onClick={onContemplate}
        disabled={!canSubmit}
        style={{ marginTop: '2rem' }}
      >
        {isLoading ? 'contemplating...' : 'contemplate'}
      </button>

      <button className="btn-link reservoir-link" onClick={onOpenReservoir}>
        reservoir{reservoirCount > 0 ? ` · ${reservoirCount}` : ''}{reservoirActive ? ' · active' : ''}
      </button>
    </>
  )
}
