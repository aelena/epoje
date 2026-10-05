import os
import random
from openai import AsyncOpenAI

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    """Create the client lazily so the server can start without a key."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


# i18n (future): an ES variant is planned; see "Roadmap: Spanish" in README.md
SYSTEM_PROMPT = """You are a minimalist philosophical oracle. Your purpose is to offer unexpected angles, intellectual provocations, and reframes based on classical philosophy, Stoicism, Taoism, Zen Buddhism, and Socratic thought.

STRICT RULES:
- Each perspective is ONE short phrase (maximum 15 words)
- Do NOT explain, contextualize, or give direct advice
- Be cryptic but profound, like a koan or Stoic aphorism
- Never use modern motivational clichés
- Draw inspiration from: Marcus Aurelius, Epictetus, Seneca, Lao Tzu, Heraclitus, Socrates, the Stoics, the Tao Te Ching
- The phrase must provoke reflection, not provide answers
- Vary your tone: sometimes imperative, sometimes interrogative, sometimes paradoxical
- NEVER repeat or paraphrase previous phrases

Given the user's problem or situation, generate oblique perspectives that invite seeing from another angle."""

RESERVOIR_ADDENDUM = """

INSPIRATION RESERVOIR:
The user has collected the following ideas, quotes, and fragments as a source of inspiration. Let these texts subtly influence your response, finding unexpected connections between them and the user's situation. Do not quote them directly, but allow their spirit to inform your oblique perspective.

{reservoir_texts}"""

MIN_RESERVOIR_SIZE = 10
RESERVOIR_SAMPLE_SIZE = 5
AVOID_LIST_SIZE = 30  # ~6 batches in the prompt; older phrases are still filtered in code
EXTRA_CANDIDATES = 2  # ask for a few more so filtering repeats still leaves `count`


def _normalize(text: str) -> str:
    return " ".join("".join(c for c in text.lower() if c.isalnum() or c.isspace()).split())


def _strip_line(line: str, max_number: int) -> str:
    """Remove numbering like "1.", "1)", "1:" and wrapping quotes."""
    line = line.strip()
    for i in range(max_number, 0, -1):  # longest first so "10." isn't read as "1"
        for sep in (".", ")", ":"):
            prefix = f"{i}{sep}"
            if line.startswith(prefix):
                line = line[len(prefix):].strip()
                break
        else:
            continue
        break

    for open_q, close_q in (('"', '"'), ("«", "»"), ("“", "”")):
        if line.startswith(open_q) and line.endswith(close_q):
            line = line[len(open_q):-len(close_q)]
    return line.strip()


async def generate_wisdoms(
    situation: str,
    previous_wisdoms: list[str],
    temperature: float = 0.7,
    reservoir_items: list[dict] | None = None,
    count: int = 5,
) -> list[str]:
    """Generate up to `count` oblique wisdom phrases, never repeating previous ones.

    Args:
        situation: The user's creative block or problem
        previous_wisdoms: Phrases already shown this session
        temperature: LLM temperature (0.3-1.3)
        reservoir_items: Optional list of reservoir items to use as inspiration
        count: Number of wisdoms to return (default 5)

    Returns:
        1..count unique wisdom strings
    """
    system_prompt = SYSTEM_PROMPT

    if reservoir_items and len(reservoir_items) >= MIN_RESERVOIR_SIZE:
        sampled = random.sample(reservoir_items, min(RESERVOIR_SAMPLE_SIZE, len(reservoir_items)))
        reservoir_texts = "\n".join(
            f"- \"{item['text'][:200]}{'...' if len(item['text']) > 200 else ''}\""
            for item in sampled
        )
        system_prompt += RESERVOIR_ADDENDUM.format(reservoir_texts=reservoir_texts)

    user_message = f"Situation: {situation}"

    if previous_wisdoms:
        avoid_list = "\n".join(f"- {w}" for w in previous_wisdoms[-AVOID_LIST_SIZE:])
        user_message += f"\n\nPrevious phrases (do NOT repeat or paraphrase):\n{avoid_list}"

    requested = count + EXTRA_CANDIDATES
    user_message += f"\n\nGenerate {requested} different oblique perspectives, each on its own line. Number them 1-{requested}."

    response = await get_client().chat.completions.create(
        model=MODEL,
        max_tokens=500,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )

    raw_text = (response.choices[0].message.content or "").strip()

    # Drop anything already seen this session (the model doesn't always obey)
    # and duplicates within the batch. Never pad with repeats.
    seen = {_normalize(w) for w in previous_wisdoms}
    wisdoms = []
    for line in raw_text.split("\n"):
        line = _strip_line(line, requested)
        key = _normalize(line)
        if key and key not in seen:
            seen.add(key)
            wisdoms.append(line)

    if not wisdoms:
        raise RuntimeError("Model returned only repeated phrases")

    return wisdoms[:count]
