# epoche — Oblique Angles

Describe what's blocking you in ≤280 characters; get back five short, cryptic
reframes in the spirit of Brian Eno's *Oblique Strategies*, drawn from Stoic,
Taoist, Zen and Socratic thought. `−` / `+` regenerate cooler or hotter (LLM
temperature, shown by the flame), the dots flip between the five, *save* copies
situation + phrase to the clipboard.

No accounts. The **reservoir** — quotes and fragments you collect — lives in
your browser's localStorage and is sent along with each request. Once it holds
≥10 items, 5 random ones are sampled into the prompt to colour the output.
Manage it from the *reservoir* link (add, remove, export/import JSON), or
capture text from any page with the Chrome extension.

## Stack

| Part | Tech |
|---|---|
| Frontend | React 19 + TypeScript 7, Vite 8, hand-written CSS (`src/app`) |
| API | Python 3.12, Sanic 25 (`src/api`) |
| LLM | OpenAI, `gpt-4o-mini` by default (`src/api/llm.py`) |
| Storage | Browser localStorage (reservoir); SQLite anonymous usage log |
| Extension | Chrome MV3 context-menu capture (`extension/`) |

## Run locally (development mode, no limits)

```bash
cp .env.example src/api/.env        # set OPENAI_API_KEY
pip install -r src/api/requirements.txt
npm install
npm run api                         # API on :8000
npm run dev                         # app on http://localhost:3000 (proxies /api)
```

## Production mode

`EPOCHE_ENV=production` turns on per-IP limits (`RATE_LIMIT_PER_MINUTE`,
`RATE_LIMIT_PER_DAY`), a global daily cap (`GLOBAL_DAILY_LIMIT`) as a spending
guard, and makes the API serve the built frontend, so one process is the whole
site:

```bash
npm run build                       # -> dist/
EPOCHE_ENV=production python src/api/server.py   # listens on 127.0.0.1:8000
```

Put a reverse proxy with TLS in front (e.g. Caddy: `example.com { reverse_proxy 127.0.0.1:8000 }`)
and keep `PROXIES_COUNT=1` so limits apply to real client IPs. Limits are
in-memory (single process), which is fine for one small server. Also set a hard
monthly budget on the OpenAI account.

## Roadmap: Spanish (ES) as an alternate language

The project started in Spanish ("Ángulos Oblicuos", see `_specs/designdoc.md`)
and was switched to English; ES should come back as a choice, not a fork.
Plan, when picked up:

- **UI strings**: extract the literals in `src/app/components/*.tsx` (and
  `App.tsx` errors) into `src/app/i18n/{en,es}.ts` behind a tiny `t()` hook,
  no library needed for ~40 strings. Language picked from `navigator.language`,
  overridable with a toggle next to the theme one, saved in localStorage
  (same pattern as `useTheme.ts`). Set `<html lang>` accordingly.
- **Oracle language**: send `lang` with `/api/generate`; in `src/api/llm.py`
  either keep the English system prompt and add "Respond in Spanish", or keep a
  hand-written Spanish prompt (the original in the design doc). Test both: the
  aphoristic tone is the product, so a native prompt is probably worth it.
  Server-side fallbacks/errors in `server.py` need ES too.
- **Mixed situations**: if the user writes in Spanish with the UI in English,
  answering in the situation's language is likely the least surprising default.
- **Extension**: Chrome's `_locales/{en,es}/messages.json` for the menu item,
  notifications and popup.
- **Copy to watch**: "contemplate", "new beginning", "reservoir" (→ "reservorio"),
  "save" (→ "guardar"), the 280-char placeholder "What's blocking you?"
  (→ "¿Qué te bloquea?").

Design intent lives in `_specs/designdoc.md`.
