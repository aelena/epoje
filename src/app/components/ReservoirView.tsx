import { useRef, useState } from 'react'
import { useReservoir } from '../contexts/ReservoirContext'
import { RESERVOIR_MIN_ACTIVE } from '../types'

function hostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

interface ReservoirViewProps {
  onClose: () => void
}

export default function ReservoirView({ onClose }: ReservoirViewProps) {
  const { items, addItem, removeItem, importItems } = useReservoir()
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    if (!draft.trim()) return
    addItem(draft)
    setDraft('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `epoche-reservoir-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const added = importItems(JSON.parse(await file.text()))
      setNotice(`${added} new ${added === 1 ? 'fragment' : 'fragments'} added`)
    } catch {
      setNotice('That file is not a reservoir export')
    }
  }

  const remaining = RESERVOIR_MIN_ACTIVE - items.length

  return (
    <div className="reservoir-view">
      <h1 className="title">Reservoir</h1>
      <p className="subtitle">
        {remaining > 0
          ? `fragments that colour the oracle · ${remaining} more to awaken it`
          : 'fragments that colour the oracle · active'}
      </p>

      <textarea
        className="textarea reservoir-input"
        placeholder="A quote, an idea, a fragment..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={2000}
      />
      <button className="btn" onClick={handleAdd} disabled={!draft.trim()} style={{ marginTop: '1rem' }}>
        keep
      </button>

      <ul className="reservoir-list">
        {items.map(item => (
          <li key={item.id} className="reservoir-item">
            <p className="reservoir-text">{item.text}</p>
            <div className="reservoir-meta">
              {item.source_url ? (
                <a href={item.source_url} target="_blank" rel="noreferrer noopener">
                  {item.source_title || hostname(item.source_url)}
                </a>
              ) : (
                <span>{item.created_at.slice(0, 10)}</span>
              )}
              <button
                className="reservoir-remove"
                onClick={() => removeItem(item.id)}
                aria-label="Remove fragment"
                title="Remove"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <p className="reservoir-empty">
          Empty. Add fragments here, or select text on any page and choose
          “Add to reservoir” with the browser extension.
        </p>
      )}

      {notice && <p className="reservoir-notice">{notice}</p>}

      <div className="reservoir-actions">
        <button className="btn-link" onClick={handleExport} disabled={items.length === 0}>export</button>
        <button className="btn-link" onClick={() => fileInput.current?.click()}>import</button>
        <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImport} hidden />
        <button className="btn-link" onClick={onClose}>back</button>
      </div>
    </div>
  )
}
