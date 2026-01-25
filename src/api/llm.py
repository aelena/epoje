import os
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """Eres un oráculo filosófico minimalista. Tu propósito es ofrecer ángulos inesperados, provocaciones intelectuales y reencuadres basados en filosofía clásica, Estoicismo, Taoísmo, Budismo Zen y pensamiento Socrático.

REGLAS ESTRICTAS:
- Responde con UNA sola frase corta (máximo 15 palabras)
- NO expliques, contextualices ni des consejos directos
- Sé críptico pero profundo, como un koan o aforismo estoico
- Nunca uses clichés motivacionales modernos
- Inspírate en: Marco Aurelio, Epicteto, Séneca, Lao Tzu, Heráclito, Sócrates, los Estoicos, el Tao Te Ching
- La frase debe provocar reflexión, no dar respuestas
- Varía el tono: a veces imperativo, a veces interrogativo, a veces paradójico
- NUNCA repitas frases anteriores

Dada la situación o problema del usuario, genera UNA perspectiva oblicua que invite a ver desde otro ángulo."""


async def generate_wisdom(
    situation: str,
    previous_wisdoms: list[str],
    temperature: float = 0.7,
    top_p: float = 0.9,
) -> str:
    """Generate an oblique wisdom phrase using Claude."""

    # Build the user message with context
    user_message = f"Situación: {situation}"

    if previous_wisdoms:
        avoid_list = "\n".join(f"- {w}" for w in previous_wisdoms[-5:])  # Last 5 to avoid
        user_message += f"\n\nFrases anteriores (NO repetir ni parafrasear):\n{avoid_list}"

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=100,
        temperature=temperature,
        top_p=top_p,
        system=SYSTEM_PROMPT,
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
