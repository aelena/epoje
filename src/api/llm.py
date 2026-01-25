import os
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT_BASE = """Eres un oráculo filosófico minimalista. Tu propósito es ofrecer ángulos inesperados, provocaciones intelectuales y reencuadres basados en filosofía clásica, Estoicismo, Taoísmo, Budismo Zen y pensamiento Socrático.

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

RESERVOIR_ADDENDUM = """

RESERVORIO DE INSPIRACIÓN:
El usuario ha recopilado las siguientes ideas, citas y fragmentos como fuente de inspiración. Puedes dejar que estos textos influyan sutilmente en tu respuesta, encontrando conexiones inesperadas entre ellos y la situación del usuario. No los cites directamente, pero permite que su espíritu informe tu perspectiva oblicua.

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
    user_message = f"Situación: {situation}"

    if previous_wisdoms:
        avoid_list = "\n".join(f"- {w}" for w in previous_wisdoms[-5:])  # Last 5 to avoid
        user_message += f"\n\nFrases anteriores (NO repetir ni parafrasear):\n{avoid_list}"

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
