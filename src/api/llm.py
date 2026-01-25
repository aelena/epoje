import os
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT_BASE = """You are a minimalist philosophical oracle. Your purpose is to offer unexpected angles, intellectual provocations, and reframes based on classical philosophy, Stoicism, Taoism, Zen Buddhism, and Socratic thought.

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


async def generate_wisdom(
    situation: str,
    previous_wisdoms: list[str],
    temperature: float = 0.7,
    top_p: float = 0.9,
    reservoir_items: list[dict] = None,
) -> str:
    """Generate an oblique wisdom phrase using Claude.

    Args:
        situation: The user's creative block or problem
        previous_wisdoms: List of previously generated wisdoms to avoid repetition
        temperature: LLM temperature (0.3-1.3)
        top_p: LLM top_p (0.7-1.0)
        reservoir_items: Optional list of reservoir items to use as inspiration
    """

    # Build system prompt, optionally including reservoir
    system_prompt = SYSTEM_PROMPT_BASE

    if reservoir_items:
        reservoir_texts = "\n".join(
            f"- \"{item['text'][:200]}{'...' if len(item['text']) > 200 else ''}\""
            for item in reservoir_items[:5]  # Limit to 5 items
        )
        system_prompt += RESERVOIR_ADDENDUM.format(reservoir_texts=reservoir_texts)

    # Build the user message with context
    user_message = f"Situation: {situation}"

    if previous_wisdoms:
        avoid_list = "\n".join(f"- {w}" for w in previous_wisdoms[-5:])  # Last 5 to avoid
        user_message += f"\n\nPrevious phrases (do NOT repeat or paraphrase):\n{avoid_list}"

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=100,
        temperature=temperature,
        top_p=top_p,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_message}
        ]
    )

    # Extract text from response
    wisdom = response.content[0].text.strip()

    # Remove quotes if the model wrapped the response
    if wisdom.startswith('"') and wisdom.endswith('"'):
        wisdom = wisdom[1:-1]
    if wisdom.startswith("«") and wisdom.endswith("»"):
        wisdom = wisdom[1:-1]

    return wisdom
