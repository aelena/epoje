import { MAX_CHARS } from '../types'

interface EntryViewProps {
  situation: string
  onSituationChange: (value: string) => void
  onContemplate: () => void
  isLoading: boolean
}

export default function EntryView({
  situation,
  onSituationChange,
  onContemplate,
  isLoading,
}: EntryViewProps) {
  const charCount = situation.length
  const isOverLimit = charCount > MAX_CHARS
  const canSubmit = situation.trim().length > 0 && !isOverLimit && !isLoading

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey && canSubmit) {
      onContemplate()
    }
  }

  return (
    <>
      <h1 className="title">Ángulos Oblicuos</h1>
      <p className="subtitle">perspectivas para desbloquear</p>

      <textarea
        className="textarea"
        placeholder="¿Qué te bloquea?"
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
        {isLoading ? 'contemplando...' : 'contemplar'}
      </button>
    </>
  )
}
