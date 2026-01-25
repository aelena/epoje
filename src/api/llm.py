import os
import random
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a minimalist philosophical oracle. Your purpose is to offer unexpected angles, intellectual provocations, and reframes based on classical philosophy, Stoicism, Taoism, Zen Buddhism, and Socratic thought.

STRICT RULES:
- Respond with ONE short phrase only (maximum 15 words)
- Do NOT explain, contextualize, or give direct advice
- Be cryptic but profound, like a koan or Stoic aphorism
- Never use modern motivational clichés
- Draw inspiration from: Marcus Aurelius, Epictetus, Seneca, Lao Tzu, Heraclitus, Socrates, the Stoics, the Tao Te Ching
- The phrase must provoke reflection, not provide answers
- Vary your tone: sometimes imperative, sometimes interrogative, sometimes paradoxical
- NEVER repeat previous phrases

Given the user's problem or situation, generate ONE oblique perspective that invites seeing from another angle."""

RESERVOIR_ADDENDUM = """

INSPIRATION RESERVOIR:
The user has collected the following ideas, quotes, and fragments as a source of inspiration. Let these texts subtly influence your response, finding unexpected connections between them and the user's situation. Do not quote them directly, but allow their spirit to inform your oblique perspective.

{reservoir_texts}"""

MIN_RESERVOIR_SIZE = 10
RESERVOIR_SAMPLE_SIZE = 5


async def generate_wisdoms(
    situation: str,
    previous_wisdoms: list[str],
    temperature: float = 0.7,
    reservoir_items: list[dict] = None,
    count: int = 5,
) -> list[str]:
    """Generate multiple oblique wisdom phrases using OpenAI.

    Args:
        situation: The user's creative block or problem
        previous_wisdoms: List of previously generated wisdoms to avoid repetition
        temperature: LLM temperature (0.3-1.3)
        reservoir_items: Optional list of reservoir items to use as inspiration
        count: Number of wisdoms to generate (default 5)

    Returns:
        List of wisdom strings
    """

    # Build system prompt, optionally including reservoir
    system_prompt = SYSTEM_PROMPT

    if reservoir_items and len(reservoir_items) >= MIN_RESERVOIR_SIZE:
        # Sample random items from reservoir
        sampled = random.sample(reservoir_items, min(RESERVOIR_SAMPLE_SIZE, len(reservoir_items)))
        reservoir_texts = "\n".join(
            f"- \"{item['text'][:200]}{'...' if len(item['text']) > 200 else ''}\""
            for item in sampled
        )
        system_prompt += RESERVOIR_ADDENDUM.format(reservoir_texts=reservoir_texts)

    # Build the user message with context
    user_message = f"Situation: {situation}"

    if previous_wisdoms:
        avoid_list = "\n".join(f"- {w}" for w in previous_wisdoms[-5:])
        user_message += f"\n\nPrevious phrases (do NOT repeat or paraphrase):\n{avoid_list}"

    user_message += f"\n\nGenerate {count} different oblique perspectives, each on its own line. Number them 1-{count}."

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=500,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )

    # Extract and parse the response
    raw_text = response.choices[0].message.content.strip()

    # Parse numbered lines
    wisdoms = []
    for line in raw_text.split("\n"):
        line = line.strip()
        if not line:
            continue
        # Remove numbering like "1.", "1)", "1:"
        for prefix in [f"{i}." for i in range(1, count + 1)] + \
                      [f"{i})" for i in range(1, count + 1)] + \
                      [f"{i}:" for i in range(1, count + 1)]:
            if line.startswith(prefix):
                line = line[len(prefix):].strip()
                break

        # Remove quotes if wrapped
        if line.startswith('"') and line.endswith('"'):
            line = line[1:-1]
        if line.startswith("«") and line.endswith("»"):
            line = line[1:-1]

        if line:
            wisdoms.append(line)

    # Ensure we have exactly count wisdoms (pad or trim)
    while len(wisdoms) < count:
        wisdoms.append(wisdoms[-1] if wisdoms else "The obstacle is the way.")

    return wisdoms[:count]
